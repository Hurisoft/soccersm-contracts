// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "../interfaces/IChallengePool.sol";
import "../interfaces/IEvaluator.sol";

import "../utils/helpers.sol";

contract FootBallCorrectScoreEvaluator is IEvaluator, Helpers {
    constructor(
        address _dataProvider
    ) IEvaluator(_dataProvider) Ownable(msg.sender) {}

    function decodeAndAskProvider(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external override returns (bool) {
        (uint256 matchId, , ) = abi.decode(
            _challengeEvent.eventParam,
            (uint256, uint256, uint256)
        );

        bool success = dataProvider().requestData(abi.encode(matchId));
        return success;
    }

    function decodeAndAnswer(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external override returns (IChallengePool.Prediction) {
        (
            uint256 matchId,
            uint256 predictedHomeScore,
            uint256 predictedAwayScore
        ) = abi.decode(_challengeEvent.eventParam, (uint256, uint256, uint256));
        bytes memory encodedMatchId = abi.encode(matchId);
        if (!dataProvider().hasData(encodedMatchId)) {
            return IChallengePool.Prediction.zero;
        }
        (uint256 homeScore, uint256 awayScore) = abi.decode(
            dataProvider().getData(encodedMatchId),
            (uint256, uint256)
        );
        if (
            homeScore == predictedHomeScore && awayScore == predictedAwayScore
        ) {
            return IChallengePool.Prediction.yes;
        } else {
            return IChallengePool.Prediction.no;
        }
    }
}
