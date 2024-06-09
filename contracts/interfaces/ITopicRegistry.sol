// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

interface ITopicRegistry {
    enum TopicState {
        active,
        disabled
    }
    struct Topic {
        string title;
        string description;
        address evaluator;
        address eventFeed;
        TopicState state;
    }

    event NewTopic(
        uint indexed topicId,
        address indexed evaluator,
        address indexed eventFeed,
        string title,
        string description,
        TopicState state
    );

    event DisableTopic(uint indexed topicId, TopicState state);
    event EnableTopic(uint indexed topicId, TopicState state);

    error ZeroAddress();
    error InvalidTopic();
    error EmptyString();
    error EvaluatorIsEventFeed();

    function createTopic(
        string memory _title,
        string memory _description,
        address _evaluator,
        address _eventFeed
    ) external returns (uint);

    function disableTopic(uint topicId) external;

    function enableTopic(uint topicId) external;

    function getTopic(uint topicId) external view returns (Topic memory);
}
