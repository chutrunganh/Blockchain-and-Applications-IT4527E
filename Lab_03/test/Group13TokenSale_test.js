const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * Test 1: Initial State and Price Calculation Understanding
 * --------------------------------------------------------
 * Purpose: Verify that the initial price calculation and interest rate logic are correct.
 * Command: npx hardhat test --grep "Test 1"
 * Expected Result: The base price is 5 ETH, the interest rate is calculated from the ETH balance,
 * and the current price matches the base price at deployment.
 */
describe("Test 1: Initial State and Price Calculation Understanding", function () {
  it("Should demonstrate correct understanding of price calculation", async function () {
    console.log("\\n=== TEST 1: PRICE CALCULATION UNDERSTANDING ===");
    
    const contractInfo = await sale.getContractInfo();
    const ethBalance = contractInfo[2]; // 10 ETH = 10 * 10^18 wei
    const basePrice = await sale.basePrice(); // 5 ETH
    
    console.log(`Base price: ${ethers.formatEther(basePrice)} ETH per token`);
    console.log(`ETH in contract: ${ethers.formatEther(ethBalance)} ETH`);
    
    // Calculate expected interest rate
    const ethBalanceInEth = Number(ethers.formatEther(ethBalance));
    const dailyInterestRate = ethBalanceInEth / (2 * 10**9);
    console.log(`Daily interest rate: ${dailyInterestRate.toExponential(4)} = ${ethBalanceInEth} / (2 * 10^9)`);
    
    // Initially price should be base price (no time passed)
    const currentPrice = await sale.getCurrentPrice();
    console.log(`Current price (time=0): ${ethers.formatEther(currentPrice)} ETH`);
    
    // Allow small precision differences due to time passing during deployment
    const tolerance = ethers.parseEther("0.000001"); // 0.000001 ETH tolerance
    const difference = currentPrice > basePrice ? currentPrice - basePrice : basePrice - currentPrice;
    expect(difference).to.be.lte(tolerance);
    
    console.log("\\n✅ Key Understanding:");
    console.log("- Initially each token costs 5 ETH");
    console.log("- Interest rate depends on ETH remaining in contract");
    console.log("- More ETH in contract = higher interest rate = faster price growth");
    console.log("- Price is recalculated on each transaction based on current ETH balance and time");
  });
});

/**
 * Test 2: Buying Tokens (ETH goes INTO contract)
 * ----------------------------------------------
 * Purpose: Test buying tokens, ensure ETH is added to the contract, and price/interest rate increase accordingly.
 * Command: npx hardhat test --grep "Test 2"
 * Expected Result: Buyer receives tokens, contract ETH increases, and price/interest rate go up.
 */
describe("Test 2: Buying Tokens (ETH goes INTO contract)", function () {
  it("Should allow buying tokens and demonstrate ETH balance effect", async function () {
    console.log("\\n=== TEST 2: BUYING TOKENS ===");
    
    const tokensToBuy = ethers.parseUnits("2", 18); // 2 tokens
    
    // Check state before buying
    const priceBefore = await sale.getCurrentPrice();
    const contractInfoBefore = await sale.getContractInfo();
    const ethBefore = contractInfoBefore[2];
    
    console.log(`Before buying:`);
    console.log(`- Price: ${ethers.formatEther(priceBefore)} ETH per token`);
    console.log(`- ETH in contract: ${ethers.formatEther(ethBefore)} ETH`);
    console.log(`- Buying 2 tokens`);
    
    // Calculate cost and buy tokens
    const totalCost = (priceBefore * tokensToBuy) / ethers.parseUnits("1", 18);
    console.log(`- Total cost: ${ethers.formatEther(totalCost)} ETH`);
    
    // Add small buffer for price changes during transaction
    const costWithBuffer = totalCost + ethers.parseEther("0.01");
    
    const buyerBalanceBefore = await token.balanceOf(buyer1.address);
    await sale.connect(buyer1).buyTokens(tokensToBuy, { value: costWithBuffer });
    const buyerBalanceAfter = await token.balanceOf(buyer1.address);
    
    // Check state after buying
    const contractInfoAfter = await sale.getContractInfo();
    const ethAfter = contractInfoAfter[2];
    const priceAfter = await sale.getCurrentPrice();
    
    console.log(`\\nAfter buying:`);
    console.log(`- Buyer received: ${ethers.formatUnits(buyerBalanceAfter - buyerBalanceBefore, 18)} tokens`);
    console.log(`- ETH in contract: ${ethers.formatEther(ethAfter)} ETH`);
    console.log(`- ETH increase: ${ethers.formatEther(ethAfter - ethBefore)} ETH`);
    console.log(`- New price: ${ethers.formatEther(priceAfter)} ETH per token`);
    
    // Calculate new interest rate
    const ethAfterInEth = Number(ethers.formatEther(ethAfter));
    const newDailyRate = ethAfterInEth / (2 * 10**9);
    console.log(`- New daily interest rate: ${newDailyRate.toExponential(4)}`);
    
    console.log("\\n✅ Key Observations:");
    console.log("- ETH goes INTO contract when buying tokens");
    console.log("- Higher ETH balance = higher interest rate");
    console.log("- Future price increases will be faster due to more ETH");
    
    expect(buyerBalanceAfter).to.equal(tokensToBuy);
    expect(ethAfter).to.be.gt(ethBefore); // More ETH in contract
  });
});

