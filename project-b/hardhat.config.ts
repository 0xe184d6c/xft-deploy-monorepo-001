import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  paths: {
    artifacts: "./artifacts",
    sources: "./contracts",
    tests: "./test",
  },
};

export default config;