import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import args from "../contract-args/multi_challenge_pool";
dotenv.config();
async function main() {

  const shadow = await ethers.deployContract("MultiChallengePool", args);

  await shadow.waitForDeployment();

  const { ...tx } = shadow.deploymentTransaction()?.toJSON();
  tx.data = await shadow.getAddress();

  console.log(`deployed to ${JSON.stringify(tx, null, 2)}`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
