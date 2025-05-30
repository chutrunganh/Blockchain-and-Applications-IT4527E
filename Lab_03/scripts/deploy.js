const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
* Wallet in crypto is same as a real-world wallet, it allows you to sepnd and view  your balance. But in crypto, in stead of
* containing money, it actaully  contains keys that allow you control your funds on the blockchain. It means when create a wallet, you have:
* 1. A public key, from this public key, we will derive a public address, which is like your bank account number. You send this number to others neeed to send you money.
* 2. A private key, which is like your bank account password. You use this to sign transactions and prove you own the funds in your wallet.
*
* Have a private key -> we can generate a corresponding public key -> we can generate a wallet address.
*/


async function main() {
  const [owner] = await hre.ethers.getSigners(); // Get the first account from hardhat's local network as the owner
  if (!owner) {
    console.error("No accounts found. Please ensure you have accounts available in your Hardhat network.");
    process.exit(1);
  }
  const { ethers } = hre;

  console.log("Deploying contracts with the first account...");
  console.log("Account address:", owner.address);
  console.log("Account balance:", ethers.formatEther(await owner.provider.getBalance(owner.address)));

  // Deploy Group13Token using our specific owner
  console.log("\nDeploying Group13Token...");
  const Token = await ethers.getContractFactory("Group13Token", owner);
  const token = await Token.deploy(); // No initial supply parameter needed since we already set a fixed total supply in the contract
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`✅ Group13Token deployed to: ${tokenAddress}`);

  // Deploy Group13TokenSale with the token address using our owner
  console.log("\nDeploying Group13TokenSale...");
  const Sale = await ethers.getContractFactory("Group13TokenSale", owner);
  const sale = await Sale.deploy(tokenAddress);
  await sale.waitForDeployment();
  const saleAddress = await sale.getAddress();
  console.log(`✅ Group13TokenSale deployed to: ${saleAddress}`);

  // Transfer tokens to sale contract (50% of total supply for sale)
  const totalSupply = await token.totalSupply();
  const tokensForSale = totalSupply / 2n; // 50% of total supply (50,000 tokens)
  // For example, we initially set the total supply to 100,000 tokens, so this will transfer 50,000 tokens to the sale contract
  console.log(`\nTransferring ${ethers.formatUnits(tokensForSale, 18)} tokens to sale contract...`);
  const tx = await token.transfer(saleAddress, tokensForSale);
  await tx.wait();

  // Add initial ETH liquidity (100 ETH) to the sale contract
  console.log("\nAdding initial ETH liquidity...");
  const liquidityTx = await owner.sendTransaction({
    to: saleAddress,
    value: ethers.parseEther("100")
  });
  await liquidityTx.wait();
  console.log("✅ Added 100 ETH initial liquidity");

  // Print final setup information
  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log("Owner Address:", owner.address);
  console.log("Token Contract:", tokenAddress);
  console.log("Sale Contract:", saleAddress);
  console.log("\nInitial Setup:");
  console.log("- Total Supply:", ethers.formatUnits(totalSupply, 18), "tokens");
  console.log("- Tokens for Sale:", ethers.formatUnits(tokensForSale, 18));
  console.log("- Initial ETH Liquidity of contract: 100 ETH");

  // Save deployment info to file for frontend
  const deploymentInfo = {
    network: hre.network.name,
    tokenAddress: tokenAddress,
    saleAddress: saleAddress,
    owner: owner.address,
    totalSupply: ethers.formatUnits(totalSupply, 18),
    tokensForSale: ethers.formatUnits(tokensForSale, 18),
    initialEth: "100",
    deployedAt: new Date().toISOString()
  };

  const deploymentPath = path.join(__dirname, "..", "frontend", "deployment.json");
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n✅ Deployment info saved to: ${deploymentPath}`);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
