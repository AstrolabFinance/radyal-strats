import { ethers, network, revertNetwork } from "@astrolabs/hardhat";
import { assert } from "chai";
import chainlinkOracles from "../../src/chainlink-oracles.json";
import addresses from "../../src/implementations/Venus/addresses";
import { Fees, IStrategyDeploymentEnv, IStrategyDesc } from "../../src/types";
import { abiEncode, getEnv } from "../utils";
import { IFlow, testFlow } from "../flows";
import { setupStrat } from "../flows/StrategyV5";
import { suite } from "../StrategyV5.test";

const baseDesc: IStrategyDesc = {
  name: `Astrolab Primitive Venus USD`,
  symbol: `apXVS.USD`,
  asset: "USDC",
  version: 1,
  contract: "VenusMultiStake",
  seedLiquidityUsd: 10,
} as IStrategyDesc;

// strategy description to be converted into test/deployment params
const descByChainId: { [chainId: number]: IStrategyDesc } = {
  56: {
    ...baseDesc,
    inputs: ["USDC", "DAI", "USDT", "BUSD"],
    inputWeights: [9000],
  }, // 90% allocation, 10% cash
};

const desc = descByChainId[network.config.chainId!];

describe(`test.${desc.name}`, () => {
  const addr = addresses[network.config.chainId!];
  const protocolAddr = addr.Venus;
  // const protocolAddr: { [name: string]: string }[] = <any>desc.inputs.map(i => addr.Venus[i]);
  const oracles = (<any>chainlinkOracles)[network.config.chainId!];
  let env: IStrategyDeploymentEnv;

  beforeEach(async () => {});
  after(async () => {
    // revert blockchain state to before the tests (eg. healthy balances and pool liquidity)
    if (env?.revertState) await revertNetwork(env.snapshotId);
  });

  before("Deploy and setup strat", async () => {
    env = (await getEnv(
      { revertState: false },
      addresses,
    )) as IStrategyDeploymentEnv;
    // load environment+deploy+verify the strategy stack
    env = await setupStrat(
      desc.contract,
      desc.name,
      [
        {
          // base params
          erc20Metadata: { name: desc.name, symbol: desc.symbol }, // erc20Metadata
          coreAddresses: { asset: addr.tokens[desc.asset] }, // coreAddresses (use default)
          fees: {} as Fees, // fees (use default)
          inputs: desc.inputs.map((i) => addr.tokens[i]), // inputs
          inputWeights: desc.inputWeights, // inputWeights in bps (100% on input[0])
          lpTokens: desc.inputs.map((input) => addr.Venus[`v${input}`]), // LP tokens
          rewardTokens: protocolAddr.rewardTokens, // VXS
        },
        {
          // chainlink oracle params
          assetPriceFeed: oracles[`Crypto.${desc.asset}/USD`],
          inputPriceFeeds: desc.inputs.map((i) => oracles[`Crypto.${i}/USD`]),
        },
        abiEncode(["address"], [protocolAddr.Comptroller]),
      ],
      desc.seedLiquidityUsd, // seed liquidity in USD
      ["AsAccounting"], // libraries to link and verify with the strategy
      env, // deployment environment
      false, // force verification (after deployment)
    );
  });
  describe("Test flow", async () => {
    (suite as IFlow[]).map((f) => {
      it(`Test ${f.fn.name}`, async () => {
        f.env = env;
        assert(await testFlow(f));
      });
    });
  });
});
