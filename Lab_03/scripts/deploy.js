const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const { ethers } = hre;

  console.log("Deploying contracts to local hardhat network...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Deploy Group13Token (now with fixed supply of 100,000 tokens)
  console.log("\nDeploying Group13Token...");
  const Token = await ethers.getContractFactory("Group13Token");
  const token = await Token.deploy(); // No initial supply parameter needed
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`✅ Group13Token deployed to: ${tokenAddress}`);

  // Deploy Group13TokenSale with the token address
  console.log("\nDeploying Group13TokenSale...");
  const Sale = await ethers.getContractFactory("Group13TokenSale");
  const sale = await Sale.deploy(tokenAddress);
  await sale.waitForDeployment();
  const saleAddress = await sale.getAddress();
  console.log(`✅ Group13TokenSale deployed to: ${saleAddress}`);

  // Transfer tokens to sale contract (50% of total supply for sale)
  const totalSupply = await token.totalSupply();
  const tokensForSale = totalSupply / 2n; // 50% of total supply (50,000 tokens)
  console.log(`\nTransferring ${ethers.formatUnits(tokensForSale, 18)} tokens to sale contract...`);
  const tx = await token.transfer(saleAddress, tokensForSale);
  await tx.wait();
  console.log("✅ Tokens transferred to sale contract");

  // Add initial ETH to sale contract for liquidity
  console.log("\nAdding initial ETH to sale contract for buy-back liquidity...");
  const initialEth = ethers.parseEther("100"); // 100 ETH initial liquidity
  const addEthTx = await deployer.sendTransaction({
    to: saleAddress,
    value: initialEth
  });
  await addEthTx.wait();
  console.log(`✅ Added ${ethers.formatEther(initialEth)} ETH to sale contract`);

  // Save deployment info to file for frontend
  const deploymentInfo = {
    network: hre.network.name,
    tokenAddress: tokenAddress,
    saleAddress: saleAddress,
    deployer: deployer.address,
    totalSupply: ethers.formatUnits(totalSupply, 18),
    tokensForSale: ethers.formatUnits(tokensForSale, 18),
    initialEth: ethers.formatEther(initialEth),
    deployedAt: new Date().toISOString()
  };

  const deploymentPath = path.join(__dirname, "..", "frontend", "deployment.json");
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n✅ Deployment info saved to: ${deploymentPath}`);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📄 Contract Details:");
  console.log(`   Token Contract: ${tokenAddress}`);
  console.log(`   Sale Contract: ${saleAddress}`);
  console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, 18)} G13`);
  console.log(`   Tokens for Sale: ${ethers.formatUnits(tokensForSale, 18)} G13`);
  console.log(`   Price Tier 1: 5 ETH per token`);
  console.log(`   Price Tier 2: 10 ETH per token`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
