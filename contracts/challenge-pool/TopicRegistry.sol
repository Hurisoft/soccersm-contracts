// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/ITopicRegistry.sol";

contract TopicRegistry is Ownable, ITopicRegistry {
    constructor() Ownable(msg.sender) {}

    Topic[] private registry;

    modifier validTopic(uint256 topicId) {
        if (topicId >= registry.length) {
            revert InvalidTopic();
        }
        _;
    }

    modifier positiveAddress(address addr) {
        if (address(0) == addr) {
            revert ZeroAddress();
        }
        _;
    }

    modifier nonEmptyString(string memory str) {
        if (bytes(str).length == 0) {
            revert EmptyString();
        }
        _;
    }

    function createTopic(
        string memory _title,
        string memory _description,
        address _evaluator,
        address _eventFeed
    )
        external
        onlyOwner
        positiveAddress(_evaluator)
        positiveAddress(_eventFeed)
        nonEmptyString(_title)
        nonEmptyString(_description)
        returns (uint)
    {
        if (_evaluator == _eventFeed) {
            revert EvaluatorIsEventFeed();
        }
        registry.push(
            Topic({
                title: _title,
                description: _description,
                evaluator: _evaluator,
                eventFeed: _eventFeed,
                state: TopicState.active
            })
        );
        emit NewTopic(
            registry.length,
            _evaluator,
            _eventFeed,
            _title,
            _description,
            TopicState.active
        );
        return registry.length;
    }

    function disableTopic(uint topicId) external onlyOwner validTopic(topicId) {
        registry[topicId].state = TopicState.disabled;
        emit DisableTopic(topicId, TopicState.disabled);
    }

    function enableTopic(uint topicId) external onlyOwner validTopic(topicId) {
        registry[topicId].state = TopicState.active;
        emit EnableTopic(topicId, TopicState.disabled);
    }

    function getTopic(uint topicId) external view validTopic(topicId) returns (Topic memory) {
        return registry[topicId];
    }
}
