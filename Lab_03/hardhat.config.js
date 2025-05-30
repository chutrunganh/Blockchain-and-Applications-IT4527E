require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
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
      chainId: 1337,
      accounts: {
        count: 5, // Limit to 5 test accounts instead of the default 20
        accountsBalance: "10000000000000000000000" // 10000 ETH per account
      }
    }
  }
};
