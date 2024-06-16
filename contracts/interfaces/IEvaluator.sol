// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;
import "./IChallengePool.sol";
import "./ITopicDataProvider.sol";

import "../utils/EvaluatorAccess.sol";

abstract contract IEvaluator is EvaluatorAccess {
    constructor(address _dataProvider) EvaluatorAccess(_dataProvider) {}
    function evaluateEvent(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external returns (IChallengePool.Prediction) {
        try this.decodeAndAnswer(_challengeEvent) returns (
            IChallengePool.Prediction k
        ) {
            return k;
        } catch {
            return IChallengePool.Prediction.zero;
        }
    }

    function validateEvent(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external returns (bool) {
        try this.decodeAndAskProvider(_challengeEvent) returns (
            bool k
        ) {
            return k;
        } catch {
            return false;
        }
    }

    function decodeAndAskProvider(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external virtual returns (bool);

    function decodeAndAnswer(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external virtual returns (IChallengePool.Prediction);

    function dataProvider() public view returns (ITopicDataProvider) {
        return evaluatorDataProvider;
    }
}
