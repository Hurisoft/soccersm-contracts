# Soccersm Challenge Pools

[Specification](./specification.md)

## Initial Deployment & Setup Steps

1. Deploy TopicRegistry to get `REGISTRY_CONTRACT`

2. Deploy ChallengePool to get `POOL_CONTRACT`

3. Deploy Providers
  - FootballScoreProvider `FOOTBALL_SCORE_PROVIDER`
  - AssetPriceProvider `ASSET_PRICE_PROVIDER`

4. Deploy Evaluators
  - FootballOutcomeEvaluator `FOOTBALL_OUTCOME_EVALUATOR`
  - FootballOverUnderEvaluator `FOOTBALL_OVER_UNDER_EVALUATOR`
  - FootBallCorrectScoreEvaluator `FOOTBALL_CORRECT_SCORE_EVALUATOR`
  - AssetPriceBoundedEvaluator `ASSET_PRICE_BOUNDED_EVALUATOR`
  - AssetPriceTargetEvaluator `ASSET_PRICE_TARGET_EVALUATOR`

5. Create Default Topics


## Deployments

### Morph


