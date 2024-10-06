// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IMultiTopicRegistry.sol";
import "../utils/Helpers.sol";
import "../interfaces/IMultiEvaluator.sol";

contract MultiTopicRegistry is Ownable, IMultiTopicRegistry, Helpers {
    constructor() Ownable(msg.sender) {}

    Topic[] private registry;

    modifier validTopic(uint256 topicId) {
        if (topicId >= registry.length) {
            revert InvalidTopic();
        }
        _;
    }

    function createTopic(
        string memory _title,
        string memory _description,
        address _evaluator
    )
        external
        onlyOwner
        positiveAddress(_evaluator)
        nonEmptyString(_title)
        nonEmptyString(_description)
        returns (uint)
    {
        registry.push(
            Topic({
                title: _title,
                description: _description,
                evaluator: _evaluator,
                state: TopicState.active
            })
        );
        emit NewTopic(
            registry.length,
            _evaluator,
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

    function getTopic(
        uint topicId
    ) external view validTopic(topicId) returns (Topic memory) {
        return registry[topicId];
    }

    function topicEvaluator(
        uint256 topicId
    ) external view returns (IMultiEvaluator) {
        return IMultiEvaluator(registry[topicId].evaluator);
    }

    function activeTopic(uint256 topicId) external view returns (bool) {
        if (topicId >= registry.length) {
            return false;
        }
        return registry[topicId].state == TopicState.active;
    }
}
