import { erc20Abi } from "abitype/abis";
import { add, get, merge } from "lodash";
import { Contract, BigNumber, utils as ethersUtils } from "ethers";
import {
  IDeploymentUnit,
  TransactionResponse,
  deploy,
  deployAll,
  ethers,
  loadAbi,
  network,
  weiToString,
} from "@astrolabs/hardhat";
import {
  ITransactionRequestWithEstimate,
  getTransactionRequest,
} from "@astrolabs/swapper";
import {
  Erc20Metadata,
  IStrategyDeployment,
  IStrategyDeploymentEnv,
  ITestEnv,
  IStrategyBaseParams,
  IToken,
} from "../../src/types";
import {
  addressZero,
  getEnv,
  getInitSignature,
  getOverrides,
  getSwapperEstimate,
  getSwapperOutputEstimate,
  getSwapperRateEstimate,
  buildToken,
  getTxLogData,
  isLive,
  isStablePair,
  logState,
  sleep,
  isOracleLib,
} from "./utils";
import addresses from "../../src/addresses";

const MaxUint256 = ethers.constants.MaxUint256;

// TODO: move the already existing libs/contracts logic to @astrolabs/hardhat
export const deployStrat = async (
  env: Partial<IStrategyDeploymentEnv>,
  name: string,
  contract: string,
  constructorParams: [Erc20Metadata],
  initParams: [IStrategyBaseParams, ...any],
  libNames = ["AsAccounting"],
  forceVerify = false // check that the contract is verified on etherscan/tenderly
): Promise<IStrategyDeploymentEnv> => {
  let [swapper, agent] = [{}, {}] as Contract[];

  // strategy dependencies
  const libraries: { [name: string]: string } = {};
  const contractUniqueName = name; // `${contract}.${env.deployment?.inputs?.map(i => i.symbol).join("-")}`;

  for (const n of libNames) {
    let lib = {} as Contract;
    const path = `src/libs/${n}.sol:${n}`;
    const address = env.addresses?.libs?.[n] ?? "";
    if (!libraries[n]) {
      const libParams = {
        contract: n,
        name: n,
        verify: true,
        deployed: address ? true : false,
        address,
        libraries: isOracleLib(n) ? { AsMaths: libraries.AsMaths } : {},
      } as IDeploymentUnit;
      if (libParams.deployed) {
        console.log(`Using existing ${n} at ${libParams.address}`);
        lib = new Contract(address, loadAbi(n) ?? [], env.deployer);
      } else {
        lib = await deploy(libParams);
      }
    }
    libraries[n] = lib.address;
  }

  // exclude implementation specific libraries from agentLibs (eg. oracle libs)
  // as these are specific to the strategy implementation
  const stratLibs = Object.assign({}, libraries);
  delete stratLibs.AsMaths; // linking not required on the strategy itself

  const agentLibs = Object.assign({}, stratLibs);
  for (const lib of Object.keys(agentLibs)) {
    if (isOracleLib(lib)) delete agentLibs[lib];
  }

  const units: { [name: string]: IDeploymentUnit } = {
    Swapper: {
      contract: "Swapper",
      name: "Swapper",
      verify: true,
      deployed: env.addresses!.astrolab?.Swapper ? true : false,
      address: env.addresses!.astrolab?.Swapper ?? "",
    },
    StrategyV5Agent: {
      contract: "StrategyV5Agent",
      name: "StrategyV5Agent",
      libraries: agentLibs,
      verify: true,
      deployed: env.addresses!.astrolab?.StrategyV5Agent ? true : false,
      address: env.addresses!.astrolab?.StrategyV5Agent,
      overrides: getOverrides(env),
    },
    [contract]: {
      contract,
      name: contract,
      verify: true,
      deployed: env.addresses!.astrolab?.[contractUniqueName] ? true : false,
      address: env.addresses!.astrolab?.[contractUniqueName],
      proxied: ["StrategyV5Agent"],
      args: constructorParams,
      overrides: getOverrides(env),
      libraries: stratLibs, // External libraries are only used in StrategyV5Agent
    },
  };

  for (const libName of libNames) {
    units[libName] = {
      contract: libName,
      name: libName,
      verify: false,
      deployed: true,
      address:
        libraries[libName] ?? libraries[`src/libs/${libName}.sol:${libName}`],
    };
  }

  if (!env.addresses!.astrolab?.Swapper) {
    console.log(`Deploying missing Swapper`);
    swapper = await deploy(units.Swapper);
  } else {
    console.log(
      `Using existing Swapper at ${env.addresses!.astrolab?.Swapper}`
    );
    swapper = new Contract(
      env.addresses!.astrolab?.Swapper!,
      loadAbi("Swapper")!,
      env.deployer
    );
  }

  if (!env.addresses!.astrolab?.StrategyV5Agent) {
    console.log(`Deploying missing StrategyV5Agent`);
    agent = await deploy(units.StrategyV5Agent);
    units.StrategyV5Agent.verify = false; // already verified
  } else {
    console.log(
      `Using existing StrategyV5Agent at ${env.addresses!.astrolab
        ?.StrategyV5Agent}`
    );
    agent = new Contract(
      env.addresses!.astrolab?.StrategyV5Agent,
      loadAbi("StrategyV5Agent")!,
      env.deployer
    );
  }

  // default fees
  initParams[0].fees = merge(
    {
      perf: 1_000, // 10%
      mgmt: 20, // .2%
      entry: 2, // .02%
      exit: 2, // .02%
    },
    initParams[0].fees
  );

  // coreAddresses
  initParams[0].coreAddresses = [
    env.deployer!.address, // feeCollector
    swapper.address, // Swapper
    agent.address, // StrategyV5Agent
  ];

  // inputs
  if (initParams[0].inputWeights.length == 1)
    // default input weight == 100%
    initParams[0].inputWeights = [10_000];

  merge(env.deployment, {
    name: `${name} Stack`,
    contract: "",
    constructorParams,
    initParams,
    verify: true,
    libraries,
    swapper,
    agent,
    // deployer/provider
    deployer: env.deployer,
    provider: env.provider,
    // deployment units
    units,
    inputs: [] as IToken[],
    rewardTokens: [] as IToken[],
    underlying: {} as IToken,
    strat: {} as IToken,
  } as IStrategyDeployment);

  if (
    Object.values(env.deployment!.units!).every((u) => u.deployed) &&
    !forceVerify
  ) {
    console.log(`Using existing deployment [${name} Stack]`);
    env.deployment!.strat = await buildToken(
      env.deployment!.units![contract].address!,
      loadAbi(contract)!,
      env.deployer
    );
  } else {
    await deployAll(env.deployment!);
  }

  if (!env.deployment!.units![contract].address) {
    throw new Error(`Could not deploy ${contract}`);
  }

  const stratProxyAbi = loadAbi(contract)!; // use "StrategyV5" for generic abi
  env.deployment!.strat = await buildToken(
    env.deployment!.units![contract].address!,
    stratProxyAbi
  );
  env.deployment = env.deployment;
  return env as IStrategyDeploymentEnv;
};

