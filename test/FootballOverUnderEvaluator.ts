import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployFootballScoreProviderWithKofiProvder } from "./FootballScoreProvider";

export async function deployFootballOverUnderEvaluator() {
  const { provider, kofi } = await loadFixture(
    deployFootballScoreProviderWithKofiProvder
  );

  const [owner, feeAccount, otherAccount, kojo, kwame] =
    await ethers.getSigners();

  // deploy football evaluator
  const FootballOverUnderEvaluator = await ethers.getContractFactory(
    "FootballOverUnderEvaluator"
  );

  const evaluator = await FootballOverUnderEvaluator.deploy(provider);

  await provider.addReader(await evaluator.getAddress());

  return {
    owner,
    feeAccount,
    otherAccount,
    kojo,
    kwame,
    kofi,
    evaluator,
    provider,
  };
}

describe("FootballOverUnderEvaluator", function () {
  describe("Deployment", function () {
    it("Should Deploy Pool", async function () {
      await loadFixture(deployFootballOverUnderEvaluator);
    });
  });
  describe("Set Data Provider", function () {
    it("Should Set Data Provider", async function () {
      const { provider, evaluator } = await loadFixture(
        deployFootballOverUnderEvaluator
      );
      await expect(evaluator.setDataProvider(provider))
        .to.emit(evaluator, "NewDataProvider")
        .withArgs(await provider.getAddress());
    });
    it("Should Fail to Set Data Provider", async function () {
      const { provider, evaluator, kwame } = await loadFixture(
        deployFootballOverUnderEvaluator
      );
      expect(evaluator.connect(kwame).setDataProvider(provider))
        .to.revertedWithCustomError(evaluator, "OwnableUnauthorizedAccount")
        .withArgs(await kwame.getAddress());
    });
  });
  describe("Validate Event", function () {
    it("Should Validate Event", async function () {
      const { provider, evaluator } = await loadFixture(
        deployFootballOverUnderEvaluator
      );
      const coder = new ethers.AbiCoder();
      const matchId = 1;
      const predictedTotal = 3;
      const outcome = "under";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
      const eventParam = coder.encode(
        ["uint256", "uint256", "string"],
        [matchId, predictedTotal, outcome]
      );
      const result = 0;
      const challengeEvent = { eventParam, topicId: 1, maturity, result };
      const a = await evaluator.validateEvent(challengeEvent);
    });
    it("Should fail to Validate Event", async function () {
      const { provider, evaluator, kwame } = await loadFixture(
        deployFootballOverUnderEvaluator
      );
      const coder = new ethers.AbiCoder();
      const matchId = 1;
      const predictedTotal = 3;
      const outcome = "okay";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
      const eventParam = coder.encode(
        ["uint256", "uint256", "string"],
        [matchId, predictedTotal, outcome]
      );
      const result = 0;
      const challengeEvent = { eventParam, topicId: 1, maturity, result };
      await evaluator.validateEvent(challengeEvent);
      await provider.removeReader(await evaluator.getAddress());
      challengeEvent.eventParam = coder.encode(
        ["uint256", "uint256", "string"],
        [matchId, predictedTotal, 'under']
      );
      await evaluator.validateEvent(challengeEvent);
    });
  });
  describe("Evaluate Event", function () {
    it("Should Evaluate Event", async function () {
      const { provider, evaluator, kofi } = await loadFixture(
        deployFootballOverUnderEvaluator
      );
      const coder = new ethers.AbiCoder();
      const matchId = 1;
      const homeScore = 1;
      const awayScore = 2;
      const param = coder.encode(
        ["uint256", "uint256", "uint256"],
        [matchId, homeScore, awayScore]
      );
      await provider.connect(kofi).provideData(param);
      const predictedTotal = 3;
      const outcome = "under";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
      const eventParam = coder.encode(
        ["uint256", "uint256", "string"],
        [matchId, predictedTotal, outcome]
      );
      const result = 0;
      const challengeEvent = { eventParam, topicId: 1, maturity, result };
      await evaluator.evaluateEvent(challengeEvent);
      challengeEvent.eventParam = coder.encode(
        ["uint256", "uint256", "string"],
        [matchId, 2, 'over']
      );
      await evaluator.evaluateEvent(challengeEvent);
    });
    it("Should fail to Evaluate Event", async function () {
      const { provider, evaluator, kofi } = await loadFixture(
        deployFootballOverUnderEvaluator
      );
      const coder = new ethers.AbiCoder();
      const matchId = 1;
      const homeScore = 2;
      const awayScore = 2;
      const param = coder.encode(
        ["uint256", "uint256", "uint256"],
        [matchId, homeScore, awayScore]
      );
      await provider.connect(kofi).provideData(param);
      const predictedTotal = 3;
      const outcome = "okay";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
      const eventParam = coder.encode(
        ["uint256", "uint256", "string"],
        [matchId, predictedTotal, outcome]
      );
      const result = 0;
      const challengeEvent = { eventParam, topicId: 1, maturity, result };
      await evaluator.evaluateEvent(challengeEvent);
      challengeEvent.eventParam = coder.encode(
        ["uint256", "uint256", "string"],
        [0, predictedTotal, 'under']
      );
      await evaluator.evaluateEvent(challengeEvent);
      await provider.removeReader(await evaluator.getAddress());
      challengeEvent.eventParam = coder.encode(
        ["uint256", "uint256", "string"],
        [matchId, predictedTotal, 'under']
      );
      await evaluator.evaluateEvent(challengeEvent);
    });
  });
});
