// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "hardhat/console.sol";
import "../interfaces/IChallengePool.sol";
import "../interfaces/IEvaluator.sol";


contract DummyEvaluator is IEvaluator {
    bool public validateResult = true;
    IChallengePool.Prediction public evaluateResult =
        IChallengePool.Prediction.yes;

    constructor(
        bool _validateResult,
        IChallengePool.Prediction _evaluateResult
    ) {
        validateResult = _validateResult;
        evaluateResult = _evaluateResult;
    }

    function updateResults(
        bool _validateResult,
        IChallengePool.Prediction _evaluateResult
    ) external {
        validateResult = _validateResult;
        evaluateResult = _evaluateResult;
    }

    function evaluateEvent(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external view returns (IChallengePool.Prediction) {
        console.log(_challengeEvent.maturity, _challengeEvent.topicId);
        return evaluateResult;
    }

    function validateEvent(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external view returns (bool) {
        console.log(_challengeEvent.maturity, _challengeEvent.topicId);
        return validateResult;
    }

    function actualMaturity(
        IChallengePool.ChallengeEvent calldata challengeEvent
    ) external pure returns (uint256) {
        return challengeEvent.maturity;
    }

    function eventFeed() external view returns (address) {
        return address(this);
    }
}