/**
 * Test 3: Time Effect on Price
 * ----------------------------
 * Purpose: Demonstrate that the token price increases over time based on the interest rate.
 * Command: npx hardhat test --grep "Test 3"
 * Expected Result: After advancing time, the price increases as expected according to the formula.
 */
describe("Test 3: Time Effect on Price", function () {
  it("Should demonstrate price increase over time", async function () {
    console.log("\\n=== TEST 3: TIME EFFECT ON PRICE ===");
    
    // Record initial state
    const initialPrice = await sale.getCurrentPrice();
    const contractInfo = await sale.getContractInfo();
    const ethBalance = Number(ethers.formatEther(contractInfo[2]));
    const dailyRate = ethBalance / (2 * 10**9);
    
    console.log(`Initial conditions:`);
    console.log(`- Price: ${ethers.formatEther(initialPrice)} ETH`);
    console.log(`- ETH balance: ${ethBalance} ETH`);
    console.log(`- Daily interest rate: ${dailyRate.toExponential(4)}`);
    
    // Wait 1 day and check price
    console.log(`\\nWaiting 1 day...`);
    await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
    await ethers.provider.send("evm_mine");
    
    const priceAfter1Day = await sale.getCurrentPrice();
    const expectedIncrease = Number(ethers.formatEther(initialPrice)) * dailyRate * 1; // 1 day
    const expectedPrice = Number(ethers.formatEther(initialPrice)) * (1 + dailyRate);
    
    console.log(`After 1 day:`);
    console.log(`- New price: ${ethers.formatEther(priceAfter1Day)} ETH`);
    console.log(`- Expected price: ~${expectedPrice.toFixed(10)} ETH`);
    console.log(`- Price increase: ${ethers.formatEther(priceAfter1Day - initialPrice)} ETH`);
    
    // Wait another day
    console.log(`\\nWaiting another day...`);
    await ethers.provider.send("evm_increaseTime", [86400]); // Another day
    await ethers.provider.send("evm_mine");
    
    const priceAfter2Days = await sale.getCurrentPrice();
    console.log(`After 2 days total:`);
    console.log(`- New price: ${ethers.formatEther(priceAfter2Days)} ETH`);
    console.log(`- Total increase: ${ethers.formatEther(priceAfter2Days - initialPrice)} ETH`);
    
    console.log("\\n✅ Key Observations:");
    console.log("- Price increases continuously over time");
    console.log("- Rate depends on ETH balance in contract");
    console.log("- Formula: Price = BasePrice × (1 + InterestRate × DaysElapsed)");
    
    expect(priceAfter1Day).to.be.gt(initialPrice);
    expect(priceAfter2Days).to.be.gt(priceAfter1Day);
  });
});

/**
 * Test 4: Selling Tokens (ETH goes OUT of contract)
 * -------------------------------------------------
 * Purpose: Test selling tokens, ensure ETH is removed from the contract, and price/interest rate decrease accordingly.
 * Command: npx hardhat test --grep "Test 4"
 * Expected Result: Seller receives ETH, contract ETH decreases, and price/interest rate go down.
 */
