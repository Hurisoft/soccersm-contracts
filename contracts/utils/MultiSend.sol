// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MultiSend {
    event Sent(address _to, uint256 _amount);
    function transfer(
        address[] memory _receivers,
        uint256 _amount
    ) external payable {
        require(msg.value == _receivers.length * _amount, "invalid value");
        for (uint i = 0; i < _receivers.length; i++) {
            _send(payable(_receivers[i]), _amount);
            emit Sent(_receivers[i], _amount);
        }
    }

    function _send(address payable _to, uint256 _amount) internal {
        (bool sent, ) = _to.call{value: _amount}("");
        require(sent, "Failed to send Ether");
    }
}
