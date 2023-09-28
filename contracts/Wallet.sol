//SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
contract Wallet is Ownable, ReentrancyGuard {
    using Address for address payable;
    mapping(address => mapping(bytes32 => uint256)) public balances;

    struct Token {
        bytes32 ticker;
        address tokenAddress;
    }

    bytes32[] public tokenList; //Token Index
    mapping(bytes32 => Token) public tokenMapping; //Token Mapping

    modifier tokenExist(bytes32 ticker) {
        tokenAvailable(ticker);
        _;
    }

    constructor() {}

    /// addToken - Add a new ERC20 token to the wallet
    /// @param _ticker Ticker of the ERC20 token to add
    /// @param _tokenAddress Token address of the ERC20 token to add
    function addToken(
        bytes32 _ticker,
        address _tokenAddress
    ) external onlyOwner {
        tokenMapping[_ticker] = Token(_ticker, _tokenAddress);
        tokenList.push(_ticker);
    }

    /// deposit - Deposit ERC20 tokens to the wallet
    /// @param amount amount of ERC20 tokens to Deposit
    /// @param ticker ticker of the ERC20 token to Deposit
    function deposit(bytes32 ticker, uint amount) external tokenExist(ticker) {
        IERC20(tokenMapping[ticker].tokenAddress).transferFrom(
            msg.sender,
            address(this),
            amount
        );
        balances[msg.sender][ticker] = balances[msg.sender][ticker] + amount;
    }

    function withdraw(
        bytes32 ticker,
        uint amount
    ) external tokenExist(ticker) nonReentrant {
        require(
            balances[msg.sender][ticker] >= amount,
            "Balance not sufficient"
        );
        balances[msg.sender][ticker] = balances[msg.sender][ticker] - amount;
        IERC20(tokenMapping[ticker].tokenAddress).transfer(msg.sender, amount);
    }

    function withdrawEth(uint amount) external nonReentrant {
        require(
            balances[msg.sender][bytes32("ETH")] >= amount,
            "Balance not sufficient"
        );
        balances[msg.sender][bytes32("ETH")] =
            balances[msg.sender][bytes32("ETH")] -
            amount;
        payable(msg.sender).sendValue(amount);
    }

    function tokenAvailable(bytes32 ticker) public view returns (bool) {
        if (tokenMapping[ticker].tokenAddress == address(0)) {
            return false;
        }
        return true;
    }

    function getUserTokenBalance(address _user, bytes32 ticker)
        public
        view
        returns (uint256)
    {
        return balances[_user][ticker];
    }

    receive() external payable {
        balances[msg.sender][bytes32("ETH")] =
            balances[msg.sender][bytes32("ETH")] +
            msg.value;
    }
}