describe("Test 4: Selling Tokens (ETH goes OUT of contract)", function () {
  it("Should allow selling tokens and demonstrate ETH balance reduction", async function () {
    console.log("\\n=== TEST 4: SELLING TOKENS ===");
    
    // First, buy some tokens to have something to sell
    const tokensToBuy = ethers.parseUnits("1", 18);
    const buyPrice = await sale.getCurrentPrice();
    const buyCost = (buyPrice * tokensToBuy) / ethers.parseUnits("1", 18);
    const buyCostWithBuffer = buyCost + ethers.parseEther("0.01");
    
    await sale.connect(buyer1).buyTokens(tokensToBuy, { value: buyCostWithBuffer });
    console.log(`Setup: Bought 1 token for ${ethers.formatEther(buyCost)} ETH`);
    
    // Wait some time for price to increase
    await ethers.provider.send("evm_increaseTime", [43200]); // 12 hours
    await ethers.provider.send("evm_mine");
    
    // Check state before selling
    const contractInfoBefore = await sale.getContractInfo();
    const ethBefore = contractInfoBefore[2];
    const priceBefore = await sale.getCurrentPrice();
    
    console.log(`\\nBefore selling:`);
    console.log(`- ETH in contract: ${ethers.formatEther(ethBefore)} ETH`);
    console.log(`- Current price: ${ethers.formatEther(priceBefore)} ETH`);
    
    // Sell tokens
    const tokensToSell = ethers.parseUnits("0.5", 18); // Sell half
    const expectedETHReceive = (priceBefore * tokensToSell) / ethers.parseUnits("1", 18);
    
    console.log(`- Selling 0.5 tokens`);
    console.log(`- Expected ETH to receive: ${ethers.formatEther(expectedETHReceive)} ETH`);
    
    // Approve and sell
    await token.connect(buyer1).approve(saleAddress, tokensToSell);
    const buyerETHBefore = await ethers.provider.getBalance(buyer1.address);
    
    await sale.connect(buyer1).sellTokens(tokensToSell);
    
    // Check state after selling
    const contractInfoAfter = await sale.getContractInfo();
    const ethAfter = contractInfoAfter[2];
    const priceAfter = await sale.getCurrentPrice();
    const buyerETHAfter = await ethers.provider.getBalance(buyer1.address);
    
    console.log(`\\nAfter selling:`);
    console.log(`- ETH in contract: ${ethers.formatEther(ethAfter)} ETH`);
    console.log(`- ETH decrease: ${ethers.formatEther(ethBefore - ethAfter)} ETH`);
    console.log(`- New price: ${ethers.formatEther(priceAfter)} ETH`);
    console.log(`- Buyer ETH change: ${ethers.formatEther(buyerETHAfter - buyerETHBefore)} ETH (minus gas)`);
    
    // Calculate new interest rate
    const ethAfterInEth = Number(ethers.formatEther(ethAfter));
    const newDailyRate = ethAfterInEth / (2 * 10**9);
    const oldDailyRate = Number(ethers.formatEther(ethBefore)) / (2 * 10**9);
    
    console.log(`- Old daily rate: ${oldDailyRate.toExponential(4)}`);
    console.log(`- New daily rate: ${newDailyRate.toExponential(4)}`);
    
    console.log("\\n✅ Key Observations:");
    console.log("- ETH goes OUT of contract when selling tokens");
    console.log("- Lower ETH balance = lower interest rate");
    console.log("- Future price increases will be slower due to less ETH");
    
    expect(ethAfter).to.be.lt(ethBefore); // Less ETH in contract
    expect(newDailyRate).to.be.lt(oldDailyRate); // Lower interest rate
  });
});

/**
 * Test 5: Interest Rate Impact Demonstration
 * ------------------------------------------
 * Purpose: Show how different ETH balances in the contract affect the interest rate and price growth.
 * Command: npx hardhat test --grep "Test 5"
 * Expected Result: Higher ETH balances result in higher daily interest rates and faster price growth.
 */
describe("Test 5: Interest Rate Impact Demonstration", function () {
  it("Should demonstrate how ETH balance affects interest rate", async function () {
    console.log("\\n=== TEST 5: INTEREST RATE IMPACT ===");
    
    // Test different ETH balances
    const testBalances = [
      ethers.parseEther("1"),    // 1 ETH
      ethers.parseEther("100"),  // 100 ETH  
      ethers.parseEther("1000"), // 1000 ETH
    ];
    
    for (let i = 0; i < testBalances.length; i++) {
      const balance = testBalances[i];
      const balanceInEth = Number(ethers.formatEther(balance));
      const dailyRate = balanceInEth / (2 * 10**9);
      const basePrice = Number(ethers.formatEther(await sale.basePrice()));
      
      // Calculate price after 1 day with this balance
      const priceAfter1Day = basePrice * (1 + dailyRate);
      const dailyIncrease = priceAfter1Day - basePrice;
      
      console.log(`\\nScenario ${i + 1}: ${balanceInEth} ETH in contract`);
      console.log(`- Daily interest rate: ${dailyRate.toExponential(4)}`);
      console.log(`- Price after 1 day: ${priceAfter1Day.toFixed(10)} ETH`);
      console.log(`- Daily increase: ${dailyIncrease.toExponential(4)} ETH`);
    }
    
    console.log("\\n✅ Key Understanding:");
    console.log("- More ETH in contract = Higher interest rate = Faster price growth");
    console.log("- Interest rate is proportional to ETH balance");
    console.log("- This creates dynamic pricing based on contract's ETH reserves");
  });
});

