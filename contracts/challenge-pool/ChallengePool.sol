// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "../interfaces/IChallengePool.sol";
import "../interfaces/ITopicRegistry.sol";
import "../interfaces/IEvaluator.sol";

contract Soccersm is IChallengePool, Ownable {
    constructor(
        uint256 _poolFee,
        uint256 _joinPeriod,
        uint256 _maxMaturityPeriod,
        uint256 _maxPlayersPerPool,
        uint256 _minStakeAmount,
        uint256 _maxEventsPerChallenge,
        uint256 _minMaturityPeriod,
        uint256 _maxStaleRetries,
        uint256 _staleExtensionPeriod,
        address _feeAddress
    ) Ownable(msg.sender) {
        poolFee = _poolFee;
        joinPeriod = _joinPeriod;
        maxMaturityPeriod = _maxMaturityPeriod;
        maxPlayersPerPool = _maxPlayersPerPool;
        minStakeAmount = _minStakeAmount;
        maxEventsPerChallenge = _maxEventsPerChallenge;
        minMaturityPeriod = _minMaturityPeriod;
        maxStaleRetries = _maxStaleRetries;
        staleExtensionPeriod = _staleExtensionPeriod;
        feeAddress = _feeAddress;
    }
    function setFeeAddress(address _feeAddress) external override onlyOwner {
        feeAddress = _feeAddress;
    }

    function setMinMaturityPeriod(
        uint256 _minMaturityPeriod
    ) external override onlyOwner {
        minMaturityPeriod = _minMaturityPeriod;
    }

    function setJoinPeriod(uint256 _joinPeriod) external override onlyOwner {
        joinPeriod = _joinPeriod;
    }

    function setPoolFee(uint256 _poolFee) external override onlyOwner {
        poolFee = _poolFee;
    }

    function setMaxEventsPerChallenge(
        uint256 _maxChallengeEvents
    ) external override onlyOwner {}

    function setMinStakeAmount(
        uint256 _minStakeAmount
    ) external override onlyOwner {
        minStakeAmount = _minStakeAmount;
    }

    function setMaxPlayersPerPool(
        uint256 _maxPlayersPerPool
    ) external override onlyOwner {
        maxPlayersPerPool = _maxPlayersPerPool;
    }

    function setMaxMaturityPeriod(
        uint256 _maxMaturityPeriod
    ) external override onlyOwner {
        maxMaturityPeriod = _maxMaturityPeriod;
    }

    function setMaxStaleRetries(
        uint256 _maxStaleRetries
    ) external override onlyOwner {
        maxStaleRetries = _maxStaleRetries;
    }

    function setStaleExtensionTime(
        uint256 _staleExtensionPeriod
    ) external override onlyOwner {
        staleExtensionPeriod = _staleExtensionPeriod;
    }

    function closeFromManual(
        uint256 _challengeId
    ) external override onlyOwner {}

    function cancelFromManual(
        uint256 _challengeId
    ) external override onlyOwner {}
}