export async function setMinLiquidity(
  env: Partial<IStrategyDeploymentEnv>,
  usdAmount = 10
) {
  const { strat, underlying } = env.deployment!;
  const [from, to] = ["USDC", env.deployment!.underlying.sym];
  const exchangeRate = await getSwapperRateEstimate(from, to, 1e12);
  const seedAmount = underlying.toWei(usdAmount * exchangeRate);
  if ((await strat.minLiquidity()).gte(seedAmount)) {
    console.log(`Skipping setMinLiquidity as minLiquidity == ${seedAmount}`);
  } else {
    console.log(
      `Setting minLiquidity to ${seedAmount} ${to} wei (${usdAmount} USDC)`
    );
    await strat
      .setMinLiquidity(seedAmount)
      .then((tx: TransactionResponse) => tx.wait());
    console.log(
      `Liquidity can now be seeded with ${await strat.minLiquidity()}wei ${to}`
    );
  }
  return seedAmount;
}

export async function seedLiquidity(env: IStrategyDeploymentEnv, _amount = 10) {
  const { strat, underlying } = env.deployment!;
  let amount = underlying.toWei(_amount);
  if ((await strat.totalAssets()).gte(await strat.minLiquidity())) {
    console.log(`Skipping seedLiquidity as totalAssets > minLiquidity`);
    return BigNumber.from(1);
  }
  if (
    (await underlying.allowance(env.deployer.address, strat.address)).lt(amount)
  )
    await underlying
      .approve(strat.address, MaxUint256, getOverrides(env))
      .then((tx: TransactionResponse) => tx.wait());

  await logState(env, "Before SeedLiquidity");
  const receipt = await strat
    .seedLiquidity(amount, MaxUint256, getOverrides(env))
    .then((tx: TransactionResponse) => tx.wait());
  await logState(env, "After SeedLiquidity", 2_000);
  return getTxLogData(receipt, ["uint256", "uint256"], 0, -2); // seeded amount
}

