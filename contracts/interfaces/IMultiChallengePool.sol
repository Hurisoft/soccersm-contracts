// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IMultiTopicRegistry.sol";
import "./IMultiEvaluator.sol";
import "../utils/Helpers.sol";

import "hardhat/console.sol";

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

    struct Poll {
        bytes pollParam;
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
        Poll poll;
    }

    struct Ticket {
        uint256 quantity;
        bytes choice;
        bool withdrawn;
    }

    struct OptionTicket {
        bool isOption;
        uint256 totalSupply;
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
        Poll poll
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
    error InvalidPollTopic();
    error InvalidPollParam();
    error InvalidPollMaturity(uint256 _timeDiff);
    error InvalidOptionsLength();
    error InvalidPollOption();

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

    modifier validPrediction(bytes memory _prediction) {
        if (compareBytes(_prediction, emptyBytes)) {
            revert InvalidPrediction();
        }
        _;
    }

    // ============= ADMIN =================

    function setFeeAddress(address _feeAddress) external virtual;

    function setMinMaturityPeriod(uint256 _minMaturity) external virtual;

    function setJoinPeriod(uint256 _joinPeriod) external virtual;

    function setCreatePoolFee(uint256 _createPoolFee) external virtual;

    function setJoinPoolFee(uint256 _joinPoolFee) external virtual;

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

    function withdrawFees() external virtual;

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
            .totalSupply;
        uint256 loosers = _challenge.totalTickets - winners;
        return Math.mulDiv(_challenge.stake, loosers, winners);
    }

    function _poolState(
        Challenge storage _challenge
    ) internal view returns (PoolState) {
        if (_challenge.state == PoolState.open) {
            if (block.timestamp >= _challenge.poll.maturity) {
                return PoolState.mature;
            }
            if (block.timestamp >= _challenge.poll.maturity) {
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
        bytes calldata _pollParam,
        uint256 _pollTopicId,
        uint256 _pollMaturity,
        bytes[] calldata _pollOptions,
        bytes calldata _userPrediction,
        uint256 _ticketQuantity,
        uint256 _poolStake
    ) external nonZero(_ticketQuantity) validStake(_poolStake) {
        if (_pollOptions.length > maxOptionsPerPool) {
            revert InvalidOptionsLength();
        }
        if (_pollOptions.length < 2) {
            revert InvalidOptionsLength();
        }
        if (_pollMaturity < (block.timestamp + minMaturityPeriod)) {
            revert InvalidPollMaturity(
                (block.timestamp + minMaturityPeriod) - _pollMaturity
            );
        }
        if (!_activeTopic(_pollTopicId)) {
            revert InvalidPollTopic();
        }
        uint256 stake = _ticketQuantity * _poolStake;
        uint256 fee = _computeCreateFee(stake);
        _senderHasBalls(stake + fee);
        uint256 challengeId = challengePools.length;
        Poll memory poll = Poll(
            _pollParam,
            _pollTopicId,
            _pollMaturity,
            _pollOptions
        );
        if (!_topicEvaluator(poll.topicId).validatePoll(poll)) {
            revert InvalidPollParam();
        }
        if (compareBytes(_userPrediction, emptyBytes)) {
            revert InvalidPrediction();
        }
        bool _userPredictionValid = false;
        for (uint256 i = 0; i < _pollOptions.length; i++) {
            if (compareBytes(emptyBytes, _pollOptions[i])) {
                revert InvalidPollOption();
            }
            if (
                compareBytes(_userPrediction, _pollOptions[i]) &&
                !_userPredictionValid
            ) {
                optionTickets[challengeId][_pollOptions[i]] = OptionTicket(
                    true,
                    _ticketQuantity
                );
                _userPredictionValid = true;
            } else {
                optionTickets[challengeId][_pollOptions[i]] = OptionTicket(
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
                _poolStake,
                block.timestamp,
                _pollMaturity,
                0,
                PoolState.open,
                emptyBytes,
                1,
                _ticketQuantity,
                poll
            )
        );
        emit NewChallengePool(
            challengeId,
            msg.sender,
            block.timestamp,
            _pollMaturity,
            _pollMaturity,
            0,
            PoolState.open,
            emptyBytes,
            _poolStake,
            fee,
            1,
            _ticketQuantity,
            poll
        );
    }

    function joinChallenge(
        uint256 _challengeId,
        bytes calldata _userPrediction,
        uint256 _ticketQuantity
    ) external validChallenge(_challengeId) nonZero(_ticketQuantity) {
        if (!optionTickets[_challengeId][_userPrediction].isOption) {
            revert InvalidPrediction();
        }
        if (tickets[msg.sender][_challengeId].quantity > 0) {
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
        optionTickets[_challengeId][_userPrediction]
            .totalSupply += _ticketQuantity;
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
        bytes memory evaluation = _topicEvaluator(challenge.poll.topicId)
            .evaluatePoll(challenge.poll);
        if (compareBytes(evaluation, emptyBytes)) {
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
            totalWithdrawal,
            winShare
        );
    }

    function batchWithdrawWinnings(uint256[] memory _challengeIds) external {
        for (uint i = 0; i < _challengeIds.length; i++) {
            withdrawWinnings(_challengeIds[i]);
        }
    }

    function closeFromManual(
        uint256 _challengeId,
        bytes calldata _manualPrediction
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

        if (optionTickets[_challengeId][challenge.result].totalSupply > 0) {
            if (!compareBytes(playerTicket.choice, challenge.result)) {
                revert PlayerDidNotWinPool();
            }
            winShare = _computeWinnerShare(challenge, _challengeId);
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
            compareBytes(tickets[_participant][_challengeId].choice, emptyBytes)
        ) {
            return 0;
        }

        if (
            !compareBytes(
                tickets[_participant][_challengeId].choice,
                challenge.result
            )
        ) {
            return 0;
        }
        winShare = _computeWinnerShare(challenge, _challengeId);
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
        return challengePools[_challengeId].poll.maturity;
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

    // NFT Support

    /// @dev Thrown when owner balance for id is insufficient.
    /// @param owner The address of the owner.
    /// @param id The id of the token.
    error InsufficientBalance(address owner, uint256 id);

    /// @dev Thrown when spender allowance for id is insufficient.
    /// @param spender The address of the spender.
    /// @param id The id of the token.
    error InsufficientPermission(address spender, uint256 id);

    error TicketWithdrawn(address owner, uint256 id);

    error IncompatibleTicketChoices(address from, address to, uint256 id);

    /// @notice The event emitted when a transfer occurs.
    /// @param sender The address of the sender.
    /// @param receiver The address of the receiver.
    /// @param id The id of the token.
    /// @param amount The amount of the token.
    event Transfer(
        address caller,
        address indexed sender,
        address indexed receiver,
        uint256 indexed id,
        uint256 amount
    );

    /// @notice The event emitted when an operator is set.
    /// @param owner The address of the owner.
    /// @param spender The address of the spender.
    /// @param approved The approval status.
    event OperatorSet(
        address indexed owner,
        address indexed spender,
        bool approved
    );

    /// @notice The event emitted when an approval occurs.
    /// @param owner The address of the owner.
    /// @param spender The address of the spender.
    /// @param id The id of the token.
    /// @param amount The amount of the token.
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 indexed id,
        uint256 amount
    );

    string public contractURI;

    /// @notice Spender allowance of an id.
    mapping(address owner => mapping(address spender => mapping(uint256 id => uint256 amount)))
        public allowance;

    /// @notice Checks if a spender is approved by an owner as an operator.
    mapping(address owner => mapping(address spender => bool))
        public isOperator;

    modifier ticketNotWithdrawn(address owner, uint256 id) {
        if (tickets[owner][id].withdrawn) {
            revert TicketWithdrawn(owner, id);
        }
        _;
    }

    /// balanceOf interfeace is represented with a public view function

    function balanceOf(
        address owner,
        uint256 id
    ) public view returns (uint256) {
        return tickets[owner][id].quantity;
    }

    /// totalSupply interfeace is represented with a public view function

    function totalSupply(
        uint256 id
    ) public view validChallenge(id) returns (uint256) {
        return challengePools[id].totalTickets;
    }

    function _transferTicket(
        address from,
        address to,
        uint256 id,
        uint256 amount
    ) internal ticketNotWithdrawn(from, id) ticketNotWithdrawn(to, id) {
        Ticket storage senderTicket = tickets[from][id];
        Ticket storage receiverTicket = tickets[to][id];
        if (senderTicket.quantity < amount) {
            revert InsufficientBalance(from, id);
        }
        if (
            receiverTicket.quantity > 0 &&
            !compareBytes(senderTicket.choice, receiverTicket.choice)
        ) {
            revert IncompatibleTicketChoices(from, to, id);
        }
        senderTicket.quantity -= amount;
        receiverTicket.quantity += amount;
        emit Transfer(msg.sender, from, to, id, amount);
    }

    /// @notice Transfers an amount of an id from the caller to a receiver.
    /// @param receiver The address of the receiver.
    /// @param id The id of the token.
    /// @param amount The amount of the token.
    function transfer(
        address receiver,
        uint256 id,
        uint256 amount
    ) public returns (bool) {
        _transferTicket(msg.sender, receiver, id, amount);
        return true;
    }

    /// @notice Transfers an amount of an id from a sender to a receiver.
    /// @param sender The address of the sender.
    /// @param receiver The address of the receiver.
    /// @param id The id of the token.
    /// @param amount The amount of the token.
    function transferFrom(
        address sender,
        address receiver,
        uint256 id,
        uint256 amount
    ) public returns (bool) {
        if (sender != msg.sender && !isOperator[sender][msg.sender]) {
            uint256 senderAllowance = allowance[sender][msg.sender][id];
            if (senderAllowance < amount)
                revert InsufficientPermission(msg.sender, id);
            if (senderAllowance != type(uint256).max) {
                allowance[sender][msg.sender][id] = senderAllowance - amount;
            }
        }
        _transferTicket(sender, receiver, id, amount);
        return true;
    }

    /// @notice Approves an amount of an id to a spender.
    /// @param spender The address of the spender.
    /// @param id The id of the token.
    /// @param amount The amount of the token.
    function approve(
        address spender,
        uint256 id,
        uint256 amount
    ) public returns (bool) {
        allowance[msg.sender][spender][id] = amount;
        emit Approval(msg.sender, spender, id, amount);
        return true;
    }

    /// @notice Sets or removes a spender as an operator for the caller.
    /// @param spender The address of the spender.
    /// @param approved The approval status.
    function setOperator(address spender, bool approved) public returns (bool) {
        isOperator[msg.sender][spender] = approved;
        emit OperatorSet(msg.sender, spender, approved);
        return true;
    }

    /// @notice Checks if a contract implements an interface.
    /// @param interfaceId The interface identifier, as specified in ERC-165.
    /// @return supported True if the contract implements `interfaceId`.
    function supportsInterface(
        bytes4 interfaceId
    ) public pure returns (bool supported) {
        return interfaceId == 0x0f632fb3 || interfaceId == 0x01ffc9a7;
    }

    function setContractURI(string memory _uri) external virtual;

    /// @notice The URI for each id.
    /// @return The URI of the token.
    function tokenURI(uint256) public pure returns (string memory) {
        return "<baseuri>/{id}";
    }
}
