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

    IERC20Mintable public token;

    mapping(address => uint256) public lastRequest;
    constructor(address _token) {
        token = IERC20Mintable(_token);
    }

    function requestTokens() external {
        require(block.timestamp - lastRequest[msg.sender] >= 1 days, "You can only request tokens once per day");
        lastRequest[msg.sender] = block.timestamp;
        token.mint(msg.sender, 1000 * 10 ** 18);
    }   
}