import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployFootballScoreProvider } from "./FootballScoreProvider";

export async function deployFootballOverUnderEvaluator() {
  const { provider } = await loadFixture(deployFootballScoreProvider);

  const [owner, feeAccount, otherAccount, kojo, kwame, kofi] =
    await ethers.getSigners();

  // deploy football score provider

  // deploy football evaluator
  const FootballOverUnderEvaluator = await ethers.getContractFactory(
    "FootballOverUnderEvaluator"
  );

  const evaluator = await FootballOverUnderEvaluator.deploy(provider);

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
});
