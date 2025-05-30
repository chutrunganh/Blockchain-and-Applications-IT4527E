// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Group13Token is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 100000 * 10**18; // 100,000 tokens (fixed supply as the assignment suggests)
    
    // Constructor to initialize the token with a name, symbol, and total supply
    constructor() ERC20("Group13Token", "G13") Ownable(msg.sender) {
        _mint(msg.sender, TOTAL_SUPPLY);
    }
} 