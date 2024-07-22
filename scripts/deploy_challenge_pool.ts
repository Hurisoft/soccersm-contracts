import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();
async function main() {
  const ONE_HOUR = 60 * 60;
  const ONE_DAY = ONE_HOUR * 24;
  const ONE_WEEK = ONE_DAY * 7;

  const poolFee = 10;
  const joinPeriod = 9000;
  const maxMaturityPeriod = ONE_WEEK * 12;
  const maxPlayersPerPool = 100;
  const minStakeAmount = BigInt(100 * 1e18);
  const maxEventsPerChallenge = 10;
  const minMaturityPeriod = ONE_HOUR;
  const maxStaleRetries = 3;
  const staleExtensionPeriod = ONE_HOUR;
  const feeAddress: string = process.env.FEE_ACCOUNT!;
  const balls: string = process.env.BALLS!;
  const trophies: string = process.env.TROPHIES!;
  const topicRegistry: string = process.env.TOPIC_REGISTRY!;

  const args = [
    poolFee,
    joinPeriod,
    maxMaturityPeriod,
    maxPlayersPerPool,
    minStakeAmount,
    maxEventsPerChallenge,
    minMaturityPeriod,
    maxStaleRetries,
    staleExtensionPeriod,
    feeAddress,
    topicRegistry,
    trophies,
    balls,
  ];

  const argTypes = [
    "uint256",
    "uint256",
    "uint256",
    "uint256",
    "uint256",
    "uint256",
    "uint256",
    "uint256",
    "uint256",
    "address",
    "address",
    "address",
    "address",
  ];

  const shadow = await ethers.deployContract("ChallengePool", args);

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
