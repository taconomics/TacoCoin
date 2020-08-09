import { usePlugin, task } from "@nomiclabs/buidler/config";
usePlugin("@nomiclabs/buidler-ethers");
usePlugin("@nomiclabs/buidler-waffle");
usePlugin("@nomiclabs/buidler-etherscan");
usePlugin("solidity-coverage");
usePlugin("buidler-typechain");

require('dotenv').config()

const INFURA_PROJECT_ID = "083f01d908124b7d976218a06bb6db1c"

const config = {
  networks: {
    coverage: {
      url: "http://localhost:8555",
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`]
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`]
    }
  },
  solc: {
    version: "0.6.8",
  },
  typechain: {
    outDir: "./src/types",
    target: "ethers-v4",
  },
  etherscan: {
    url: "https://api.etherscan.io/api",
    apiKey: process.env.ETHERSCAN_API_KEY
  },
};
export default config;
