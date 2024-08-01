// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "../interfaces/IChallengePool.sol";
import "../interfaces/IEvaluator.sol";

import "../utils/Helpers.sol";

contract FootballOutcomeEvaluator is IEvaluator, Helpers {
    string public constant HOME = "home";
    string public constant AWAY = "away";
    string public constant DRAW = "draw";
    string public constant HOME_AWAY = "home-away";
    string public constant HOME_DRAW = "home-draw";
    string public constant AWAY_DRAW = "away-draw";
    constructor(
        address _dataProvider
    ) IEvaluator(_dataProvider) Ownable(msg.sender) {}

    function decodeAndAskProvider(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external override returns (bool) {
        (uint256 matchId, string memory outcome) = abi.decode(
            _challengeEvent.eventParam,
            (uint256, string)
        );
        if (
            !compareStrings(outcome, HOME) &&
            !compareStrings(outcome, AWAY) &&
            !compareStrings(outcome, DRAW) &&
            !compareStrings(outcome, HOME_DRAW) &&
            !compareStrings(outcome, AWAY_DRAW) &&
            !compareStrings(outcome, HOME_AWAY)
        ) {
            return false;
        }
        bool success = dataProvider().requestData(abi.encode(matchId));
        return success;
    }

    function decodeAndAnswer(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external override returns (IChallengePool.Prediction) {
        (uint256 matchId, string memory outcome) = abi.decode(
            _challengeEvent.eventParam,
            (uint256, string)
        );
        bytes memory encodedMatchId = abi.encode(matchId);
        if (!dataProvider().hasData(encodedMatchId)) {
            return IChallengePool.Prediction.zero;
        }
        (uint256 homeScore, uint256 awayScore) = abi.decode(
            dataProvider().getData(encodedMatchId),
            (uint256, uint256)
        );

        string memory result = scoreToOutcome(homeScore, awayScore);

        if (compareStrings(outcome, HOME)) {
            if (compareStrings(HOME, result)) {
                return IChallengePool.Prediction.yes;
            }
        } else if (compareStrings(outcome, AWAY)) {
            if (compareStrings(AWAY, result)) {
                return IChallengePool.Prediction.yes;
            }
        } else if (compareStrings(outcome, DRAW)) {
            if (compareStrings(DRAW, result)) {
                return IChallengePool.Prediction.yes;
            }
        } else if (compareStrings(outcome, HOME_DRAW)) {
            if (compareStrings(HOME, result)) {
                return IChallengePool.Prediction.yes;
            }
            if (compareStrings(DRAW, result)) {
                return IChallengePool.Prediction.yes;
            }
        } else if (compareStrings(outcome, AWAY_DRAW)) {
            if (compareStrings(AWAY, result)) {
                return IChallengePool.Prediction.yes;
            }
            if (compareStrings(DRAW, result)) {
                return IChallengePool.Prediction.yes;
            }
        } else if (compareStrings(outcome, HOME_AWAY)) {
            if (compareStrings(HOME, result)) {
                return IChallengePool.Prediction.yes;
            }
            if (compareStrings(AWAY, result)) {
                return IChallengePool.Prediction.yes;
            }
        } else {
            return IChallengePool.Prediction.zero;
        }
        return IChallengePool.Prediction.no;
    }

    function scoreToOutcome(
        uint256 homeScore,
        uint256 awayScore
    ) internal pure returns (string memory) {
        if (homeScore > awayScore) {
            return HOME;
        } else if (awayScore > homeScore) {
            return AWAY;
        } else {
            return DRAW;
        }
    }
}
