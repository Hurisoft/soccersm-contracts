// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

abstract contract ITrophies is ERC20, ERC20Permit {
    mapping(address account => bool) private _minters;

    error MinterOnly();

    event MinterAdded(address indexed _minter, uint256 _tokenId);

    modifier onlyMinter() {
        if (!_minters[msg.sender]) {
            revert MinterOnly();
        }
        _;
    }

    function addMinter(address _minter) external virtual;

    function removeMinter(address _minter) external virtual;

    function mint(address _account, uint256 _value) external virtual;
}
