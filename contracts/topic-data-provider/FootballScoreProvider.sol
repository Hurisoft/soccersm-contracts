// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../interfaces/ITopicDataProvider.sol";

import "../utils/DataProviderAccess.sol";

contract FootballScoreProvider is ITopicDataProvider, DataProviderAccess {
    constructor() Ownable(msg.sender) {}
    function requestData(bytes calldata _params) external override onlyReader returns(bool){}

    function provideData(
        bytes calldata _params
    ) external override onlyProvider {}

    function getData(
        bytes calldata _params
    ) external override returns (bytes memory _data) {}

    function hasData(bytes calldata _params) external override returns (bool) {}
}
