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

    mapping(address => mapping(uint8 => uint256)) public lastRequest;

    constructor(address _token1, address _token2) {
        token1 = IERC20Mintable(_token1);
        token1 = IERC20Mintable(_token2);
    }

    function requestTokens(uint8 _token) external {
        require(_token == 1 || _token == 2, "Token not supported");
        require(
            block.timestamp - lastRequest[msg.sender][_token] >= 1 days,
            "You have to wait 1 day before requesting again"
        );
        if (_token == 1) {
            _requestToken1();
        } else {
            _requestToken2();
        }
    }
    function _requestToken1() internal {
        lastRequest[msg.sender][1] = block.timestamp;
        token1.mint(msg.sender, 1000 * 10 ** 18);
    }
        function _requestToken2() internal {
        lastRequest[msg.sender][2] = block.timestamp;
        token2.mint(msg.sender, 1000 * 10 ** 18);
    }
}
