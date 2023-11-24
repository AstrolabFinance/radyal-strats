import {
  IDeploymentUnit,
  TransactionRequest,
  deploy,
  ethers,
  getDeployer,
  network,
  provider,
  weiToString,
} from "@astrolabs/hardhat";
import {
  ISwapperParams,
  getAllTransactionRequests,
  swapperParamsToString,
} from "@astrolabs/swapper";
import { MaxUint256 } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { erc20Abi, wethAbi } from "abitype/abis";
// import HopStrategyAbi from "../../../registry/abis/HopStrategy.json";
import { BigNumber, Contract, constants } from "ethers";
import { IStrategyV5 } from "src/types";
import { ChainAddresses } from "../../src/addresses";
import { assert } from "chai";

export const addressZero = constants.AddressZero;
let maxTopup = BigNumber.from(weiToString(5 * 1e18));
let deployer: SignerWithAddress;
let swapper: Contract;

export async function deploySwapper(): Promise<Contract> {
  deployer ??= (await getDeployer()) as SignerWithAddress;
  swapper = await deploy({
    contract: "Swapper",
    name: "Swapper",
    verify: true,
  });
  console.log(
    `Connected to ${network.name} (id ${
      network.config.chainId
    }), block ${await provider.getBlockNumber()}`
  );
  return swapper;
}

export async function grantStratRoles(strat: Contract) {
  const keeperRole = await strat.KEEPER_ROLE();
  const managerRole = await strat.MANAGER_ROLE();

  await strat.grantRole(keeperRole, deployer.address);
  await strat.grantRole(managerRole, deployer.address);
}

export async function setupStrat(
  contract: string,
  name: string,
  args: IStrategyV5,
  allocator?: string,
  agentAddress?: string,
  libAddresses?: { [name: string]: string }
): Promise<Contract> {
  deployer ??= (await getDeployer()) as SignerWithAddress;

  // strategy dependencies
  const libNames = new Set(["AsAccounting"]); // no need to add AsMaths as imported and use by AsAccounting
  libAddresses ??= {};
  const contractByLib: { [name: string]: Contract } = {};

  for (const n of libNames) {
    const path = `src/libs/${n}.sol:${n}`;
    if (!libAddresses[path]) {
      const params = {
        contract: n,
        name: n,
        verify: true,
      } as IDeploymentUnit;
      // if (n !== "AsMaths")
      //   params.libraries = { AsMaths: libAddresses[path] };
      contractByLib[n] = await deploy(params);
      libAddresses[path] = contractByLib[n].address;
    } else {
      console.log(`Using existing ${n} at ${libAddresses[path]}`);
      contractByLib[n] = new Contract(libAddresses[path], [], deployer);
    }
  }

  // if StrategyAgent implementation is not available on the current blockchain, deploy it
  if (!agentAddress) {
    const agent = await deploy({
      contract: "StrategyAgentV5",
      name: "StrategyAgentV5",
      libraries: libAddresses, // same libs as strategy
      verify: true,
    });
    agentAddress = agent.address;
  } else {
    console.log(`Using existing StrategyAgent at ${agentAddress}`);
  }
  assert(agentAddress, "StrategyAgentV5 seems missing from the deployment");
  args.coreAddresses.push(agentAddress);

  // deploy the strategy implementation (specific strategy implementation + StrategyAgent transparent proxy)
  const strat = await deploy({
    contract,
    name: contract,
    args: [args.erc20Metadata],
    libraries: libAddresses,
    verify: true,
  });

  // remove the constructed erc20Metadata from the init args
  delete (args as any).erc20Metadata;

  const argsList = Object.values(args);
  await grantStratRoles(strat);
  const ok = await strat[
    "init((uint64,uint64,uint64,uint64),address,address[4],address[],uint256[],address[],address,address,address,uint8)"
  ](...argsList, { gasLimit: 5e7 });
  await logState(strat, "After initialize");
  if (allocator) {
    // Add new strategy to allocator
    // await allocator.addNewStrategy(strategy.address, MaxUint256, name, {
    //   from: deployer.address,
    // });
  }
  const asset = new Contract(args.underlying, erc20Abi, deployer);
  await asset.approve(strat.address, MaxUint256);
  return strat;
}

export async function logState(strat: Contract, step?: string) {
  try {
    const underlyingAddress = await strat.underlying();
    const underlyingToken = new Contract(underlyingAddress, erc20Abi, deployer);
    const stratBalanceOfUl = await underlyingToken.balanceOf(strat.address);
    const [
      inputsAddresses,
      rewardTokensAddresses,
      sharePriceAfter,
      totalAssetsAfter,
      invested,
      // stratBalanceOfUl,
    ] = await Promise.all([
      strat.underlying(),
      strat.inputs(0),
      strat.rewardTokens(0),
      strat.sharePrice(),
      strat.totalAssets(),
      strat.invested(),
      // await underlyingTokenContract.balanceOf(strategy.address),
    ]);
    console.log(
      `State ${step ? `after ${step}` : ""}:
      underlying: ${underlyingAddress}
      inputs: ${inputsAddresses}
      rewardTokens: ${rewardTokensAddresses}
      sharePrice: ${sharePriceAfter}
      totalAssets(): ${totalAssetsAfter}
      invested(): ${invested}
      stratBalanceOfUl(): ${stratBalanceOfUl}`
    );
  } catch (e) {
    console.log(`Error logging state ${step ?? ""}: ${e}`);
  }
}

