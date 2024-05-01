// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "../interfaces/IEvaluator.sol";
import "../SymbolFeedUSD.sol";

contract AssetPrice is IEvaluator {
    address public immutable symbolFeed;

    constructor(address _symbolFeed) {
        symbolFeed = _symbolFeed;
    }

    function evaluateChallenge(
        IChallengePool.Challenge calldata challenge
    )
        external
        view
        returns (int results, address[] memory losers, address[] memory winners)
    {
        results = 2586755000000;// SymbolFeedUSD(symbolFeed).getUSDPrice(challenge.params);
        uint winnerCount = 0;
        uint looserCount = 0;
        for (uint256 i = 0; i < challenge.participants.length; i++) {
            if (challenge.participants[i].proposal != results) {
                looserCount++;
            } else {
                winnerCount++;
            }
        }
        losers = new address[](looserCount);
        winners = new address[](winnerCount);
        uint w = 0;
        uint l = 0;
        for (uint256 i = 0; i < challenge.participants.length; i++) {
            if (challenge.participants[i].proposal != results) {
                losers[l++] = challenge.participants[i].participant;
            } else {
                winners[w++] = challenge.participants[i].participant;
            }
        }
    }

    function validateChallenge(
        string memory params,
        int proposal
    ) public view returns (bool) {
        if (
            SymbolFeedUSD(symbolFeed).symbolAggregators(params) == address(0x0)
        ) {
            return false;
        }
        return true;
    }
}
