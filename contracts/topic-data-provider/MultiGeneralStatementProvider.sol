// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IMultiTopicDataProvider.sol";
import "../utils/DataProviderAccess.sol";
import "../utils/Helpers.sol";
import "../interfaces/IChallengePool.sol";

import "hardhat/console.sol";

contract MultiGeneralStatementProvider is
    IMultiTopicDataProvider,
    DataProviderAccess,
    Helpers
{
    struct Statement {
        uint256 statementId;
        string statement;
        uint256 maturity;
        bytes result;
        bytes[] options;
        bool exists;
    }
    mapping(uint256 => Statement) private _statements;
    mapping(uint256 => mapping(bytes => bool)) internal statementOptions; // statementId > option > bool
    constructor() Ownable(msg.sender) {}

    error InvalidStatementId(uint256 _statementId);
    error DataAlreadyProvided();
    error InvalidInitialResult();
    error InvalidResult();
    error InvalidSubmissionDate(uint256 _date);
    error ModifiedParams(string _paramName);
    error ZeroStatementId();

    event MultiGeneralStatementRequested(
        address indexed _reader,
        uint256 _statementId
    );
    event MultiGeneralStatementProvided(
        address indexed _provider,
        uint256 _statementId,
        string _statement,
        bytes _result
    );

    function _statementExists(
        uint256 _statementId
    ) internal view returns (bool) {
        return _statements[_statementId].exists;
    }

    function requestData(
        bytes calldata _params
    ) external override onlyReader returns (bool) {
        uint256 statementId = abi.decode(_params, (uint256));
        if (!_statementExists(statementId)) {
            revert InvalidStatementId(statementId);
        }
        if (_statements[statementId].maturity < block.timestamp) {
            revert InvalidSubmissionDate(_statements[statementId].maturity);
        }
        emit MultiGeneralStatementRequested(msg.sender, statementId);
        return true;
    }

    function provideData(
        bytes calldata _params
    ) external override onlyProvider {
        (
            uint256 statementId,
            string memory statement,
            uint256 maturity,
            bytes memory result,
            bytes[] memory options
        ) = abi.decode(_params, (uint256, string, uint256, bytes, bytes[]));

        if (statementId == 0) {
            revert ZeroStatementId();
        }
        console.log(block.timestamp, maturity);
        if (_statementExists(statementId)) {
            if (maturity > block.timestamp) {
                revert InvalidSubmissionDate(maturity);
            }
            Statement storage _statement = _statements[statementId];
            if (_statement.maturity != maturity) {
                revert ModifiedParams("maturity");
            }
            if (!compareStrings(_statement.statement, statement)) {
                revert ModifiedParams("statement");
            }
            if (!compareBytes(_statement.result, emptyBytes)) {
                revert DataAlreadyProvided();
            }
            if (compareBytes(result, emptyBytes)) {
                revert InvalidResult();
            }
            if (!statementOptions[statementId][result]) {
                revert InvalidResult();
            }
            _statement.result = result;
        } else {
            if (maturity <= block.timestamp) {
                revert InvalidSubmissionDate(maturity);
            }
            if (!compareBytes(result, emptyBytes)) {
                revert InvalidInitialResult();
            }
            _statements[statementId] = Statement(
                statementId,
                statement,
                maturity,
                result,
                options,
                true
            );
            for (uint256 i = 0; i < options.length; i++) {
                statementOptions[statementId][options[i]] = true;
            }
        }

        emit MultiGeneralStatementProvided(
            msg.sender,
            statementId,
            statement,
            result
        );
    }

    function getData(
        bytes calldata _params
    ) external view override returns (bytes memory _data) {
        uint256 statementId = abi.decode(_params, (uint256));
        if (!_statementExists(statementId)) {
            revert InvalidStatementId(statementId);
        }
        return abi.encode(_statements[statementId].result);
    }

    function hasData(
        bytes calldata _params
    ) external view override returns (bool) {
        uint256 statementId = abi.decode(_params, (uint256));
        return (_statementExists(statementId));
    }

    function hasOptions(
        bytes calldata _params
    ) external view override returns (bool) {
        (uint256 statementId, bytes[] memory options) = abi.decode(
            _params,
            (uint256, bytes[])
        );
        for (uint256 i = 0; i < options.length; i++) {
            if (!statementOptions[statementId][options[i]]) {
                return false;
            }
        }
        return true;
    }
}
