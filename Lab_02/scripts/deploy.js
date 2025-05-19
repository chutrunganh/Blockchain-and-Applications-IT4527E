const hre = require("hardhat");

async function main() {
  const { ethers } = hre;

  // Define the initial supply for the token
  const initialSupply = hre.ethers.utils.parseUnits("1000", 18); // 1000 tokens with 18 decimals

  // Deploy Group13Token
  const Token = await ethers.getContractFactory("Group13Token");
  const token = await Token.deploy(initialSupply);
  await token.deployed();
  console.log(`Token deployed to: ${token.address}`);

  // Deploy Group13TokenSale with the token address
  const Sale = await ethers.getContractFactory("Group13TokenSale");
  const sale = await Sale.deploy(token.address);
  await sale.deployed();
  console.log(`TokenSale deployed to: ${sale.address}`);

  // Transfer all tokens to sale contract
  const totalSupply = await token.totalSupply();
  const tx = await token.transfer(sale.address, totalSupply);
  await tx.wait();
  console.log("All tokens transferred to sale contract");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