export async function grantManagerRole(
  env: Partial<IStrategyDeploymentEnv>,
  address: string
) {
  const { strat } = env.deployment!;
  const roles = await env.multicallProvider!.all([
    strat.multi.KEEPER_ROLE(),
    strat.multi.MANAGER_ROLE(),
  ]);
  const has = await env.multicallProvider!.all(
    roles.map((role) => strat.multi.hasRole(role, address))
  );
  for (const i in roles)
    if (!has[i])
      await strat
        .grantRole(roles[i], address, getOverrides(env))
        .then((tx: TransactionResponse) => tx.wait());
}

export async function setupStrat(
  contract: string,
  name: string,
  // below we use hop strategy signature as placeholder
  constructorParams: [Erc20Metadata],
  initParams: [IStrategyBaseParams, ...any],
  minLiquidityUsd = 10,
  libNames = ["AsAccounting"],
  env: Partial<IStrategyDeploymentEnv> = {},
  addressesOverride?: any
): Promise<IStrategyDeploymentEnv> {
  env = await getEnv(env, addressesOverride);

  // make sure to include PythUtils if pyth is used (not lib used with chainlink)
  if (initParams[1]?.pyth && !libNames.includes("PythUtils")) {
    libNames.push("PythUtils");
  }
  env.deployment = {
    underlying: await buildToken(initParams[0].underlying),
    inputs: await Promise.all(
      initParams[0].inputs!.map((input) => buildToken(input))
    ),
    rewardTokens: await Promise.all(
      initParams[0].rewardTokens!.map((rewardToken) => buildToken(rewardToken))
    ),
  } as any;

  env = await deployStrat(
    env,
    name,
    contract,
    constructorParams,
    initParams,
    libNames
  );

  const { strat, inputs, rewardTokens } = env.deployment!;

  await grantManagerRole(env, env.deployer!.address);

  // load the implementation abi, containing the overriding init() (missing from d.strat)
  // init((uint64,uint64,uint64,uint64),address,address[3],address[],uint256[],address[],address,address,address,uint8)'
  const proxy = new Contract(strat.address, loadAbi(contract)!, env.deployer);

  await setMinLiquidity(env, minLiquidityUsd);

  // NB: can use await proxy.initialized?.() instead
  if ((await proxy.agent()) != addressZero) {
    console.log(`Skipping init() as ${name} already initialized`);
  } else {
    const initSignature = getInitSignature(contract);
    await proxy[initSignature](...initParams, getOverrides(env));
  }

  const actualInputs: string[] = //inputs.map((input) => input.address);
    await env.multicallProvider!.all(
      inputs.map((input, index) => strat.multi.inputs(index))
    );

  const actualRewardTokens: string[] = // rewardTokens.map((reward) => reward.address);
    await env.multicallProvider!.all(
      rewardTokens.map((input, index) => strat.multi.rewardTokens(index))
    );

  // assert that the inputs and rewardTokens are set correctly
  for (const i in inputs) {
    if (inputs[i].address.toUpperCase() != actualInputs[i].toUpperCase())
      throw new Error(
        `Input ${i} address mismatch ${inputs[i].address} != ${actualInputs[i]}`
      );
  }

  for (const i in rewardTokens) {
    if (rewardTokens[i].address.toUpperCase() != actualRewardTokens[i].toUpperCase())
      throw new Error(
        `RewardToken ${i} address mismatch ${rewardTokens[i].address} != ${actualRewardTokens[i]}`
      );
  }

  await logState(env, "After init", 2_000);
  return env as IStrategyDeploymentEnv;
}

