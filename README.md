# Soccersm Challenge Pools

A wierd diagram of how the smart contract is all linked together.

![Architecture](https://github.com/Hurisoft/soccersm-contracts/blob/main/images/blockxchallenge-contracts.png)

## Initial Deployment & Setup Steps

1. Deploy TopicRegistry to get `REGISTRY_CONTRACT`

2. Deploy ChallengePool to get `POOL_CONTRACT`

3. Deploy PoolManger to get `POOL_MANAGER_CONTRACT`

4. Deploy Evaluators
  - SymbolFeed to get `SYMBOL_FEED_CONTRACT`
  - AssetPrice to get `ASSET_PRICE_EVALUATOR`

5. Create Default Topics


### Deployments

### Morph
#### Topic Registry
https://explorer-testnet.morphl2.io/address/0x31556A6Fd2D2De4775B4df43c877cF7178499b49
#### Soccersm Challenge Pool

#### Pool Manager

#### Symbol Feed USD

#### Asset Price

#### Chainlink Keeper

