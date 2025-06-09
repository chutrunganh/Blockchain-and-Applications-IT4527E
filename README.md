# 🚀 Blockchain-and-Applications-IT4527E


## 📚 Introduction

This repository contains lab exercises for the IT4527E course, which includes deploying a simple **ERC20 token** and its associated **sale contract**. 

## 🗂️ Project Structure

Each lab shares a common structure:

```plaintext
Lab_0x/
├── contracts/
│   ├── Group13Token.sol          # ERC-20 token definition contract
│   └── Group13TokenSale.sol      # Token sale contract with custom pricing
│
├── frontend/                     # UI for interacting with the token sale contract using Next.js (only for Lab 03)
│  
├── scripts/ 
│   └── deploy.js                 # Script to deploy the contracts to Hardhat local network/ Sepolia testnet
│ 
├── test/
│   └── Group13TokenSale_test.js  # Unit tests for the token sale contract
│ 
├── hardhat.config.js             # Hardhat configuration file 
├── package.json                  # Project dependencies
├── README.md                     # Report file
└── Requirement_Lab0x.md          # Requirements for the Lab 0x
```

## 📝 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
