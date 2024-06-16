import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployFootballScoreProviderWithKojoReader, deployFootballScoreProviderWithKofiProvder } from "./fixtures";

export async function deployFootballScoreProvider() {
  const [owner, feeAccount, otherAccount, kojo, kwame, kofi] =
    await ethers.getSigners();

  const FootballScoreProvider = await ethers.getContractFactory(
    "FootballScoreProvider"
  );
  const provider = await FootballScoreProvider.deploy();

  await provider.addProvider(owner);
  console.log(await provider.getAddress(), "FootballScoreProvider");

  return {
    owner,
    feeAccount,
    otherAccount,
    kojo,
    kwame,
    kofi,
    provider,
  };
}



describe("FootballScoreProvider", function () {
  describe("Deployment", function () {
    it("Should Deploy Pool", async function () {
      await loadFixture(deployFootballScoreProvider);
    });
  });
  describe("Add Provider", function () {
    it("Should Add Provider", async function () {
      const { provider, kofi } = await loadFixture(deployFootballScoreProvider);
      const newProvider = await kofi.getAddress();
      await provider.addProvider(newProvider);
      expect(await provider.isProvider(newProvider)).to.be.true;
    });
    it("Should Fail to Add Provider", async function () {
      const { provider, otherAccount, kofi } = await loadFixture(
        deployFootballScoreProvider
      );
      const newProvider = await kofi.getAddress();
      await expect(provider.connect(otherAccount).addProvider(newProvider))
        .to.revertedWithCustomError(provider, "OwnableUnauthorizedAccount")
        .withArgs(await otherAccount.getAddress());
      expect(await provider.isProvider(newProvider)).to.be.false;
    });
  });
  describe("Remove Provider", function () {
    it("Should Remove Provider", async function () {
      const { provider, kofi } = await loadFixture(deployFootballScoreProvider);
      const newProvider = await kofi.getAddress();
      await provider.addProvider(newProvider);
      await provider.removeProvider(newProvider);
      expect(await provider.isProvider(newProvider)).to.be.false;
    });
    it("Should Fail to Remove Provider", async function () {
      const { provider, otherAccount, kofi } = await loadFixture(
        deployFootballScoreProvider
      );
      const newProvider = await kofi.getAddress();
      await provider.addProvider(newProvider);
      await expect(provider.connect(otherAccount).removeProvider(newProvider))
        .to.revertedWithCustomError(provider, "OwnableUnauthorizedAccount")
        .withArgs(await otherAccount.getAddress());
      expect(await provider.isProvider(newProvider)).to.be.true;
    });
  });
  describe("Add Reader", function () {
    it("Should Add Reader", async function () {
      const { provider, kofi } = await loadFixture(deployFootballScoreProvider);
      const newReader = await kofi.getAddress();
      await provider.addReader(newReader);
      expect(await provider.isReader(newReader)).to.be.true;
    });
    it("Should Fail to Add Reader", async function () {
      const { provider, otherAccount, kofi } = await loadFixture(
        deployFootballScoreProvider
      );
      const newReader = await kofi.getAddress();
      await expect(provider.connect(otherAccount).addReader(newReader))
        .to.revertedWithCustomError(provider, "OwnableUnauthorizedAccount")
        .withArgs(await otherAccount.getAddress());
      expect(await provider.isReader(newReader)).to.be.false;
    });
  });
  describe("Remove Reader", function () {
    it("Should Remove Reader", async function () {
      const { provider, kofi } = await loadFixture(deployFootballScoreProvider);
      const newReader = await kofi.getAddress();
      await provider.removeReader(newReader);
      expect(await provider.isReader(newReader)).to.be.false;
    });
    it("Should Fail to Remove Reader", async function () {
      const { provider, otherAccount, kofi } = await loadFixture(
        deployFootballScoreProvider
      );
      const newReader = await kofi.getAddress();
      await provider.addReader(newReader);
      await expect(provider.connect(otherAccount).removeReader(newReader))
        .to.revertedWithCustomError(provider, "OwnableUnauthorizedAccount")
        .withArgs(await otherAccount.getAddress());
      expect(await provider.isReader(newReader)).to.be.true;
    });
  });
  describe("Request Data", function () {
    it("Should Request Data", async function () {
      const { provider, kojo } = await loadFixture(
        deployFootballScoreProviderWithKojoReader
      );
      const coder = new ethers.AbiCoder();
      const matchId = 1;
      const param = coder.encode(["uint256"], [matchId]);
      await expect(provider.connect(kojo).requestData(param))
        .to.emit(provider, "FootballScoreRequested")
        .withArgs(await kojo.getAddress(), matchId);
    });
    it("Should Fail to Request Data", async function () {
      const { provider, kofi } = await loadFixture(
        deployFootballScoreProviderWithKojoReader
      );
      const coder = new ethers.AbiCoder();
      const matchId = 1;
      const param = coder.encode(["uint256"], [matchId]);
      await expect(
        provider.connect(kofi).requestData(param)
      ).to.revertedWithCustomError(provider, "ReaderOnly");
    });
  });
  describe("Provide Data", function () {
    it("Should Provide Data", async function () {
      const { provider, kofi } = await loadFixture(
        deployFootballScoreProviderWithKofiProvder
      );
      const coder = new ethers.AbiCoder();
      const matchId = 1;
      const homeScore = 1;
      const awayScore = 2;
      const param = coder.encode(
        ["uint256", "uint256", "uint256"],
        [matchId, homeScore, awayScore]
      );
      await expect(provider.connect(kofi).provideData(param))
        .to.emit(provider, "FootballScoreProvided")
        .withArgs(await kofi.getAddress(), matchId, homeScore, awayScore);
      const matchIdParam = coder.encode(["uint256"], [matchId]);
      const matchData = await provider.getData(matchIdParam);
      const [_homeScore, _awayScore] = coder.decode(
        ["uint256", "uint256"],
        matchData
      );
      expect(_homeScore).to.equals(homeScore);
      expect(_awayScore).to.equals(awayScore);
    });
    it("Should Fail to Provide Data", async function () {
      const { provider, kofi, kojo } = await loadFixture(
        deployFootballScoreProviderWithKofiProvder
      );
      const coder = new ethers.AbiCoder();
      const matchId = 1;
      const homeScore = 1;
      const awayScore = 2;
      const param = coder.encode(
        ["uint256", "uint256", "uint256"],
        [matchId, homeScore, awayScore]
      );
      await expect(
        provider.connect(kojo).provideData(param)
      ).to.revertedWithCustomError(provider, "ProviderOnly");
      const hasParam = coder.encode(["uint256"], [matchId]);
      expect(await provider.connect(kojo).hasData(hasParam)).to.be.false;
    });
  });
  describe("Get Data", function () {
    it("Should Get Data", async function () {
      const { provider, kofi } = await loadFixture(
        deployFootballScoreProviderWithKofiProvder
      );
      const coder = new ethers.AbiCoder();
      const matchId = 1;
      const homeScore = 1;
      const awayScore = 2;
      const param = coder.encode(
        ["uint256", "uint256", "uint256"],
        [matchId, homeScore, awayScore]
      );
      await expect(provider.connect(kofi).provideData(param))
        .to.emit(provider, "FootballScoreProvided")
        .withArgs(await kofi.getAddress(), matchId, homeScore, awayScore);
      const matchIdParam = coder.encode(["uint256"], [matchId]);
      const matchData = await provider.getData(matchIdParam);
      const [ _homeScore, _awayScore] = coder.decode(
        ["uint256", "uint256"],
        matchData
      );
      expect(_homeScore).to.equals(homeScore);
      expect(_awayScore).to.equals(awayScore);
    });
    it("Should Fail to Get Data", async function () {
      const { provider, kofi, kojo } = await loadFixture(
        deployFootballScoreProviderWithKofiProvder
      );
      const coder = new ethers.AbiCoder();
      const matchId = 1;
      const param = coder.encode(["uint256"], [matchId]);
      await expect(provider.connect(kojo).getData(param))
        .to.revertedWithCustomError(provider, "InvalidMatchId")
        .withArgs(matchId);
      expect(await provider.connect(kojo).hasData(param)).to.be.false;
    });
  });
});
