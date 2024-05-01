import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

import { assert } from "chai";

describe("Token contract", function () {
  it("Deployment", async function () {
    const [owner] = await ethers.getSigners();

    const TopicRegistry = await ethers.deployContract("TopicRegistry");

    const ChallengePool = await ethers.deployContract("ChallengePool", [
      TopicRegistry.getAddress(),
    ]);

    const PoolManager = await ethers.deployContract("PoolManager", [
      ChallengePool.getAddress(),
    ]);

    const SymbolFeedUSD = await ethers.deployContract("SymbolFeedUSD");

    await SymbolFeedUSD.setSymbols(
      ["BTC"],
      ["0xC16679B963CeB52089aD2d95312A5b85E318e9d2"]
    );

    const AssetPrice = await ethers.deployContract("AssetPrice", [
      SymbolFeedUSD.getAddress(),
    ]);

    await TopicRegistry.createTopic(
      "A",
      "ABC",
      owner.address,
      AssetPrice.getAddress()
    );

    const stake = 1_000_000_000;

    const maturity = 1694250009 + 2;

    await ChallengePool.createChallenge(0, maturity, "BTC", 2586755000000, {
      value: stake,
    });

    await ChallengePool.joinChallenge(0, 2586756000000, {
      value: stake,
    });

    await ChallengePool.joinChallenge(0, 2586757000000, {
      value: stake,
    });

    const res = await ChallengePool.getTopicChallenge(0);

    console.log(res);

    await ChallengePool.joinChallenge(0, 2586757000000, {
        value: stake,
      });

    await time.increaseTo(maturity);

    const pools = await ChallengePool.getMaturePools();

    const pm = await PoolManager.checkUpkeep(
      "0x5fc8d32690cc91d4c39d9d3abcbd16989f875707"
    );

    console.log(pm);
    if (pm[0]) {
      await PoolManager.performUpkeep(pm[1]);
    }

    console.log(pools);
    assert(true);
  });
});
