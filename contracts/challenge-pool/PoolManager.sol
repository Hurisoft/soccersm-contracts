// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IPoolManager.sol";
import "../interfaces/IChallengePool.sol";

contract PoolManager is IPoolManager, Ownable {
    address public challengePool;

    constructor(address _challengePool) Ownable(msg.sender) {
        challengePool = _challengePool;
    }

    function setChallengePool(address _challengePool) public onlyOwner {
        challengePool = _challengePool;
    }

    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        uint[] memory maturedPools = IChallengePool(challengePool)
            .getMaturePools();
        performData = abi.encode(maturedPools);
        upkeepNeeded = maturedPools.length > 0;
    }

    function performUpkeep(bytes calldata performData) external override {
        uint[] memory maturedPools = abi.decode(performData, (uint[]));
        IChallengePool(challengePool).batchCloseChallenge(maturedPools);
    }
}
