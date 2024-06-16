import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployFootballOutcomeEvaluator } from "./fixtures";


describe("FootballOutcomeEvaluator", function () {
  describe("Deployment", function () {
    it("Should Deploy Pool", async function () {
      await loadFixture(deployFootballOutcomeEvaluator);
    });
  });
  describe("Set Data Provider", function () {
    it("Should Set Data Provider", async function () {
      const { provider, evaluator } = await loadFixture(
        deployFootballOutcomeEvaluator
      );
      await expect(evaluator.setDataProvider(provider))
        .to.emit(evaluator, "NewDataProvider")
        .withArgs(await provider.getAddress());
    });
    it("Should Fail to Set Data Provider", async function () {
      const { provider, evaluator, kwame } = await loadFixture(
        deployFootballOutcomeEvaluator
      );
      expect(evaluator.connect(kwame).setDataProvider(provider))
        .to.revertedWithCustomError(evaluator, "OwnableUnauthorizedAccount")
        .withArgs(await kwame.getAddress());
    });
  });
  describe("Validate Event", function () {
    it("Should Validate Event", async function () {
      const { provider, evaluator } = await loadFixture(
        deployFootballOutcomeEvaluator
      );
      const coder = new ethers.AbiCoder();
      const matchId = 1;
      const outcome = "home";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
      const eventParam = coder.encode(
        ["uint256", "string"],
        [matchId, outcome]
      );
      const result = 0;
      const challengeEvent = { eventParam, topicId: 1, maturity, result };
      const a = await evaluator.validateEvent(challengeEvent);
    });
    it("Should fail to Validate Event", async function () {
      const { provider, evaluator, kwame } = await loadFixture(
        deployFootballOutcomeEvaluator
      );
      const coder = new ethers.AbiCoder();
      const matchId = 1;
      const outcome = "okay";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
      const eventParam = coder.encode(
        ["uint256", "string"],
        [matchId, outcome]
      );
      const result = 0;
      const challengeEvent = { eventParam, topicId: 1, maturity, result };
      await evaluator.validateEvent(challengeEvent);
      await provider.removeReader(await evaluator.getAddress());
      challengeEvent.eventParam = coder.encode(
        ["uint256", "string"],
        [matchId, "draw"]
      );
      await evaluator.validateEvent(challengeEvent);
    });
  });
  describe("Evaluate Event", function () {
    it("Should Evaluate Event", async function () {
      const { provider, evaluator, kofi } = await loadFixture(
        deployFootballOutcomeEvaluator
      );
      const coder = new ethers.AbiCoder();
      const matchId = 1;
      const homeScore = 3;
      const awayScore = 2;
      const param = coder.encode(
        ["uint256", "uint256", "uint256"],
        [matchId, homeScore, awayScore]
      );
      await provider.connect(kofi).provideData(param);
      const outcome = "home";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
      const eventParam = coder.encode(
        ["uint256", "string"],
        [matchId, outcome]
      );
      const result = 0;
      const challengeEvent = { eventParam, topicId: 1, maturity, result };
      await evaluator.evaluateEvent(challengeEvent);
      challengeEvent.eventParam = coder.encode(
        ["uint256", "string"],
        [matchId, "away"]
      );
      await evaluator.evaluateEvent(challengeEvent);
      challengeEvent.eventParam = coder.encode(
        ["uint256", "string"],
        [matchId, "draw"]
      );
      await evaluator.evaluateEvent(challengeEvent);
      challengeEvent.eventParam = coder.encode(
        ["uint256", "string"],
        [matchId, "home-away"]
      );
      await evaluator.evaluateEvent(challengeEvent);
      challengeEvent.eventParam = coder.encode(
        ["uint256", "string"],
        [matchId, "home-draw"]
      );
      await evaluator.evaluateEvent(challengeEvent);
      challengeEvent.eventParam = coder.encode(
        ["uint256", "string"],
        [matchId, "away-draw"]
      );
      await evaluator.evaluateEvent(challengeEvent);
    });
    it("Should fail to Evaluate Event", async function () {
      const { provider, evaluator, kofi } = await loadFixture(
        deployFootballOutcomeEvaluator
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
      const outcome = "okay";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
      const eventParam = coder.encode(
        ["uint256", "string"],
        [matchId, outcome]
      );
      const result = 0;
      const challengeEvent = { eventParam, topicId: 1, maturity, result };
      await evaluator.evaluateEvent(challengeEvent);
      challengeEvent.eventParam = coder.encode(
        ["uint256", "string"],
        [0, "draw"]
      );
      await evaluator.evaluateEvent(challengeEvent);
      await provider.removeReader(await evaluator.getAddress());
      challengeEvent.eventParam = coder.encode(
        ["uint256", "string"],
        [matchId, "home"]
      );
      await evaluator.evaluateEvent(challengeEvent);
    });
  });
});
