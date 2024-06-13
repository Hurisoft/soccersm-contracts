// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../interfaces/ITopicDataProvider.sol";

import "../utils/DataProviderAccess.sol";

contract AssetPriceProvider is ITopicDataProvider, DataProviderAccess {
    struct PriceExists {
        uint256 price;
        bool exists;
    }
    mapping(string => mapping(uint256 => PriceExists)) private _assetDatePrice;
    constructor() Ownable(msg.sender) {}

    error InvalidAssetSymbolDate(string _assetSymbol, uint256 _date);
    error InvalidSubmissionDate(uint256 _date);

    event AssetPriceRequested(
        address indexed _reader,
        string _assetSymbol,
        uint256 _date
    );
    event AssetPriceProvided(
        address indexed _provider,
        string _assetSymbol,
        uint256 _date,
        uint256 _price
    );

    function _assetPriceExists(
        string memory _asset,
        uint256 _date
    ) internal view returns (bool) {
        return _assetDatePrice[_asset][_date].exists;
    }

    function requestData(
        bytes calldata _params
    ) external override onlyReader returns (bool) {
        (string memory assetSymbol, uint256 date) = abi.decode(
            _params,
            (string, uint256)
        );

        emit AssetPriceRequested(msg.sender, assetSymbol, date);
        return true;
    }

    function provideData(
        bytes calldata _params
    ) external override onlyProvider {
        (string memory assetSymbol, uint256 date, uint256 price) = abi.decode(
            _params,
            (string, uint256, uint256)
        );
        if (block.timestamp < date) {
            revert InvalidSubmissionDate(date);
        }
        _assetDatePrice[assetSymbol][date] = PriceExists(price, true);
        emit AssetPriceProvided(msg.sender, assetSymbol, date, price);
    }

    function getData(
        bytes calldata _params
    ) external view override returns (bytes memory _data) {
        (string memory assetSymbol, uint256 date) = abi.decode(
            _params,
            (string, uint256)
        );
        if (!_assetPriceExists(assetSymbol, date)) {
            revert InvalidAssetSymbolDate(assetSymbol, date);
        }
        return abi.encode(_assetDatePrice[assetSymbol][date].price);
    }

    function hasData(
        bytes calldata _params
    ) external view override returns (bool) {
        (string memory assetSymbol, uint256 date) = abi.decode(
            _params,
            (string, uint256)
        );
        return _assetPriceExists(assetSymbol, date);
    }
}
