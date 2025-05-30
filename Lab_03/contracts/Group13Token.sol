// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Group13Token is ERC20 {
    uint256 public constant TOTAL_SUPPLY = 100000 * 10**18; // 100,000 tokens (fixed supply)
    address public owner;
    
    constructor() ERC20("Group13Token", "G13") {
        _mint(msg.sender, TOTAL_SUPPLY);
        owner = msg.sender;
    }
} 