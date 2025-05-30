# Quick Demo Script for Lab 3 Presentation

## Setup Commands (run these first)

```bash
# Terminal 1 - Start Hardhat Network
npx hardhat node

# Terminal 2 - Deploy Contracts  
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3 - Start Frontend
cd frontend
npm run dev
```

## Demo Flow (5-7 minutes)

### 1. Introduction (30 seconds)
- "This is our ERC-20 token with dynamic pricing system"
- "The token follows all ERC-20 standards with 100,000 total supply"
- "Price starts at 5 ETH per token but increases based on contract ETH balance and time"

### 2. Show Initial State (30 seconds)
- Connect MetaMask wallet
- Point out key information:
  - Current price: ~5.0 ETH
  - Contract has 50,000 tokens available
  - Contract has 100 ETH initial liquidity
  - Your balance: 0 tokens, ~10,000 ETH

### 3. First Purchase Demo (1 minute)
- "Let me buy 1 token to demonstrate the basic functionality"
- Enter "1" in buy field
- Show estimated cost calculation
- Click "Show Details" to explain price calculation
- Execute transaction
- Point out changes:
  - Your token balance increased to 1
  - ETH balance decreased
  - Price increased slightly
  - Transaction appears in history

### 4. Dynamic Pricing Demo (2 minutes)
- "Now let me show how the price increases with larger transactions"
- Enter "10" tokens
- Show new estimated cost (higher price per token)
- Execute transaction
- Point out:
  - Price jumped significantly
  - More ETH in contract = higher interest rate
  - Formula explanation in price breakdown

### 5. Selling Demo (1 minute)  
- Switch to "Sell" mode
- "Now I can sell tokens back at current market price"
- Enter "5" tokens to sell
- Show estimated ETH to receive
- Execute transaction (approve + sell)
- Point out:
  - Received ETH at current high price
  - Contract ETH balance decreased
  - Price may adjust slightly

### 6. Time-Based Pricing (30 seconds)
- "Price also increases over time even without transactions"
- Show "Days Elapsed" in price breakdown
- "In real deployment, price would compound daily"

### 7. Error Handling Demo (30 seconds)
- Try to buy with insufficient funds
- Try to sell more tokens than owned
- Show proper error messages

## Key Points to Emphasize

✅ **ERC-20 Compliance**: Standard token functions
✅ **Fixed Supply**: 100,000 tokens total  
✅ **Dynamic Pricing**: Price = BasePrice + (BasePrice × InterestRate × DaysElapsed)
✅ **Interest Rate Formula**: ETH_balance ÷ (2 × 10⁹)
✅ **Bi-directional Trading**: Buy and sell functionality
✅ **Price Recalculation**: Updates on every transaction
✅ **Error Handling**: Proper validation and user feedback

## Troubleshooting During Demo

- **"Transaction Failed"**: Check MetaMask gas settings
- **"Price seems too high"**: Explain that's expected with large balances
- **"UI not updating"**: Click "Refresh Data" button
- **"MetaMask issues"**: Make sure connected to localhost:8545

## Sample Numbers for Demo

| Action | Amount | Expected Result |
|--------|--------|----------------|
| Initial | - | 5.0 ETH/token |
| Buy 1 token | 1 | ~5.001 ETH/token |
| Buy 10 tokens | 10 | ~5.05 ETH/token |
| Sell 5 tokens | 5 | Receive ~25 ETH |

*Note: Exact numbers depend on elapsed time and contract balance*
