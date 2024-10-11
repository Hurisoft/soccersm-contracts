import { ethers } from "hardhat";

async function main() {
  const shadow = await ethers.getContractAt(
    "MultiTopicRegistry",
    process.env.MULTI_TOPIC_REGISTRY!
  );

  // await shadow.createTopic(
  //   "Football Outcome Events",
  //   "Outcome of football match; home, away, win, home-away, home-draw, away-draw",
  //   process.env.FOOTBALL_OUTCOME_EVALUATOR!
  // ); // id 0
  // await shadow.createTopic(
  //   "Football Over/Under Events",
  //   "Whether total goals will be over or under a given value. Values are 1.5, 2.5, 3.5 and 4.5",
  //   process.env.FOOTBALL_OVER_UNDER_EVALUATOR!
  // ); // id 1
  // await shadow.createTopic(
  //   "Football Correct Score Events",
  //   "The correct score of a football match",
  //   process.env.FOOTBALL_CORRECT_SCORE_EVALUATOR!
  // ); // 2
  // await shadow.createTopic(
  //   "Asset Price Bounded",
  //   "Whether asset price will fall within a given bound",
  //   process.env.ASSET_PRICE_BOUNDED_EVALUATOR!
  // ); // 3
  // await shadow.createTopic(
  //   "Asset Price Target",
  //   "Whether asset price be above or below a given amount",
  //   process.env.ASSET_PRICE_TARGET_EVALUATOR!
  // ); // 4
  await shadow.createTopic(
    "Multi General Statements",
    "Predict outcome of any and all statements.",
    process.env.MULTI_GENERAL_STATEMENT_EVALUATOR!
  ); // 5

  console.log("Topics Created ...");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
