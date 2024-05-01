// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/IChallengePool.sol";
import "./interfaces/ITopicRegistry.sol";
import "./interfaces/IEvaluator.sol";

contract Soccersm is IChallengePool, Ownable {
    using EnumerableSet for EnumerableSet.UintSet;
    address public immutable topicRegistry;
    uint private challengeIdCounter;
    mapping(uint => IChallengePool.Challenge) public challengePools;
    EnumerableSet.UintSet private openPools;

    address public feeAddress;
    uint public accumulatedFees;

    uint256 public minMaturity = 3 minutes;
    uint256 public joiningThreshold = 3;
    uint256 public participantsLimit = 9;
    uint256 public feePercent = 1000;

    modifier nonZeroValue() {
        require(
            msg.value > 0,
            "Invalid stake amount! Must be greater than zero."
        );
        _;
    }

    modifier validMaturity(uint256 _maturity) {
        require(
            _maturity >= block.timestamp + minMaturity,
            "Invalid Maturity date."
        );
        _;
    }

    modifier validStake(uint _challengeId) {
        require(
            msg.value >= challengePools[_challengeId].stake,
            "Invalid stake amount less than pool stake amount."
        );
        _;
    }

    modifier validChallenge(
        uint _topicId,
        string memory _params,
        int _proposal
    ) {
        ITopicRegistry.Topic memory topic = ITopicRegistry(topicRegistry)
            .getTopic(_topicId);
        require(
            IEvaluator(topic.evaluator).validateChallenge(_params, _proposal),
            "Invalid params or proposal."
        );
        _;
    }

    modifier validJoiningTime(uint _challengeId) {
        uint256 lockTime = challengePools[_challengeId].createdAt +
            ((challengePools[_challengeId].maturity -
                challengePools[_challengeId].createdAt) / joiningThreshold);
        require(
            lockTime > block.timestamp,
            "Joining Time Exceeded, Pool Locked."
        );
        _;
    }

    modifier validParticipantLimit(uint _challengeId) {
        require(
            challengePools[_challengeId].participants.length <
                participantsLimit,
            "Participants limits exceeded."
        );
        _;
    }

    modifier validTopic(uint _topicId) {
        ITopicRegistry.Topic memory topic = ITopicRegistry(topicRegistry)
            .getTopic(_topicId);
        require(
            topic.state == ITopicRegistry.TopicState.active,
            "Inactive topic."
        );
        _;
    }

    constructor(address _topicRegistry) Ownable(msg.sender) {
        topicRegistry = _topicRegistry;
    }

    function setFeeAddress(address _feeAddress) public onlyOwner {
        feeAddress = _feeAddress;
    }

    function setMinMaturity(uint256 _minMaturity) public onlyOwner {
        minMaturity = _minMaturity;
    }

    function setJoiningThreshold(uint256 _joiningThreshold) public onlyOwner {
        joiningThreshold = _joiningThreshold;
    }

    function setParticipantsLimit(uint256 _participantsLimit) public onlyOwner {
        participantsLimit = _participantsLimit;
    }

    function setFeePercent(uint256 _feePercent) public onlyOwner {
        feePercent = _feePercent;
    }

    function withdrawFees() public {
        require(accumulatedFees > 0, "Insufficient Transfer Amount.");
        uint feeAmount = accumulatedFees;
        accumulatedFees = 0;
        payable(feeAddress).transfer(feeAmount);
    }

    function createChallenge(
        uint _topicId,
        uint256 _maturity,
        string memory _params,
        int _proposal
    )
        public
        payable
        nonZeroValue
        validTopic(_topicId)
        validMaturity(_maturity)
        validChallenge(_topicId, _params, _proposal)
        returns (uint)
    {
        IChallengePool.Participant memory _participant = IChallengePool
            .Participant(msg.sender, _proposal);
        IChallengePool.Participant[]
            memory _participants = new IChallengePool.Participant[](1);
        _participants[0] = _participant;
        address[] memory _winners;
        address[] memory _losers;
        int _results;
        challengePools[challengeIdCounter] = IChallengePool.Challenge({
            topicId: _topicId,
            stake: msg.value,
            createdAt: block.timestamp,
            maturity: _maturity,
            state: IChallengePool.PoolState.open,
            participants: _participants,
            winners: _winners,
            losers: _losers,
            results: _results,
            params: _params
        });
        EnumerableSet.add(openPools, challengeIdCounter);
        emit IChallengePool.PoolChallenge(challengeIdCounter);
        challengeIdCounter++;
        return challengeIdCounter;
    }

    function joinChallenge(
        uint _challengeId,
        int _proposal
    )
        public
        payable
        nonZeroValue
        validChallenge(
            challengePools[_challengeId].topicId,
            challengePools[_challengeId].params,
            _proposal
        )
        validJoiningTime(_challengeId)
        validParticipantLimit(_challengeId)
        validStake(_challengeId)
    {
        IChallengePool.Participant memory _participant = IChallengePool
            .Participant(msg.sender, _proposal);
        challengePools[_challengeId].participants.push(_participant);
    }

    function _closeChallenge(uint _challengeId) internal {
        IChallengePool.Challenge storage challenge = challengePools[
            _challengeId
        ];
        require(
            challenge.maturity < block.timestamp,
            "Pool is not yet matured."
        );
        require(
            challenge.state == IChallengePool.PoolState.open,
            "Pool is not open."
        );
        uint256 initPoolBalance = address(this).balance;
        uint256 totalChallengeAmount = challenge.stake *
            challenge.participants.length;
        ITopicRegistry.Topic memory topic = getTopic(_challengeId);
        try IEvaluator(topic.evaluator).evaluateChallenge(challenge) returns (
            int results,
            address[] memory losers,
            address[] memory winners
        ) {
            challenge.results = results;
            challenge.losers = losers;
            challenge.winners = winners;
            challenge.state = IChallengePool.PoolState.closed;
            if (winners.length > 0) {
                for (uint256 i = 0; i < winners.length; i++) {
                    payable(winners[i]).transfer(challenge.stake);
                }
            }
            if (losers.length > 0 && winners.length > 0) {
                uint reward = (losers.length * challenge.stake) /
                    winners.length;
                for (uint256 i = 0; i < winners.length; i++) {
                    payable(winners[i]).transfer(reward);
                }
            }
        } catch Error(string memory /*reason*/) {
            challenge.state = IChallengePool.PoolState.stale;
            for (uint256 i = 0; i < challenge.participants.length; i++) {
                payable(challenge.participants[i].participant).transfer(
                    challenge.stake
                );
            }
        }
        uint256 endPoolBalance = address(this).balance;
        require(
            endPoolBalance >= initPoolBalance - totalChallengeAmount,
            "Challenge Payout Invariant Failed."
        );
        EnumerableSet.remove(openPools, _challengeId);
        emit IChallengePool.PoolChallenge(_challengeId);
    }

    function batchCloseChallenge(uint[] memory _challengeIds) external {
        for (uint256 i = 0; i < _challengeIds.length; i++) {
            _closeChallenge(_challengeIds[i]);
        }
    }

    function getTopic(
        uint challengeId
    ) public view returns (ITopicRegistry.Topic memory) {
        return
            ITopicRegistry(topicRegistry).getTopic(
                challengePools[challengeId].topicId
            );
    }

    function getChallenge(
        uint _challengeId
    ) public view returns (Challenge memory) {
        return challengePools[_challengeId];
    }

    function getTopicChallenge(
        uint _challengeId
    )
        public
        view
        returns (ITopicRegistry.Topic memory topic, Challenge memory challenge)
    {
        topic = getTopic(_challengeId);
        challenge = getChallenge(_challengeId);
    }

    function getOpenPools() public view returns (uint[] memory) {
        return EnumerableSet.values(openPools);
    }

    function getMaturePools() public view returns (uint[] memory maturedPools) {
        uint[] memory pools = getOpenPools();
        uint size = 0;
        for (uint256 i = 0; i < pools.length; i++) {
            if (challengePools[pools[i]].maturity <= block.timestamp) {
                size++;
            }
        }
        maturedPools = new uint[](size);
        uint m = 0;
        for (uint256 i = 0; i < pools.length; i++) {
            if (challengePools[pools[i]].maturity <= block.timestamp) {
                maturedPools[m++] = pools[i];
            }
        }
    }

    function stakeFee(uint _value) public view returns (uint stake, uint fee) {
        uint feePercentDenom = feePercent + 1;
        stake = (feePercent / feePercentDenom) * (_value);
        fee = _value - stake;
    }
}
