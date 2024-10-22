// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "../interfaces/IMultiChallengePool.sol";
import "../interfaces/IMultiEvaluator.sol";

import "../utils/Helpers.sol";

// import "hardhat/console.sol";

contract MultiGeneralStatementEvaluator is IMultiEvaluator {
    constructor(
        address _dataProvider
    ) IMultiEvaluator(_dataProvider) Ownable(msg.sender) {}

    function decodeAndAskProvider(
        IMultiChallengePool.Poll calldata _poll
    ) external override returns (bool) {
        uint256 statementId = abi.decode(_poll.pollParam, (uint256));
        bool options = this.hasOptions(abi.encode(statementId, _poll.options));
        if (!options) {
            return false;
        }
        bool success = dataProvider().requestData(abi.encode(statementId));
        return success;
    }

    function decodeAndAnswer(
        IMultiChallengePool.Poll calldata _poll
    ) external override returns (bytes memory) {
        uint256 statementId = abi.decode(_poll.pollParam, (uint256));

        bytes memory encodedStatementId = abi.encode(statementId);
        if (!dataProvider().hasData(encodedStatementId)) {
            return emptyBytes;
        }
        return abi.decode(dataProvider().getData(encodedStatementId), (bytes));
    }

    function hasOptions(
        bytes calldata _params
    ) external view override returns (bool) {
        return dataProvider().hasOptions(_params);
    }
}
