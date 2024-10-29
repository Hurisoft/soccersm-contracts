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

### Lisk Sepolia

#### Topic Registry

Deploy - `npx hardhat run scripts/deploy_topic_registry.ts --network liskTestnet`
Verify - `npx hardhat verify --contract contracts/challenge-pool/TopicRegistry.sol:TopicRegistry [TOPIC_REGISTRY] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0xACBC1eC300bBea9A9FD0A661cD717d8519c5FCA5>

#### Multi Topic Registry

Deploy - `npx hardhat run scripts/deploy_multi_topic_registry.ts --network liskTestnet`
Verify - `npx hardhat verify --contract contracts/challenge-pool/MultiTopicRegistry.sol:MultiTopicRegistry [MULTI_TOPIC_REGISTRY] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0x28cB409154beb695D5E9ffA85dA8f1564Aa3cD76>

#### ERC20 Tokens

##### Balls

Deploy - `npx hardhat run scripts/deploy_balls.ts --network liskTestnet`
Verify - `npx hardhat verify [BALLS] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0x935E49458145B917a0EaEE279652F724EA78d8F0>

##### BallsFaucet

Deploy - `npx hardhat run scripts/deploy_faucet.ts --network liskTestnet`
Verify - `npx hardhat verify [FAUCET] [BALLS] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0xa7c3a5bd99E11E0d8cD21952a0133449b194d3A8>

#### Challenge Pool

Deploy - `npx hardhat run scripts/deploy_challenge_pool.ts --network liskTestnet`
Verify - `npx hardhat verify --network liskTestnet --constructor-args contract-args/challenge_pool.ts [CHALLENGE_POOL]`
Url - <https://sepolia-blockscout.lisk.com/address/0xB2002EaFC86DD21eaDAed4b1a7857357a6C3f41f>

#### Multi Challenge Pool

Deploy - `npx hardhat run scripts/deploy_multi_challenge_pool.ts --network liskTestnet`
Verify - `npx hardhat verify --network liskTestnet --constructor-args contract-args/multi_challenge_pool.ts [MULTI_CHALLENGE_POOL]`
Url - <https://sepolia-blockscout.lisk.com/address/0xF9Ae3039535F030c9e8118C71FC68DE1089f5a0a>

#### Deploy Providers

##### Asset Price Provider

Deploy - `npx hardhat run scripts/deploy_asset_price_provider.ts --network liskTestnet`
Verify - `npx hardhat verify [ASSET_PRICE_PROVIDER] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0x08FD9b19435dD5bdbaF183EE3fe68dCD6fD709EF>

##### Football Score Provider

Deploy - `npx hardhat run scripts/deploy_football_score_provider.ts --network liskTestnet`
Verify - `npx hardhat verify [FOOTBALL_SCORE_PROVIDER] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0x53637cE365d796FA32eE3FB1A0cB8408Df0fB554>

##### General Statement Provider

Deploy - `npx hardhat run scripts/deploy_general_statement_provider.ts --network liskTestnet`
Verify - `npx hardhat verify [GENERAL_STATEMENT_PROVIDER] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0xF5Bd8F96A9cb7e27a838aFA4AF55df5594bc9041>

##### Multi Provider

Deploy - `npx hardhat run scripts/deploy_multi_provider.ts --network liskTestnet`
Verify - `npx hardhat verify [MULTI_PROVIDER] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0x3CB9BAf9b481c38940aeb1EBfc0Dc25B9707A39b>

##### Multi Sender

Deploy - `npx hardhat run scripts/deploy_multi_send.ts --network liskTestnet`
Verify - `npx hardhat verify [MULTIPLE_SEND] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0xDEa41a7FC992A02504f170a0cCE0b6225d41815c>

#### Deploy Evaluators

##### Football Outcome Evaluator

Deploy - `npx hardhat run scripts/deploy_football_outcome_evaluator.ts --network liskTestnet`
Verify - `npx hardhat verify [FOOTBALL_OUTCOME_EVALUATOR] [FOOTBALL_SCORE_PROVIDER] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0x7281b4cCA308aF757D8BE75e62241e5e0c88CAA3>

##### Football Over Under Evaluator

Deploy - `npx hardhat run scripts/deploy_football_over_under_evaluator.ts --network liskTestnet`
Verify - `npx hardhat verify [FOOTBALL_OVER_UNDER_EVALUATOR] [FOOTBALL_SCORE_PROVIDER] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0xc1272b64F1b500dCe5059b3951afEA77b329e2B9>

##### Football Correct Score Evaluator

Deploy - `npx hardhat run scripts/deploy_football_correct_score_evaluator.ts --network liskTestnet`
Verify - `npx hardhat verify [FOOTBALL_CORRECT_SCORE_EVALUATOR] [FOOTBALL_SCORE_PROVIDER] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0x76411bBAAf025F3D25aFFcEb79209eE89cA554Bd>

##### Asset Price Bounded Evaluator

