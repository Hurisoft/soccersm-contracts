// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IMultiTopicDataProvider.sol";

abstract contract MultiEvaluatorAccess is Ownable {
    IMultiTopicDataProvider internal evaluatorDataProvider;

    error InvalidDataProviderAddress(address _dataProviderAddress);

    event NewDataProvider(address _dataProvider);
    constructor(address _dataProvider) {
        evaluatorDataProvider = IMultiTopicDataProvider(_dataProvider);
        emit NewDataProvider(_dataProvider);
    }

    function setDataProvider(address _dataProvider) external onlyOwner {
        if (_dataProvider == address(0)) {
            revert InvalidDataProviderAddress(_dataProvider);
        }
        evaluatorDataProvider = IMultiTopicDataProvider(_dataProvider);
        emit NewDataProvider(_dataProvider);
    }
}
