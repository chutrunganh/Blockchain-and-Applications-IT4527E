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
     * 1. Base price: 5 ETH per token
     * 2. Interest rate: ETH_balance / (2 * 10^9) per day (compound daily)
     * 3. Price calculation: Price = BasePrice * (1 + InterestRate)^DaysElapsed
     * 4. Recalculate: On every buy/sell transaction (not daily automation)
     * 
     * Using approximation for compound interest with high precision:
     * For small rates: (1 + r)^t ≈ 1 + r*t + (r*t)^2/2 + (r*t)^3/6 + ...
     */
    function getCurrentPrice() public view returns (uint256) {
        uint256 ethBalance = address(this).balance;
        uint256 timePassed = block.timestamp - contractCreationTime;
        
        // If less than 1 hour passed, return base price to avoid tiny rounding effects
        if (timePassed < 3600) {
            return basePrice;
        }
        
        // Convert time to fractional days (using higher precision)
        // timePassed is in seconds, 1 day = 86400 seconds
        uint256 timeInDays = timePassed * 1e18 / (1 days); // Fractional days with 18 decimals
        
        // Convert ETH balance from wei to ETH (with precision)
        uint256 ethBalanceInEth = ethBalance / 1 ether;
        
        // Calculate daily interest rate: ETH_balance / (2 * 10^9)
        // Scale up for precision: rate = ethBalance * 1e18 / (2 * 10^9 * 1e18)
        uint256 dailyRate = (ethBalanceInEth * 1e18) / (2 * 10**9);
        
        // For compound interest approximation: Price ≈ BasePrice * (1 + rate * time + (rate * time)^2 / 2)
        // This gives good approximation for reasonable rates and time periods
        uint256 rateTimeProduct = (dailyRate * timeInDays) / 1e18; // rate * time
        
        // Calculate: 1 + rate*time + (rate*time)^2/2
        uint256 compound = 1e18 + rateTimeProduct;
        
        // Add quadratic term for better accuracy: (rate*time)^2/2
        if (rateTimeProduct > 0) {
            uint256 quadraticTerm = (rateTimeProduct * rateTimeProduct) / (2 * 1e18);
            compound += quadraticTerm;
        }
        
        // Final price: BasePrice * compound_factor
        return (basePrice * compound) / 1e18;
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

    /**
     * @dev Get detailed price calculation breakdown for debugging and UI
     */
    function getPriceBreakdown() external view returns (
        uint256 currentPrice,
        uint256 basePrice_,
        uint256 ethBalance,
        uint256 timeInSeconds,
        uint256 timeInDays,
        uint256 dailyInterestRate,
        uint256 compoundFactor
    ) {
        uint256 ethBal = address(this).balance;
        uint256 timePassed = block.timestamp - contractCreationTime;
        uint256 timeInDaysPrecise = timePassed * 1e18 / (1 days);
        uint256 ethBalanceInEth = ethBal / 1 ether;
        uint256 dailyRate = (ethBalanceInEth * 1e18) / (2 * 10**9);
        
        uint256 compound = 1e18; // Default compound factor
        
        // Only calculate compound interest if meaningful time has passed
        if (timePassed >= 3600) {
            uint256 rateTimeProduct = (dailyRate * timeInDaysPrecise) / 1e18;
            compound = 1e18 + rateTimeProduct;
            
            if (rateTimeProduct > 0) {
                uint256 quadraticTerm = (rateTimeProduct * rateTimeProduct) / (2 * 1e18);
                compound += quadraticTerm;
            }
        }
        
        return (
            getCurrentPrice(),
            basePrice,
            ethBal,
            timePassed,
            timeInDaysPrecise,
            dailyRate,
            compound
        );
    }
}