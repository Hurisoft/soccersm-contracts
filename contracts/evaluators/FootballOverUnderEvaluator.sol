// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "hardhat/console.sol";
import "../interfaces/IChallengePool.sol";
import "../interfaces/IEvaluator.sol";

import "../utils/helpers.sol";
import "hardhat/console.sol";

contract FootballOverUnderEvaluator is IEvaluator, Helpers {
    string public constant OVER = "over";
    string public constant UNDER = "under";
    constructor(
        address _dataProvider
    ) IEvaluator(_dataProvider) Ownable(msg.sender) {}

    function decodeAndAskProvider(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external override returns (bool) {
        (uint256 matchId, uint256 predictedTotal, string memory outcome) = abi
            .decode(_challengeEvent.eventParam, (uint256, uint256, string));
        if (!compareStrings(outcome, OVER) && !compareStrings(outcome, UNDER)) {
            return false;
        }
        if (predictedTotal < 1) {
            return false;
        }
        bool success = dataProvider().requestData(abi.encode(matchId));
        return success;
    }

    function decodeAndAnswer(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external override returns (IChallengePool.Prediction) {
        (uint256 matchId, uint256 predictedTotal, string memory outcome) = abi
            .decode(_challengeEvent.eventParam, (uint256, uint256, string));
        bytes memory encodedMatchId = abi.encode(matchId);
        if (!dataProvider().hasData(encodedMatchId)) {
            return IChallengePool.Prediction.zero;
        }
        (uint256 homeScore, uint256 awayScore) = abi.decode(
            dataProvider().getData(encodedMatchId),
            (uint256, uint256)
        );

        uint256 actualTotal = homeScore + awayScore;

        if (compareStrings(outcome, OVER)) {
            if (actualTotal > predictedTotal) {
                return IChallengePool.Prediction.yes;
            }
        } else if (compareStrings(outcome, UNDER)) {
            if (actualTotal <= predictedTotal) {
                return IChallengePool.Prediction.yes;
            }
        } else {
            return IChallengePool.Prediction.zero;
        }
        return IChallengePool.Prediction.no;
    }
}
