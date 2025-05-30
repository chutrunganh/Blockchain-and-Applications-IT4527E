require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: false,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    ...(process.env.SEPOLIA_RPC_URL && process.env.PRIVATE_KEY ? {
      sepolia: {
        url: process.env.SEPOLIA_RPC_URL,
        accounts: [process.env.PRIVATE_KEY],
      }
    } : {})
  },
  ...(process.env.ETHERSCAN_API_KEY ? {
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY,
    }
  } : {})
};
