// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

interface IERC20Mintable is IERC20 {
    function mint(address to, uint256 amount) external;
}

contract Faucet {
    IERC20Mintable public token1;
    IERC20Mintable public token2;

    enum Token {
        Token1,
        Token2
    }

    mapping(address => mapping(Token => uint256)) public lastRequest;

    constructor(address _token1, address _token2) {
        token1 = IERC20Mintable(_token1);
        token2 = IERC20Mintable(_token2);
    }

    function requestTokens(Token _token) external {
        require(
            _token == Token.Token1 || _token == Token.Token2,
            "Invalid token"
        );

        require(
            block.timestamp - lastRequest[msg.sender][_token] >= 1 days,
            "You can only request tokens once per day"
        );
        lastRequest[msg.sender][_token] = block.timestamp;
        if (_token == Token.Token1) {
            token1.mint(msg.sender, 1000 * 10 ** 18);
        } else {
            token2.mint(msg.sender, 1000 * 10 ** 18);
        }
    }
}
