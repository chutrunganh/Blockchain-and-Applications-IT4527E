// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Group13Token.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Group13TokenSale
 * @dev Smart contract for buying and selling tokens with dynamic pricing based on ETH balance and time
 */
contract Group13TokenSale is Ownable {
    Group13Token public token;
    uint256 public contractCreationTime; // Time when contract was created
    uint256 public basePrice = 5 ether; // Initial price: 5 ETH per token
    
    // Define events: Buying and selling tokens, price updates
    event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost);
    event TokensSold(address indexed seller, uint256 amount, uint256 ethReceived);
    event PriceUpdated(uint256 newPrice);
    
    constructor(address tokenAddress) Ownable(msg.sender) {
        token = Group13Token(tokenAddress);
        contractCreationTime = block.timestamp; // Set creation time
    }
    
    /**
     * @dev Calculate current token price based on ETH balance and time since creation
     * Formula from Lab requirements:
     * - InterestRate = ETH_balance_in_ETH / (2 * 10^9)
     * - Price = BasePrice * (1 + InterestRate * DaysElapsed)
     * - Recalculated on each transaction (buy/sell)
     */
    function getCurrentPrice() public view returns (uint256) {
        uint256 ethBalance = address(this).balance;
        uint256 timePassed = block.timestamp - contractCreationTime;
        
        // Convert time to days (with fractional precision)
        uint256 daysElapsed = timePassed / 1 days;
        
        // Convert ETH balance from wei to ETH
        uint256 ethBalanceInEth = ethBalance / 1 ether;
        
        // Calculate interest rate: ETH_balance / (2 * 10^9)
        // Since this results in very small numbers, we need to handle precision carefully
        
        if (daysElapsed == 0) {
            return basePrice; // No time passed, return base price
        }
        
        // Interest calculation: basePrice * (ethBalance / 2*10^9) * daysElapsed
        // To avoid precision loss with small numbers, we'll use scaled arithmetic
        
        // priceIncrease = basePrice * ethBalanceInEth * daysElapsed / (2 * 10^9)
        uint256 priceIncrease = (basePrice * ethBalanceInEth * daysElapsed) / (2 * 10**9);
        
        return basePrice + priceIncrease;
    }
    
    /**
     * @dev Buy tokens from the contract
     */
    function buyTokens(uint256 tokenAmount) external payable {
        require(tokenAmount > 0, "Token amount must be greater than 0");
        
        uint256 currentPrice = getCurrentPrice();
        uint256 totalCost = (currentPrice * tokenAmount) / 1 ether;
        
        require(msg.value >= totalCost, "Insufficient ETH sent");
        require(token.balanceOf(address(this)) >= tokenAmount, "Not enough tokens available");
        
        // Transfer tokens to buyer
        require(token.transfer(msg.sender, tokenAmount), "Token transfer failed");
        
        // Refund excess ETH
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        emit TokensPurchased(msg.sender, tokenAmount, totalCost);
        emit PriceUpdated(getCurrentPrice());
    }
    
    /**
     * @dev Sell tokens back to the contract
     */
    function sellTokens(uint256 tokenAmount) external {
        require(tokenAmount > 0, "Token amount must be greater than 0");
        require(token.balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");
        
        uint256 currentPrice = getCurrentPrice();
        uint256 ethToReceive = (currentPrice * tokenAmount) / 1 ether;
        
        require(address(this).balance >= ethToReceive, "Contract has insufficient ETH");
        
        // Transfer tokens from seller to contract
        require(token.transferFrom(msg.sender, address(this), tokenAmount), "Token transfer failed");
        
        // Send ETH to seller
        payable(msg.sender).transfer(ethToReceive);
        
        emit TokensSold(msg.sender, tokenAmount, ethToReceive);
        emit PriceUpdated(getCurrentPrice());
    }
    
    /**
     * @dev Get contract info for frontend
     */
    function getContractInfo() external view returns (
        uint256 currentPrice,
        uint256 contractTokenBalance,
        uint256 contractEthBalance,
        uint256 timeSinceCreation
    ) {
        return (
            getCurrentPrice(),
            token.balanceOf(address(this)),
            address(this).balance,
            block.timestamp - contractCreationTime // Time since creation, not last transaction
        );
    }
    
    /**
     * @dev Owner can add ETH to the contract
     */
    function addEth() external payable onlyOwner {
        require(msg.value > 0, "Must send ETH");
    }
    
    /**
     * @dev Owner can withdraw ETH (for emergencies)
     */
    function withdrawEth(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        payable(owner()).transfer(amount);
    }
    
    /**
     * @dev Allow contract to receive ETH
     */
    receive() external payable {}
}