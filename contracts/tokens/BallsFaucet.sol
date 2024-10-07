// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract BallsFaucet is Ownable {
    uint256 public dailyClaim = 5000 * 1e18;

    uint256 public claimInterval = 1 days;

    mapping(address => uint256) public lastClaimed;

    IERC20 public balls;
    constructor(address _ballsAddress) Ownable(msg.sender) {
        balls = IERC20(_ballsAddress);
    }

    error AlreadyClaimed();

    event Claimed(address _cliamer, uint256 _amount);

    function claim() external {
        if ((block.timestamp - lastClaimed[msg.sender]) < claimInterval) {
            revert AlreadyClaimed();
        }
        lastClaimed[msg.sender] = block.timestamp;
        SafeERC20.safeTransfer(balls, msg.sender, dailyClaim);
        emit Claimed(msg.sender, dailyClaim);
    }

    function drain() external onlyOwner {
        SafeERC20.safeTransfer(balls, owner(), balls.balanceOf(address(this)));
    }
}
