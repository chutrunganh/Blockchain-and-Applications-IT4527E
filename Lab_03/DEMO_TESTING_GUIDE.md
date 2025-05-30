# Token Sale Demo Testing Guide

## 🎯 Testing the Dynamic Pricing UI

This guide will help you demonstrate the dynamic pricing mechanism and high-precision price display.

### 1. Start the Development Environment

```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3: Start frontend
cd frontend
npm run dev
```

### 2. Open Browser and Connect MetaMask

1. Go to `http://localhost:3000`
2. Connect MetaMask to localhost:8545
3. Import one of the test accounts from Hardhat node

### 3. UI Features to Demonstrate

#### A. High-Precision Price Display
- **Current Price** is now displayed with 12 decimal places
- Shows real-time price changes with change indicators (↗️/↘️)
- Auto-refreshes every 10 seconds
- Manual refresh button available

#### B. Price Breakdown Details
- Click "Show Price Breakdown" to see:
  - Base Price: 5.000000000000 ETH
  - Current ETH Balance in contract
  - Time elapsed since contract creation
  - Interest rate calculation
  - Price formula explanation

#### C. Real-time Cost Calculation
- As you type token amounts, see precise cost calculations
- Shows: Amount × Current Price = Total Cost
- Displays with 10 decimal precision

### 4. Testing Scenarios

#### Scenario 1: Initial Price Check
```
Expected: Price = 5.000000000000 ETH (base price, no time elapsed)
Action: Check current price display
Result: Should show exactly 5.000000000000 ETH
```

#### Scenario 2: Buy Tokens to Increase ETH Balance
```
Action: Buy 10 tokens
Expected: Price should increase slightly due to ETH balance change
Check: Price breakdown shows increased ETH balance
```

#### Scenario 3: Wait for Time-based Price Increase
```
Action: Wait or simulate time passage
Expected: Price increases based on time elapsed
Formula: Price = 5 + (5 × (ETH_balance/2×10^9) × days)
```

#### Scenario 4: Precision Testing
```
Action: Try buying fractional amounts (e.g., 0.001 tokens)
Expected: Cost calculated with high precision
Check: No rounding errors in small amounts
```

### 5. Price Change Indicators

Watch for these visual cues:
- 🔄 Auto-refresh every 10 seconds
- ↗️ Green indicator when price increases
- ↘️ Red indicator when price decreases  
- 📊 Percentage change display
- ⚡ Animated pulse effect for 5 seconds

### 6. Testing the Bug Fix

**Before Fix:**
- Price calculation used `BigInt(buyAmount)` instead of `tokenAmount`
- Resulted in incorrect cost calculation
- Transaction would fail with "Internal JSON-RPC error"

**After Fix:**
- Uses proper `tokenAmount` (parsed to wei)
- Accurate cost calculation: `(price × tokenAmount) / 1 ether`
- Transactions succeed with correct ETH amount

### 7. Demo Script

1. **Show Initial State**
   - Point out 12-decimal precision price
   - Show price breakdown details

2. **Buy Small Amount**
   - Enter 0.1 tokens
   - Show precise cost calculation
   - Execute transaction

3. **Show Price Change**
   - Refresh price manually
   - Point out any changes
   - Explain the formula

4. **Buy Larger Amount**
   - Enter 100 tokens  
   - Show significant cost
   - Note price increase after transaction

5. **Wait and Refresh**
   - Wait 10 seconds for auto-refresh
   - Show time-based price changes
   - Demonstrate the dynamic nature

### 8. Troubleshooting

If price doesn't seem to change:
- ETH balance might be too small for visible impact
- Time elapsed might be minimal
- Try larger transactions or add more ETH to contract

### 9. Key Points to Highlight

✅ **High Precision**: 12 decimal places prevent rounding errors
✅ **Real-time Updates**: Price refreshes automatically  
✅ **Visual Feedback**: Change indicators and animations
✅ **Accurate Calculations**: Fixed BigInt precision issues
✅ **Transparent Formula**: Breakdown shows all components
✅ **User-Friendly**: Clear cost estimates before transactions

This demonstrates a professional, production-ready dynamic pricing system!
