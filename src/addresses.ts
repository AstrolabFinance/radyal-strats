import { networkBySlug } from "@astrolabs/hardhat";

export type NetworkAddresses = {
  // common addresses
  accounts?: { [token: string]: string };
  oracles?: { [token: string]: string };
  tokens: { [name: string]: string };
  libs?: { [name: string]: string };
  // protocol specific addresses
  [protocol: string]: { [name: string]: string } | undefined;
  astrolab?: {
    [contract: string]: string;
    Swapper: string;
    StrategyV5Agent: string;
  };
};

export type Addresses = {
  [networkId: number]: NetworkAddresses;
};

export const addresses = {
  // ethereum
  1: {
    accounts: {
      impersonate: "0xf977814e90da44bfa03b6295a0616a897441acec", // binance 8
    },
    oracles: {
      Pyth: "0x4305FB66699C3B2702D4d05CF36551390A4c69C6",
    },
    tokens: {
      WETH: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      WGAS: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      USDCe: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      XDAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      WXDAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      TUSD: "0x0000000000085d4780B73119b644AE5ecd22b376",
      FRAX: "0x853d955aCEf822Db058eb8505911ED77F175b99e",
      MIM: "0x99D8a9C45b2ecA8864373A26D1459e3Dff1e17F3",
      sUSD: "0x57Ab1ec28D129707052df4dF418D58a2D46d5f51",
      EURC: "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c",
      EURT: "0xC581b735A1688071A1746c968e0798D642EDE491",

      // staked eth
      cbETH: "0xBe9895146f7AF43049ca1c1AE358B0541Ea49704",
      wBETH: "0xa2E3356610840701BDf5611a53974510Ae27E2e1",
      stETH: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
      rETH: "0xae78736Cd615f374D3085123A210448E74Fc6393",
      sETH2: "0xFe2e637202056d30016725477c5da089Ab0A043A",
      ankrETH: "0xE95A203B1a91a908F9B9CE46459d101078c2c3cb",
      sETH: "0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb",
      swETH: "0xf951E335afb289353dc249e82926178EaC7DEd78",
      ETHx: "0xA35b1B31Ce002FBF2058D22F30f95D405200A15b",

      SGETH: "0x72E2F4830b9E45d52F80aC08CB2bEC0FeF72eD9c",
      BNB: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
      LINK: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
      WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      MATIC: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
      TON: "0x582d872A1B094FC48F5DE31D3B73F2D9bE47def1",
      UNI: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      ARB: "0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1",
      MANTLE: "0x3c3a81e81dc49A522A592e7622A7E711c06bf354",
      FMT: "0x4E15361FD6b4BB609Fa63C81A2be19d873717870",
      LDO: "0xFdb794692724153d1488CcdBE0C56c252596735F",
      USDD: "0x0C10bF8FcB7Bf5412187A595ab97a3609160b5c6",
      FXS: "0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0",
      XAUt: "0x68749665FF8D2d112Fa859AA293F07A622782F38",
      CAKE: "0x152649eA73beAb28c5b49B26eb48f7EAD6d4c898",
      PAXG: "0x45804880De22913dAFE09f4980848ECE6EcbAf78",
      USDP: "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
      _1INCH: "0x111111111117dC0aa78b770fA6A738034120C302",
      GNO: "0x6810e776880C02933D47DB1b9fc05908e5386b96",
      COMP: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
      SUSHI: "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
      BAL: "0xba100000625a3754423978a60c9317c58a424e3D",
      crvUSD: "0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E",
      RBN: "0x6123B0049F904d730dB3C36a31167D9d4121fA6B",
      KNC: "0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202",
      STG: "0xAf5191B0De278C7286d6C7CC6ab6BB8A73bA2Cd6",
      PENDLE: "0x808507121B80c02388fAd14726482e061B8da827",
      RDNT: "0x137dDB47Ee24EaA998a535Ab00378d6BFa84F893",
      DODO: "0x43Dfc4159D86F3A37A5A4B3D4580b888ad7d4DDd",
      SPELL: "0x090185f2135308BaD17527004364eBcC2D37e5F6",
      OGN: "0x8207c1FfC5B6804F6024322CcF34F29c3541Ae26",
      TRU: "0x4C19596f5aAfF459fA38B0f7eD92F11AE6543784",
      AURA: "0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF",
      GFI: "0xdab396cCF3d84Cf2D07C4454e10C8A6F5b008D2b",
      BIFI: "0x5870700f1272a1AdbB87C3140bD770880a95e55D",
      QUICK: "0xd2bA23dE8a19316A638dc1e7a9ADdA1d74233368",
    },
  },
  // optimism
  10: {
    accounts: {
      impersonate: "0xacD03D601e5bB1B275Bb94076fF46ED9D753435A",
    },
    oracles: {
      Pyth: "0xff1a0f4744e8582DF1aE09D5611b887B6a12925C",
    },
    libs: {
      AsMaths: "",
      AsArrays: "",
      AsAccounting: "",
      PythUtils: "",
      ChainlinkUtils: "",
      RedStoneUtils: "",
    },
    astrolab: {
      Swapper: "0xdfe11c1beb360820a6aa9ada899243de459b3894",
      StrategyV5Agent: "",
      "HopSingleStake.USDC": "",
      "HopSingleStake.WETH": "",
      "Astrolab Hop MetaStable": "",
      "Astrolab Aave Metastable": "",
      "Astrolab Stargate Metastable": "",
    },
    tokens: {
      OP: "0x4200000000000000000000000000000000000042",
      WETH: "0x4200000000000000000000000000000000000006",
      WGAS: "0x4200000000000000000000000000000000000006",
      WBTC: "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
      sBTC: "0x298B9B95708152ff6968aafd889c6586e9169f1D",
      USDC: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
      USDCe: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
      USDT: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",
      LUSD: "0xc40f949f8a4e094d1b49a23ea9241d289b7b2819",
      sUSD: "0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9",
      DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      FRAX: "0x2E3D870790dC77A83DD1d18184Acc7439A53f475",
      TUSD: "0xcB59a0A753fDB7491d5F3D794316F1adE197B21E",
      axlUSD: "0xEB466342C4d449BC9f53A865D5Cb90586f405215",
      BOB: "0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb",
      DOLA: "0x8aE125E8653821E851F12A49F7765db9a9ce7384",
      USDplus: "0x73cb180bf0521828d8849bc8CF2B920918e23032",

      // staked eth
      sETH: "0xE405de8F52ba7559f9df3C368500B6E6ae6Cee49",
      cbETH: "0xadDb6A0412DE1BA0F936DCaeb8Aaa24578dcF3B2",
      frxETH: "0x6806411765Af15Bddd26f8f544A34cC40cb9838B",
      sfrxETH: "0x484c2D6e3cDd945a8B2DF735e079178C1036578c",
      wstETH: "0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb",

      STG: "0x296f55f8fb28e498b858d0bcda06d955b2cb3f97",
      SGETH: "0xb69c8CBCD90A39D8D3d3ccf0a3E968511C3856A0",
      KNC: "0xa00E3A3511aAC35cA78530c85007AFCd31753819",
      SNX: "0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4",
      RPL: "0xC81D1F0EB955B0c020E5d5b264E1FF72c14d1401",
      HOP: "0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC",
      SYN: "0x5A5fFf6F753d7C11A56A52FE47a177a87e431655",
      VELO: "0x3c8B650257cFb5f272f799F5e2b4e65093a11a05",
      LINK: "0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6",
      LDO: "0xFdb794692724153d1488CcdBE0C56c252596735F",
      FXS: "0x67CCEA5bb16181E7b4109c9c2143c24a1c2205Be",
      PENDLE: "0xBC7B1Ff1c6989f006a1185318eD4E7b5796e66E1",
      BAL: "0xFE8B128bA8C78aabC59d4c64cEE7fF28e9379921",
    },
  },
  // bnb
  56: {
    accounts: {
      impersonate: "0x8894E0a0c962CB723c1976a4421c95949bE2D4E3",
    },
    oracles: {
      Pyth: "0x4D7E825f80bDf85e913E0DD2A2D54927e9dE1594",
    },
    tokens: {
      WBNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      WGAS: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      WETH: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
      BTCB: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
      BSCUSD: "0x55d398326f99059fF775485246999027B3197955",
      USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
      DAI: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
      TUSD: "0x40af3827F39D0EAcBF4A168f8D4ee67c121D11c9",
      BUSD: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
      USDD: "0xd17479997F34dd9156Deef8F95A52D81D265be9c",

      LINK: "0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD",
      MATIC: "0xCC42724C6683B7E57334c4E856f4c9965ED682bD",
      AVAX: "0x1CE0c2827e2eF14D5C4f29a091d735A204794041",
      FTM: "0xAD29AbB318791D579433D831ed122aFeAf29dcfe",
      BCH: "0x8fF795a6F4D97E7887C79beA79aba5cc76444aDf",
      LTC: "0x4338665CBB7B2485A8855A139b75D5e34AB0DB94",
      CAKE: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
      STG: "0xB0D502E938ed5f4df2E681fE6E419ff29631d62b",
      BSW: "0x965F527D9159dCe6288a2219DB51fc6Eef120dD1",
      RDNT: "0xf7DE7E8A6bd59ED41a4b5fe50278b3B7f31384dF",
      VXS: "0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63",
      UNI: "0xBf5140A22578168FD562DCcF235E5D43A02ce9B1",
      DODO: "0x67ee3Cb086F8a16f34beE3ca72FAD36F7Db929e2",
      ANKR: "0xf307910A4c7bbc79691fD374889b36d8531B08e3",
      BIFI: "0xCa3F508B8e4Dd382eE878A314789373D80A5190A",
      JOE: "0x371c7ec6D8039ff7933a2AA28EB827Ffe1F52f07",
    },
  },
  // xdai
  100: {
    accounts : {
      impersonate: "0x5bb83e95f63217cda6ae3d181ba580ef377d2109"
    },
    oracles: {
      Pyth: "0x2880aB155794e7179c9eE2e38200202908C17B43",
    },
    libs: {
      AsMaths: "0x3Ad84F7Dd934D7ba3dc3A6EE42d900237F5ADa0C", // prod
      AsArrays: "",
      AsAccounting: "0x55B5e5C8541feAC305BeBDe91a7558a1a685FbFD", // prod
      PythUtils: "",
      ChainlinkUtils: "0x597a3df5638CF5F5713F2C74147Fbc096E4dBDb0", // prod
      RedStoneUtils: "",
    },
    astrolab: {
      Swapper: "0x47A84E64a9b50D6f489F9AB58DB1ab7a2719C42b", // prod
      StrategyV5Agent: "0x39291B9dc8Fc83E731Bd7318922D34C90081e0DF",
      "HopSingleStake.USDC": "",
      "HopSingleStake.WETH": "",
      "Astrolab Hop MetaStable": "",
      "Astrolab Aave MetaStable": "0xB72F246bB229F67eCBbb1c4bd1b61f6fAA0AC40B",
    },
    tokens: {
      WXDAI: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d",
      WGAS: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d",
      DAI: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d",
      USDT: "0x4ECaBa5870353805a9F068101A40E0f32ed605C6",
      USDC: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83",
      WETH: "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1",
      WBTC: "0x8e5bBbb09Ed1ebdE8674Cda39A0c169401db4252",

      GNO: "0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb",
      HOP: "0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC",
      AGVE: "0x3a97704a1b25F08aa230ae53B352e2e72ef52843",
      stETH: "0x6C76971f98945AE98dD7d4DFcA8711ebea946eA6",
      sDAI: "0xaf204776c7245bF4147c2612BF6e5972Ee483701",
    },
  },
  // manta
  169: {
    accounts: {},
    oracles: {
      Pyth: "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729",
    },
    tokens: {}
  },
  // matic
  137: {
    accounts: {
      impersonate: "0xF977814e90dA44bFA03b6295A0616a897441aceC", // binance
    },
    oracles: {
      Pyth: "0xff1a0f4744e8582DF1aE09D5611b887B6a12925C",
    },
    libs: {
      AsMaths: "0x78D5ECF1fBd052F7D8914DFBd7e3e5B5cD9aa6BB",
      AsArrays: "",
      AsAccounting: "0x1761FF905292548fF2254620166eabd988e48718",
      PythUtils: "",
      ChainlinkUtils: "0x7221EbDd4176b1A21C3C014fd70bAB46E697E272",
      RedStoneUtils: "",
    },
    astrolab: {
      Swapper: "0xdfe11c1beb360820a6aa9ada899243de459b3894",
      StrategyV5Agent: "0xa8973d3A983157163e58C02683ED18ae0C7f990a",
      "HopSingleStake.USDC": "",
      "HopSingleStake.WETH": "",
      "Astrolab Hop MetaStable": "0x9C14F9137Fc7327F336cC73D4218d310F3Faba11",
      "Astrolab Aave MetaStable": "0x11c8f790d252f4a49cfbff5766310873898bf5d3",
      "Astrolab Stargate MetaStable": "",
    },
    tokens: {
      WBTC: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
      WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
      WGAS: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
      WMATIC: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",

      USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      BNB: "0x3BA4c387f786bFEE076A58914F5Bd38d668B42c3",
      USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      USDCe: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
      BUSD: "0xdAb529f40E671A1D4bF91361c21bf9f0C9712ab7",
      DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
      TUSD: "0x2e1AD108fF1D8C782fcBbB89AAd783aC49586756",
      USDD: "0xFFA4D863C96e743A2e1513824EA006B8D0353C57",
      FRAX: "0x45c32fA6DF82ead1e2EF74d17b76547EDdFaFF89",
      agEUR: "0xE0B52e49357Fd4DAf2c15e02058DCE6BC0057db4",

      rETH: "0x0266F4F08D82372CF0FcbCCc0Ff74309089c74d1",
      frxETH: "0xEe327F889d5947c1dc1934Bb208a1E792F953E96",

      HOP: "0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC",
      PAXG: "0x553d3D295e0f695B9228246232eDF400ed3560B5",
      LINK: "0xb0897686c545045aFc77CF20eC7A532E3120E0F1",
      MATIC: "0x0000000000000000000000000000000000001010",
      AVAX: "0x2C89bbc92BD86F8075d1DEcc58C7F4E0107f286b",
      FTM: "0xC9c1c1c20B3658F8787CC2FD702267791f224Ce1",
      UNI: "0xb33EaAd8d922B1083446DC23f610c2567fB5180f",
      LDO: "0xC3C7d422809852031b44ab29EEC9F1EfF2A58756",
      AAVE: "0xD6DF932A45C0f255f85145f286eA0b292B21C90B",
      SNX: "0x50B728D8D964fd00C2d0AAD81718b71311feF68a",
      FXS: "0x1a3acf6D19267E2d3e7f898f42803e90C9219062",
      STG: "0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590",
      SUSHI: "0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a",
      BAL: "0x9a71012B13CA4d3D0Cdc72A177DF3ef03b0E76A3",
      QUICK: "0xf28164A485B0B2C90639E47b0f377b4a438a16B1",
    },
  },
  // opbnb
  204: {
    accounts: {},
    oracles: {},
    tokens: {
      BTCB: "0x7c6b91d9be155a6db01f749217d76ff02a7227f2",
      ETH: "0xe7798f023fc62146e8aa1b36da45fb70855a77ea",
      USDT: "0x9e5aac1ba1a2e6aed6b32689dfcf62a509ca96f3",
      WBNB: "0x4200000000000000000000000000000000000006",
    },
  },
  // ftm
  250: {
    accounts: {
      impersonate: "0x65bab4f268286b9005d6053a177948dddc29bad3",
    },
    oracles: {
      Pyth: "0xff1a0f4744e8582DF1aE09D5611b887B6a12925C",
    },
    tokens: {
      WFTM: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
      WGAS: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
      WBTC: "0x321162Cd933E2Be498Cd2267a90534A804051b11",
      WETH: "0x74b23882a30290451a17c44f4f05243b6b58c76d",
      stFTM: "0x69c744D3444202d35a2783929a0F930f2FBB05ad",

      frxETH: "0x9E73F99EE061C8807F69f9c6CCc44ea3d8c373ee",
      sfrxETH: "0xb90CCD563918fF900928dc529aA01046795ccb4A",
      ankrETH: "0x12D8CE035c5DE3Ce39B1fDD4C1d5a745EAbA3b8C",

      lzUSDC: "0x28a92dde19D9989F39A49905d7C9C2FAc7799bDf",
      axlUSDC: "0x1b6382dbdea11d97f24495c9a90b7c88469134a4",
      FUSDT: "0x049d68029688eabf473097a2fc38ef61633a3c7a",
      FRAX: "0xdc301622e621166BD8E82f2cA0A26c13Ad0BE355",
      MIM: "0x82f0B8B456c1A451378467398982d4834b6829c1",
      USDD: "0xcf799767d366d789e8B446981C2D578E241fa25c",
      MAI: "0xfB98B335551a418cD0737375a2ea0ded62Ea213b",
      DOLA: "0x3129662808bEC728a27Ab6a6b9AFd3cBacA8A43c",

      STFTM: "0x69c744D3444202d35a2783929a0F930f2FBB05ad",
      LDO: "0xFdb794692724153d1488CcdBE0C56c252596735F",
      AAVE: "0x6a07A792ab2965C72a5B8088d3a069A7aC3a993B",
      SNX: "0x56ee926bD8c72B2d5fa1aF4d9E4Cbb515a1E3Adc",
      FXS: "0x7d016eec9c25232b01F23EF992D98ca97fc2AF5a",
      ANKR: "0x0615Dbba33Fe61a31c7eD131BDA6655Ed76748B1",
      SUSHI: "0xae75A438b2E0cB8Bb01Ec1E1e376De11D44477CC",
      AXL: "0x8b1f4432F943c465A973FeDC6d7aa50Fc96f1f65",
      STG: "0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590",
      SYN: "0xE55e19Fb4F2D85af758950957714292DAC1e25B2",
      SPELL: "0x468003B688943977e6130F4F68F23aad939a1040",
      BOO: "0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE",
    },
  },
  // zksync
  324: {
    impersonate: {},
    oracles: {
      Pyth: "0xf087c864AEccFb6A2Bf1Af6A0382B0d0f6c5D834",
    },
    tokens: {
      WETH: "0x000000000000000000000000000000000000800A",
      WGAS: "0x000000000000000000000000000000000000800A",
      WBTC: "0xBBeB516fb02a01611cBBE0453Fe3c580D7281011",

      USDC: "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4",
      DAI: "0x4B9eb6c0b6ea15176BBF62841C6B2A8a398cb656",
      USDT: "0x493257fD37EDB34451f62EDf8D2a0C418852bA4C",
      LUSD: "0x503234F203fC7Eb888EEC8513210612a43Cf6115",

      rETH: "0x32Fd44bB869620C0EF993754c8a00Be67C464806",
      cbETH: "0x75Af292c1c9a37b3EA2E6041168B4E48875b9ED5",
      ETHx: "0x668cc2668Eeeaf8075d38E72EF54fa546BF3C39c",

      PEPE: "0xFD282F16a64c6D304aC05d1A58Da15bed0467c71",
      KNC: "0x6ee46Cb7cD2f15Ee1ec9534cf29a5b51C83283e6",
    },
  },
  // rollux
  570: {
    accounts: {},
    oracles: {},
    tokens: {},
  },
  // polygon zkevm
  1101: {
    accounts: {},
    oracles: {
      Pyth: "0xC5E56d6b40F3e3B5fbfa266bCd35C37426537c65",
    },
    tokens: {},
  },
  // moonbeam
  1284: {
    accounts: {
      impersonate: "0x73197B461eA369b36d5ee96A1C9f090Ef512be21",
    },
    oracles: {
      Pyth: "",
    },
    tokens: {
      WGLMR: "0xAcc15dC74880C9944775448304B263D191c6077F",
      WGAS: "0xAcc15dC74880C9944775448304B263D191c6077F",
      whBTC: "0xE57eBd2d67B462E9926e04a8e33f01cD0D64346D",
      WETH: "0xab3f0245B83feB11d15AAffeFD7AD465a59817eD",

      frxETH: "0x82bbd1b6f6De2B7bb63D3e1546e6b1553508BE99",
      sfrxETH: "0xecf91116348aF1cfFe335e9807f0051332BE128D",

      FRAX: "0x322E86852e492a7Ee17f28a78c663da38FB33bfb",
      whDAI: "0x06e605775296e851FF43b4dAa541Bb0984E9D6fD",
      axlUSDC: "0xCa01a1D0993565291051daFF390892518ACfAD3A",
      axlUSDT: "0xDFd74aF792bC6D45D1803F425CE62Dd16f8Ae038",
      whUSDC: "0x931715FEE2d06333043d11F658C8CE934aC61D0c",

      FXS: "0x2CC0A9D8047A5011dEfe85328a6f26968C8aaA1C",
      SYN: "0xF44938b0125A6662f9536281aD2CD6c499F22004",
      AXL: "0x467719aD09025FcC6cF6F8311755809d45a5E5f3",
    },
  },
  // kava
  2222: {
    accounts: {
      impersonate: "",
    },
    oracles: {
      Pyth: "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729",
    },
    tokens: {
      WKAVA: "0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b",
      WGAS: "0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b",
      SKAVA: "0xc86c7c0efbd6a49b35e8714c5f59d99de09a225b",
      SWKAVA: "0x9d9682577CA889c882412056669bd936894663fd",
      ETH: "0xe3f5a90f9cb311505cd691a46596599aa1a0ad7d",
      WBTC: "0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b",
      USDC: "0xfA9343C3897324496A05fC75abeD6bAC29f8A40f",
      USDT: "0xB44a9B6905aF7c801311e8F4E76932ee959c663C",
      MIM: "0x471EE749bA270eb4c1165B5AD95E614947f6fCeb",
      SGUSDT: "0xAad094F6A75A14417d39f04E690fC216f080A41a",
      STG: "0x83c30eb8bc9ad7C56532895840039E62659896ea",
      SUSHI: "0x7C598c96D02398d89FbCb9d41Eab3DF0C16F227D",
      BIFI: "0xC19281F22A075E0F10351cd5D6Ea9f0AC63d4327",
    },
  },
  // mantle
  5000: {
    accounts: {
      impersonate: "0xf89d7b9c864f589bbF53a82105107622B35EaA40",
    },
    oracles: {
      Pyth: "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729",
    },
    tokens: {
      MNT: "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000",
      WGAS: "0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000",
      WETH: "0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111",
      WBTC: "0xCAbAE6f6Ea1ecaB08Ad02fE02ce9A44F09aebfA2",

      USDT: "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE",
      USDC: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9",

      SGUSDC: "0xAad094F6A75A14417d39f04E690fC216f080A41a",

    },
  },
  // horizen eon
  7332: {
    accounts: {},
    oracles: {
      Pyth: "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729",
    },
    tokens: {},
  },
  // base
  8453: {
    accounts: {
      impersonate: "0x09aea4b2242abc8bb4bb78d537a67a245a7bec64",
    },
    oracles: {
      Pyth: "0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a",
    },
    libs: {
      AsAccounting: "",
    },
    astrolab: {
      Swapper: "",
      StrategyV5Agent: "",
    },
    tokens: {
      WETH: "0x4200000000000000000000000000000000000006",
      WGAS: "0x4200000000000000000000000000000000000006",
      tBTC: "0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b",
      USDbC: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
      USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
      MIM: "0x4A3A6Dd60A34bB2Aba60D73B4C88315E9CeB6A3D",
      R: "0xaFB2820316e7Bc5Ef78d295AB9b8Bb2257534576",
      USDplus: "0xda3de145054ED30Ee937865D31B500505C4bDfe7",

      cbETH: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
      rETH: "0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c",

      SGETH: "0x224D8Fd7aB6AD4c6eb4611Ce56EF35Dec2277F03",
      STG: "0xE3B53AF74a4BF62Ae5511055290838050bf764Df",
      KNC: "0x28fe69Ff6864C1C218878BDCA01482D36B9D57b1",
    },
  },
  // evmos
  9001: {
    accounts: {},
    oracles: {
      Pyth: "0x354bF866A4B006C9AF9d9e06d9364217A8616E12",
    },
    tokens: {},
  },
  // arbitrum
  42161: {
    accounts: {
      impersonate: "0x489ee077994B6658eAfA855C308275EAd8097C4A",
    },
    oracles: {
      Pyth: "0xff1a0f4744e8582DF1aE09D5611b887B6a12925C",
    },
    libs: {
      AsAccounting: "",
    },
    astrolab: {
      Swapper: "",
      StrategyV5Agent: "",
    },
    tokens: {
      WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
      WGAS: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
      WBTC: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
      ARB: "0x912CE59144191C1204E64559FE8253a0e49E6548",
      USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      USDCe: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
      USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      TUSD: "0x4D15a3A2286D883AF0AA1B3f21367843FAc63E07",
      // SUSD: "0xA970AF1a584579B618be4d69aD6F73459D112F95", // no liqudity
      FRAX: "0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F",
      MIM: "0xFEa7a6a0B346362BF88A9e4A88416B77a57D6c2A",
      USDD: "0x680447595e8b7b3Aa1B43beB9f6098C79ac2Ab3f",
      AGEUR: "0xFA5Ed56A203466CbBC2430a43c66b9D8723528E7",

      LINK: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
      SUSHI: "0xd4d42F0b6DEF4CE0383636770eF773390d85c61A",
      CRV: "0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978",
      COMP: "0x354A6dA3fcde098F8389cad84b0182725c6C91dE",
      WSTETH: "0x0fBcbaEA96Ce0cF7Ee00A8c19c3ab6f5Dc8E1921",
      FRXETH: "0x178412e79c25968a32e89b11f63B33F733770c2A",
      GMX: "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a",
      FXS: "0x9d2F299715D94d8A7E6F5eaa8E654E8c74a988A7",
      LDO: "0xFdb794692724153d1488CcdBE0C56c252596735F",

      SGETH: "0x82CbeCF39bEe528B5476FE6d1550af59a9dB6Fc0",
      STG: "0x6694340fc020c5E6B96567843da2df01b2CE1eb6",
      // AXL: "0x23ee2343B892b1BB63503a4FAbc840E0e2C6810f", // no liquidity
      ACX: "0x53691596d1BCe8CEa565b84d4915e69e03d9C99d",
      PENDLE: "0x0c880f6761F1af8d9Aa9C466984b80DAb9a8c9e8",
      RDNT: "0x3082CC23568eA640225c2467653dB90e9250AaA0",
      KNC: "0xe4DDDfe67E7164b0FE14E218d80dC4C08eDC01cB",
      BAL: "0x040d1EdC9569d4Bab2D15287Dc5A4F10F56a56B8",
      AURA: "0x1509706a6c66CA549ff0cB464de88231DDBe213B",
      JOE: "0x371c7ec6D8039ff7933a2AA28EB827Ffe1F52f07",
      JONES: "0x10393c20975cF177a3513071bC110f7962CD67da",
      HOP: "0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC",
      LYRA: "0x079504b86d38119F859c4194765029F692b7B7aa",
      LODE: "0xF19547f9ED24aA66b03c3a552D181Ae334FBb8DB",
      DODO: "0x69Eb4FA4a2fbd498C257C57Ea8b7655a2559A581",
      GNS: "0x18c11FD286C5EC11c3b683Caa813B77f5163A122",
      GRAIL: "0x3d9907F9a368ad0a51Be60f7Da3b97cf940982D8",
      VELA: "0x088cd8f5eF3652623c22D48b1605DCfE860Cd704",
    },
  },
  // celo
  42220: {
    oracles: {
      Pyth: "0xff1a0f4744e8582DF1aE09D5611b887B6a12925C",
    },
    accounts: {
      impersonate: "0x1e0f3bfc926c4c4b98d428de9bbf0e5fa5909063",
    },
    tokens: {
      CELO: "0x471EcE3750Da237f93B8E339c536989b8978a438",
      WGAS: "0x471EcE3750Da237f93B8E339c536989b8978a438",
      WETH: "0x122013fd7dF1C6F636a5bb8f03108E876548b455", // optics
      WBTC: "0xD629eb00dEced2a080B7EC630eF6aC117e614f1b", // wrapped.com
      oWBTC: "0xbaab46e28388d2779e6e31fd00cf0e5ad95e327b", // optics

      ptUSDT: "0x617f3112bf5397D0467D315cC709EF968D9ba546",
      USDC: "0xef4229c8c3250C675F21BCefa42f58EfbfF6002a", // optics
      cUSDC: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
      MAI: "0xB9C8F0d3254007eE4b98970b94544e473Cd610EC",
      whUSDC: "0x37f750B7cC259A2f741AF45294f6a16572CF5cAd",

      whEUROC: "0xBddC3554269053544bE0d6d027a73271225E9859",
      cEUR: "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73",

      SUSHI: "0x29dFce9c22003A4999930382Fd00f9Fd6133Acd1",
    },
  },
  // avalanche
  43114: {
    accounts: {
      impersonate: "0x9f8c163cBA728e99993ABe7495F06c0A3c8Ac8b9",
    },
    oracles: {
      Pyth: "0x4305FB66699C3B2702D4d05CF36551390A4c69C6",
    },
    tokens: {
      WBTCe: "0x50b7545627a5162F82A992c33b87aDc75187B218",
      WAVAX: "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",

      USDTe: "0xc7198437980c041c805a1edcba50c1ce5db95118",
      USDT: "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7",
      USDCe: "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664",
      USDC: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
      DAI: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70",
      BUSDe: "0x19860CCB0A68fd4213aB9D8266F7bBf05A8dDe98",

      LINKe: "0x5947BB275c521040051D82396192181b413227A3",
      AAVEe: "0x63a72806098Bd3D9520cC43356dD78afe5D386D9",
      FRAX: "0xD24C2Ad096400B6FBcd2ad8B24E7acBc21A1da64",
      SNXe: "0xbec243c995409e6520d7c41e404da5deba4b209b",
    },
  },
  // linea
  59144: {
    accounts: {
      impersonate: "0x7160570bb153edd0ea1775ec2b2ac9b65f1ab61b",
    },
    oracles: {
      Pyth: "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729"
    },
    tokens: {
      WETH: "0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f",
      WGAS: "0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f",
      WBTC: "0x3aAB2285ddcDdaD8edf438C1bAB47e1a9D05a9b4",

      USDT: "0xA219439258ca9da29E9Cc4cE5596924745e12B93",
      USDC: "0x176211869ca2b568f2a7d4ee941e073a821ee1ff",
      DAI: "0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5",
      BUSD: "0x7d43AABC515C356145049227CeE54B608342c0ad",
      MIM: "0xDD3B8084AF79B9BaE3D1b668c0De08CCC2C9429A",

      SGETH: "0xAad094F6A75A14417d39f04E690fC216f080A41a",

      AVAX: "0x5471ea8f739dd37E9B81Be9c5c77754D8AA953E4",
      BNB: "0xf5C6825015280CdfD0b56903F9F8B5A2233476F5",
      LINK: "0x5b16228b94b68c7ce33af2acc5663ebde4dcfa2d",
      UNI: "0x636B22bC471c955A8DB60f28D4795066a8201fa3",
      LDO: "0x0e076AAFd86a71dCEAC65508DAF975425c9D0cB6",
      KNC: "0x3b2F62d42DB19B30588648bf1c184865D4C3B1D6",
    },
  },
  // scroll
  534352: {
    accounts: {
      impersonate: "0xeFaAE8E0381bD4e23CE9A662cfA833Fb4ED916e5",
    },
    oracles: {
      Pyth: "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729"
    },
    tokens: {
      WETH: "0x5300000000000000000000000000000000000004",
      WGAS: "0x5300000000000000000000000000000000000004",
      WBTC: "0x3C1BCa5a656e69edCD0D4E36BEbb3FcDAcA60Cf1",

      USDC: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4",
      USDT: "0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df",
      DAI: "0xcA77eB3fEFe3725Dc33bccB54eDEFc3D9f764f97",

      UNI: "0x434cdA25E8a2CA5D9c1C449a8Cb6bCbF719233E8",
      AAVE: "0x79379C0E09a41d7978f883a56246290eE9a8c4d3",
      CRV: "0xB755039eDc7910C1F1BD985D48322E55A31AC0bF",
      CAKE: "0x1b896893dfc86bb67Cf57767298b9073D2c1bA2c",
      BAL: "0x6a28e90582c583fcd3347931c544819C31e9D0e0",
      KNC: "0x608ef9a3bffe206b86c3108218003b3cfbf99c84"
    },
  },
  // neon
  245022934: {
    accounts: {
      impersonate: "0xef117c0b7b2512c812a64d2ce9bfe767cbb4c1f8",
    },
    oracles: {
      Pyth: "0x7f2dB085eFC3560AFF33865dD727225d91B4f9A5"
    },
    tokens: {
      WNEON: "0x202c35e517fa803b537565c40f0a6965d7204609",
      WGAS: "0x202c35e517fa803b537565c40f0a6965d7204609",
      WETH: "0xcffd84d468220c11be64dc9df64eafe02af60e8a", // Wormhole
      WBTC: "0x54ecec9d995a6cbff3838f6a8f38099e518805d7", // Sollet

      USDC: "0xea6b04272f9f62f997f666f07d3a974134f7ffb9",
      USDT: "0x5f0155d08ef4aae2b500aefb64a3419da8bb611a",
      WSOL: "0x5f38248f339bf4e84a2caf4e4c0552862dc9f82a",
    },
  },
  // aurora
  1313161554: {
    accounts: {},
    oracles: {
      Pyth: "0xF89C7b475821EC3fDC2dC8099032c05c6c0c9AB9"
    },
    tokens: {},
  },
} as { [chainId: number]: NetworkAddresses };

// addresses[42161] == byNetwork("arbitrum-mainnet-one")
export const byNetwork = (id: string | number) =>
  addresses[id as number] ?? addresses[networkBySlug[id].id];

export default addresses;
