// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;
import "./IMultiChallengePool.sol";
import "./ITopicDataProvider.sol";

import "../utils/EvaluatorAccess.sol";

import "../utils/Helpers.sol";

abstract contract IMultiEvaluator is EvaluatorAccess, Helpers {
    constructor(address _dataProvider) EvaluatorAccess(_dataProvider) {}
    function evaluatePoll(
        IMultiChallengePool.Poll calldata _poll
    ) external returns (bytes memory) {
        try this.decodeAndAnswer(_poll) returns (bytes memory k) {
            return k;
        } catch {
            return emptyBytes;
        }
    }

    function validatePoll(
        IMultiChallengePool.Poll calldata _poll
    ) external returns (bool) {
        try this.decodeAndAskProvider(_poll) returns (bool k) {
            return k;
        } catch {
            return false;
        }
    }

    function decodeAndAskProvider(
        IMultiChallengePool.Poll calldata _poll
    ) external virtual returns (bool);

    function decodeAndAnswer(
        IMultiChallengePool.Poll calldata _poll
    ) external virtual returns (bytes memory);

    function dataProvider() public view returns (ITopicDataProvider) {
        return evaluatorDataProvider;
    }
}