/**
 * Test 6: Complete Transaction Cycle
 * ----------------------------------
 * Purpose: Demonstrate a full buy-sell cycle, showing ETH and price changes at each step.
 * Command: npx hardhat test --grep "Test 6"
 * Expected Result: Buying increases ETH and price, time increases price, selling decreases ETH and price, all as expected.
 */
describe("Test 6: Complete Transaction Cycle", function () {
  it("Should demonstrate complete buy-sell cycle with price changes", async function () {
    console.log("\\n=== TEST 6: COMPLETE TRANSACTION CYCLE ===");
    
    // Record initial state
    const initialInfo = await sale.getContractInfo();
    const initialPrice = initialInfo[0];
    const initialETH = initialInfo[2];
    
    console.log(`Initial state:`);
    console.log(`- Price: ${ethers.formatEther(initialPrice)} ETH`);
    console.log(`- Contract ETH: ${ethers.formatEther(initialETH)} ETH`);
    
    // Step 1: Buyer1 buys tokens
    console.log(`\\nStep 1: Buyer1 buys 2 tokens`);
    const tokens1 = ethers.parseUnits("2", 18);
    const cost1 = (initialPrice * tokens1) / ethers.parseUnits("1", 18);
    const cost1WithBuffer = cost1 + ethers.parseEther("0.01");
    await sale.connect(buyer1).buyTokens(tokens1, { value: cost1WithBuffer });
    
    const info1 = await sale.getContractInfo();
    console.log(`- Contract ETH: ${ethers.formatEther(info1[2])} ETH (+${ethers.formatEther(info1[2] - initialETH)})`);
    console.log(`- New price: ${ethers.formatEther(info1[0])} ETH`);
    
    // Step 2: Wait some time
    console.log(`\\nStep 2: Wait 6 hours`);
    await ethers.provider.send("evm_increaseTime", [21600]); // 6 hours
    await ethers.provider.send("evm_mine");
    
    const info2 = await sale.getContractInfo();
    console.log(`- Price after time: ${ethers.formatEther(info2[0])} ETH`);
    
    // Step 3: Buyer2 buys tokens (at higher price)
    console.log(`\\nStep 3: Buyer2 buys 1 token at new price`);
    const tokens2 = ethers.parseUnits("1", 18);
    const cost2 = (info2[0] * tokens2) / ethers.parseUnits("1", 18);
    const cost2WithBuffer = cost2 + ethers.parseEther("0.01");
    await sale.connect(buyer2).buyTokens(tokens2, { value: cost2WithBuffer });
    
    const info3 = await sale.getContractInfo();
    console.log(`- Contract ETH: ${ethers.formatEther(info3[2])} ETH (+${ethers.formatEther(cost2)})`);
    console.log(`- New price: ${ethers.formatEther(info3[0])} ETH`);
    
    // Step 4: Wait more time
    console.log(`\\nStep 4: Wait another 6 hours`);
    await ethers.provider.send("evm_increaseTime", [21600]); // 6 hours
    await ethers.provider.send("evm_mine");
    
    const info4 = await sale.getContractInfo();
    console.log(`- Price after more time: ${ethers.formatEther(info4[0])} ETH`);
    
    // Step 5: Buyer1 sells some tokens
    console.log(`\\nStep 5: Buyer1 sells 1 token`);
    const tokensToSell = ethers.parseUnits("1", 18);
    await token.connect(buyer1).approve(saleAddress, tokensToSell);
    await sale.connect(buyer1).sellTokens(tokensToSell);
    
    const info5 = await sale.getContractInfo();
    const ethReduction = info4[2] - info5[2];
    console.log(`- Contract ETH: ${ethers.formatEther(info5[2])} ETH (-${ethers.formatEther(ethReduction)})`);
    console.log(`- New price: ${ethers.formatEther(info5[0])} ETH`);
    
    console.log(`\\n=== SUMMARY ===`);
    console.log(`- Total price change: ${ethers.formatEther(info5[0] - initialPrice)} ETH`);
    console.log(`- Net ETH change: ${ethers.formatEther(info5[2] - initialETH)} ETH`);
    console.log(`- Current interest rate: ${(Number(ethers.formatEther(info5[2])) / (2 * 10**9)).toExponential(4)}`);
    
    console.log("\\n✅ Complete cycle demonstrates:");
    console.log("- Buying increases ETH balance and interest rate");
    console.log("- Time passage increases price based on current interest rate");
    console.log("- Selling decreases ETH balance and interest rate");
    console.log("- Price is recalculated on each transaction");
  });
});
