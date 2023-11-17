import "@nomiclabs/hardhat-ethers";
import { config } from "@astrolabs/hardhat/dist/hardhat.config";

config.solidity?.compilers.forEach((compiler) => {
    compiler.settings.optimizer = {
        enabled: true,
        runs: 200,
    };
});
config.paths = {
    // registry
    sources: "./src",
    interfaces: "../registry/interfaces",
    abis: "../registry/abis",
    registry: "../registry",
    // tmp build files
    artifacts: "./artifacts",
    cache: "./cache",
    // local sources
    tests: "./test/integration"
} as any;

export default config;
