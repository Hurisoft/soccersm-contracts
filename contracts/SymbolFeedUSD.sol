// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SymbolFeedUSD is Ownable {
    mapping(string => address) public symbolAggregators;
    string[] public symbols;


    constructor() Ownable(msg.sender) {
        
    }

    function setSymbols(string[] memory _symbols, address[] memory _aggregators) public onlyOwner {
        require(_symbols.length == _aggregators.length, "Lengths not equal.");
        for (uint256 i = 0; i < _symbols.length; i++) {
            symbolAggregators[_symbols[i]] = _aggregators[i];
        }
        symbols = _symbols;
    }

    /**
     * Returns the latest answer.
     */
    function getUSDPrice(string calldata symbol) public view returns (int) {
        AggregatorV3Interface dataFeed = AggregatorV3Interface(
            symbolAggregators[symbol]
        );
        (
            /* uint80 roundID */,
            int answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }
}
