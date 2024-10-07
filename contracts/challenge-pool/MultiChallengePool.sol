// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IMultiChallengePool.sol";
import "../interfaces/IMultiTopicRegistry.sol";

contract MultiChallengePool is IMultiChallengePool, Ownable {
    constructor(
        uint256 _joinPoolFee,
        uint256 _createPoolFee,
        uint256 _joinPeriod,
        uint256 _maxMaturityPeriod,
        uint256 _maxPlayersPerPool,
        uint256 _minStakeAmount,
        uint256 _maxOptionsPerPool,
        uint256 _minMaturityPeriod,
        uint256 _maxStaleRetries,
        uint256 _staleExtensionPeriod,
        address _feeAddress,
        address _topicRegistry,
        address _ballsAddress
    ) Ownable(msg.sender) {
        joinPoolFee = _joinPoolFee;
        createPoolFee = _createPoolFee;
        joinPeriod = _joinPeriod;
        maxMaturityPeriod = _maxMaturityPeriod;
        maxPlayersPerPool = _maxPlayersPerPool;
        minStakeAmount = _minStakeAmount;
        maxOptionsPerPool = _maxOptionsPerPool;
        minMaturityPeriod = _minMaturityPeriod;
        maxStaleRetries = _maxStaleRetries;
        staleExtensionPeriod = _staleExtensionPeriod;
        feeAddress = _feeAddress;
        balls = IERC20(_ballsAddress);
        topicRegistry = IMultiTopicRegistry(_topicRegistry);
    }
    function setFeeAddress(
        address _feeAddress
    ) external override onlyOwner positiveAddress(_feeAddress) {
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

    function setCreatePoolFee(
        uint256 _createPoolFee
    ) external override onlyOwner {
        createPoolFee = _createPoolFee;
    }

    function setJoinPoolFee(uint256 _joinPoolFee) external override onlyOwner {
        joinPoolFee = _joinPoolFee;
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
    ) external override onlyOwner positiveAddress(_topicRegistry) {
        topicRegistry = IMultiTopicRegistry(_topicRegistry);
    }

    function setBallsAddress(
        address _ballsAddress
    ) external override onlyOwner positiveAddress(_ballsAddress) {
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

    function setMaxOptionsPerPool(
        uint256 _staleExtensionPeriod
    ) external override onlyOwner {
        staleExtensionPeriod = _staleExtensionPeriod;
    }

    function setStaleExtensionTime(
        uint256 _maxOptionsPerPool
    ) external override onlyOwner {
        maxOptionsPerPool = _maxOptionsPerPool;
    }

    function closeFromManual(
        uint256 _challengeId,
        bytes calldata _manualResult
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
        emit ClosedChallengePool(
            _challengeId,
            msg.sender,
            challenge.state,
            challenge.result
        );
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

    function withdrawFees() external override onlyOwner {
        uint256 amount = accumulatedFee;
        accumulatedFee = 0;
        SafeERC20.safeTransfer(balls, feeAddress, amount);
    }
}
