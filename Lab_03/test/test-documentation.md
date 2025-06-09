# Group13TokenSale Test Documentation

## Overview
This test suite verifies the functionality of a token sale contract with dynamic pricing based on ETH balance and time.

## Initial Setup
- Deploys both Token and Sale contracts
- Transfers 50% of tokens to sale contract
- Adds 10 ETH initial balance to sale contract

## Test Cases

### Test 1: Initial State and Price Calculation Understanding
**Purpose:** Demonstrates how token price is calculated
- Verifies initial price starts at 5 ETH per token (base price)
- Shows how interest rate is calculated: ETH_Balance / (2 * 10^9)
- Confirms price calculation formula is working correctly
- Key point: More ETH in contract = Higher interest rate = Faster price growth

### Test 2: Buying Tokens
**Purpose:** Tests token purchase functionality and ETH balance effects
- Demonstrates buying 2 tokens
- Shows how ETH flows INTO the contract during purchase
- Verifies price changes after purchase due to increased ETH balance
- Demonstrates how higher ETH balance leads to higher interest rate
- Documents the complete transaction flow with before/after states

### Test 3: Time Effect on Price
**Purpose:** Shows how token price increases over time
- Tests price changes over multiple time periods (1 day, 2 days)
- Verifies price increase formula: Price = BasePrice × (1 + InterestRate × DaysElapsed)
- Shows continuous price growth over time
- Confirms that price increases are proportional to time passed

### Test 4: Selling Tokens
**Purpose:** Tests token selling mechanism
- Demonstrates complete buy-then-sell cycle
- Shows how ETH flows OUT of contract during sales
- Verifies price changes after selling due to decreased ETH balance
- Demonstrates lower ETH balance leads to lower interest rate
- Documents how selling affects future price growth

### Test 5: Interest Rate Impact
**Purpose:** Analyzes how different ETH balances affect price growth
- Tests scenarios with different ETH balances (1, 100, 1000 ETH)
- Shows price growth differences based on ETH balance
- Demonstrates relationship between ETH balance and interest rate
- Proves that higher ETH reserves lead to faster price growth

### Test 6: Complete Transaction Cycle
**Purpose:** End-to-end test of contract functionality
- Shows full lifecycle: buy → wait → buy → wait → sell
- Demonstrates compound effects of:
  - Multiple purchases increasing ETH balance
  - Time passage affecting price
  - Sales decreasing ETH balance
  - Dynamic price recalculation at each step
- Documents complete state changes throughout the cycle

## Key Findings
1. Price mechanism is dynamic and influenced by:
   - Base price (5 ETH)
   - ETH balance in contract
   - Time passed since contract deployment
2. ETH balance directly affects interest rate and price growth
3. Price increases are continuous and compound over time
4. System maintains balance through buy/sell mechanics
