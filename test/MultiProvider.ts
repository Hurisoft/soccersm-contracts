import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

export async function deployMultiProvider() {
  const [owner, feeAccount, otherAccount, kojo, kwame, kofi] =
    await ethers.getSigners();

  const MultiProvider = await ethers.getContractFactory("MultiProvider");

  const multiProvider = await MultiProvider.deploy();

  await multiProvider.addProvider(owner);

  const AssetPriceProvider = await ethers.getContractFactory(
    "AssetPriceProvider"
  );
  const assetProvider = await AssetPriceProvider.deploy();

  await assetProvider.addProvider(await multiProvider.getAddress());

  const FootballScoreProvider = await ethers.getContractFactory(
    "FootballScoreProvider"
  );
  const footballProvider = await FootballScoreProvider.deploy();

  await footballProvider.addProvider(await multiProvider.getAddress());

  return {
    owner,
    feeAccount,
    otherAccount,
    kojo,
    kwame,
    kofi,
    assetProvider,
    multiProvider,
    footballProvider,
  };
}

describe("MultiProvider", function () {
  describe("Deployment", function () {
    it("Should Deploy Pool", async function () {
      await loadFixture(deployMultiProvider);
    });
  });
  describe("Provide Data", function () {
    it("Should Provide Data", async function () {
      const { assetProvider, multiProvider, footballProvider, kofi, owner } =
        await loadFixture(deployMultiProvider);
      const coder = new ethers.AbiCoder();
      const assetSymbol = "BTC";
      const date = Math.floor(Date.now() / 1000) - 60 * 60 * 2;
      const price = BigInt(60000 * 1e9);
      const matchId = 1;
      const homeScore = 1;
      const awayScore = 2;
      const footballParam = coder.encode(
        ["uint256", "uint256", "uint256"],
        [matchId, homeScore, awayScore]
      );
      const assetParam = coder.encode(
        ["string", "uint256", "uint256"],
        [assetSymbol, date, price]
      );
      const assetProviderParam = coder.encode(
        ["address", "bytes"],
        [await assetProvider.getAddress(), assetParam]
      );
      const footballProviderParam = coder.encode(
        ["address", "bytes"],
        [await footballProvider.getAddress(), footballParam]
      );
      await expect(
        multiProvider.provideMultiData([
          assetProviderParam,
          footballProviderParam,
        ])
      )
        .to.emit(multiProvider, "MultiDataProvided")
        .withArgs(await owner.getAddress());
      const assetDateParam = coder.encode(
        ["string", "uint256"],
        [assetSymbol, date]
      );
      const assetData = await assetProvider.getData(assetDateParam);

      const [_price] = coder.decode(["uint256"], assetData);

      expect(BigInt(_price)).to.equals(price);
      expect(await assetProvider.hasData(assetDateParam)).to.be.true;

      const matchIdParam = coder.encode(["uint256"], [matchId]);
      const matchData = await footballProvider.getData(matchIdParam);
      const [_homeScore, _awayScore] = coder.decode(
        ["uint256", "uint256"],
        matchData
      );
      expect(_homeScore).to.equals(homeScore);
      expect(_awayScore).to.equals(awayScore);
    });
    it("Should Fail to Provide Data", async function () {});
  });
});
