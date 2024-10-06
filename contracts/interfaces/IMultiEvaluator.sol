// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;
import "./IMultiChallengePool.sol";
import "./ITopicDataProvider.sol";

import "../utils/EvaluatorAccess.sol";

abstract contract IMultiEvaluator is EvaluatorAccess {
    constructor(address _dataProvider) EvaluatorAccess(_dataProvider) {}
    function evaluateEvent(
        IMultiChallengePool.ChallengeEvent calldata _challengeEvent
    ) external returns (bytes) {
        try this.decodeAndAnswer(_challengeEvent) returns (bytes k) {
            return k;
        } catch {
            return IMultiChallengePool.Prediction.zero;
        }
    }

    function validateEvent(
        IMultiChallengePool.ChallengeEvent calldata _challengeEvent
    ) external returns (bool) {
        try this.decodeAndAskProvider(_challengeEvent) returns (bool k) {
            return k;
        } catch {
            return false;
        }
    }

    function decodeAndAskProvider(
        IMultiChallengePool.ChallengeEvent calldata _challengeEvent
    ) external virtual returns (bool);

    function decodeAndAnswer(
        IMultiChallengePool.ChallengeEvent calldata _challengeEvent
    ) external virtual returns (bytes);

    function dataProvider() public view returns (ITopicDataProvider) {
        return evaluatorDataProvider;
    }
}
