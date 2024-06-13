// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract DataProviderAccess is Ownable {
    mapping(address => bool) public provider;
    mapping(address => bool) public reader;

    error ProviderOnly();
    error ReaderOnly();

    event ProviderAdded(address indexed _provider);
    event ReaderAdded(address indexed _reader);
    event ProviderRemoved(address indexed _provider);
    event ReaderRemoved(address indexed _reader);

    modifier onlyProvider() {
        if (!provider[msg.sender]) {
            revert ProviderOnly();
        }
        _;
    }

    modifier onlyReader() {
        if (!reader[msg.sender]) {
            revert ReaderOnly();
        }
        _;
    }

    function addProvider(address _provider) external onlyOwner {
        provider[_provider] = true;
        emit ProviderAdded(_provider);
    }

    function removeProvider(address _provider) external onlyOwner {
        provider[_provider] = false;
        emit ProviderRemoved(_provider);
    }

    function addReader(address _reader) external onlyOwner {
        reader[_reader] = true;
        emit ReaderAdded(_reader);
    }

    function removeReader(address _reader) external onlyOwner {
        reader[_reader] = false;
        emit ReaderRemoved(_reader);
    }

    function isProvider(address _provider) public view returns (bool) {
        return provider[_provider];
    }

    function isReader(address _reader) public view returns (bool) {
        return reader[_reader];
    }
}
