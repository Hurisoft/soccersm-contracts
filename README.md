# Soccersm Challenge Pools

[Specification](./specification.md)

## Initial Deployment & Setup Steps

1. Deploy TopicRegistry to get `TOPIC_REGISTRY`

2. Deploy erc20 tokens or use existing ones

- Balls `BALLS`
- Trophies `TROPHIES`

3. Deploy ChallengePool to get `CHALLENGE_POOL`

4. Deploy Providers

- FootballScoreProvider `FOOTBALL_SCORE_PROVIDER`
- AssetPriceProvider `ASSET_PRICE_PROVIDER`

5. Deploy Evaluators

- FootballOutcomeEvaluator `FOOTBALL_OUTCOME_EVALUATOR`
- FootballOverUnderEvaluator `FOOTBALL_OVER_UNDER_EVALUATOR`
- FootBallCorrectScoreEvaluator `FOOTBALL_CORRECT_SCORE_EVALUATOR`
- AssetPriceBoundedEvaluator `ASSET_PRICE_BOUNDED_EVALUATOR`
- AssetPriceTargetEvaluator `ASSET_PRICE_TARGET_EVALUATOR`

6. Create Topics

- Football Outcome
- Football Over/Under
- Football Correct Score
- Asset Price Bounded
- Asset Price Target

## Deployments

### Morph Holesky

#### Topic Registry

Deploy - `npx hardhat run scripts/deploy_topic_registry.ts --network morphTestnet`
Verify - `npx hardhat verify [TOPIC_REGISTRY] --network morphTestnet`
Url - https://explorer-holesky.morphl2.io/address/0x8BA0d448FAD5469D0BE9E7aF3c2b7be0d689db47

#### ERC20 Tokens

##### Balls

Deploy - `npx hardhat run scripts/deploy_test_balls.ts --network morphTestnet`
Verify - `npx hardhat verify [BALLS] --network morphTestnet --contract contracts/test/TestBalls.sol:TestBalls`
Url - https://explorer-holesky.morphl2.io/address/0x6656fB94F441B3713BC61E76e1a890E01C1DE433

##### Trophies

Deploy - `npx hardhat run scripts/deploy_test_trophies.ts --network morphTestnet`
Verify - `npx hardhat verify [TROPHIES] --network morphTestnet --contract contracts/test/TestTrophies.sol:TestTrophies`
Url - https://explorer-holesky.morphl2.io/address/0x3CB9BAf9b481c38940aeb1EBfc0Dc25B9707A39b

#### Challenge Pool

Deploy - `npx hardhat run scripts/deploy_test_challenge_pool.ts --network morphTestnet`
Verify - `npx hardhat verify --network morphTestnet --constructor-args contract-args/challenge_pool.ts [CHALLENGE_POOL]`
Url - https://explorer-holesky.morphl2.io/address/0xeA9316E285AdAb8d931c9031720a525E4d1a2097

#### Deploy Providers

##### Asset Price Provider
Deploy - `npx hardhat run scripts/deploy_asset_price_provider.ts --network morphTestnet`
Verify - `npx hardhat verify [ASSET_PRICE_PROVIDER] --network morphTestnet`
Url - https://explorer-holesky.morphl2.io/address/0x87a0Ab77f3F4A4E525EBA0CdFac8dA64E637d0Fe

##### Football Score Provider
Deploy - `npx hardhat run scripts/deploy_football_score_provider.ts --network morphTestnet`
Verify - `npx hardhat verify [FOOTBALL_SCORE_PROVIDER] --network morphTestnet`
Url - https://explorer-holesky.morphl2.io/address/0x165a2B4F2e9C6c85D545c34aE3f00D1A2A5877eA

#### Deploy Evaluators

##### Football Outcome Evaluator
Deploy - `npx hardhat run scripts/deploy_football_outcome_evaluator.ts --network morphTestnet`
Verify - `npx hardhat verify [FOOTBALL_OUTCOME_EVALUATOR] [FOOTBALL_SCORE_PROVIDER] --network morphTestnet`
Url - https://explorer-holesky.morphl2.io/address/0xA0ae218688261800C9cfdE604c31520f54BaB494

##### Football Over Under Evaluator
Deploy - `npx hardhat run scripts/deploy_football_over_under_evaluator.ts --network morphTestnet`
Verify - `npx hardhat verify [FOOTBALL_OVER_UNDER_EVALUATOR] [FOOTBALL_SCORE_PROVIDER] --network morphTestnet`
Url - https://explorer-holesky.morphl2.io/address/0xF9Ae3039535F030c9e8118C71FC68DE1089f5a0a

##### Football Correct Score Evaluator
Deploy - `npx hardhat run scripts/deploy_football_correct_score_evaluator.ts --network morphTestnet`
Verify - `npx hardhat verify [FOOTBALL_CORRECT_SCORE_EVALUATOR] [FOOTBALL_SCORE_PROVIDER] --network morphTestnet`
Url - https://explorer-holesky.morphl2.io/address/0x85a14478ACB2D22C740CB69e15C744b8173C5Ae8

##### Asset Price Bounded Evaluator
Deploy - `npx hardhat run scripts/deploy_asset_price_bounded_evaluator.ts --network morphTestnet`
Verify - `npx hardhat verify [ASSET_PRICE_BOUNDED_EVALUATOR] [ASSET_PRICE_PROVIDER] --network morphTestnet`
Url - https://explorer-holesky.morphl2.io/address/0x252Ba1b6E8b97Fa4759d4F180244810C612B273F

##### Asset Price Target Evaluator
Deploy - `npx hardhat run scripts/deploy_asset_price_target_evaluator.ts --network morphTestnet`
Verify - `npx hardhat verify [ASSET_PRICE_TARGET_EVALUATOR] [ASSET_PRICE_PROVIDER] --network morphTestnet`
Url - https://explorer-holesky.morphl2.io/address/0xC080c3Bad87f90F00ce49C5953dFDd1189918adA