export async function deposit(env: IStrategyDeploymentEnv, _amount = 10) {
  const { strat, underlying } = env.deployment!;
  const balance = await underlying.balanceOf(env.deployer.address);
  let amount = underlying.toWei(_amount);

  if (balance.lt(amount)) {
    console.log(`Using full balance ${balance} (< ${amount})`);
    amount = balance;
  }
  if (
    (await underlying.allowance(env.deployer.address, strat.address)).lt(amount)
  )
    await underlying
      .approve(strat.address, MaxUint256, getOverrides(env))
      .then((tx: TransactionResponse) => tx.wait());
  await logState(env, "Before Deposit");
  const receipt = await strat
    .safeDeposit(amount, env.deployer.address, 1, getOverrides(env))
    .then((tx: TransactionResponse) => tx.wait());
  await logState(env, "After Deposit", 2_000);
  return getTxLogData(receipt, ["uint256", "uint256"], 0);
}

export async function swapDeposit(
  env: IStrategyDeploymentEnv,
  inputAddress?: string,
  _amount = 10
) {
  const { strat, underlying } = env.deployment!;
  const depositAsset = new Contract(inputAddress!, erc20Abi, env.deployer);
  const [minSwapOut, minSharesOut] = [1, 1];
  let amount = underlying.toWei(_amount);

  if (
    (await underlying.allowance(env.deployer.address, strat.address)).lt(amount)
  )
    await underlying
      .approve(strat.address, MaxUint256, getOverrides(env))
      .then((tx: TransactionResponse) => tx.wait());

  let swapData: any = [];
  if (underlying.address != depositAsset.address) {
    const tr = (await getTransactionRequest({
      input: depositAsset.address,
      output: underlying.address,
      amountWei: amount.toString(),
      inputChainId: network.config.chainId!,
      payer: strat.address,
      testPayer: env.addresses!.accounts!.impersonate,
    })) as ITransactionRequestWithEstimate;
    swapData = ethers.utils.defaultAbiCoder.encode(
      ["address", "uint256", "bytes"],
      [tr.to, minSwapOut, tr.data]
    );
  }
  await logState(env, "Before SwapDeposit");
  const receipt = await strat
    .swapSafeDeposit(
      depositAsset.address, // input
      amount, // amount == 100$
      env.deployer.address, // receiver
      minSharesOut, // minShareAmount in wei
      swapData, // swapData
      getOverrides(env)
    )
    .then((tx: TransactionResponse) => tx.wait());
  await logState(env, "After SwapDeposit", 2_000);
  return getTxLogData(receipt, ["uint256", "uint256"], 0);
}

export async function preInvest(env: IStrategyDeploymentEnv, _amount = 100) {
  const { underlying, inputs, strat } = env.deployment!;
  const stratLiquidity = await strat.available();
  const [minSwapOut, minIouOut] = [1, 1];
  let amount = underlying.toWei(_amount);

  if (stratLiquidity.lt(amount)) {
    console.log(
      `Using stratLiquidity as amount (${stratLiquidity} < ${amount})`
    );
    amount = stratLiquidity;
  }

  const amounts = await strat.previewInvest(amount); // parsed as uint256[8]
  const trs = [] as Partial<ITransactionRequestWithEstimate>[];
  const swapData = [] as string[];

  for (const i in inputs) {
    let tr = {
      to: addressZero,
      data: "0x00",
    } as ITransactionRequestWithEstimate;

    // only generate swapData if the input is not the underlying
    if (underlying.address != inputs[i].address) {
      console.log("Preparing invest() SwapData from inputs/inputWeights");
      // const weight = env.deployment!.initParams[0].inputWeights[i];
      // if (!weight) throw new Error(`No inputWeight found for input ${i} (${inputs[i].symbol})`);
      // inputAmount = amount.mul(weight).div(10_000).toString()
      tr = (await getTransactionRequest({
        input: underlying.address,
        output: inputs[i].address,
        amountWei: amounts[i], // using a 10_000 bp basis (10_000 = 100%)
        inputChainId: network.config.chainId!,
        payer: strat.address,
        testPayer: env.addresses.accounts!.impersonate,
      })) as ITransactionRequestWithEstimate;
    }
    trs.push(tr);
    swapData.push(
      ethersUtils.defaultAbiCoder.encode(
        // router, minAmountOut, data // TODO: minSwapOut == pessimistic estimate - slippage
        ["address", "uint256", "bytes"],
        [tr.to, minSwapOut, tr.data]
      )
    );
  }
  return [amounts, swapData];
}

