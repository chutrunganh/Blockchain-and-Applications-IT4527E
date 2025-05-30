# Contract Features

Recall from the prvios lab (Lab 02), we have created a simple ERC20 token contract with some sell constraints as follows:

- **Tiered Pricing**: First 25% of tokens cost 5 ETH each, remaining tokens cost 10 ETH each
- **Sale Cap**: Maximum 50% of total supply can be sold
- **Duration**: 30-day sale period
- **Automatic Refunds**: Excess ETH is automatically refunded

We have successfully run and tested the contract Remix online IDE (Also tried to deploy against the Sepolia testnet but still facing some issues). In this lab, I will:

- Deploy the ERC20 token contract to a local Hardhat network
- Make the UI web interface to interact with the contract
- Some new requirements as defined in the [Lab 03 Requirements](#)

# Deploy ERC20 Contract

> [!TIP]
> You can conduct this lab using the [Remix IDE](https://remix.ethereum.org/) for fast startup with zero configuration, or run it locally using [Hardhat](https://hardhat.org/) for a more realistic development environment. This will require using WSL and some additional configuration steps. 

## 🚀 Quick Start - Local Deployment with Hardhat

For easier testing and development, you can deploy the contracts to a local Hardhat network:

### Prerequisites
- Node.js (v16 or higher)
- MetaMask browser extension

### Setup and Deployment

1. **Install dependencies:**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

2. **Start Hardhat local network** (in one terminal):
   ```bash
   npm run node
   ```
   This will start a local blockchain at `http://127.0.0.1:8545` with 20 test accounts, each having 10,000 ETH.

3. **Deploy contracts** (in another terminal):
   ```bash
   npm run deploy:local
   ```
   This will deploy both the token and sale contracts to the local network.

4. **Start the web interface:**
   ```bash
   npm run frontend
   ```
   Open http://localhost:3000 in your browser.

5. **Configure MetaMask:**
   - Add Hardhat local network:
     - Network Name: Hardhat
     - RPC URL: http://127.0.0.1:8545
     - Chain ID: 31337
     - Currency Symbol: ETH
   - Import one of the test accounts using the private keys shown in the terminal when you ran `npm run node`

### Testing the Contracts

The web interface allows you to:
- View token and sale contract information
- Check your token and ETH balances
- Buy tokens with the tiered pricing system
- See real-time transaction status




