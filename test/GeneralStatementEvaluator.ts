import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployGeneralStatementEvaluator } from "./fixtures";

describe("GeneralStatementEvaluator", function () {
  describe("Deployment", function () {
    it("Should Deploy Pool", async function () {
      await loadFixture(deployGeneralStatementEvaluator);
    });
  });
  describe("Set Data Provider", function () {
    it("Should Set Data Provider", async function () {
      const { provider, evaluator } = await loadFixture(
        deployGeneralStatementEvaluator
      );
      await expect(evaluator.setDataProvider(provider))
        .to.emit(evaluator, "NewDataProvider")
        .withArgs(await provider.getAddress());
    });
    it("Should Fail to Set Data Provider", async function () {
      const { provider, evaluator, kwame } = await loadFixture(
        deployGeneralStatementEvaluator
      );
      expect(evaluator.connect(kwame).setDataProvider(provider))
        .to.revertedWithCustomError(evaluator, "OwnableUnauthorizedAccount")
        .withArgs(await kwame.getAddress());
    });
  });
  describe("Validate Event", function () {
    it("Should Validate Event", async function () {
      const { provider, evaluator } = await loadFixture(
        deployGeneralStatementEvaluator
      );
      const coder = new ethers.AbiCoder();
      const statementId = 1;
      const statement = "Trump will win!";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 4;
      const result = 0;
      const eventParam = coder.encode(
        ["uint256"],
        [statementId]
      );
      const challengeEvent = { eventParam, topicId: 1, maturity, result };
      const a = await evaluator.validateEvent(challengeEvent);
    });
    it("Should fail to Validate Event", async function () {
      const { provider, evaluator, kwame } = await loadFixture(
        deployGeneralStatementEvaluator
      );
      const coder = new ethers.AbiCoder();
      const statementId = 1;
      const statement = "Trump will win!";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 4;
      const result = 0;
      const eventParam = coder.encode(
        ["uint256"],
        [statementId]
      );
      const challengeEvent = { eventParam, topicId: 1, maturity, result };
      const a = await evaluator.validateEvent(challengeEvent);
      await provider.removeReader(await evaluator.getAddress());
      challengeEvent.eventParam = coder.encode(
        ["uint256"],
        [statementId]
      );
      await evaluator.validateEvent(challengeEvent);
    });
  });
  describe("Evaluate Event", function () {
    it("Should Evaluate Event", async function () {
      const { provider, evaluator, kofi } = await loadFixture(
        deployGeneralStatementEvaluator
      );
      const coder = new ethers.AbiCoder();
      const statementId = 1;
      const statement = "Trump will win!";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 4;
      const result = 0;
      const param = coder.encode(
        ["uint256", "string", "uint256", "uint8"],
        [statementId, statement, maturity, result]
      );
      await provider.connect(kofi).provideData(param);
      const maturity2 = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
      const eventParam = coder.encode(
        ["uint256"],
        [statementId]
      );
      const result2 = 0;
      const challengeEvent = {
        eventParam,
        topicId: 1,
        maturity,
        result: result2,
      };
      await evaluator.evaluateEvent(challengeEvent);
    });
    it("Should fail to Evaluate Event", async function () {
      const { provider, evaluator, kofi } = await loadFixture(
        deployGeneralStatementEvaluator
      );
      const coder = new ethers.AbiCoder();
      const statementId = 1;
      const statement = "Trump will win!";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 4;
      const result = 0;
      const param = coder.encode(
        ["uint256", "string", "uint256", "uint8"],
        [statementId, statement, maturity, result]
      );
      await provider.connect(kofi).provideData(param);
      const maturity2 = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
      const eventParam = coder.encode(
        ["uint256", "string", "uint256", "uint8"],
        [statementId, statement, maturity2, result]
      );
      const result2 = 0;
      const challengeEvent = {
        eventParam,
        topicId: 1,
        maturity,
        result: result2,
      };
      await evaluator.evaluateEvent(challengeEvent);
    });
  });
});
