// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "hardhat/console.sol";
import "../interfaces/IChallengePool.sol";
import "../interfaces/IEvaluator.sol";

import "../utils/helpers.sol";

contract DummyEvaluator is IEvaluator, Helpers {
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
    ) external view override returns (IChallengePool.Prediction) {
        console.log(_challengeEvent.maturity, _challengeEvent.topicId);
        (uint256 matchId, string memory outcome) = abi.decode(
            _challengeEvent.eventParam,
            (uint256, string)
        );
        console.log(matchId);
        console.log(outcome);
        return evaluateResult;
    }

    function decode(bytes calldata _params) external pure override returns (bool) {
        (uint256 matchId, string memory outcome) = abi.decode(
            _params,
            (uint256, string)
        );
        console.log(matchId);
        console.log(outcome);
        return true;
    }

     function dataProvider() external view override returns (ITopicDataProvider) {
        return ITopicDataProvider(address(this));
    }

}
