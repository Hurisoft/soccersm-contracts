import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.26",
    settings: {
      // viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "london",
    },
  },
  networks: {
    morphTestnet: {
      url: "https://rpc-quicknode-holesky.morphl2.io",
      accounts: [process.env.PRIVATE_KEY!],
      gasPrice: 20000000000, // 2 gwei in wei
    },
    optimism: {
      url: "https://optimism-mainnet.infura.io/v3/82de4c56f4364dd899635d8ebbc349cc",
      chainId: 10,
      accounts: [process.env.PRIVATE_KEY!],
    },
    optimismTestnet: {
      url: "https://optimism-sepolia.infura.io/v3/82de4c56f4364dd899635d8ebbc349cc",
      chainId: 11155420,
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
  etherscan: {
    apiKey: {
      morphTestnet: "anything",
    },
    customChains: [
      {
        network: "morphTestnet",
        chainId: 2810,
        urls: {
          apiURL: "https://explorer-api-holesky.morphl2.io/api? ",
          browserURL: "https://explorer-holesky.morphl2.io/",
        },
      },
    ],
  },
};

export default config;