async function ensureWhitelisted(contract: Contract, addresses: string[]) {
  const whitelistPromises = addresses.map(async (addr) => {
    const isWhitelisted = await contract.isWhitelisted(addr);
    if (!isWhitelisted) {
      console.log(`whitelisting ${addr}`);
      await contract.addToWhitelist(addr);
      assert(
        await contract.isWhitelisted(addr),
        `Address ${addr} could not be whitelisted`
      );
    }
  });

  await Promise.all(whitelistPromises);
}

async function _swap(o: ISwapperParams, a: ChainAddresses) {
  if (!swapper) swapper = await deploySwapper();
  if (o.inputChainId != network.config.chainId) {
    if (network.name.includes("tenderly")) {
      console.warn(`Skipping case as not on current network: ${network.name}`);
      return;
    } else {
      console.warn(`Case requires hardhat network change to ${network.name}`);
    }
  }

  o.payer ||= deployer!.address;
  const amountWei = BigNumber.from(o.amountWei as any);
  o.amountWei = amountWei;
  o.inputChainId ??= network.config.chainId!;

  let input: Contract;
  const nativeBalance = await provider.getBalance(o.payer);

  if (!o.input) {
    o.input = a.tokens.WGAS;
    input = new Contract(a.tokens.WGAS, wethAbi, deployer);

    const symbol = await input.symbol();
    if (["ETH", "BTC"].some((s) => symbol.includes(s))) {
      // limit the size of a swap to 10 ETH/BTC
      if (amountWei.gt(maxTopup)) o.amountWei = BigNumber.from(maxTopup);
    }
    console.assert(nativeBalance.gt(amountWei));
    const wrappedBalanceBefore = await input.balanceOf(o.payer);
    await input.deposit({ value: o.amountWei });
    const wrapped = (await input.balanceOf(o.payer)).sub(wrappedBalanceBefore);
    console.log(`wrapped ${wrapped} ${o.input}`);
    console.assert(wrapped.eq(o.amountWei));
  } else {
    input = await ethers.getContractAt("IERC20Metadata", o.input);
  }

  console.log(swapperParamsToString(o));

  let inputBalance = await input.balanceOf(o.payer);

  if (inputBalance.lt(o.amountWei)) {
    console.log(
      `payer ${o.payer} has not enough balance of ${o.inputChainId}:${o.input}, swapping from gasToken to ${o.input}`
    );
    await _swap(
      {
        payer: o.payer,
        inputChainId: o.inputChainId,
        output: o.input,
        amountWei: weiToString(nativeBalance.sub(BigInt(1e20).toString())),
      } as ISwapperParams,
      a
    );
    inputBalance = await input.balanceOf(o.payer);
  }

  const output = await ethers.getContractAt("IERC20Metadata", o.output);
  const outputBalanceBeforeSwap = await output.balanceOf(o.payer);
  await input.approve(swapper.target, MaxUint256.toString());
  const trs: TransactionRequest[] | undefined =
    (await getAllTransactionRequests(o)) as TransactionRequest[];
  assert(trs?.length);
  let received = BigNumber.from(0);
  for (const tr of trs) {
    assert(!!tr?.data);
    console.log(`using request: ${JSON.stringify(tr, null, 2)}`);
    await ensureWhitelisted(swapper, [
      tr.from as string,
      tr.to!,
      o.input,
      o.output,
    ]);
    const ok = await swapper.swap(
      input.target ?? input.address,
      output.target ?? output.address,
      o.amountWei.toString(),
      "1",
      tr.to,
      tr.data,
      { gasLimit: Math.max(Number(tr.gasLimit ?? 0), 50_000_000) }
    );
    console.log(`received response: ${JSON.stringify(ok, null, 2)}`);
    received = (await output.balanceOf(o.payer)).sub(outputBalanceBeforeSwap);
    console.log(`received ${received} ${o.output}`);
    if (received.gt(0)) break;
  }
  assert(received.gt(1));
}

export async function fundAccount(
  amount: number,
  asset: string,
  receiver: string,
  a: ChainAddresses
): Promise<void> {
  const deployer = (await getDeployer()) as SignerWithAddress;
  const output = new Contract(asset, erc20Abi, deployer);
  const balanceBefore = await output.balanceOf(receiver);
  let balanceAfter = balanceBefore;
  let retries = 3;
  while (balanceAfter <= balanceBefore && retries--) {
    await _swap(
      {
        inputChainId: network.config.chainId!,
        output: asset,
        amountWei: weiToString(amount),
        receiver,
        payer: deployer.address,
        testPayer: a.accounts!.impersonate,
        // maxSlippage: 5000,
      } as ISwapperParams,
      a
    );
    balanceAfter = await output.balanceOf(receiver);
  }
}
