// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Group13Token.sol"; // Import ERC-20 token contract

/**
 * @title Group13TokenSale
 * @dev Smart contract bán token với mô hình định giá theo bậc (tiered pricing).
 */
contract Group13TokenSale {
    Group13Token public token; // The ERC-20 token being sold
    address payable public owner; // The owner of the token sale contract
    uint256 public startTime; // The timestamp when the sale starts
    uint256 public saleDuration = 30 days; // Duration of the token sale (30 days)
    uint256 public tokensSold; // Total number of tokens sold so far

    uint256 public constant PERCENT_25 = 25; // 25% threshold for tiered pricing
    uint256 public constant PERCENT_50 = 50; // 50% threshold for sale cap

    uint256 public price1 = 5 ether;  // Price per token for the first 25% of tokens
    uint256 public price2 = 10 ether; // Price per token for the remaining tokens

    // The requirement specifiy that first 25% is 5 ether and next 25 % is 10 ether, that is oke to deploy on local,. Howevert, I want to deploy
    // these two contract to the sepolia testnet, I will change the ratio a little bit, since sepolia testnet only give you 0.05 ETH a day for testing
    // Therefore, we can do not have the ETH to buy with 5 ether, 10 ether as current ration, let change it to 0.0005 ether and 0.001 ether
    //uint256 public price1 = 0.0005 ether;  // Price per token for the first 25% of tokens
    //uint256 public price2 = 0.001 ether; // Price per token for the remaining tokens


    event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost); // Event emitted when tokens are purchased
    event SaleEnded(address indexed owner, uint256 unsoldTokens); // Event emitted when the sale ends

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this"); // Restrict access to the owner
        _;
    }

    /**
     * @dev Constructor initializes the token contract and sets the owner and start time.
     * @param tokenAddress The address of the deployed Group13Token contract.
     */
    constructor(address tokenAddress) {
        token = Group13Token(tokenAddress); // Initialize the token contract
        owner = payable(msg.sender); // Set the owner of the contract
        startTime = block.timestamp; // Set the start time of the sale
    }

    /**
     * @dev Function to buy tokens. Calculates cost based on tiered pricing and processes the purchase.
     * @param amount The number of tokens the buyer wants to purchase.
     */
    function buyTokens(uint256 amount) public payable {
        require(block.timestamp <= startTime + saleDuration, "Sale ended"); // Ensure the sale is still active
        require(amount > 0, "Amount must be > 0"); // Ensure a valid amount is specified

        uint256 totalSupply = token.totalSupply(); // Get the total supply of tokens
        uint256 maxTokensForSale = (totalSupply * PERCENT_50) / 100; // Calculate the maximum tokens available for sale
        require(tokensSold + amount <= maxTokensForSale, "Exceeds sale limit"); // Ensure the purchase does not exceed the sale cap

        uint256 tokensAtPrice1 = (totalSupply * PERCENT_25) / 100; // Calculate the number of tokens available at the first price tier
        uint256 toBuyAtPrice1 = 0; // Tokens to buy at the first price tier
        uint256 toBuyAtPrice2 = 0; // Tokens to buy at the second price tier
        uint256 cost = 0; // Total cost of the purchase

        if (tokensSold < tokensAtPrice1) { // Check if tokens are still available at the first price tier
            uint256 availableAtPrice1 = tokensAtPrice1 - tokensSold; // Calculate the remaining tokens at the first price tier
            toBuyAtPrice1 = amount > availableAtPrice1 ? availableAtPrice1 : amount; // Determine how many tokens to buy at the first price tier
            cost += (toBuyAtPrice1 * price1) / 1e18; // Add the cost of tokens at the first price tier
            toBuyAtPrice2 = amount - toBuyAtPrice1; // Calculate the remaining tokens to buy at the second price tier
        } else {
            toBuyAtPrice2 = amount; // All tokens are purchased at the second price tier
        }

        if (toBuyAtPrice2 > 0) { // Calculate the cost of tokens at the second price tier
            cost += (toBuyAtPrice2 * price2) / 1e18;
        }

        require(msg.value >= cost, "Insufficient ETH sent"); // Ensure the buyer sent enough ETH
        require(token.balanceOf(address(this)) >= amount, "Not enough tokens in contract"); // Ensure the contract has enough tokens
        require(token.transfer(msg.sender, amount), "Token transfer failed"); // Transfer tokens to the buyer

        tokensSold += amount; // Update the total tokens sold

        // Refund excess ETH
        uint256 refund = msg.value - cost; // Calculate the refund amount
        if (refund > 0) {
            (bool successRefund, ) = msg.sender.call{value: refund}(""); // Refund the excess ETH
            require(successRefund, "Refund failed");
        }

        // Transfer ETH to owner
        (bool successPay, ) = owner.call{value: cost}(""); // Transfer the payment to the owner
        require(successPay, "ETH transfer to owner failed");

        emit TokensPurchased(msg.sender, amount, cost); // Emit the TokensPurchased event
    }

    /**
     * @dev Utility function to calculate the cost of purchasing a given number of tokens.
     * @param amount The number of tokens to calculate the cost for.
     * @return The total cost in ETH.
     */
    function calculateCost(uint256 amount) public view returns (uint256) {
        uint256 totalSupply = token.totalSupply(); // Get the total supply of tokens
        uint256 tokensAtPrice1 = (totalSupply * PERCENT_25) / 100; // Calculate the number of tokens available at the first price tier

        uint256 toBuyAtPrice1 = 0; // Tokens to buy at the first price tier
        uint256 toBuyAtPrice2 = 0; // Tokens to buy at the second price tier
        uint256 cost = 0; // Total cost of the purchase

        if (tokensSold < tokensAtPrice1) { // Check if tokens are still available at the first price tier
            uint256 availableAtPrice1 = tokensAtPrice1 - tokensSold; // Calculate the remaining tokens at the first price tier
            toBuyAtPrice1 = amount > availableAtPrice1 ? availableAtPrice1 : amount; // Determine how many tokens to buy at the first price tier
            cost += (toBuyAtPrice1 * price1) / 1e18; // Add the cost of tokens at the first price tier
            toBuyAtPrice2 = amount - toBuyAtPrice1; // Calculate the remaining tokens to buy at the second price tier
        } else {
            toBuyAtPrice2 = amount; // All tokens are purchased at the second price tier
        }

        if (toBuyAtPrice2 > 0) { // Calculate the cost of tokens at the second price tier
            cost += (toBuyAtPrice2 * price2) / 1e18;
        }

        return cost; // Return the total cost
    }

    /**
     * @dev Utility function to get the sale progress as a percentage of the 50% sale cap.
     * @return percentSold The percentage of tokens sold relative to the sale cap.
     */
    function getSaleProgress() public view returns (uint256 percentSold) {
        uint256 maxTokensForSale = (token.totalSupply() * PERCENT_50) / 100; // Calculate the maximum tokens available for sale
        if (maxTokensForSale == 0) return 0; // Avoid division by zero
        return (tokensSold * 100) / maxTokensForSale; // Calculate the percentage of tokens sold
    }

    /**
     * @dev Ends the token sale. Transfers unsold tokens back to the owner.
     */
    function endSale() public onlyOwner {
        require(
            block.timestamp > startTime + saleDuration || // Check if the sale duration has ended
            tokensSold >= (token.totalSupply() * PERCENT_50) / 100, // Check if the sale cap has been reached
            "Sale not yet ended"
        );

        uint256 remaining = token.balanceOf(address(this)); // Get the remaining tokens in the contract
        if (remaining > 0) {
            require(token.transfer(owner, remaining), "Transfer failed"); // Transfer the remaining tokens to the owner
        }

        emit SaleEnded(owner, remaining); // Emit the SaleEnded event
    }

    /**
     * @dev Fallback function to prevent accidental ETH transfers to the contract.
     */
    receive() external payable {
        revert("Use buyTokens() to purchase tokens"); // Reject any direct ETH transfers
    }
}
