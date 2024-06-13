// import {
//   time,
//   loadFixture,
// } from "@nomicfoundation/hardhat-toolbox/network-helpers";
// import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
// import { expect } from "chai";
// import { ethers } from "hardhat";
// import { deployTopicRegistry } from "./TopicRegistry";
// import {
//   ChallengePool,
//   DummyEvaluator,
//   TestBalls,
//   TopicRegistry,
// } from "../typechain-types";

// async function deployChallengePool() {
//   const { registry } = await loadFixture(deployTopicRegistry);

//   const [owner, feeAccount, otherAccount, kojo, kwame, kofi] =
//     await ethers.getSigners();

//   // deploy dummy evaluator
//   const DummyEvaluator = await ethers.getContractFactory("DummyEvaluator");
//   const dummyYesEvaluator = await DummyEvaluator.deploy(true, 1);
//   const dummyNoEvaluator = await DummyEvaluator.deploy(true, 2);
//   const dummyZeroEvaluator = await DummyEvaluator.deploy(true, 0);
//   const dummyFalsValidate = await DummyEvaluator.deploy(false, 1);
//   await createTopic(
//     registry,
//     dummyYesEvaluator,
//     "dummyYesEvaluator",
//     "Always Yes"
//   ); // id 0
//   await createTopic(
//     registry,
//     dummyNoEvaluator,
//     "dummyNoEvaluator",
//     "Always No"
//   ); // id 1
//   await createTopic(
//     registry,
//     dummyZeroEvaluator,
//     "dummyZeroEvaluator",
//     "Always Zero"
//   ); // 2
//   await createTopic(
//     registry,
//     dummyFalsValidate,
//     "dummyFalsValidate",
//     "Validate False"
//   ); // 3
//   // deploy test trophies
//   const TestTrophies = await ethers.getContractFactory("TestTrophies");
//   const testTrophies = await TestTrophies.deploy();
//   // deploy test balls
//   const TestBalls = await ethers.getContractFactory("TestBalls");
//   const testBalls = await TestBalls.deploy();

//   const ONE_HOUR = 60 * 60;
//   const ONE_DAY = ONE_HOUR * 24;
//   const ONE_WEEK = ONE_DAY * 7;

//   const poolFee = 10;
//   const joinPeriod = 9000;
//   const maxMaturityPeriod = ONE_WEEK * 12;
//   const maxPlayersPerPool = 100;
//   const minStakeAmount = BigInt(100 * 1e18);
//   const maxEventsPerChallenge = 10;
//   const minMaturityPeriod = ONE_HOUR;
//   const maxStaleRetries = 3;
//   const staleExtensionPeriod = ONE_HOUR;
//   const feeAddress = feeAccount;
//   const balls = testBalls;
//   const trophies = testTrophies;
//   const topicRegistry = registry;

//   // deploy challenge

//   const ChallengePool = await ethers.getContractFactory("ChallengePool");
//   const pool = await ChallengePool.deploy(
//     poolFee,
//     joinPeriod,
//     maxMaturityPeriod,
//     maxPlayersPerPool,
//     minStakeAmount,
//     maxEventsPerChallenge,
//     minMaturityPeriod,
//     maxStaleRetries,
//     staleExtensionPeriod,
//     feeAddress,
//     topicRegistry,
//     trophies,
//     balls
//   );

//   return {
//     registry,
//     owner,
//     feeAccount,
//     otherAccount,
//     kojo,
//     kwame,
//     kofi,
//     dummyYesEvaluator,
//     dummyNoEvaluator,
//     dummyZeroEvaluator,
//     testTrophies,
//     testBalls,
//     pool,
//   };
// }

// async function createTopic(
//   registry: TopicRegistry,
//   dummyEvaluator: DummyEvaluator,
//   title: string,
//   description: string
// ) {
//   await registry.createTopic(title, description, dummyEvaluator);
// }

// async function createYesChallenge(pool: ChallengePool, balls: TestBalls) {
//   const topicId = 0;
//   const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
//   const matchAId = 1;
//   const matchBId = 2;
//   const matchCId = 3;
//   const outcomeA = "home";
//   const outcomeB = "draw";
//   const outcomeC = "away";
//   const encoder = new ethers.AbiCoder();
//   const event1 = encoder.encode(["uint256", "string"], [matchAId, outcomeA]);
//   const event2 = encoder.encode(["uint256", "string"], [matchBId, outcomeB]);
//   const event3 = encoder.encode(["uint256", "uint256"], [matchCId, 1]);

//   const stake = BigInt(200 * 1e18);
//   const prediction = 1;

//   const feeAndStake = await pool.stakeAmountAndFee(stake);

//   await balls.approve(await pool.getAddress(), feeAndStake[0] + feeAndStake[1]);

//   await pool.createChallenge(
//     [event1, event2, event3],
//     [maturity, maturity, maturity],
//     [topicId, topicId, topicId],
//     prediction,
//     stake
//   );
// }

// async function createNoChallenge(pool: ChallengePool) {}

// async function createZeroChallenge(pool: ChallengePool) {}

// async function createChallenges() {
//   const {
//     registry,
//     owner,
//     feeAccount,
//     otherAccount,
//     kojo,
//     kwame,
//     kofi,
//     dummyYesEvaluator,
//     dummyNoEvaluator,
//     dummyZeroEvaluator,
//     testTrophies,
//     testBalls,
//     pool,
//   } = await loadFixture(deployChallengePool);

//   await createYesChallenge(pool, testBalls);
//   //   await createNoChallenge(pool);
//   //   await createZeroChallenge(pool);

//   return {
//     registry,
//     owner,
//     feeAccount,
//     otherAccount,
//     kojo,
//     kwame,
//     kofi,
//     dummyYesEvaluator,
//     dummyNoEvaluator,
//     dummyZeroEvaluator,
//     testTrophies,
//     testBalls,
//     pool,
//   };
// }

// describe("ChallengePool", function () {
//   describe("Deployment", function () {
//     it("Should Deploy Pool", async function () {
//       await loadFixture(deployChallengePool);
//     });
//   });
//   describe("Create Challenge", function () {
//     it("Should Create Challenge", async function () {
//       await loadFixture(createChallenges);
//     });
//   });
//   describe("Join Challenge", function () {});
//   describe("Close Challenge", function () {});
//   describe("Withdraw Winnings", function () {});
//   describe("Batch Close Challenge", function () {});
//   describe("Batch Withdraw Winnings", function () {});
// });
