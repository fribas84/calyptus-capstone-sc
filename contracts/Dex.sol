//SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./Wallet.sol";

contract Dex is Wallet {
    enum Side {
        BUY,
        SELL
    }

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

    function getOrderBook(
        bytes32 ticker,
        Side side
    ) public view returns (Order[] memory) {
        return orderBook[ticker][uint(side)];
    }

    function createLimitOrder(
        Side _side,
        bytes32 _ticker,
        uint _amount,
        uint _price
    ) public {
        if (_side == Side.BUY) {
            require(
                balances[msg.sender]["ETH"] >= _amount * _price,
                "Not enough eth in your wallet"
            );
        } else if (_side == Side.SELL) {
            require(
                balances[msg.sender][_ticker] >= _amount,
                "Not enough tokens in your wallet"
            );
        }
        Order[] storage orders = orderBook[_ticker][uint(_side)];
        orders.push(
            Order(
                nextOrderId,
                msg.sender,
                _side,
                _ticker,
                _amount,
                0,
                _price,
                block.timestamp
            )
        );

        if (_side == Side.BUY) {
            uint i = orders.length > 0 ? orders.length - 1 : 0;
            while (i > 0) {
                if (orders[i].price > orders[i - 1].price) {
                    Order memory orderToMove = orders[i - 1];
                    orders[i - 1] = orders[i];
                    orders[i] = orderToMove;
                }
                i--;
            }
        }
    }
}
