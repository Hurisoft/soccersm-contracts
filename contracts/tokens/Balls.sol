// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract BallsToken is ERC20, ERC20Permit {
    constructor() ERC20("Balls Token", "BALLS") ERC20Permit("Balls Token") {
        _mint(_msgSender(), 1_000_000_000 * 1e18);
    }
}

