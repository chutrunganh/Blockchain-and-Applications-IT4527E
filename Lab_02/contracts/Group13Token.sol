// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; // Version of solidity


// Importing the ERC20 contract from the openzeppelin library. This library
// have already provided for basic ERC20 functions, just need to import to reuse
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Inheriting the ERC20 contract, name our contract Group13Token, and set the symbol to G13
contract Group13Token is ERC20 {
    address public owner;

    // Constructor to initialize the token with a name, symbol, and initial supply (we will need to provide value for
    // initial supply when deploying the contract)
    // The constructor also sets the owner of the contract to the address that deploys it
    constructor(uint256 initialSupply) ERC20("Group13Token", "G13") {
        _mint(msg.sender, initialSupply); // This token is default support 18 decimals by OpenZeppelin library
        owner = msg.sender;
    }

    // Function to mint new tokens ("mint" means creating new tokens and adding them to the total supply)
    // Only the owner of the contract can mint new tokens
    function mint(address to, uint256 amount) public {
        require(msg.sender == owner, "Only owner can mint");
        _mint(to, amount);
    }
} 