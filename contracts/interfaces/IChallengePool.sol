// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "./ITopicRegistry.sol";
import "./IEvaluator.sol";
import "../utils/helpers.sol";

abstract contract IChallengePool is Helpers {
    enum PoolState {
        open,
        closed,
        stale,
        manual,
        cancelled,
        locked,
        mature
    }
    enum Prediction {
        zero,
        yes,
        no
    }

    struct ChallengeEvent {
        bytes eventParam;
        uint256 topicId;
        uint256 maturity;
        Prediction result;
    }

    struct Challenge {
        uint256 stake;
        uint256 createdAt;
        uint256 maturity; // when last event will mature
        uint256 maxDeadline; // when first event will mature
        uint256 nextCloseTime; // next retry time after stale
        uint256 staleRetries;
        PoolState state;
        Prediction result;
        uint256 totalParticipants;
        uint256 yesParticipants;
        uint256 noParticipants;
        ChallengeEvent[] events;
    }

    // ============ protocol variables =============
    uint256 public poolFee = 10; // in basis point
    uint256 public joinPeriod = 9000; // in basis point
    uint256 public maxMaturityPeriod = 12 weeks;
    uint256 public maxPlayersPerPool = 100;
    uint256 public minStakeAmount = 100 * 1e18;
    uint256 public maxEventsPerChallenge = 10;
    uint256 public minMaturityPeriod = 1 hours;
    uint256 public maxStaleRetries = 3;
    uint256 public staleExtensionPeriod = 1 hours;
    address public feeAddress;
    ITopicRegistry public topicRegistry;
    IERC20 public trophies;
    IERC20 public balls;

    // ============ ================= ==============
    mapping(address => mapping(uint => Prediction))
        internal userChallengePrediction;
    mapping(address => mapping(uint => bool)) internal userChallengeWithdrawal;
    Challenge[] internal challengePools;

    // ============ ================= ==============
    event StakeTokenAdded(address indexed token);
    event NewChallengePool(
        uint256 indexed challengeId,
        address indexed creator,
        uint256 createdAt,
        uint256 maturity,
        Prediction result,
        uint256 stake,
        uint256 fee,
        uint256 yesParticipants,
        uint256 noParticipants,
        ChallengeEvent[] events
    );
    event ClosedChallengePool(
        uint256 indexed challengeId,
        address indexed closer,
        PoolState state
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
        uint256 stake,
        uint256 fee,
        uint256 yesParticipants,
        uint256 noParticipants,
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
    error NextStalePoolRetryNotReached();
    error UserLacksEnoughBalls();
    error InvalidLengthForEvent(
        uint256 _params,
        uint256 _maturity,
        uint256 _topics
    );
    error InvalidEventTopic();
    error InvalidEventParam();
    error InvalidEventMaturity();
    error InvalidEventsLength();

    modifier validChallenge(uint256 _challengeId) {
        if (_challengeId >= challengePools.length) {
            revert InvalidChallenge();
        }
        _;
    }

    modifier validPrediction(Prediction _prediction) {
        if (_prediction == Prediction.zero) {
            revert InvalidPrediction();
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

    // ============= ADMIN =================

    function setFeeAddress(address _feeAddress) external virtual;

    function setMinMaturityPeriod(uint256 _minMaturity) external virtual;

    function setJoinPeriod(uint256 _joinPeriod) external virtual;

    function setPoolFee(uint256 _poolFee) external virtual;

    function setMaxEventsPerChallenge(
        uint256 _maxChallengeEvents
    ) external virtual;

    function setMinStakeAmount(uint256 _minStakeAmount) external virtual;

    function setMaxPlayersPerPool(uint256 _maxPlayers) external virtual;

    function setMaxMaturityPeriod(uint256 _maxMaturity) external virtual;

    function setMaxStaleRetries(uint256 _maxStaleRetries) external virtual;

    function setTopicRegistry(address _topicRegistry) external virtual;

    function setTrophiesAddress(address _trophiesAddress) external virtual;

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

    function _computeFee(uint256 _stake) internal view returns (uint256) {
        return basisPoint(_stake, poolFee);
    }

    function _computeWinnerShare(
        Challenge storage _challenge
    ) internal view returns (uint256) {
        uint256 loosers;
        uint256 winners;
        if (_challenge.result == Prediction.yes) {
            winners = _challenge.yesParticipants;
            loosers = _challenge.noParticipants;
        } else if (_challenge.result == Prediction.no) {
            winners = _challenge.noParticipants;
            loosers = _challenge.yesParticipants;
        }
        return Math.mulDiv(_challenge.stake, loosers, winners);
    }

    function _poolState(
        Challenge storage _challenge
    ) internal view returns (PoolState) {
        if (_challenge.state == PoolState.open) {
            if (block.timestamp >= _challenge.maturity) {
                return PoolState.mature;
            }
            if (
                block.timestamp >=
                _computeDeadline(_challenge.createdAt, _challenge.maxDeadline)
            ) {
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
    ) internal view returns (IEvaluator) {
        return ITopicRegistry(topicRegistry).topicEvaluator(_topicId);
    }

    function _activeTopic(uint256 _topicId) internal view returns (bool) {
        return ITopicRegistry(topicRegistry).activeTopic(_topicId);
    }

    function _senderHasBalls(uint256 _amount) internal view {
        if (IERC20(balls).balanceOf(msg.sender) < _amount) {
            revert UserLacksEnoughBalls();
        }
    }

    // ============= EXTERNAL STATE =================

    function createChallenge(
        bytes[] calldata _eventsParams,
        uint256[] calldata _eventsMaturity,
        uint256[] calldata _eventsTopics,
        Prediction _userPrediction,
        uint256 _stake
    ) external validPrediction(_userPrediction) {
        if (_eventsParams.length > maxEventsPerChallenge) {
            revert InvalidEventsLength();
        }
        if (
            _eventsParams.length != _eventsMaturity.length ||
            _eventsParams.length != _eventsTopics.length ||
            _eventsMaturity.length != _eventsTopics.length
        ) {
            revert InvalidLengthForEvent(
                _eventsParams.length,
                _eventsMaturity.length,
                _eventsTopics.length
            );
        }
        uint256 fee = _computeFee(_stake);
        _senderHasBalls(_stake + fee);
        uint256 minMatureDate = 0;
        uint256 maxMatureDate = 0;
        ChallengeEvent[] memory events = new ChallengeEvent[](
            _eventsParams.length
        );
        uint256 challengeId = challengePools.length;
        for (uint256 i = 0; i < _eventsParams.length; i++) {
            ChallengeEvent memory challengeEvent = ChallengeEvent(
                _eventsParams[i],
                _eventsTopics[i],
                _eventsMaturity[i],
                Prediction.zero
            );
            if (!_activeTopic(challengeEvent.topicId)) {
                revert InvalidEventTopic();
            }
            if (
                !_topicEvaluator(challengeEvent.topicId).validateEvent(
                    challengeEvent
                )
            ) {
                revert InvalidEventParam();
            }
            if (
                challengeEvent.maturity < (block.timestamp + minMaturityPeriod)
            ) {
                revert InvalidEventMaturity();
            }

            if (minMatureDate == 0) {
                minMatureDate = challengeEvent.maturity;
            } else {
                if (challengeEvent.maturity < minMatureDate) {
                    minMatureDate = challengeEvent.maturity;
                }
            }

            if (maxMatureDate == 0) {
                maxMatureDate = challengeEvent.maturity;
            } else {
                if (challengeEvent.maturity > maxMatureDate) {
                    maxMatureDate = challengeEvent.maturity;
                }
            }
            events[i] = challengeEvent;
        }
        _deposit(_stake + fee);
        uint256 yesParticipants = _userPrediction == Prediction.yes ? 1 : 0;
        uint256 noParticipants = _userPrediction == Prediction.no ? 1 : 0;
        challengePools.push(
            Challenge(
                _stake,
                block.timestamp,
                maxMatureDate,
                minMatureDate,
                maxMatureDate,
                0,
                PoolState.open,
                Prediction.zero,
                1,
                yesParticipants,
                noParticipants,
                events
            )
        );
        emit NewChallengePool(
            challengeId,
            msg.sender,
            block.timestamp,
            minMatureDate,
            Prediction.zero,
            _stake,
            fee,
            yesParticipants,
            noParticipants,
            events
        );
    }

    function joinChallenge(
        uint256 _challengeId,
        Prediction _userPrediction,
        uint256 _stake
    ) external validChallenge(_challengeId) validPrediction(_userPrediction) {
        uint256 fee = _computeFee(_stake);
        _senderHasBalls(_stake + fee);
        Challenge storage challenge = challengePools[_challengeId];
        PoolState currentState = _poolState(challenge);
        if (currentState != PoolState.open) {
            revert ActionNotAllowedForState(currentState);
        }
        if (challenge.totalParticipants >= maxPlayersPerPool) {
            revert PlayerLimitReached();
        }
        if (
            userChallengePrediction[msg.sender][_challengeId] != Prediction.zero
        ) {
            revert PlayerAlreadyInPool();
        }
        userChallengePrediction[msg.sender][_challengeId] = _userPrediction;
        challenge.totalParticipants += 1;
        if (_userPrediction == Prediction.yes) {
            challenge.yesParticipants += 1;
        } else {
            challenge.noParticipants += 1;
        }
        _deposit(_stake + fee);
        emit JoinChallengePool(
            _challengeId,
            msg.sender,
            _stake,
            fee,
            challenge.yesParticipants,
            challenge.noParticipants,
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
            if (challenge.nextCloseTime < block.timestamp) {
                revert NextStalePoolRetryNotReached();
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
        bool result = true;
        for (uint256 i = 0; i < challenge.events.length; i++) {
            ChallengeEvent storage challengeEvent = challenge.events[i];
            if (challengeEvent.result != Prediction.zero) {
                continue;
            }
            Prediction evaluation = _topicEvaluator(challengeEvent.topicId)
                .evaluateEvent(challengeEvent);
            if (evaluation == Prediction.zero) {
                challenge.staleRetries += 1;
                challenge.state = PoolState.stale;
                challenge.nextCloseTime =
                    block.timestamp +
                    staleExtensionPeriod;
                emit StaleChallengePool(
                    _challengeId,
                    msg.sender,
                    challenge.nextCloseTime,
                    challenge.staleRetries,
                    challenge.state
                );
                return;
            } else if (evaluation == Prediction.yes) {
                result = result && true;
                challengeEvent.result = Prediction.yes;
            } else {
                result = result && false;
                challengeEvent.result = Prediction.no;
            }
        }
        challenge.result = result ? Prediction.yes : Prediction.no;
        challenge.state = PoolState.closed;
        emit ClosedChallengePool(_challengeId, msg.sender, challenge.state);
    }

    function batchCloseChallenge(uint256[] memory _challengeIds) external {
        for (uint i = 0; i < _challengeIds.length; i++) {
            closeChallenge(_challengeIds[i]);
        }
    }

    function withdrawWinnings(uint256 _challengeId) public {
        (uint256 totalWithdrawal, uint256 winShare) = checkWinnings(
            _challengeId
        );
        if (userChallengeWithdrawal[msg.sender][_challengeId]) {
            revert PlayerWinningAlreadyWithdrawn();
        }
        userChallengeWithdrawal[msg.sender][_challengeId] = true;
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
        Prediction _manualPrediction
    ) external virtual;

    function cancelFromManual(uint256 _challengeId) external virtual;

    // ============= EXTERNAL VIEW =================

    function checkWinnings(
        uint256 _challengeId
    ) public view returns (uint256 totalWithdrawal, uint256 winShare) {
        Challenge storage challenge = challengePools[_challengeId];
        PoolState currentState = _poolState(challenge);
        if (
            currentState != PoolState.closed &&
            currentState != PoolState.cancelled
        ) {
            revert ActionNotAllowedForState(currentState);
        }
        if (
            userChallengePrediction[msg.sender][_challengeId] == Prediction.zero
        ) {
            revert PlayerNotInPool();
        }
        if (
            challenge.state != PoolState.cancelled &&
            challenge.yesParticipants != challenge.totalParticipants &&
            challenge.noParticipants != challenge.totalParticipants
        ) {
            if (
                userChallengePrediction[msg.sender][_challengeId] !=
                challenge.result
            ) {
                revert PlayerDidNotWinPool();
            }
            winShare = _computeWinnerShare(challenge);
        }
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
        if (
            userChallengePrediction[_participant][_challengeId] ==
            Prediction.zero
        ) {
            return 0;
        }
        if (
            challenge.state != PoolState.cancelled &&
            challenge.yesParticipants != challenge.totalParticipants &&
            challenge.noParticipants != challenge.totalParticipants
        ) {
            if (
                userChallengePrediction[_participant][_challengeId] !=
                challenge.result
            ) {
                return 0;
            }
            winShare = _computeWinnerShare(challenge);
        }
    }

    function stakeAmountAndFee(
        uint256 _stake
    ) public view returns (uint256, uint256) {
        return (_stake, _computeFee(_stake));
    }

    function challengeDeadline(
        uint256 _challengeId
    ) external view validChallenge(_challengeId) returns (uint256) {
        Challenge storage challenge = challengePools[_challengeId];
        return _computeDeadline(challenge.createdAt, challenge.maxDeadline);
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
