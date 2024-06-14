import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
  import { expect } from "chai";
  import { ethers } from "hardhat";
  import { deployFootballScoreProviderWithKofiProvder } from "./FootballScoreProvider";
  
  export async function deployAssetPriceBoundedEvaluator() {
    const { provider, kofi } = await loadFixture(
      deployFootballScoreProviderWithKofiProvder
    );
  
    const [owner, feeAccount, otherAccount, kojo, kwame] =
      await ethers.getSigners();

    const AssetPriceBoundedEvaluator = await ethers.getContractFactory(
      "AssetPriceBoundedEvaluator"
    );
  
    const evaluator = await AssetPriceBoundedEvaluator.deploy(provider);
  
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
    describe("Evaluate Event", function () {});
    describe("Validate Event", function () {});
  });
  