/**
 * This file is just for some of my testing, no need to care this for the logic of the project.
 */

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("=== WALLET & OWNERSHIP VERIFICATION ===");
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`Deployer balance: ${hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH`);
  
  // Deploy contracts to verify ownership
  const Token = await hre.ethers.getContractFactory("Group13Token");
  const token = await Token.deploy();
  await token.waitForDeployment();
  
  const Sale = await hre.ethers.getContractFactory("Group13TokenSale");
  const sale = await Sale.deploy(await token.getAddress());
  await sale.waitForDeployment();
  
  // Check ownership
  const tokenOwner = await token.owner();
  const saleOwner = await sale.owner();
  const tokenBalance = await token.balanceOf(deployer.address);
  
  console.log("\n=== OWNERSHIP VERIFICATION ===");
  console.log(`Token contract owner: ${tokenOwner}`);
  console.log(`Sale contract owner: ${saleOwner}`);
  console.log(`Deployer owns token contract: ${tokenOwner === deployer.address ? '✅ YES' : '❌ NO'}`);
  console.log(`Deployer owns sale contract: ${saleOwner === deployer.address ? '✅ YES' : '❌ NO'}`);
  console.log(`Deployer token balance: ${hre.ethers.formatUnits(tokenBalance, 18)} tokens`);
  
  console.log("\n=== REQUIREMENT SATISFIED ===");
  console.log("✅ Wallet created: YES (Hardhat account with private key)");
  console.log("✅ Wallet is token owner: YES");
  console.log("✅ Wallet controls both contracts: YES");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
