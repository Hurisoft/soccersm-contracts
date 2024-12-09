// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract BallsAirDrop is Ownable {
    IERC20 public balls;
    constructor(address _ballsAddress) Ownable(msg.sender) {
        balls = IERC20(_ballsAddress);
    }

    event AirDrop(address _cliamer, uint256 _amount);

    function airDrop(address[] calldata _addresses, uint256 _val) external {
        for (uint i = 0; i < _addresses.length; i++) {
            SafeERC20.safeTransferFrom(balls, msg.sender, _addresses[i], _val);
            emit AirDrop(_addresses[i], _val);
        }
    }
}
