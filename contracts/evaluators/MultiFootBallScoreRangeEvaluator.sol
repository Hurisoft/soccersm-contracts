// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "../interfaces/IMultiChallengePool.sol";
import "../interfaces/IMultiEvaluator.sol";

import "../utils/Helpers.sol";

contract MultiFootBallScoreRangeEvaluator is IMultiEvaluator {
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
        uint256 totalScore = homeScore + awayScore;
        for (uint256 i = 0; i < _poll.options.length; i++) {
            (uint256 low, uint256 high) = abi.decode(
                _poll.options[i],
                (uint256, uint256)
            );
            if (totalScore >= low && totalScore <= high) {
                return _poll.options[i];
            }
        }
        return emptyBytes;
    }

    function hasOptions(
        bytes calldata _params
    ) external pure override returns (bool) {
        bytes[] memory options = abi.decode(_params, (bytes[]));
        if(options.length == 0) {
            return false;
        }
        for (uint256 i = 0; i < options.length; i++) {
            (uint256 low, uint256 high) = abi.decode(
                options[i],
                (uint256, uint256)
            );
            if (high <= low) {
                return false;
            }
        }
        return true;
    }
}
