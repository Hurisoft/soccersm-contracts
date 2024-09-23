// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../interfaces/ITopicDataProvider.sol";

import "../utils/DataProviderAccess.sol";

contract MultiProvider is DataProviderAccess {
    constructor() Ownable(msg.sender) {}

    event MultiDataProvided(address indexed _provider);

    function provideMultiData(bytes[] calldata _params) external onlyProvider {
        for (uint i = 0; i < _params.length; i++) {
            (address _provider, bytes memory _data ) = abi.decode(
                _params[i],
                (address, bytes)
            );
            ITopicDataProvider(_provider).provideData(_data);
        }
        emit MultiDataProvided(msg.sender);
    }
}
