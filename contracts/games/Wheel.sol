// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/ITopicDataProvider.sol";
import "../interfaces/ITrophies.sol";

contract Wheel {
    ITrophies public trophies;
    event NewSpin(address _player, uint256 _stake, uint256 _winnings);
    constructor(address _tropies) {
        trophies = ITrophies(_tropies);
    }

    error ProtocolInvariantCheckFailed();

    function _deposit(uint256 _amount) internal {
        uint256 balanceBefore = IERC20(trophies).balanceOf(address(this));
        SafeERC20.safeTransferFrom(
            IERC20(trophies),
            msg.sender,
            address(this),
            _amount
        );
        uint256 balanceAfter = IERC20(trophies).balanceOf(address(this));
        if ((balanceAfter - balanceBefore) != _amount) {
            revert ProtocolInvariantCheckFailed();
        }
    }

    function _withdraw(uint256 _amount) internal {
        uint256 balanceBefore = IERC20(trophies).balanceOf(address(this));
        SafeERC20.safeTransfer(IERC20(trophies), msg.sender, _amount);
        uint256 balanceAfter = IERC20(trophies).balanceOf(address(this));
        if ((balanceBefore - balanceAfter) != _amount) {
            revert ProtocolInvariantCheckFailed();
        }
    }

    function spin(uint256 _stake, uint256 _winnings) external {
        if (_stake > _winnings) {
            _deposit(_stake - _winnings);
        } else if(_winnings > _stake) {
            _withdraw(_winnings - _stake);
        }
        emit NewSpin(msg.sender, _stake, _winnings);
    }
}
