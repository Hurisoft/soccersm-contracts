import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployAssetPriceProviderWithKofiProvder } from "./AssetPriceProvider";

export async function deployAssetPriceBoundedEvaluator() {
  const { provider, kofi } = await loadFixture(
    deployAssetPriceProviderWithKofiProvder
  );

  const [owner, feeAccount, otherAccount, kojo, kwame] =
    await ethers.getSigners();

  // deploy football evaluator
  const AssetPriceBoundedEvaluator = await ethers.getContractFactory(
    "AssetPriceBoundedEvaluator"
  );

  const evaluator = await AssetPriceBoundedEvaluator.deploy(provider);

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

describe("AssetPriceBoundedEvaluator", function () {
  describe("Deployment", function () {
    it("Should Deploy Pool", async function () {
      await loadFixture(deployAssetPriceBoundedEvaluator);
    });
  });
  describe("Set Data Provider", function () {
    it("Should Set Data Provider", async function () {
      const { provider, evaluator } = await loadFixture(
        deployAssetPriceBoundedEvaluator
      );
      await expect(evaluator.setDataProvider(provider))
        .to.emit(evaluator, "NewDataProvider")
        .withArgs(await provider.getAddress());
    });
    it("Should Fail to Set Data Provider", async function () {
      const { provider, evaluator, kwame } = await loadFixture(
        deployAssetPriceBoundedEvaluator
      );
      expect(evaluator.connect(kwame).setDataProvider(provider))
        .to.revertedWithCustomError(evaluator, "OwnableUnauthorizedAccount")
        .withArgs(await kwame.getAddress());
    });
  });
  describe("Validate Event", function () {
    it("Should Validate Event", async function () {
      const { provider, evaluator } = await loadFixture(
        deployAssetPriceBoundedEvaluator
      );
      const coder = new ethers.AbiCoder();
      const assetSymbol = "BTC";
      const priceLowerBound = BigInt(60000 * 1e9);
      const priceUpperBound = BigInt(100000 * 1e9);
      const outcome = "in";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
      const eventParam = coder.encode(
        ["string", "uint256", "uint256", "string"],
        [assetSymbol, priceLowerBound, priceUpperBound, outcome]
      );
      const result = 0;
      const challengeEvent = { eventParam, topicId: 1, maturity, result };
      await evaluator.validateEvent(challengeEvent);
    });
    it("Should fail to Validate Event", async function () {
      const { provider, evaluator, kwame } = await loadFixture(
        deployAssetPriceBoundedEvaluator
      );
      const coder = new ethers.AbiCoder();
      const assetSymbol = "BTC";
      const priceLowerBound = BigInt(60000 * 1e9);
      const priceUpperBound = BigInt(100000 * 1e9);
      const outcome = "around";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
      const eventParam = coder.encode(
        ["string", "uint256", "uint256", "string"],
        [assetSymbol, priceLowerBound, priceUpperBound, outcome]
      );
      const result = 0;
      const challengeEvent = { eventParam, topicId: 1, maturity, result };
      await evaluator.validateEvent(challengeEvent);
      challengeEvent.eventParam = coder.encode(
        ["string", "uint256", "uint256", "string"],
        [assetSymbol, priceUpperBound, priceLowerBound, outcome]
      );
      await evaluator.validateEvent(challengeEvent);
      await provider.removeReader(await evaluator.getAddress());
      challengeEvent.eventParam = coder.encode(
        ["string", "uint256", "uint256", "string"],
        [assetSymbol, priceLowerBound, priceUpperBound, outcome]
      );
      await evaluator.validateEvent(challengeEvent);
    });
  });
  describe("Evaluate Event", function () {
    it("Should Evaluate Event", async function () {
      const { provider, evaluator, kofi } = await loadFixture(
        deployAssetPriceBoundedEvaluator
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
      const outcome = "in";
      const priceLowerBound = BigInt(60000 * 1e9);
      const priceUpperBound = BigInt(100000 * 1e9);
      const eventParam = coder.encode(
        ["string", "uint256", "uint256", "string"],
        [assetSymbol, priceLowerBound, priceUpperBound, outcome]
      );
      const result = 0;
      const challengeEvent = { eventParam, topicId: 1, maturity: date, result };
      await evaluator.evaluateEvent(challengeEvent);
      challengeEvent.eventParam = coder.encode(
        ["string", "uint256", "uint256", "string"],
        [assetSymbol, BigInt(10000 * 1e9), BigInt(50000 * 1e9), 'out']
      );
      await evaluator.evaluateEvent(challengeEvent);
    });
    it("Should fail to Evaluate Event", async function () {
      const { provider, evaluator, kofi } = await loadFixture(
        deployAssetPriceBoundedEvaluator
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
      const priceLowerBound = BigInt(60000 * 1e9);
      const priceUpperBound = BigInt(100000 * 1e9);
      const outcome = "okay";
      const eventParam = coder.encode(
        ["string", "uint256", "uint256", "string"],
        [assetSymbol, priceLowerBound, priceUpperBound, outcome]
      );
      const result = 0;
      const challengeEvent = { eventParam, topicId: 1, maturity: date, result };
      await evaluator.evaluateEvent(challengeEvent);
      challengeEvent.eventParam = coder.encode(
        ["string", "uint256", "uint256", "string"],
        [assetSymbol, BigInt(10000 * 1e9), BigInt(50000 * 1e9), 'in']
      );
      await evaluator.evaluateEvent(challengeEvent);
      await provider.removeReader(await evaluator.getAddress());
      challengeEvent.eventParam = coder.encode(
        ["string", "uint256", "uint256", "string"],
        [assetSymbol, priceLowerBound, priceUpperBound, 'out']
      );
      await evaluator.evaluateEvent(challengeEvent);
    });
  });
});
