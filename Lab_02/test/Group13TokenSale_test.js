const { expect } = require("chai");
const { ethers } = require("hardhat");

// Test suite for Group13TokenSale contract
// This suite tests the functionality of the token sale contract, including tiered pricing, sale limits, and time-based restrictions.
describe("Group13TokenSale", function () {
  let Token, Sale, token, sale, owner, user1, user2;
  const initialSupply = ethers.parseUnits("1000", 18); // Initial token supply (1000 tokens with 18 decimals)

  // Runs before each test to deploy contracts and set up initial state
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners(); // Get test accounts

    // Deploy the Group13Token contract with the initial supply
    Token = await ethers.getContractFactory("Group13Token");
    token = await Token.deploy(initialSupply);
    await token.waitForDeployment();

    // Deploy the Group13TokenSale contract and link it to the token contract
    Sale = await ethers.getContractFactory("Group13TokenSale");
    sale = await Sale.deploy(await token.getAddress());
    await sale.waitForDeployment();

    // Transfer 50% of the total token supply to the sale contract
    await token.transfer(await sale.getAddress(), initialSupply / 2n);
  });

  // Test case: Verify that the token and sale contracts are deployed correctly
  it("should allow buying tokens at 0.01 ETH each for first 25%", async function () {
    const buyAmount = ethers.parseUnits("1", 18); // 1 token
    const cost = await sale.calculateCost(buyAmount); // Use contract's cost calculation
    console.log("Test 1: buyAmount=", buyAmount.toString(), "cost=", cost.toString());

    // Expect the token balances to change correctly after the purchase
    await expect(
      sale.connect(user1).buyTokens(buyAmount, { value: cost })
    ).to.changeTokenBalances(token, [user1, sale], [buyAmount, -buyAmount]);
  });

  // Test case: Verify tiered pricing after 25% of tokens are sold
  it("should allow buying tokens at 0.02 ETH each after 25% sold", async function () {
    // First buy 25% of tokens (250 tokens) at 0.01 ETH each
    const tokensAtPrice1 = (await token.totalSupply() * 25n) / 100n; // 25% of total supply
    const costTier1 = await sale.calculateCost(tokensAtPrice1); // Calculate cost for first tier
    console.log("Tokens at price 1 (25%):", tokensAtPrice1.toString(), "Cost: ", costTier1.toString());
    await sale.connect(user1).buyTokens(tokensAtPrice1, { value: costTier1 });

    // Buy 1 more token at 0.02 ETH (second tier pricing)
    const oneToken = ethers.parseUnits("1", 18); // 1 token
    const costTier2 = await sale.calculateCost(oneToken); // Calculate cost for second tier
    console.log("Second tier (1 token):", oneToken.toString(), "Cost: ", costTier2.toString());

    // Expect the token balances to change correctly after the purchase
    await expect(
      sale.connect(user2).buyTokens(oneToken, { value: costTier2 })
    ).to.changeTokenBalances(token, [user2, sale], [oneToken, -oneToken]);
  });

  // Test case: Ensure that no more than 50% of the total supply can be sold
  it("should not allow buying more than 50% of total supply", async function () {
    const maxSale = (await token.totalSupply() * 50n) / 100n; // 50% of total supply
    const cost = await sale.calculateCost(maxSale); // Calculate cost for 50% of tokens
    console.log("Max sale (50%):", maxSale.toString(), "Cost: ", cost.toString());

    // Buy exactly 50% of the total supply
    await sale.connect(user1).buyTokens(maxSale, { value: cost });

    // Attempt to buy 1 more token (should fail)
    await expect(
      sale.connect(user2).buyTokens(ethers.parseUnits("1", 18), { value: ethers.parseEther("1") })
    ).to.be.revertedWith("Exceeds sale limit");
  });

  // Test case: Ensure that no tokens can be purchased after the sale duration ends
  it("should not allow buying after 30 days", async function () {
    // Fast forward 31 days
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    // Attempt to buy tokens (should fail)
    await expect(
      sale.connect(user1).buyTokens(ethers.parseUnits("1", 18), { value: ethers.parseEther("0.01") })
    ).to.be.revertedWith("Sale ended");
  });

  // Test case: Verify that the owner can end the sale and withdraw remaining tokens
  it("should allow owner to end sale and withdraw remaining tokens", async function () {
    // Fast forward 31 days
    await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    // Expect the owner to successfully end the sale
    await expect(sale.connect(owner).endSale()).to.not.be.reverted;
  });
});