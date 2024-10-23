// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "../interfaces/IMultiChallengePool.sol";
import "../interfaces/IMultiEvaluator.sol";

import "../utils/Helpers.sol";

import "hardhat/console.sol";

contract MultiFootBallScoreOutcomeEvaluator is IMultiEvaluator {
    string public constant HOME = "home";
    string public constant AWAY = "away";
    string public constant DRAW = "draw";
    constructor(
        address _dataProvider
    ) IMultiEvaluator(_dataProvider) Ownable(msg.sender) {}

    function decodeAndAskProvider(
        IMultiChallengePool.Poll calldata _poll
    ) external override returns (bool) {
        uint256 matchId = abi.decode(_poll.pollParam, (uint256));
        bool options = this.hasOptions(abi.encode(_poll.options));
        if (!options) {
            return false;
        }
        bool success = dataProvider().requestData(abi.encode(matchId));
        return success;
    }

    function decodeAndAnswer(
        IMultiChallengePool.Poll calldata _poll
    ) external override returns (bytes memory) {
        uint256 matchId = abi.decode(_poll.pollParam, (uint256));
        bytes memory encodedMatchId = abi.encode(matchId);
        if (!dataProvider().hasData(encodedMatchId)) {
            return emptyBytes;
        }
        (uint256 homeScore, uint256 awayScore) = abi.decode(
            dataProvider().getData(encodedMatchId),
            (uint256, uint256)
        );
        return _scoreToOutcome(homeScore, awayScore);
    }

    function _isOutcome(bytes memory outcome) internal pure returns (bool) {
        if (
            !compareBytes(outcome, abi.encode(HOME)) &&
            !compareBytes(outcome, abi.encode(AWAY)) &&
            !compareBytes(outcome, abi.encode(DRAW))
        ) {
            return false;
        }
        return true;
    }

    function _scoreToOutcome(
        uint256 homeScore,
        uint256 awayScore
    ) internal pure returns (bytes memory) {
        if (homeScore > awayScore) {
            return abi.encode(HOME);
        } else if (awayScore > homeScore) {
            return abi.encode(AWAY);
        } else {
            return abi.encode(DRAW);
        }
    }

    function hasOptions(
        bytes calldata _params
    ) external pure override returns (bool) {
        bytes[] memory options = abi.decode(_params, (bytes[]));
        if(options.length == 0) {
            return false;
        }
        if (options.length > 3) {
            return false;
        }
        for (uint256 i = 0; i < options.length; i++) {
            if (!_isOutcome(options[i])) {
                return false;
            }
        }
        return true;
    }
}
