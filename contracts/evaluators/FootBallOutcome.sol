// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "hardhat/console.sol";
import "../interfaces/IChallengePool.sol";
import "../interfaces/IEvaluator.sol";

import "../utils/helpers.sol";

contract FootballOutcomeEvaluator is IEvaluator, Helpers {
    constructor(
        address _dataProvider
    ) IEvaluator(_dataProvider) Ownable(msg.sender) {}

    function evaluateEvent(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external pure override returns (IChallengePool.Prediction) {
        console.log(_challengeEvent.maturity, _challengeEvent.topicId);
        (uint256 matchId, string memory outcome) = abi.decode(
            _challengeEvent.eventParam,
            (uint256, string)
        );
        console.log(matchId);
        console.log(outcome);
        return IChallengePool.Prediction.no;
    }

    function decodeAndAskProvider(
        bytes calldata _params
    ) external override returns (bool) {
        (uint256 matchId, string memory outcome) = abi.decode(
            _params,
            (uint256, string)
        );
        bool success = dataProvider().requestData(abi.encode(matchId));
        return success;
    }
}
