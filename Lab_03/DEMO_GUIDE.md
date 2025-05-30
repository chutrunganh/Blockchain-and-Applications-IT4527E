# Lab 3 Demo Guide: ERC20 Token Sale with Dynamic Pricing

This guide will help you demonstrate all the requirements of Lab 3 using the UI.

## Prerequisites

1. **Start Hardhat Local Network**
   ```bash
   npx hardhat node
   ```

2. **Deploy Contracts**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Configure MetaMask**
   - Add Hardhat Network: RPC URL `http://localhost:8545`, Chain ID `1337`
   - Import test accounts using private keys from hardhat node output

## Demo Scenarios

### 1. Initial Setup Verification ✅

**What to demonstrate:**
- Token follows ERC-20 standard
- Total supply is 100,000 tokens
- Initial price is 5 ETH per token
- Contract has 50,000 tokens available for sale

**Steps:**
1. Connect wallet to the dApp
2. Check the "Contract Information" section:
   - Current price should show ~5.0 ETH
   - Contract should have 50,000 tokens
   - Contract should have ~100 ETH initial liquidity
3. Check token information shows proper name and symbol

### 2. Buying Tokens (Basic) ✅

**What to demonstrate:**
- Users can buy tokens with ETH
- Price calculation works correctly
- Token transfer happens

**Steps:**
1. Enter a small amount (e.g., 1 token) in the "Buy Tokens" field
2. Click "Buy Tokens"
3. Confirm transaction in MetaMask
4. Observe:
   - Your token balance increases
   - Your ETH balance decreases
   - Transaction hash appears
   - Price might slightly increase

### 3. Dynamic Pricing System ✅

**What to demonstrate:**
- Price increases based on ETH balance and time
- Formula: `Price = BasePrice + (BasePrice * InterestRate * DaysElapsed)`
- Interest rate = `ETH_balance / (2 * 10^9)`

**Steps:**
1. Record initial price and contract ETH balance
2. Make a purchase (this adds ETH to contract)
3. Note the new price after transaction
4. For time-based testing:
   - You can manually advance time in tests
   - Or wait and make another transaction to see accumulated interest

### 4. Selling Tokens Back ✅

**What to demonstrate:**
- Users can sell tokens back to contract
- They receive ETH at current market price
- Price recalculation after selling

**Steps:**
1. First buy some tokens (if you haven't)
2. Switch to "Sell" mode
3. Enter amount of tokens to sell
4. Click "Sell Tokens"
5. Approve token spending (first transaction)
6. Confirm sell transaction
7. Observe:
   - Token balance decreases
   - ETH balance increases
   - Contract's ETH balance decreases

### 5. Price Evolution Demo ✅

**What to demonstrate:**
- How price changes over multiple transactions
- Impact of contract's ETH balance on pricing

**Sequential Demo:**
1. **Initial State**: Record price, contract ETH balance
2. **Buy Transaction 1**: Small amount (1-2 tokens)
   - Price should increase slightly
3. **Buy Transaction 2**: Larger amount (10 tokens)
   - Price should increase more significantly
4. **Sell Transaction**: Sell some tokens back
   - Price might decrease as ETH leaves contract
5. **Final State**: Compare all recorded values

### 6. Edge Cases and Error Handling ✅

**What to demonstrate:**
- Proper error messages
- Input validation
- Insufficient funds handling

**Test Cases:**
1. Try to buy with insufficient ETH
2. Try to sell more tokens than you own
3. Try to buy more tokens than available in contract
4. Try to enter invalid amounts (0, negative, etc.)

## Expected Results Summary

| Scenario | Expected Behavior |
|----------|------------------|
| Initial Setup | 5 ETH/token, 50K tokens available |
| First Purchase | Slight price increase, tokens received |
| Large Purchase | Significant price increase |
| Selling | Price may decrease, ETH received |
| Insufficient Funds | Clear error message |
| Invalid Inputs | Input validation prevents transaction |

## Key Metrics to Track

1. **Token Price Evolution**
   - Initial: ~5.0 ETH
   - After purchases: Higher (based on formula)
   - After sales: May decrease

2. **Contract ETH Balance**
   - Initial: 100 ETH
   - Increases with buys
   - Decreases with sells

3. **Token Distribution**
   - Contract starts with 50,000 tokens
   - Owner starts with 50,000 tokens
   - Users start with 0 tokens

4. **Time Factor**
   - Price increases over time even without transactions
   - Compound effect with ETH balance

## Demo Script Template

```
1. "Let me show you our ERC-20 token with dynamic pricing..."
2. "Initially, each token costs 5 ETH, but watch how this changes..."
3. "I'll buy 1 token first..." [demonstrate small purchase]
4. "Notice the price increased slightly due to more ETH in the contract..."
5. "Now let me buy 10 tokens..." [demonstrate larger purchase]
6. "See how the price jumped more significantly..."
7. "Now I can sell some tokens back..." [demonstrate selling]
8. "The price adjusts based on the contract's ETH balance and time elapsed..."
```

## Troubleshooting

- **MetaMask not connecting**: Check network configuration
- **Transaction fails**: Check gas limits and account balances
- **Price seems wrong**: Verify contract ETH balance and time elapsed
- **Tokens not appearing**: Check if transaction was confirmed
