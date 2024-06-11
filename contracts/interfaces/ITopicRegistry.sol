// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "./IEvaluator.sol";

interface ITopicRegistry {
    enum TopicState {
        active,
        disabled
    }
    struct Topic {
        string title;
        string description;
        address evaluator;
        TopicState state;
    }

    event NewTopic(
        uint256 indexed topicId,
        address indexed evaluator,
        string title,
        string description,
        TopicState state
    );

    event DisableTopic(uint256 indexed topicId, TopicState state);
    event EnableTopic(uint256 indexed topicId, TopicState state);

    error InvalidTopic();    
    error EvaluatorIsEventFeed();

    function createTopic(
        string memory _title,
        string memory _description,
        address _evaluator
    ) external returns (uint256);

    function disableTopic(uint256 topicId) external;

    function enableTopic(uint256 topicId) external;

    function getTopic(uint256 topicId) external view returns (Topic memory);

    function topicEvaluator(uint256 topicId) external view returns(IEvaluator);

    function activeTopic(uint256 topicId) external view returns(bool);
}
