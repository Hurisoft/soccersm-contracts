// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface ITopicRegistry {
    enum TopicState {
        active,
        disabled
    }
    struct Topic {
        string title;
        string description;
        address maintainer;
        address evaluator;
        TopicState state;
    }
    event PoolTopic(uint indexed topicId);

    function createTopic(
        string memory title,
        string memory description,
        address maintainer,
        address evaluator
    ) external returns (uint);

    function disableTopic(uint topicId) external;

    function enableTopic(uint topicId) external;

    function getTopic(uint topicId) external view returns (Topic memory);
}
