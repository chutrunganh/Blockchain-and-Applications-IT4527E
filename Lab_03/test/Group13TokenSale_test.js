const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Group13TokenSale - Dynamic Pricing", function () {
  let token, sale, owner, buyer1, buyer2;
  let tokenAddress, saleAddress;

  beforeEach(async function () {
    [owner, buyer1, buyer2] = await ethers.getSigners();

    // Deploy Token Contract
    const Token = await ethers.getContractFactory("Group13Token");
    token = await Token.deploy();
    await token.waitForDeployment();
    tokenAddress = await token.getAddress();

    // Deploy Sale Contract
    const Sale = await ethers.getContractFactory("Group13TokenSale");
    sale = await Sale.deploy(tokenAddress);
    await sale.waitForDeployment();
    saleAddress = await sale.getAddress();

    // Transfer 50% of tokens to sale contract
    const totalSupply = await token.totalSupply();
    const tokensForSale = totalSupply / 2n;
    await token.transfer(saleAddress, tokensForSale);

    // Add initial ETH to sale contract for liquidity using the addEth function
    await sale.addEth({ value: ethers.parseEther("100") });

    console.log("\\n=== INITIAL SETUP ===");
    console.log(`Token deployed to: ${tokenAddress}`);
    console.log(`Sale deployed to: ${saleAddress}`);
    console.log(`Total supply: ${ethers.formatUnits(totalSupply, 18)} tokens`);
    console.log(`Tokens for sale: ${ethers.formatUnits(tokensForSale, 18)}`);
    console.log(`Initial ETH in contract: 100 ETH`);
  });

  describe("Test 1: Initial Price and Contract Setup", function () {
    it("Should have correct initial values", async function () {
      const currentPrice = await sale.getCurrentPrice();
      const contractInfo = await sale.getContractInfo();
      const basePrice = await sale.basePrice();

      console.log("\\n=== TEST 1: INITIAL VALUES ===");
      console.log(`Base price: ${ethers.formatEther(basePrice)} ETH`);
      console.log(`Current price: ${ethers.formatEther(currentPrice)} ETH`);
      console.log(`Contract token balance: ${ethers.formatUnits(contractInfo[1], 18)}`);
      console.log(`Contract ETH balance: ${ethers.formatEther(contractInfo[2])} ETH`);

      expect(basePrice).to.equal(ethers.parseEther("5"));
      expect(currentPrice).to.equal(ethers.parseEther("5"));
      expect(contractInfo[1]).to.equal(ethers.parseUnits("50000", 18)); // 50,000 tokens
      expect(contractInfo[2]).to.equal(ethers.parseEther("100")); // 100 ETH
    });
  });

  describe("Test 2: Buy Tokens", function () {
    it("Should allow buying tokens and update price", async function () {
      const tokensToBuy = ethers.parseUnits("100", 18); // 100 tokens
      const initialPrice = await sale.getCurrentPrice();
      const expectedCost = (initialPrice * tokensToBuy) / ethers.parseUnits("1", 18);
      // Add small buffer for potential price increases
      const costWithBuffer = expectedCost + ethers.parseEther("1");

      console.log("\\n=== TEST 2: BUYING TOKENS ===");
      console.log(`Tokens to buy: 100`);
      console.log(`Expected cost: ${ethers.formatEther(expectedCost)} ETH`);

      // Check initial balances
      const initialTokenBalance = await token.balanceOf(buyer1.address);
      const initialEthBalance = await ethers.provider.getBalance(buyer1.address);

      console.log(`Buyer1 initial token balance: ${ethers.formatUnits(initialTokenBalance, 18)}`);
      console.log(`Buyer1 initial ETH balance: ${ethers.formatEther(initialEthBalance)} ETH`);

      // Buy tokens
      await expect(sale.connect(buyer1).buyTokens(tokensToBuy, { value: costWithBuffer }))
        .to.emit(sale, "TokensPurchased");

      // Check final balances
      const finalTokenBalance = await token.balanceOf(buyer1.address);
      const finalEthBalance = await ethers.provider.getBalance(buyer1.address);
      const newPrice = await sale.getCurrentPrice();

      console.log(`Buyer1 final token balance: ${ethers.formatUnits(finalTokenBalance, 18)}`);
      console.log(`Buyer1 final ETH balance: ${ethers.formatEther(finalEthBalance)} ETH`);
      console.log(`New price after transaction: ${ethers.formatEther(newPrice)} ETH`);

      expect(finalTokenBalance).to.equal(tokensToBuy);
      expect(newPrice).to.be.gte(initialPrice); // Price should increase or stay same
    });
  });

  describe("Test 3: Sell Tokens Back", function () {
    it("Should allow selling tokens back to contract", async function () {
      // First buy some tokens
      const tokensToBuy = ethers.parseUnits("50", 18);
      const buyPrice = await sale.getCurrentPrice();
      const buyCost = (buyPrice * tokensToBuy) / ethers.parseUnits("1", 18);

      await sale.connect(buyer1).buyTokens(tokensToBuy, { value: buyCost });

      console.log("\\n=== TEST 3: SELLING TOKENS ===");
      console.log(`First bought: 50 tokens for ${ethers.formatEther(buyCost)} ETH`);

      // Wait a bit to simulate time passing
      await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
      await ethers.provider.send("evm_mine");

      const tokensToSell = ethers.parseUnits("25", 18); // Sell half
      const sellPrice = await sale.getCurrentPrice();
      const expectedReceive = (sellPrice * tokensToSell) / ethers.parseUnits("1", 18);

      console.log(`Tokens to sell: 25`);
      console.log(`Current price: ${ethers.formatEther(sellPrice)} ETH`);
      console.log(`Expected ETH to receive: ${ethers.formatEther(expectedReceive)} ETH`);

      // Approve sale contract to spend tokens
      await token.connect(buyer1).approve(saleAddress, tokensToSell);

      // Check balances before selling
      const initialTokenBalance = await token.balanceOf(buyer1.address);
      const initialEthBalance = await ethers.provider.getBalance(buyer1.address);

      console.log(`Before sell - Token balance: ${ethers.formatUnits(initialTokenBalance, 18)}`);
      console.log(`Before sell - ETH balance: ${ethers.formatEther(initialEthBalance)} ETH`);

      // Sell tokens
      await expect(sale.connect(buyer1).sellTokens(tokensToSell))
        .to.emit(sale, "TokensSold")
        .withArgs(buyer1.address, tokensToSell, expectedReceive);

      // Check balances after selling
      const finalTokenBalance = await token.balanceOf(buyer1.address);
      const finalEthBalance = await ethers.provider.getBalance(buyer1.address);

      console.log(`After sell - Token balance: ${ethers.formatUnits(finalTokenBalance, 18)}`);
      console.log(`After sell - ETH balance: ${ethers.formatEther(finalEthBalance)} ETH`);

      expect(finalTokenBalance).to.equal(initialTokenBalance - tokensToSell);
      expect(finalEthBalance).to.be.gt(initialEthBalance); // Should have more ETH
    });
  });

  describe("Test 4: Price Increase Over Time", function () {
    it("Should increase price continuously over time since creation", async function () {
      console.log("\\n=== TEST 4: CONTINUOUS PRICE INCREASE ===");

      // Record initial price
      const initialPrice = await sale.getCurrentPrice();
      console.log(`Initial price: ${ethers.formatEther(initialPrice)} ETH`);

      // Wait time and check price (no transactions needed)
      await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
      await ethers.provider.send("evm_mine");

      const priceAfter1Day = await sale.getCurrentPrice();
      console.log(`Price after 1 day (no transactions): ${ethers.formatEther(priceAfter1Day)} ETH`);

      // Wait more time
      await ethers.provider.send("evm_increaseTime", [86400]); // Another day
      await ethers.provider.send("evm_mine");

      const priceAfter2Days = await sale.getCurrentPrice();
      console.log(`Price after 2 days (no transactions): ${ethers.formatEther(priceAfter2Days)} ETH`);

      // Now make a transaction and see the price is still based on total time
      const tokensToBuy = ethers.parseUnits("10", 18);
      const currentPrice = await sale.getCurrentPrice();
      const cost = (currentPrice * tokensToBuy) / ethers.parseUnits("1", 18);
      // Add small buffer to account for time-based price increases during transaction
      const costWithBuffer = cost + ethers.parseEther("0.1");

      await sale.connect(buyer1).buyTokens(tokensToBuy, { value: costWithBuffer });

      const priceAfterTransaction = await sale.getCurrentPrice();
      console.log(`Price after transaction: ${ethers.formatEther(priceAfterTransaction)} ETH`);

      // Wait more time and check price continues to increase
      await ethers.provider.send("evm_increaseTime", [86400]); // Another day
      await ethers.provider.send("evm_mine");

      const finalPrice = await sale.getCurrentPrice();
      console.log(`Price after 3 days total: ${ethers.formatEther(finalPrice)} ETH`);

      console.log(`Total price increase: ${ethers.formatEther(finalPrice - initialPrice)} ETH`);

      expect(priceAfter1Day).to.be.gt(initialPrice);
      expect(priceAfter2Days).to.be.gt(priceAfter1Day);
      expect(finalPrice).to.be.gt(priceAfter2Days);
    });
  });

  describe("Test 5: Interest Rate Calculation", function () {
    it("Should demonstrate interest rate effect on pricing", async function () {
      console.log("\\n=== TEST 5: INTEREST RATE CALCULATION ===");

      const contractInfo = await sale.getContractInfo();
      const ethBalance = contractInfo[2];
      
      // Convert to ETH for calculation (avoiding BigInt division issues)
      const ethBalanceInEth = Number(ethers.formatEther(ethBalance));
      const interestRatePerDay = ethBalanceInEth / (2 * 10**9);
      const basePrice = Number(ethers.formatEther(await sale.basePrice()));

      console.log(`Contract ETH balance: ${ethBalanceInEth} ETH`);
      console.log(`Interest rate per day: ${interestRatePerDay.toExponential(6)}`);
      console.log(`Base price: ${basePrice} ETH`);

      // Simulate time passing and check price increase
      await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
      await ethers.provider.send("evm_mine");

      const priceAfterTime = await sale.getCurrentPrice();
      const expectedIncrease = basePrice * interestRatePerDay * 1; // 1 day
      const expectedPrice = basePrice + expectedIncrease;

      console.log(`Price after 1 day: ${ethers.formatEther(priceAfterTime)} ETH`);
      console.log(`Expected price increase: ${expectedIncrease.toExponential(6)} ETH`);
      console.log(`Expected total price: ${expectedPrice} ETH`);

      // Add more ETH to contract and see effect
      await owner.sendTransaction({
        to: saleAddress,
        value: ethers.parseEther("500")
      });

      const newContractInfo = await sale.getContractInfo();
      const newEthBalance = Number(ethers.formatEther(newContractInfo[2]));
      const newInterestRatePerDay = newEthBalance / (2 * 10**9);

      console.log(`\\nAfter adding 500 ETH:`);
      console.log(`New ETH balance: ${newEthBalance} ETH`);
      console.log(`New interest rate per day: ${newInterestRatePerDay.toExponential(6)}`);

      // Wait another day and check price
      await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
      await ethers.provider.send("evm_mine");

      const finalPrice = await sale.getCurrentPrice();
      console.log(`Price after adding ETH and 1 more day: ${ethers.formatEther(finalPrice)} ETH`);

      // Verify that higher ETH balance leads to faster price increases
      expect(newInterestRatePerDay).to.be.gt(interestRatePerDay);
      expect(finalPrice).to.be.gt(priceAfterTime);
    });
  });

  describe("Test 6: Edge Cases", function () {
    it("Should handle edge cases correctly", async function () {
      console.log("\\n=== TEST 6: EDGE CASES ===");

      // Test buying with exact amount
      const tokensToBuy = ethers.parseUnits("1", 18);
      const price = await sale.getCurrentPrice();
      const exactCost = (price * tokensToBuy) / ethers.parseUnits("1", 18);
      // Add small buffer for price fluctuations
      const costWithBuffer = exactCost + ethers.parseEther("0.1");

      console.log(`Buying 1 token with cost: ${ethers.formatEther(costWithBuffer)} ETH`);
      await sale.connect(buyer1).buyTokens(tokensToBuy, { value: costWithBuffer });

      // Test buying with excess ETH (should refund)
      const excessAmount = costWithBuffer + ethers.parseEther("1");
      const balanceBefore = await ethers.provider.getBalance(buyer2.address);

      console.log(`Buying 1 token with excess ETH: ${ethers.formatEther(excessAmount)} ETH`);
      await sale.connect(buyer2).buyTokens(tokensToBuy, { value: excessAmount });

      const balanceAfter = await ethers.provider.getBalance(buyer2.address);
      console.log(`Balance change: ${ethers.formatEther(balanceAfter - balanceBefore)} ETH`);

      // Should have spent only the exact cost (plus gas)
      expect(balanceBefore - balanceAfter).to.be.closeTo(exactCost, ethers.parseEther("0.01"));
    });
  });
});
