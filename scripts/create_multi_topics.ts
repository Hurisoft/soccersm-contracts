import { ethers } from "hardhat";

async function main() {
  const shadow = await ethers.getContractAt(
    "MultiTopicRegistry",
    process.env.MULTI_TOPIC_REGISTRY!
  );
  await shadow.createTopic(
    "Football Score Correct Score",
    "Predict if outcome of football match will be one of the correct scores",
    process.env.MULTI_FOOTBALL_SCORE_CORRECT_SCORE_EVALUATOR!
  );

  console.log("Topics Created ...");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
