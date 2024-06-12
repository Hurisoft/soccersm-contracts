// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/ITopicDataProvider.sol";

abstract contract EvaluatorAccess is Ownable {
    
    ITopicDataProvider internal evaluatorDataProvider;

    event NewDataProvider(address _dataProvider);
    constructor(address _dataProvider) {
        evaluatorDataProvider = ITopicDataProvider(_dataProvider);
        emit NewDataProvider(_dataProvider);
    }

    function setDataProvider(address _dataProvider) external onlyOwner {
        evaluatorDataProvider = ITopicDataProvider(_dataProvider);
        emit NewDataProvider(_dataProvider);
    }
}
