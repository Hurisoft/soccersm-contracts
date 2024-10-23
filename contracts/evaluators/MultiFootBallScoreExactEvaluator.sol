// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "../interfaces/IMultiChallengePool.sol";
import "../interfaces/IMultiEvaluator.sol";

import "../utils/Helpers.sol";

contract MultiFootBallScoreExactEvaluator is IMultiEvaluator {
    constructor(
        address _dataProvider
    ) IMultiEvaluator(_dataProvider) Ownable(msg.sender) {}

    function decodeAndAskProvider(
        IMultiChallengePool.Poll calldata _poll
    ) external override returns (bool) {
        uint256 matchId = abi.decode(_poll.pollParam, (uint256));
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
        return abi.encode(homeScore + awayScore);
    }

    function hasOptions(
        bytes calldata /*_params*/
    ) external pure override returns (bool) {
        return true;
    }
}
