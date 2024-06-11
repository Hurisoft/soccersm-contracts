// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;
import "./IChallengePool.sol";

interface IEvaluator {
    function evaluateEvent(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external view returns (IChallengePool.Prediction);

    function validateEvent(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external view returns (bool);

    function actualMaturity(
        IChallengePool.ChallengeEvent calldata challengeEvent
    ) external view returns (uint256);

    function eventFeed() external view returns(address);
}