// input prices are required to weight out the swaps and create the SwapData array
export async function invest(env: IStrategyDeploymentEnv, _amount = 0) {
  const { strat } = env.deployment!;
  const params = await preInvest(env, _amount);
  await logState(env, "Before Invest");
  const receipt = await strat["invest(uint256[8],bytes[])"](
    ...params,
    getOverrides(env)
  ).then((tx: TransactionResponse) => tx.wait());
  await logState(env, "After Invest", 2_000);
  return getTxLogData(receipt, ["uint256", "uint256"], 0);
}

// input prices are required to weight out the swaps and create the SwapData array
export async function liquidate(env: IStrategyDeploymentEnv, _amount = 50) {
  const { underlying, inputs, strat } = env.deployment!;

  let amount = underlying.toWei(_amount);

  const pendingWithdrawalRequest = await strat.totalPendingUnderlyingRequest();
  const invested = await strat["invested()"]();
  const max = invested.gt(pendingWithdrawalRequest)
    ? invested
    : pendingWithdrawalRequest;

  if (pendingWithdrawalRequest.gt(invested)) {
    console.warn(
      `pendingWithdrawalRequest > invested (${pendingWithdrawalRequest} > ${invested})`
    );
  }

  if (pendingWithdrawalRequest.gt(amount)) {
    console.log(
      `Using pendingWithdrawalRequest ${pendingWithdrawalRequest} (> amount ${amount})`
    );
    amount = pendingWithdrawalRequest;
  }

  if (max.lt(amount)) {
    console.log(`Using total allocated assets (max) ${max} (< ${amount})`);
    amount = max;
  }

  if (amount.lt(10)) {
    console.log(
      `Skipping liquidate as amount < 10wei (no liquidation required)`
    );
    return BigNumber.from(1);
  }

  const trs = [] as Partial<ITransactionRequestWithEstimate>[];
  const swapData = [] as string[];
  const amounts = Object.assign([], await strat.previewLiquidate(amount));
  const swapAmounts = new Array<BigNumber>(amounts.length).fill(
    BigNumber.from(0)
  );

  for (const i in inputs) {
    // const weight = env.deployment!.initParams[0].inputWeights[i];
    // const amountOut = amount.mul(weight).div(10_000); // using a 10_000 bp basis (10_000 = 100%)

    // by default input == underlying, no swapData is required
    let tr = {
      to: addressZero,
      data: "0x00",
      estimatedExchangeRate: 1, // no swap 1:1
      estimatedOutputWei: amounts[i],
      estimatedOutput: inputs[i].toAmount(amounts[i]),
    } as ITransactionRequestWithEstimate;

    if (
      underlying.address != inputs[i].address &&
      amounts[i].gt(BigNumber.from(0))
    ) {
      // add 1% slippage to the input amount, .1% if stable (2x as switching from ask estimate->bid)
      // NB: in case of a volatility event (eg. news/depeg), the liquidity would be one sided
      // and these estimates would be off. Liquidation would require manual parametrization
      // using more pessimistic amounts (eg. more slippage) in the swapData generation
      const stablePair = isStablePair(underlying.sym, inputs[i].sym);
      // oracle derivation tolerance (can be found at https://data.chain.link/ for chainlink)
      const derivation = stablePair ? 100 : 1_000; // .1% or 1%
      const slippage = stablePair ? 25 : 250; // .025% or .25%
      amounts[i] = amounts[i].mul(10_000 + derivation).div(10_000);
      swapAmounts[i] = amounts[i].mul(10_000 - slippage).div(10_000);

      // only generate swapData if the input is not the underlying
      tr = (await getTransactionRequest({
        input: inputs[i].address,
        output: underlying.address,
        amountWei: swapAmounts[i], // take slippage off so that liquidated LP value > swap input
        inputChainId: network.config.chainId!,
        payer: strat.address, // env.deployer.address
        testPayer: env.addresses.accounts!.impersonate,
      })) as ITransactionRequestWithEstimate;
      if (!tr.to)
        throw new Error(
          `No swapData generated for ${inputs[i].address} -> ${underlying.address}`
        );
    }
    trs.push(tr);
    swapData.push(
      ethersUtils.defaultAbiCoder.encode(
        ["address", "uint256", "bytes"],
        [tr.to, 1, tr.data]
      )
    );
  }
  console.log(
    `Liquidating ${underlying.toAmount(amount)}${underlying.sym}\n` +
      inputs
        .map(
          (input, i) =>
            `  - ${input.sym}: ${input.toAmount(amounts[i])} (${amounts[
              i
            ].toString()}wei), swap amount: ${input.toAmount(
              swapAmounts[i]
            )} (${swapAmounts[i].toString()}wei), est. output: ${trs[i]
              .estimatedOutput!} ${underlying.sym} (${trs[
              i
            ].estimatedOutputWei?.toString()}wei - exchange rate: ${
              trs[i].estimatedExchangeRate
            })\n`
        )
        .join("")
  );

  await logState(env, "Before Liquidate");
  // const [liquidity, totalAssets] = await strat.liquidate(amount, 1, false, [swapData], { 2e6 });
  const receipt = await strat
    .liquidate(amounts, 1, false, swapData, getOverrides(env))
    .then((tx: TransactionResponse) => tx.wait());

  await logState(env, "After Liquidate", 2_000);
  return getTxLogData(receipt, ["uint256", "uint256", "uint256"], 2); // liquidityAvailable
}

