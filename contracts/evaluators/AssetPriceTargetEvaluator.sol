// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "../interfaces/IChallengePool.sol";
import "../interfaces/IEvaluator.sol";

import "../utils/helpers.sol";

contract AssetPriceTargetEvaluator is IEvaluator, Helpers {
    string public constant ABOVE = "above";
    string public constant BELOW = "below";
    constructor(
        address _dataProvider
    ) IEvaluator(_dataProvider) Ownable(msg.sender) {}

    function decodeAndAskProvider(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external override returns (bool) {
        (
            string memory assetSymbol,
            uint256 predictedPrice,
            string memory outcome
        ) = abi.decode(_challengeEvent.eventParam, (string, uint256, string));

        if (
            !compareStrings(outcome, ABOVE) && !compareStrings(outcome, BELOW)
        ) {
            return false;
        }

        if (predictedPrice < 1) {
            return false;
        }

        bool success = dataProvider().requestData(
            abi.encode(assetSymbol, _challengeEvent.maturity)
        );
        return success;
    }

    function decodeAndAnswer(
        IChallengePool.ChallengeEvent calldata _challengeEvent
    ) external override returns (IChallengePool.Prediction) {
        (
            string memory assetSymbol,
            uint256 predictedPrice,
            string memory outcome
        ) = abi.decode(_challengeEvent.eventParam, (string, uint256, string));
        bytes memory encodedAssetSymbol = abi.encode(
            assetSymbol,
            _challengeEvent.maturity
        );
        if (!dataProvider().hasData(encodedAssetSymbol)) {
            return IChallengePool.Prediction.zero;
        }
        uint256 actualPrice = abi.decode(
            dataProvider().getData(encodedAssetSymbol),
            (uint256)
        );

        if (compareStrings(outcome, ABOVE)) {
            if (actualPrice > predictedPrice) {
                return IChallengePool.Prediction.yes;
            }
        } else if (compareStrings(outcome, BELOW)) {
            if (actualPrice < predictedPrice) {
                return IChallengePool.Prediction.yes;
            }
        } else {
            return IChallengePool.Prediction.zero;
        }
        return IChallengePool.Prediction.no;
    }
}
