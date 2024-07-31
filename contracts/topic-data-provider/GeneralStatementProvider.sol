// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../interfaces/ITopicDataProvider.sol";

import "../utils/DataProviderAccess.sol";

import "../interfaces/IChallengePool.sol";

contract GeneralStatementProvider is ITopicDataProvider, DataProviderAccess {
    struct Statement {
        uint256 statementId;
        string statement;
        IChallengePool.Prediction results;
    }
    mapping(uint256 => Statement) private _statements;
    constructor() Ownable(msg.sender) {}

    error InvalidStatementId(uint256 _statementId);
    error DataAlreadyProvided();

    event GeneralStatementRequested(
        address indexed _reader,
        uint256 _statementId
    );
    event GeneralStatementProvided(
        address indexed _provider,
        uint256 _statementId,
        string _statement,
        IChallengePool.Prediction _results
    );

    function _statementExists(
        uint256 _statementId
    ) internal view returns (bool) {
        return _statements[_statementId].statementId != 0;
    }

    function requestData(
        bytes calldata _params
    ) external override onlyReader returns (bool) {
        uint256 statementId = abi.decode(_params, (uint256));

        if (!_statementExists(statementId)) {
            revert InvalidStatementId(statementId);
        }
        emit GeneralStatementRequested(msg.sender, statementId);
        return true;
    }

    function provideData(
        bytes calldata _params
    ) external override onlyProvider {
        (
            uint256 statementId,
            string memory statement,
            IChallengePool.Prediction results
        ) = abi.decode(_params, (uint256, string, IChallengePool.Prediction));

        if (_statementExists(statementId)) {
            if (
                _statements[statementId].results !=
                IChallengePool.Prediction.zero
            ) {
                revert DataAlreadyProvided();
            }
        }
        _statements[statementId] = Statement(statementId, statement, results);
        emit GeneralStatementProvided(
            msg.sender,
            statementId,
            statement,
            results
        );
    }

    function getData(
        bytes calldata _params
    ) external view override returns (bytes memory _data) {
        uint256 statementId = abi.decode(_params, (uint256));
        if (!_statementExists(statementId)) {
            revert InvalidStatementId(statementId);
        }
        return abi.encode(_statements[statementId].results);
    }

    function hasData(
        bytes calldata _params
    ) external view override returns (bool) {
        uint256 statementId = abi.decode(_params, (uint256));
        return (_statementExists(statementId));
    }
}
