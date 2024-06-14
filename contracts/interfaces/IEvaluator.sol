// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;
import "./IChallengePool.sol";
import "./ITopicDataProvider.sol";

import "../utils/EvaluatorAccess.sol";
import "hardhat/console.sol";

abstract contract IEvaluator is EvaluatorAccess {
    constructor(address _dataProvider) EvaluatorAccess(_dataProvider) {}
    function evaluateEvent(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external returns (IChallengePool.Prediction) {
        try this.decodeAndAnswer(_challengeEvent) returns (
            IChallengePool.Prediction k
        ) {
            console.log("eval", uint8(k));
            return k;
        } catch {
            console.log("error");
            return IChallengePool.Prediction.zero;
        }
    }

    function validateEvent(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external returns (bool) {
        try this.decodeAndAskProvider(_challengeEvent) returns (
            bool k
        ) {
            console.log("valid", k);
            return k;
        } catch {
            console.log("error");
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
