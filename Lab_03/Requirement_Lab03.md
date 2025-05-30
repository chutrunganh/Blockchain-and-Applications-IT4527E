# Lab 3: Selling and buying the ERC20 token

In this exercise, you will create your own ERC20 tokens. This time, let’s allow others to buy and  
sell the token to you. Requirements:

- Make sure your token follows ERC-20: Token Standard  
  https://eips.ethereum.org/EIPS/eip-20  
- Please name your own token with your name. The total number of tokens fixed to 10^5  
- Please create your own wallet with a private key and use this wallet as the owner of your  
  token.  

## Buying Token  

- Allow others to buy your token using ETH. They will pay ETH to your wallet to get your token 

## Selling Token

- Allow others to sell the token to you and get ETH from your wallet  

## Token price calculation:  

- Initially, each token costs 5 ETH  
- The price of a token is increased every day with a rate:  

> **InterestRate = Number of ETH remaining in your wallet / 2*10<sup>9</sup>**

  - It means initially your token price increases very fast. Then if more ETH is sold,  
    the price of your token will increase more slowly  

Note: For each transaction of selling and buying the token, you need to
    recalculate the price of the token based on the number of ETH in your wallet and
    the Time. You do not need to recalculate the token price every day.

Please test your contract and explain what you do in each test. For each test, please also show  
what are changed in each step  