export async function withdraw(env: IStrategyDeploymentEnv, _amount = 50) {
  const { underlying, inputs, strat } = env.deployment!;
  const minAmountOut = 1; // TODO: change with staticCall
  const max = await strat.maxWithdraw(env.deployer.address);
  let amount = underlying.toWei(_amount);

  if (max.lt(10)) {
    console.log(
      `Skipping withdraw as maxWithdraw < 10wei (no exit possible at this time)`
    );
    return BigNumber.from(1);
  }

  if (BigNumber.from(amount).gt(max)) {
    console.log(`Using maxWithdraw ${max} (< ${amount})`);
    amount = max;
  }

  await logState(env, "Before Withdraw");
  const receipt = await strat
    .safeWithdraw(
      amount,
      minAmountOut,
      env.deployer.address,
      env.deployer.address,
      getOverrides(env)
    )
    .then((tx: TransactionResponse) => tx.wait());
  await logState(env, "After Withdraw", 2_000);
  return getTxLogData(receipt, ["uint256", "uint256"], 0); // recovered
}

export async function requestWithdraw(
  env: IStrategyDeploymentEnv,
  _amount = 50
) {
  const { underlying, inputs, strat } = env.deployment!;
  const balance = await strat.balanceOf(env.deployer.address);
  const pendingRequest = await strat.pendingUnderlyingRequest(
    env.deployer.address
  );
  let amount = underlying.toWei(_amount);

  if (balance.lt(10)) {
    console.log(
      `Skipping requestWithdraw as balance < 10wei (user owns no shares)`
    );
    return BigNumber.from(1);
  }

  if (BigNumber.from(amount).gt(balance)) {
    console.log(`Using full balance ${balance} (< ${amount})`);
    amount = balance;
  }

  if (pendingRequest.gte(amount.mul(weiToString(underlying.weiPerUnit)))) {
    console.log(`Skipping requestWithdraw as pendingRedeemRequest > amount`);
    return BigNumber.from(1);
  }
  await logState(env, "Before RequestWithdraw");
  const receipt = await strat
    .requestWithdraw(
      amount,
      env.deployer.address,
      env.deployer.address,
      getOverrides(env)
    )
    .then((tx: TransactionResponse) => tx.wait());
  await logState(env, "After RequestWithdraw", 2_000);
  return getTxLogData(receipt, ["address, address, address, uint256"], 3); // recovered
}

export async function preHarvest(env: IStrategyDeploymentEnv) {
  const { underlying, inputs, rewardTokens, strat } = env.deployment!;

  // const rewardTokens = (await strat.rewardTokens()).filter((rt: string) => rt != addressZero);
  const amounts = await strat.rewardsAvailable();

  console.log(
    `Generating harvest swapData for:\n${rewardTokens
      .map(
        (rt, i) =>
          "  - " +
          rt.sym +
          ": " +
          rt.toAmount(amounts[i])
      )
      .join("\n")}`
  );

  const trs: Partial<ITransactionRequestWithEstimate>[] = [];
  const swapData: string[] = [];

  for (const i in rewardTokens) {
    let tr = {
      to: addressZero,
      data: "0x00",
      estimatedOutputWei: amounts[i],
      estimatedExchangeRate: 1,
    } as ITransactionRequestWithEstimate;

    if (amounts[i].gt(10) && rewardTokens[i].address != underlying.address) {
      tr = (await getTransactionRequest({
        input: rewardTokens[i].address,
        output: underlying.address,
        amountWei: amounts[i].sub(amounts[i].div(1_000)), // .1% slippage
        inputChainId: network.config.chainId!,
        payer: strat.address,
        testPayer: env.addresses.accounts!.impersonate,
      })) as ITransactionRequestWithEstimate;
    }
    trs.push(tr);
    swapData.push(
      ethersUtils.defaultAbiCoder.encode(
        ["address", "uint256", "bytes"],
        [tr.to, 1, tr.data]
      )
    );
  }
  return [swapData];
}

