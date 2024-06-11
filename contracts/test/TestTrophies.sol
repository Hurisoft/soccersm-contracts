// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../interfaces/ITrophies.sol";

contract TestTrophies is ITrophies, Ownable {
    mapping(address account => bool) private _minters;

    constructor()
        ERC20("Test Trophies", "TT")
        ERC20Permit("Test Trophies")
        Ownable(msg.sender)
    {}

    function addMinter(address _minter) external override onlyOwner {
        _minters[_minter] = true;
    }

    function removeMinter(address _minter) external override onlyOwner {
        _minters[_minter] = false;
    }

    function mint(
        address _account,
        uint256 _value
    ) external override onlyMinter {
        _mint(_account, _value);
    }
}
