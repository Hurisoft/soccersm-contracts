// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract TestBalls is ERC20, ERC20Permit {
    constructor() ERC20("Test Balls", "TBT") ERC20Permit("Test Balls") {
        _mint(_msgSender(), 100_000_000 * 1e18);
    }
}