export async function harvest(env: IStrategyDeploymentEnv) {
  const { strat, rewardTokens } = env.deployment!;
  const params = await preHarvest(env);
  await logState(env, "Before Harvest");
  const receipt = await strat
    .harvest(...params, getOverrides(env))
    .then((tx: TransactionResponse) => tx.wait());
  await logState(env, "After Harvest", 2_000);
  return getTxLogData(receipt, ["uint256", "uint256"], 0);
}

export async function compound(env: IStrategyDeploymentEnv) {
  const { underlying, inputs, strat } = env.deployment!;
  const [harvestSwapData] = await preHarvest(env);

  // harvest static call
  let harvestEstimate = BigNumber.from(0);
  try {
    harvestEstimate = await strat.callStatic
      .harvest(harvestSwapData, getOverrides(env));
  } catch (e) {
    console.error(`Harvest static call failed: probably reverted ${e}`);
  }

  const [investAmounts, investSwapData] = await preInvest(
    env,
    underlying.toAmount(harvestEstimate.sub(harvestEstimate.div(50)))
  ); // 2% slippage
  await logState(env, "Before Compound");
  const receipt = await strat
    .compound(
      investAmounts,
      [...harvestSwapData, ...investSwapData],
      getOverrides(env)
    )
    .then((tx: TransactionResponse) => tx.wait());
  await logState(env, "After Compound", 2_000);
  return getTxLogData(receipt, ["uint256", "uint256"], 0);
}

export const Flows: { [name: string]: Function } = {
  seedLiquidity,
  deposit,
  // requestDeposit: requestDeposit,
  withdraw,
  requestWithdraw,
  invest,
  liquidate,
  harvest,
  compound,
};

export interface IFlow {
  elapsedSec: number; // seconds since last block
  revertState: boolean; // revert state after flow
  env: IStrategyDeploymentEnv;
  fn: (typeof Flows)[keyof typeof Flows]; // only allow flow functions
  params: any[];
  assert: Function;
}

export async function testFlow(flow: IFlow) {
  let { env, elapsedSec, revertState, fn, params, assert } = flow;
  const live = isLive(env);

  console.log(
    `Running flow ${fn.name}(${params.join(
      ", "
    )}, elapsedSec (before): ${elapsedSec}, revertState (after): ${revertState})`
  );
  let snapshotId = 0;

  if (!live) {
    if (revertState) snapshotId = await env.provider.send("evm_snapshot", []);
    if (elapsedSec) {
      const timeBefore = new Date((await env.provider.getBlock("latest"))?.timestamp * 1000);
      await env.provider.send("evm_increaseTime", [ethers.utils.hexValue(elapsedSec)]);
      await env.provider.send("evm_increaseBlocks", ["0x20"]); // evm_mine
      const timeAfter = new Date((await env.provider.getBlock("latest"))?.timestamp * 1000);
      console.log(`⏰🔜 Advanced blocktime by ${elapsedSec}s: ${timeBefore} -> ${timeAfter}`);
    }
  }
  let result;
  try {
    result = await fn(env, ...params);
  } catch (e) {
    assert = () => false;
    console.error(e);
  }

  // revert the state of the chain to the beginning of this test, not to env.snapshotId
  if (!live && revertState) {
    const timeBefore = new Date((await env.provider.getBlock("latest"))?.timestamp * 1000);
    await env.provider.send("evm_revert", [snapshotId]);
    const timeAfter = new Date((await env.provider.getBlock("latest"))?.timestamp * 1000);
    console.log(`⏰🔙 Reverted blocktime: ${timeBefore} -> ${timeAfter}`);
  }

  if (assert) assert(result);

  return result;
}
