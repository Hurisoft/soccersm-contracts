// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "./IChallengePool.sol";

interface IEvaluator {
    function evaluateChallenge(
        IChallengePool.Challenge calldata challenge
    )
        external
        view
        returns (
            int results,
            address[] memory losers,
            address[] memory winners
        );

    function validateChallenge(
        string memory params,
        int proposal
    ) external view returns (bool);
}
