// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "../interfaces/IChallengePool.sol";
import "../interfaces/IEvaluator.sol";

import "../utils/Helpers.sol";

contract GeneralStatementEvaluator is IEvaluator, Helpers {
    constructor(
        address _dataProvider
    ) IEvaluator(_dataProvider) Ownable(msg.sender) {}

    function decodeAndAskProvider(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external override returns (bool) {
        uint256 statementId = abi.decode(_challengeEvent.eventParam, (uint256));

        bool success = dataProvider().requestData(abi.encode(statementId));
        return success;
    }

    function decodeAndAnswer(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external override returns (IChallengePool.Prediction) {
        uint256 statementId = abi.decode(_challengeEvent.eventParam, (uint256));

        bytes memory encodedStatementId = abi.encode(statementId);
        if (!dataProvider().hasData(encodedStatementId)) {
            return IChallengePool.Prediction.zero;
        }
        return
            abi.decode(
                dataProvider().getData(encodedStatementId),
                (IChallengePool.Prediction)
            );
    }
}
