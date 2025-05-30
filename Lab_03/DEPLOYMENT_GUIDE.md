# Group13 Token Sale - Local Deployment Guide

## 🎯 Complete Setup Instructions

Follow these steps to deploy and test your token sale contracts locally:

### Step 1: Start Hardhat Local Network

Open a terminal and run:
```bash
cd /home/chutrunganh/Blockchain-and-Applications-IT4527E/Lab_02
npm run node
```

This will start a local Ethereum blockchain using Hardhat. This simulates a blockchain locally so you can test and deploy contracts quickly and safely. You should see output like:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========

WARNING: These accounts, and their private keys, are publicly known.
Any funds sent to them on Mainnet or any other live network WILL BE LOST.

Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
...
```

From the outout, we clearly see that the network is running on `http://localhost:8545` and we have several test accounts with 10,000 ETH each.

> [!NOTE]
> Keep this terminal running!

### Step 2: Deploy Contracts

Open a new terminal and run:
```bash
cd /home/chutrunganh/Blockchain-and-Applications-IT4527E/Lab_02
npm run deploy:local
```

This will deploy your smart contracts (ERC-20 + Token Sale) to the local blockchain.

You should see:
```
Deploying contracts to local hardhat network...
Deploying contracts with the account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Account balance: 10000.0

✅ Group13Token deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
✅ Group13TokenSale deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
✅ Tokens transferred to sale contract

📄 Contract Details:
   Token Contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3
   Sale Contract: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
   Total Supply: 1000000.0 G13
   Tokens for Sale: 500000.0 G13
```
This run as config in the [deploy.js](./scripts/deploy.js) script, which deploys two contracts:

- `Group13Token`: Your custom ERC-20 token contract address.
- `Group13TokenSale`: Token sale contract that manages pricing and ETH exchanges on the `Group13Token`.

This script also performs token transfer: Moves sale-allocated tokens to the sale contract, in this case transfer 500,000 G13 tokens (50% of total supply).



<!-- ### Step 3: Configure MetaMask

1. **Add Hardhat Network:**
   - Open MetaMask
   - Click on the network dropdown (usually shows "Ethereum Mainnet")
   - Click "Add network"
   - Fill in:
     - Network Name: `Hardhat`
     - New RPC URL: `http://127.0.0.1:8545`
     - Chain ID: `31337`
     - Currency Symbol: `ETH`
   - Click "Save"

2. **Import Test Account:**
   - Click on the account icon in MetaMask
   - Select "Import Account"
   - Enter one of the private keys from Step 1 (e.g., `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`)
   - Click "Import"

3. **Switch to Hardhat Network:**
   - Make sure MetaMask is connected to the "Hardhat" network you just added -->

### Step 4: Start Web Interface

Open a third terminal and run:
```bash
cd /home/chutrunganh/Blockchain-and-Applications-IT4527E/Lab_02
npm run frontend
```

Open your browser and go to: http://localhost:3000

### Step 5: Test the Token Sale

1. **Connect Wallet:**
   - Click "Connect Wallet" on the web interface
   - Approve the connection in MetaMask

2. **Buy Tokens:**
   - Enter the amount of tokens you want to buy (e.g., `10`)
   - Check the estimated cost
   - Click "Buy Tokens"
   - Confirm the transaction in MetaMask

3. **Test Different Scenarios:**
   - Buy small amounts (under 25% of total supply) - should use 5 ETH per token
   - Buy larger amounts - should use mixed pricing (5 ETH for first 25%, 10 ETH for remainder)
   - Check your token balance after each purchase

## 📊 Contract Features

- **Token Supply:** 1,000,000 G13 tokens
- **Sale Allocation:** 500,000 G13 tokens (50% of total supply)
- **Pricing Tiers:**
  - First 250,000 tokens: 5 ETH per token
  - Remaining 250,000 tokens: 10 ETH per token
- **Sale Duration:** 30 days from deployment
- **Auto Refund:** Excess ETH automatically refunded

## 🔧 Useful Commands

| Command | Purpose |
|---------|---------|
| `npm run node` | Start local blockchain |
| `npm run deploy:local` | Deploy contracts |
| `npm run frontend` | Start web interface |
| `npm run compile` | Compile contracts |
| `npm run test` | Run contract tests |

## 🐛 Troubleshooting

**Problem:** MetaMask shows "Internal JSON-RPC error"
**Solution:** Reset MetaMask account (Settings → Advanced → Reset Account)

**Problem:** Web interface shows "Contracts not found"
**Solution:** Make sure you've deployed contracts and the deployment.json file exists in frontend/

**Problem:** Transaction fails with "insufficient funds"
**Solution:** Make sure you're using an account with enough ETH (test accounts have 10,000 ETH)

**Problem:** Can't connect to local network
**Solution:** Make sure Hardhat node is running and MetaMask is configured correctly

## 📝 Testing Checklist

- [ ] Hardhat node is running
- [ ] Contracts deployed successfully
- [ ] MetaMask configured with Hardhat network
- [ ] Test account imported to MetaMask
- [ ] Web interface loads correctly
- [ ] Can connect wallet
- [ ] Can view contract information
- [ ] Can buy tokens (small amount)
- [ ] Can buy tokens (large amount, tests mixed pricing)
- [ ] Token balance updates correctly
- [ ] ETH balance decreases correctly
- [ ] Excess ETH refunded properly
