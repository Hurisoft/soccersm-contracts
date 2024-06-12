// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;
import "./IChallengePool.sol";
import "./ITopicDataProvider.sol";

import "../utils/EvaluatorAccess.sol";

abstract contract IEvaluator is EvaluatorAccess {

    constructor(address _dataProvider) EvaluatorAccess(_dataProvider){}
    function evaluateEvent(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external virtual returns (IChallengePool.Prediction);

    function validateEvent(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external returns (bool) {
        try this.decodeAndAskProvider(_challengeEvent.eventParam) returns (bool k) {
            return k;
        } catch {
            return false;
        }
    }

    function decodeAndAskProvider(bytes calldata _param) external virtual returns (bool);

    function dataProvider() public view returns (ITopicDataProvider) {
        return evaluatorDataProvider;
    }
}
