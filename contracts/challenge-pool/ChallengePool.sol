// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

import "../interfaces/IChallengePool.sol";
import "../interfaces/ITopicRegistry.sol";
import "../interfaces/IEvaluator.sol";

contract ChallengePool is IChallengePool, Ownable {
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
        address _feeAddress,
        address _topicRegistry,
        address _trophiesAddress,
        address _ballsAddress
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
        balls = IERC20(_ballsAddress);
        trophies = IERC20(_trophiesAddress);
        topicRegistry = ITopicRegistry(_topicRegistry);
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
        uint256 _maxEventsPerChallenge
    ) external override onlyOwner {
        maxEventsPerChallenge = _maxEventsPerChallenge;
    }

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

    function setTopicRegistry(
        address _topicRegistry
    ) external override onlyOwner {
        topicRegistry = ITopicRegistry(_topicRegistry);
    }

    function setTrophiesAddress(
        address _trophiesAddress
    ) external override onlyOwner {
        trophies = IERC20(_trophiesAddress);
    }

    function setBallsAddress(
        address _ballsAddress
    ) external override onlyOwner {
        balls = IERC20(_ballsAddress);
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
        uint256 _challengeId,
        Prediction _manualResult
    )
        external
        override
        onlyOwner
        validChallenge(_challengeId)
        validPrediction(_manualResult)
    {
        Challenge storage challenge = challengePools[_challengeId];
        PoolState currentState = _poolState(challenge);
        if (currentState != PoolState.manual) {
            revert ActionNotAllowedForState(currentState);
        }
        challenge.result = _manualResult;
        challenge.state = PoolState.manual;
        emit ClosedChallengePool(_challengeId, msg.sender, challenge.state);
    }

    function cancelFromManual(
        uint256 _challengeId
    ) external override onlyOwner validChallenge(_challengeId) {
        Challenge storage challenge = challengePools[_challengeId];
        PoolState currentState = _poolState(challenge);
        if (currentState != PoolState.manual) {
            revert ActionNotAllowedForState(currentState);
        }
        challenge.state = PoolState.cancelled;
        emit CancelChallengePool(_challengeId, msg.sender, challenge.state);
    }
}
