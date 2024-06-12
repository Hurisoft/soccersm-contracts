// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

abstract contract ITopicDataProvider {
    function requestData(bytes calldata _params) external virtual returns(bool);
    function provideData(bytes calldata _params) external virtual;
    function getData(
        bytes calldata _params
    ) external virtual returns (bytes calldata _data);
    function hasData(bytes calldata _params) external virtual returns (bool);
}
