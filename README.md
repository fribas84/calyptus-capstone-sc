# Calyptus Capstone Project - Challenge 10: Create an order-book based Decentralised Exchange (DEX)

## Smart Contract
Write a smart contract that implements a decentralised exchange that allows users to trade ERC-20 tokens, with functions for
- Token listing: Allow users to submit requests to list new ERC-20 tokens on the exchange.
- Order placement: Allow users to place orders to buy or sell tokens, including limit orders and market orders.
- Matching engine: Implement a matching engine that matches orders and executes trades.
- Token deposit and withdrawal: Allow users to deposit and withdraw tokens to and from the exchange.
- Order management: Allow users to manage their orders, including cancelling orders.
- Liquidity provision: Implement incentives for users to provide liquidity to the exchange, such as rewards for market makers.

Also write tests using ethers.js (or any other library of your choice) that verifies the following cases:
the buyers and sellers get the best price as per the matching engine
users can withdraw only their tokens from the exchange
cancelling orders updates the order book accordingly

## Frontend or Script
- Create a basic frontend, which provides a user-friendly interface for users to trade tokens, deposit and withdraw tokens, and manage their orders. Connect the smart contract with the frontend using Ethers.js.
- OR Write a separate script with Ethers.js to interact with the smart contract functions.
