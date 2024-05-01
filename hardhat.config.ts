import { HardhatUserConfig } from "hardhat/types";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const morphTestnet = {
  url: process.env.MORPH_TESTNET_URL || "",
  accounts:
    process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
};

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    morphTestnet,
  },
  etherscan: {
    apiKey: {
      eth: "DUU2RIG2D7G2NT3FST6HHJNRQSVQFD1XCI",
      optimisticGoerli: "SZZNTRAM27FZW2V3TFBEB3TIYHH9US543A",
      morphTestnet: "anything",
    },
    customChains: [
      {
        network: "morphTestnet",
        chainId: 2710,
        urls: {
          apiURL: "https://explorer-api-testnet.morphl2.io/api? ",
          browserURL: "https://explorer-testnet.morphl2.io/",
        },
      },
    ],
  },
};

export default config;
