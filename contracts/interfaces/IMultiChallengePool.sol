// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IMultiTopicRegistry.sol";
import "./IMultiEvaluator.sol";
import "../utils/Helpers.sol";

abstract contract IMultiChallengePool is Helpers {
    enum PoolState {
        open,
        closed,
        stale,
        manual,
        cancelled,
        locked,
        mature
    }

    struct ChallengeEvent {
        bytes eventParam;
        uint256 topicId;
        uint256 maturity;
        bytes[] options;
    }

    struct Challenge {
        uint256 stake;
        uint256 createdAt;
        uint256 nextCloseTime; // next retry time after stale
        uint256 staleRetries;
        PoolState state;
        bytes result;
        uint256 totalParticipants;
        uint256 totalTickets;
        ChallengeEvent challengeEvent;
    }

    struct Ticket {
        uint256 quantity;
        bytes choice;
        bool withdrawn;
    }

    struct OptionTicket {
        bool isOption;
        uint256 tickets;
    }

    // ============ protocol variables =============
    uint256 public joinPoolFee = 50;
    uint256 public createPoolFee = 50;
    uint256 public joinPeriod = 10000; // in basis point
    uint256 public maxMaturityPeriod = 12 weeks;
    uint256 public maxPlayersPerPool = 10000;
    uint256 public minStakeAmount = 100 * 1e18;
    uint256 public maxOptionsPerPool = 10;
    uint256 public minMaturityPeriod = 1 hours;
    uint256 public maxStaleRetries = 3;
    uint256 public staleExtensionPeriod = 1 hours;
    uint256 public accumulatedFee = 0;
    address public feeAddress;
    IMultiTopicRegistry public topicRegistry;
    IERC20 public balls;

    // ============ ================= ==============
    mapping(address => mapping(uint256 => Ticket)) internal tickets; // player > poolId > Ticket
    mapping(uint256 => mapping(bytes => OptionTicket)) internal optionTickets; // pooId > option > OptionTicket
    Challenge[] internal challengePools;

    // ============ ================= ==============
    event StakeTokenAdded(address indexed token);
    event NewChallengePool(
        uint256 indexed challengeId,
        address indexed creator,
        uint256 createdAt,
        uint256 maturity,
        uint256 nextCloseTime,
        uint256 staleRetries,
        PoolState state,
        bytes result,
        uint256 stake,
        uint256 fee,
        uint256 totalParticipants,
        uint256 totalTickets,
        ChallengeEvent challengeEvent
    );
    event ClosedChallengePool(
        uint256 indexed challengeId,
        address indexed closer,
        PoolState state,
        bytes result
    );
    event CancelChallengePool(
        uint256 indexed challengeId,
        address indexed canceller,
        PoolState state
    );
    event StaleChallengePool(
        uint256 indexed challengeId,
        address indexed closer,
        uint256 nextCloseTime,
        uint256 staleRetries,
        PoolState state
    );
    event ManualChallengePool(
        uint256 indexed challengeId,
        address indexed closer,
        PoolState state
    );
    event JoinChallengePool(
        uint256 indexed challengeId,
        address indexed participant,
        uint256 fee,
        uint256 ticketQuantity,
        bytes choice,
        PoolState state
    );
    event WinningsWithdrawn(
        address indexed participant,
        uint256 indexed challengeId,
        uint256 amountWithdrawn,
        uint256 amountWon
    );

    error InvalidChallenge();
    error InvalidPrediction();
    error ChallengePoolClosed();
    error InvalidMaxDeadLine();
    error ActionNotAllowedForState(PoolState _state);
    error PlayerLimitReached();
    error PlayerAlreadyInPool();
    error PlayerNotInPool();
    error PlayerDidNotWinPool();
    error PlayerWinningAlreadyWithdrawn();
    error StakeLowerThanMinimum();
    error ProtocolInvariantCheckFailed();
    error NextStalePoolRetryNotReached(uint256 _curentRetry);
    error UserLacksBalls();
    error InvalidEventTopic();
    error InvalidEventParam();
    error InvalidEventMaturity(uint256 _timeDiff);
    error InvalidOptionsLength();
    error InvalidEventOption();

    modifier validChallenge(uint256 _challengeId) {
        if (_challengeId >= challengePools.length) {
            revert InvalidChallenge();
        }
        _;
    }

    modifier poolInState(Challenge storage _challenge, PoolState _state) {
        PoolState currentState = _poolState(_challenge);
        if (currentState != _state) {
            revert ActionNotAllowedForState(currentState);
        }
        _;
    }

    modifier validStake(uint256 _stake) {
        if (_stake < minStakeAmount) {
            revert StakeLowerThanMinimum();
        }
        _;
    }

    modifier validPrediction(bytes _prediction) {
        if (_prediction == emptyBytes) {
            revert InvalidPrediction();
        }
        _;
    }

    // ============= ADMIN =================

    function setFeeAddress(address _feeAddress) external virtual;

    function setMinMaturityPeriod(uint256 _minMaturity) external virtual;

    function setJoinPeriod(uint256 _joinPeriod) external virtual;

    function setCreatePoolFee(uint256 _createPoolFee) external virtual;

    function setJoolFee(uint256 _joinPoolFee) external virtual;

    function setMaxOptionsPerPool(uint256 _maxOptionsPerPool) external virtual;

    function setMinStakeAmount(uint256 _minStakeAmount) external virtual;

    function setMaxPlayersPerPool(uint256 _maxPlayers) external virtual;

    function setMaxMaturityPeriod(uint256 _maxMaturity) external virtual;

    function setMaxStaleRetries(uint256 _maxStaleRetries) external virtual;

    function setTopicRegistry(address _topicRegistry) external virtual;

    function setBallsAddress(address _ballsAddress) external virtual;

    function setStaleExtensionTime(
        uint256 _staleExtensionTime
    ) external virtual;

    // ============= INTERNAL =================

    function _computeDeadline(
        uint256 _createdTime,
        uint256 _maxDeadline
    ) internal view returns (uint256) {
        if (_createdTime >= _maxDeadline) {
            revert InvalidMaxDeadLine();
        }
        return (_createdTime +
            basisPoint((_maxDeadline - _createdTime), joinPeriod));
    }

    function _computeJoinFee(uint256 _stake) internal view returns (uint256) {
        return basisPoint(_stake, joinPoolFee);
    }

    function _computeCreateFee(uint256 _stake) internal view returns (uint256) {
        return basisPoint(_stake, createPoolFee);
    }

    function _computeWinnerShare(
        Challenge storage _challenge,
        uint256 _challengeId
    ) internal view returns (uint256) {
        uint256 winners = optionTickets[_challengeId][_challenge.result]
            .tickets;
        uint256 loosers = _challenge.totalTickets - winners;
        return Math.mulDiv(_challenge.stake, loosers, winners);
    }

    function _poolState(
        Challenge storage _challenge
    ) internal view returns (PoolState) {
        if (_challenge.state == PoolState.open) {
            if (block.timestamp >= _challenge.maturity) {
                return PoolState.mature;
            }
            if (block.timestamp >= _challenge.challengeEvent.maturity) {
                return PoolState.locked;
            }
            return _challenge.state;
        }
        return _challenge.state;
    }

    function _deposit(uint256 _stakePlusFees) internal {
        uint256 balanceBefore = IERC20(balls).balanceOf(address(this));
        SafeERC20.safeTransferFrom(
            IERC20(balls),
            msg.sender,
            address(this),
            _stakePlusFees
        );
        uint256 balanceAfter = IERC20(balls).balanceOf(address(this));
        if ((balanceAfter - balanceBefore) != _stakePlusFees) {
            revert ProtocolInvariantCheckFailed();
        }
    }

    function _withdraw(uint256 _winningsAndStake) internal {
        uint256 balanceBefore = IERC20(balls).balanceOf(address(this));
        SafeERC20.safeTransfer(IERC20(balls), msg.sender, _winningsAndStake);
        uint256 balanceAfter = IERC20(balls).balanceOf(address(this));
        if ((balanceBefore - balanceAfter) != _winningsAndStake) {
            revert ProtocolInvariantCheckFailed();
        }
    }

    function _topicEvaluator(
        uint256 _topicId
    ) internal view returns (IMultiEvaluator) {
        return IMultiTopicRegistry(topicRegistry).topicEvaluator(_topicId);
    }

    function _activeTopic(uint256 _topicId) internal view returns (bool) {
        return IMultiTopicRegistry(topicRegistry).activeTopic(_topicId);
    }

    function _senderHasBalls(uint256 _amount) internal view {
        if (IERC20(balls).balanceOf(msg.sender) < _amount) {
            revert UserLacksBalls();
        }
    }

    // ============= EXTERNAL STATE =================

    function createChallenge(
        bytes _eventParam,
        uint256 calldata _eventTopicId,
        uint256 calldata _eventMaturity,
        bytes[] calldata _eventOptions,
        bytes calldata _userPrediction,
        uint256 _ticketQuantity,
        uint256 _stake
    ) external nonZero(_ticketQuantity) nonZero(_stake) {
        if (_eventOptions.length > maxOptionsPerPool) {
            revert InvalidOptionsLength();
        }
        if (_eventMaturity < (block.timestamp + minMaturityPeriod)) {
            revert InvalidEventMaturity(
                (block.timestamp + minMaturityPeriod) - _eventMaturity
            );
        }
        if (!_activeTopic(_eventTopicId)) {
            revert InvalidEventTopic();
        }
        uint256 stake = _ticketQuantity * _stake;
        uint256 fee = _computeCreateFee(stake);
        _senderHasBalls(stake + fee);
        uint256 challengeId = challengePools.length;
        ChallengeEvent memory challengeEvent = new ChallengeEvent(
            _eventParam,
            _eventTopicId,
            _eventMaturity,
            _eventOptions
        );
        if (
            !_topicEvaluator(challengeEvent.topicId).validateEvent(
                challengeEvent
            )
        ) {
            revert InvalidEventParam();
        }
        bool _userPredictionValid = false;
        for (uint256 i = 0; i < _eventOptions.length; i++) {
            if (_userPrediction == _eventOptions[i] && !_userPredictionValid) {
                optionTickets[challengeId][_userPrediction] = OptionTicket(
                    true,
                    _ticketQuantity
                );
                _userPredictionValid = true;
            } else {
                optionTickets[challengeId][_userPrediction] = OptionTicket(
                    true,
                    0
                );
            }
        }
        if (!_userPredictionValid) {
            revert InvalidPrediction();
        }
        tickets[msg.sender][challengeId] = Ticket(
            _ticketQuantity,
            _userPrediction,
            false
        );

        accumulatedFee += fee;
        _deposit(stake + fee);
        challengePools.push(
            Challenge(
                _stake,
                block.timestamp,
                _eventMaturity,
                0,
                PoolState.open,
                emptyBytes,
                1,
                _ticketQuantity,
                challengeEvent
            )
        );
        emit NewChallengePool(
            challengeId,
            msg.sender,
            block.timestamp,
            _eventMaturity,
            _eventMaturity,
            0,
            PoolState.open,
            emptyBytes,
            _stake,
            fee,
            1,
            _ticketQuantity,
            challengeEvent
        );
    }

    function joinChallenge(
        uint256 _challengeId,
        bytes _userPrediction,
        uint256 _ticketQuantity
    ) external validChallenge(_challengeId) nonZero(_ticketQuantity) {
        if (!optionTickets[_challengeId][_userPrediction].isOption) {
            revert InvalidPrediction();
        }
        if (!tickets[msg.sender][_challengeId].quantity > 0) {
            revert PlayerAlreadyInPool();
        }
        Challenge storage challenge = challengePools[_challengeId];
        PoolState currentState = _poolState(challenge);
        if (currentState != PoolState.open) {
            revert ActionNotAllowedForState(currentState);
        }
        if (challenge.totalParticipants >= maxPlayersPerPool) {
            revert PlayerLimitReached();
        }
        uint256 _stake = challenge.stake * _ticketQuantity;
        uint256 fee = _computeJoinFee(_stake);
        _senderHasBalls(_stake + fee);
        tickets[msg.sender][_challengeId] = Ticket(
            _ticketQuantity,
            _userPrediction,
            false
        );
        challenge.totalParticipants += 1;
        challenge.totalTickets += _ticketQuantity;
        optionTickets[_challengeId][_userPrediction] += _ticketQuantity;
        accumulatedFee += fee;
        _deposit(_stake + fee);
        emit JoinChallengePool(
            _challengeId,
            msg.sender,
            fee,
            _ticketQuantity,
            _userPrediction,
            currentState
        );
    }

    function closeChallenge(
        uint256 _challengeId
    ) public validChallenge(_challengeId) {
        Challenge storage challenge = challengePools[_challengeId];
        PoolState currentState = _poolState(challenge);
        if (
            currentState != PoolState.mature && currentState != PoolState.stale
        ) {
            revert ActionNotAllowedForState(currentState);
        }
        if (currentState == PoolState.stale) {
            if (challenge.nextCloseTime > block.timestamp) {
                revert NextStalePoolRetryNotReached(challenge.staleRetries);
            }
            if (challenge.staleRetries >= maxStaleRetries) {
                challenge.state = PoolState.manual;
                emit ManualChallengePool(
                    _challengeId,
                    msg.sender,
                    challenge.state
                );
                return;
            }
        }
        bytes evaluation = _topicEvaluator(challenge.topicId).evaluateEvent(
            challenge.challengeEvent
        );
        if (evaluation == emptyBytes) {
            challenge.staleRetries += 1;
            challenge.state = PoolState.stale;
            challenge.nextCloseTime = block.timestamp + staleExtensionPeriod;
            emit StaleChallengePool(
                _challengeId,
                msg.sender,
                challenge.nextCloseTime,
                challenge.staleRetries,
                challenge.state
            );
            return;
        }
        challenge.result = evaluation;
        challenge.state = PoolState.closed;
        emit ClosedChallengePool(
            _challengeId,
            msg.sender,
            challenge.state,
            challenge.result
        );
    }

    function batchCloseChallenge(uint256[] memory _challengeIds) external {
        for (uint i = 0; i < _challengeIds.length; i++) {
            closeChallenge(_challengeIds[i]);
        }
    }

    function withdrawWinnings(
        uint256 _challengeId
    ) public validChallenge(_challengeId) {
        (uint256 totalWithdrawal, uint256 winShare) = checkWinnings(
            _challengeId
        );
        if (tickets[msg.sender][_challengeId].withdrawn) {
            revert PlayerWinningAlreadyWithdrawn();
        }
        tickets[msg.sender][_challengeId].withdrawn = true;
        _withdraw(totalWithdrawal);
        emit WinningsWithdrawn(
            msg.sender,
            _challengeId,
            winShare,
            totalWithdrawal
        );
    }

    function batchWithdrawWinnings(uint256[] memory _challengeIds) external {
        for (uint i = 0; i < _challengeIds.length; i++) {
            withdrawWinnings(_challengeIds[i]);
        }
    }

    function closeFromManual(
        uint256 _challengeId,
        bytes _manualPrediction
    ) external virtual;

    function cancelFromManual(uint256 _challengeId) external virtual;

    // ============= EXTERNAL VIEW =================

    function checkWinnings(
        uint256 _challengeId
    ) public view returns (uint256 totalWithdrawal, uint256 winShare) {
        Challenge storage challenge = challengePools[_challengeId];
        Ticket storage playerTicket = tickets[msg.sender][_challengeId];
        PoolState currentState = _poolState(challenge);
        if (
            currentState != PoolState.closed &&
            currentState != PoolState.cancelled
        ) {
            revert ActionNotAllowedForState(currentState);
        }
        if (playerTicket.quantity == 0) {
            revert PlayerNotInPool();
        }
        if (playerTicket.choice != challenge.result) {
            revert PlayerDidNotWinPool();
        }
        winShare = _computeWinnerShare(challenge, _challengeId);

        totalWithdrawal = challenge.stake + winShare;
    }

    function participantWinnings(
        uint256 _challengeId,
        address _participant
    ) external view returns (uint256 winShare) {
        Challenge storage challenge = challengePools[_challengeId];
        PoolState currentState = _poolState(challenge);
        if (
            currentState != PoolState.closed &&
            currentState != PoolState.cancelled
        ) {
            revert ActionNotAllowedForState(currentState);
        }
        if (tickets[_participant][_challengeId].choice == emptyBytes) {
            return 0;
        }

        if (tickets[_participant][_challengeId] != challenge.result) {
            return 0;
        }
        winShare = _computeWinnerShare(challenge);
    }

    function stakeAmountAndFee(uint256 _stake) public view returns (uint256) {
        return _stake + _computeJoinFee(_stake);
    }

    function joinAmountAndFee(uint256 _stake) public view returns (uint256) {
        return _stake + _computeJoinFee(_stake);
    }

    function createAmountAndFee(uint256 _stake) public view returns (uint256) {
        return _stake + _computeCreateFee(_stake);
    }

    function challengeDeadline(
        uint256 _challengeId
    ) external view validChallenge(_challengeId) returns (uint256) {
        return challengePools[_challengeId].challengeEvent.maturity;
    }

    function challengeState(
        uint256 _challengeId
    ) external view validChallenge(_challengeId) returns (PoolState) {
        return _poolState(challengePools[_challengeId]);
    }

    function getChallenge(
        uint256 _challengeId
    ) external view returns (Challenge memory) {
        return challengePools[_challengeId];
    }
}