Deploy - `npx hardhat run scripts/deploy_asset_price_bounded_evaluator.ts --network liskTestnet`
Verify - `npx hardhat verify [ASSET_PRICE_BOUNDED_EVALUATOR] [ASSET_PRICE_PROVIDER] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0x39a7f0a342a0509C1aC248F379ba283e99c36Ae5>

##### Asset Price Target Evaluator

Deploy - `npx hardhat run scripts/deploy_asset_price_target_evaluator.ts --network liskTestnet`
Verify - `npx hardhat verify [ASSET_PRICE_TARGET_EVALUATOR] [ASSET_PRICE_PROVIDER] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0xB3b75E9d2BAE1Aa3AF2caeC46ec7377c27f09D28>

##### General Statement Evaluator

Deploy - `npx hardhat run scripts/deploy_general_statement_evaluator.ts --network liskTestnet`
Verify - ````npx hardhat verify [GENERAL_STATEMENT_EVALUATOR] [GENERAL_STATEMENT_PROVIDER] --network liskTestnet````
Url - <https://sepolia-blockscout.lisk.com/address/0xEd64A15A6223588794A976d344990001a065F3f1>

##### Multi General Statement Evaluator

Deploy - `npx hardhat run scripts/deploy_multi_general_statement_evaluator.ts --network liskTestnet`
Verify - `npx hardhat verify [MULTI_GENERAL_STATEMENT_EVALUATOR] [MULTI_GENERAL_STATEMENT_PROVIDER] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0x252Ba1b6E8b97Fa4759d4F180244810C612B273F>

#### Create Topics

`npx hardhat run scripts/create_topics.ts --network liskTestnet`

#### Create Multi Topics

`npx hardhat run scripts/create_multi_topics.ts --network liskTestnet`

#### Create General Statements

`npx hardhat run scripts/create_statements.ts --network liskTestnet`

#### Create Multi General Statements

`npx hardhat run scripts/create_multi_statements.ts --network liskTestnet`

#### Games

##### Spin Wheel

Deploy - `npx hardhat run scripts/deploy_wheel.ts --network liskTestnet`
Verify - `npx hardhat verify [WHEEL] [BALLS] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0xd96c0BDC90b3fc41F15d348c3D539e427162F5B7>

### Multi

#### Multi General Statement Provider

Deploy - `npx hardhat run scripts/deploy_multi_general_statement_provider.ts --network liskTestnet`
Verify - `npx hardhat verify [MULTI_GENERAL_STATEMENT_PROVIDER] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0x85a14478ACB2D22C740CB69e15C744b8173C5Ae8>

##### Multi Asset Price Provider

Deploy - `npx hardhat run scripts/deploy_multi_asset_price_provider.ts --network liskTestnet`
Verify - `npx hardhat verify [MULTI_ASSET_PRICE_PROVIDER] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0xC080c3Bad87f90F00ce49C5953dFDd1189918adA>

##### Multi Football Score Provider

Deploy - `npx hardhat run scripts/deploy_multi_football_score_provider.ts --network liskTestnet`
Verify - `npx hardhat verify [MULTI_FOOTBALL_SCORE_PROVIDER] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0x466182Fb77589D613BcbF2302833Ac8A17f37818>

##### Multi Asset Range Evaluator

Deploy - `npx hardhat run scripts/deploy_multi_asset_range_evaluator.ts --network liskTestnet`
Verify - `npx hardhat verify [MULTI_ASSET_RANGE_EVALUATOR] [MULTI_ASSET_PRICE_PROVIDER] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0x87d35Fe9D988C82C7BD15aA887a8939632d27fF0>

##### Multi Football Score Range Evaluator

Deploy - `npx hardhat run scripts/deploy_multi_football_score_range_evaluator.ts --network liskTestnet`
Verify - `npx hardhat verify [MULTI_FOOTBALL_SCORE_RANGE_EVALUATOR] [MULTI_FOOTBALL_SCORE_PROVIDER] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0x97920aaafA60CdEfe0723Dc909923097D887B742>

##### Multi Football Score Exact Evaluator

Deploy - `npx hardhat run scripts/deploy_multi_football_score_exact_evaluator.ts --network liskTestnet`
Verify - `npx hardhat verify [MULTI_FOOTBALL_SCORE_EXACT_EVALUATOR] [MULTI_FOOTBALL_SCORE_PROVIDER] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0xf90c0c0Fdc30E9B248c47CAD7236a25beA881a65>

##### Multi Football Score Outcome Evaluator

Deploy - `npx hardhat run scripts/deploy_multi_football_score_outcome_evaluator.ts --network liskTestnet`
Verify - `npx hardhat verify [MULTI_FOOTBALL_SCORE_OUTCOME_EVALUATOR] [MULTI_FOOTBALL_SCORE_PROVIDER] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0xf86E39eED355510f74350693065da0f5239bf4aA>

##### Multi Football Score Correct Score Evaluator

Deploy - `npx hardhat run scripts/deploy_multi_football_correct_score_evaluator.ts --network liskTestnet`
Verify - `npx hardhat verify [MULTI_FOOTBALL_SCORE_CORRECT_SCORE_EVALUATOR] [MULTI_FOOTBALL_SCORE_PROVIDER] --network liskTestnet`
Url - <https://sepolia-blockscout.lisk.com/address/0x0bbF53B07F6a5C55CC2F5B489dD6b32F53377664>
