// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/ITopicDataProvider.sol";

contract Wheel is Ownable {
    IERC20 public balls;
    event NewSpin(address _player, uint256 _stake, uint256 _winnings);

    uint256 public spinStake = 50 * 1e18;
    uint256 public currentMixer = 1;
    uint256[] public wheel = [
        100 * 1e18,
        20 * 1e18,
        300 * 1e18,
        40 * 1e18,
        500 * 1e18,
        60 * 1e18,
        70 * 1e18,
        80 * 1e18
    ];
    constructor(address _balls) Ownable(msg.sender) {
        balls = IERC20(_balls);
    }

    error InvalidStakeAmount();
    error InvalidMixAmount();
    error InvalidWheel();
    error ProtocolInvariantCheckFailed();
    error UserLacksBalls();

    function _simpleRandom() internal view returns (uint256) {
        uint256 baseRandom = uint256(
            keccak256(
                abi.encodePacked(blockhash(block.number - 1), block.timestamp)
            )
        ) + currentMixer;
        return baseRandom % wheel.length;
    }

    function _deposit(uint256 _amount) internal {
        uint256 balanceBefore = IERC20(balls).balanceOf(address(this));
        SafeERC20.safeTransferFrom(
            IERC20(balls),
            msg.sender,
            address(this),
            _amount
        );
        uint256 balanceAfter = IERC20(balls).balanceOf(address(this));
        if ((balanceAfter - balanceBefore) != _amount) {
            revert ProtocolInvariantCheckFailed();
        }
    }

    function _withdraw(uint256 _amount) internal {
        uint256 balanceBefore = IERC20(balls).balanceOf(address(this));
        SafeERC20.safeTransfer(IERC20(balls), msg.sender, _amount);
        uint256 balanceAfter = IERC20(balls).balanceOf(address(this));
        if ((balanceBefore - balanceAfter) != _amount) {
            revert ProtocolInvariantCheckFailed();
        }
    }

    function _senderHasBalls(uint256 _amount) internal view {
        if (IERC20(balls).balanceOf(msg.sender) < _amount) {
            revert UserLacksBalls();
        }
    }

    function spin() external {
        _senderHasBalls(spinStake);
        _deposit(spinStake);
        uint256 winnings = wheel[_simpleRandom()];
        _withdraw(winnings);
        emit NewSpin(msg.sender, spinStake, winnings);
    }

    function withdrawBalls() external onlyOwner {
        _withdraw(IERC20(balls).balanceOf(address(this)));
    }

    function setSpinStake(uint256 _stake) external onlyOwner {
        if (_stake < 1e18) {
            revert InvalidStakeAmount();
        }
        spinStake = _stake;
    }

    function setMixer(uint256 _mixin) external onlyOwner {
        if (_mixin < 1) {
            revert InvalidMixAmount();
        }
        currentMixer = _mixin;
    }

    function setWheel(uint256[] memory _wheel) external onlyOwner {
        if (_wheel.length != 8) {
            revert InvalidWheel();
        }
        for (uint i = 0; i < _wheel.length; i++) {
            if (_wheel[i] < 1) {
                revert InvalidWheel();
            }
        }
        wheel = _wheel;
    }
}
