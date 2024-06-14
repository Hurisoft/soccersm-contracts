import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployAssetPriceProviderWithKofiProvder } from "./AssetPriceProvider";

export async function deployAssetPriceTargetEvaluator() {
  const { provider, kofi } = await loadFixture(
    deployAssetPriceProviderWithKofiProvder
  );

  const [owner, feeAccount, otherAccount, kojo, kwame] =
    await ethers.getSigners();

  // deploy football evaluator
  const AssetPriceTargetEvaluator = await ethers.getContractFactory(
    "AssetPriceTargetEvaluator"
  );

  const evaluator = await AssetPriceTargetEvaluator.deploy(provider);

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

describe("AssetPriceTargetEvaluator", function () {
  describe("Deployment", function () {
    it("Should Deploy Pool", async function () {
      await loadFixture(deployAssetPriceTargetEvaluator);
    });
  });
  describe("Set Data Provider", function () {
    it("Should Set Data Provider", async function () {
      const { provider, evaluator } = await loadFixture(
        deployAssetPriceTargetEvaluator
      );
      await expect(evaluator.setDataProvider(provider))
        .to.emit(evaluator, "NewDataProvider")
        .withArgs(await provider.getAddress());
    });
    it("Should Fail to Set Data Provider", async function () {
      const { provider, evaluator, kwame } = await loadFixture(
        deployAssetPriceTargetEvaluator
      );
      expect(evaluator.connect(kwame).setDataProvider(provider))
        .to.revertedWithCustomError(evaluator, "OwnableUnauthorizedAccount")
        .withArgs(await kwame.getAddress());
    });
  });
  describe("Validate Event", function () {
    it("Should Validate Event", async function () {
      const { provider, evaluator } = await loadFixture(
        deployAssetPriceTargetEvaluator
      );
      const coder = new ethers.AbiCoder();
      const assetSymbol = "BTC";
      const predictedPrice = BigInt(60000 * 1e9);
      const outcome = "below";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
      const eventParam = coder.encode(
        ["string", "uint256", "string"],
        [assetSymbol, predictedPrice, outcome]
      );
      const result = 0;
      const challengeEvent = { eventParam, topicId: 1, maturity, result };
      await evaluator.validateEvent(challengeEvent);
    });
    it("Should fail to Validate Event", async function () {
      const { provider, evaluator, kwame } = await loadFixture(
        deployAssetPriceTargetEvaluator
      );
      const coder = new ethers.AbiCoder();
      const assetSymbol = "BTC";
      const predictedPrice = BigInt(60000 * 1e9);
      const outcome = "around";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
      const eventParam = coder.encode(
        ["string", "uint256", "string"],
        [assetSymbol, predictedPrice, outcome]
      );
      const result = 0;
      const challengeEvent = { eventParam, topicId: 1, maturity, result };
      await evaluator.validateEvent(challengeEvent);
      challengeEvent.eventParam = coder.encode(
        ["string", "uint256", "string"],
        [assetSymbol, 0, 'below']
      );
      await evaluator.validateEvent(challengeEvent);
      await provider.removeReader(await evaluator.getAddress());
      challengeEvent.eventParam = coder.encode(
        ["string", "uint256", "string"],
        [assetSymbol, predictedPrice, 'below']
      );
      await evaluator.validateEvent(challengeEvent);
    });
  });
  describe("Evaluate Event", function () {
    it("Should Evaluate Event", async function () {
      const { provider, evaluator, kofi } = await loadFixture(
        deployAssetPriceTargetEvaluator
      );
      const coder = new ethers.AbiCoder();
      const assetSymbol = "BTC";
      const date = Math.floor(Date.now() / 1000) - 60 * 60 * 2;
      const price = BigInt(60000 * 1e9);
      const param = coder.encode(
        ["string", "uint256", "uint256"],
        [assetSymbol, date, price]
      );
      await provider.connect(kofi).provideData(param);
      const outcome = "below";
      const predictedPrice = BigInt(700 * 1e9);
      const eventParam = coder.encode(
        ["string", "uint256", "string"],
        [assetSymbol, predictedPrice, outcome]
      );
      const result = 0;
      const challengeEvent = { eventParam, topicId: 1, maturity: date, result };
      await evaluator.evaluateEvent(challengeEvent);      
      const assetPrice = BigInt(1000000 * 1e9);
      challengeEvent.eventParam = coder.encode(
        ["string", "uint256", "string"],
        [assetSymbol, assetPrice, 'above']
      );
      await evaluator.evaluateEvent(challengeEvent);
    });
    it("Should fail to Evaluate Event", async function () {
      const { provider, evaluator, kofi } = await loadFixture(
        deployAssetPriceTargetEvaluator
      );
      const coder = new ethers.AbiCoder();
      const assetSymbol = "BTC";
      const date = Math.floor(Date.now() / 1000) - 60 * 60 * 2;
      const price = BigInt(60000 * 1e9);
      const param = coder.encode(
        ["string", "uint256", "uint256"],
        [assetSymbol, date, price]
      );
      await provider.connect(kofi).provideData(param);
      const predictedPrice = BigInt(6 * 1e9);
      const outcome = "okay";
      const eventParam = coder.encode(
        ["string", "uint256", "string"],
        [assetSymbol, predictedPrice, outcome]
      );
      const result = 0;
      const challengeEvent = { eventParam, topicId: 1, maturity: date, result };
      await evaluator.evaluateEvent(challengeEvent);
      challengeEvent.eventParam = coder.encode(
        ["string", "uint256", "string"],
        ["ETH", predictedPrice, 'below']
      );
      await evaluator.evaluateEvent(challengeEvent);
      await provider.removeReader(await evaluator.getAddress());
      challengeEvent.eventParam = coder.encode(
        ["string", "uint256", "string"],
        [assetSymbol, 0, 'above']
      );
      await evaluator.evaluateEvent(challengeEvent);
    });
  });
});
