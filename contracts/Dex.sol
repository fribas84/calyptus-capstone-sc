//SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./Wallet.sol";

contract Dex is Wallet{
    enum Side {BUY, SELL}

    struct Order {
        uint id;
        address trader;
        Side side;
        bytes32 ticker;
        uint amount;
        uint filled;
        uint price;
        uint date;
    }

    uint public nextOrderId = 1;
    mapping(bytes32 => mapping(uint => Order[])) public orderBook;
    constructor() {}

    function getOrderBook(bytes32 ticker, Side side) view public returns(Order[] memory){
        return orderBook[ticker][uint(side)];
    }


}