// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../interfaces/IMultiTopicDataProvider.sol";

import "../utils/DataProviderAccess.sol";

contract MultiFootballScoreProvider is
    IMultiTopicDataProvider,
    DataProviderAccess
{
    struct MatchScore {
        uint256 matchId;
        uint256 homeScore;
        uint256 awayScore;
        bool exists;
    }
    mapping(uint256 => MatchScore) private _matchScores;
    constructor() Ownable(msg.sender) {}

    error InvalidMatchId(uint256 _matchId);
    error ZeroMatchIdNotAllowed();
    error DataAlreadyProvided();

    event MultiFootballScoreRequested(
        address indexed _reader,
        uint256 _matchId
    );
    event MultiFootballScoreProvided(
        address indexed _provider,
        uint256 _matchId,
        uint256 _homeScore,
        uint256 _awayScore
    );

    function _matchExists(uint256 _matchId) internal view returns (bool) {
        return _matchScores[_matchId].exists;
    }

    function requestData(
        bytes calldata _params
    ) external override onlyReader returns (bool) {
        uint256 matchId = abi.decode(_params, (uint256));
        if (matchId == 0) {
            revert ZeroMatchIdNotAllowed();
        }
        emit MultiFootballScoreRequested(msg.sender, matchId);
        return true;
    }

    function provideData(
        bytes calldata _params
    ) external override onlyProvider {
        (uint256 matchId, uint256 homeScore, uint256 awayScore) = abi.decode(
            _params,
            (uint256, uint256, uint256)
        );
        if (matchId == 0) {
            revert ZeroMatchIdNotAllowed();
        }
        if (_matchExists(matchId)) {
            revert DataAlreadyProvided();
        }
        _matchScores[matchId] = MatchScore(matchId, homeScore, awayScore, true);
        emit MultiFootballScoreProvided(
            msg.sender,
            matchId,
            homeScore,
            awayScore
        );
    }

    function getData(
        bytes calldata _params
    ) external view override returns (bytes memory _data) {
        uint256 matchId = abi.decode(_params, (uint256));
        if (!_matchExists(matchId)) {
            revert InvalidMatchId(matchId);
        }
        return
            abi.encode(
                _matchScores[matchId].homeScore,
                _matchScores[matchId].awayScore
            );
    }

    function hasData(
        bytes calldata _params
    ) external view override returns (bool) {
        uint256 matchId = abi.decode(_params, (uint256));
        return (_matchExists(matchId));
    }

    function hasOptions(
        bytes calldata  _params
    ) external pure override returns (bool) {
        bytes[] memory options = abi.decode(_params, (bytes[]));
        return options.length > 0;
    }
}
