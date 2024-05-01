// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./interfaces/ITopicRegistry.sol";

contract TopicRegistry is ITopicRegistry {
    uint private topicIdCounter;
    mapping(uint => ITopicRegistry.Topic) public topics;

    modifier onlyMaintainer(address _maintainer) {
        require(
            msg.sender == _maintainer,
            string.concat(
                "Unauthorized, Only Maintainer Can Perform This Action."
            )
        );
        _;
    }

    function createTopic(
        string memory _title,
        string memory _description,
        address _maintainer,
        address _evaluator
    ) public returns (uint) {
        require(bytes(_title).length > 0, "Empty title.");
        require(bytes(_description).length > 0, "Empty description.");
        topics[topicIdCounter] = ITopicRegistry.Topic({
            title: _title,
            description: _description,
            maintainer: _maintainer,
            evaluator: _evaluator,
            state: ITopicRegistry.TopicState.active
        });
        emit ITopicRegistry.PoolTopic(topicIdCounter);
        topicIdCounter++;
        return topicIdCounter;
    }

    function disableTopic(uint topicId) public onlyMaintainer(topics[topicId].maintainer) {
        topics[topicId].state = ITopicRegistry.TopicState.disabled;
        emit ITopicRegistry.PoolTopic(topicId);
    }

    function enableTopic(uint topicId) public onlyMaintainer(topics[topicId].maintainer) {
        topics[topicId].state = ITopicRegistry.TopicState.active;
        emit ITopicRegistry.PoolTopic(topicId);
    }

    function getTopic(uint topicId) external view returns (Topic memory) {
        return topics[topicId];
    }
}
