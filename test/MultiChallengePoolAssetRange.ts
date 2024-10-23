import {
  time,
  loadFixture,
  reset,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

async function deployChallengePool() {
  const [
    owner,
    feeAccount,
    otherAccount,
    kojo,
    kwame,
    kofi,
    ama,
    abena,
    adwoa,
    yaa,
  ] = await ethers.getSigners();

  const MultiTopicRegistry = await ethers.getContractFactory(
    "MultiTopicRegistry"
  );
  const registry = await MultiTopicRegistry.deploy();

  const MultiAssetPriceProvider = await ethers.getContractFactory(
    "MultiAssetPriceProvider"
  );
  const assetPriceProvider = await MultiAssetPriceProvider.deploy();

  await assetPriceProvider.addProvider(owner);

  const MultiAssetRangeEvaluator = await ethers.getContractFactory(
    "MultiAssetRangeEvaluator"
  );

  const assetRangeEvaluator = await MultiAssetRangeEvaluator.deploy(
    await assetPriceProvider.getAddress()
  );

  await assetPriceProvider.addReader(await assetRangeEvaluator.getAddress());

  await assetPriceProvider.addProvider(await kofi.getAddress());

  await registry.createTopic(
    "Asset Range",
    "Asset Prices Range",
    await assetRangeEvaluator.getAddress()
  ); // 0

  const topicIds = {
    general: BigInt(0),
  };
  // deploy test balls
  const BallsToken = await ethers.getContractFactory("BallsToken");
  const ballsToken = await BallsToken.deploy();

  const ONE_HOUR = 60 * 60;
  const ONE_DAY = ONE_HOUR * 24;
  const ONE_WEEK = ONE_DAY * 7;

  const joinPoolFee = 30;
  const createPoolFee = 50;
  const joinPeriod = 10000;
  const maxMaturityPeriod = ONE_WEEK * 12;
  const maxPlayersPerPool = 100;
  const minStakeAmount = BigInt(100 * 1e18);
  const maxOptionsPerPool = 100;
  const minMaturityPeriod = ONE_HOUR;
  const maxStaleRetries = 3;
  const staleExtensionPeriod = ONE_HOUR;
  const feeAddress = feeAccount;
  const balls = ballsToken;
  const topicRegistry = registry;

  // deploy challenge

  const ChallengePool = await ethers.getContractFactory("MultiChallengePool");
  const pool = await ChallengePool.deploy(
    joinPoolFee,
    createPoolFee,
    joinPeriod,
    maxMaturityPeriod,
    maxPlayersPerPool,
    minStakeAmount,
    maxOptionsPerPool,
    minMaturityPeriod,
    maxStaleRetries,
    staleExtensionPeriod,
    feeAddress,
    topicRegistry,
    balls
  );

  return {
    registry,
    owner,
    feeAccount,
    otherAccount,
    kojo,
    kwame,
    kofi,
    assetRangeEvaluator,
    assetPriceProvider,
    ballsToken,
    pool,
    topicIds,
    ama,
    abena,
    adwoa,
    yaa,
  };
}

async function deployCreateChallenges() {
  const {
    registry,
    owner,
    feeAccount,
    otherAccount,
    kojo,
    kwame,
    kofi,
    assetPriceProvider,
    ballsToken,
    pool,
    topicIds,
    ama,
    abena,
    adwoa,
    yaa,
  } = await loadFixture(deployChallengePool);

  const coder = new ethers.AbiCoder();
  const assetSymbol = "BTC";
  const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 100;
  const options = [
    [BigInt(60000), BigInt(65000)],
    [BigInt(66000), BigInt(70000)],
    [BigInt(71000), BigInt(75000)],
    [BigInt(76000), BigInt(80000)],
  ].map((o) => coder.encode(["uint256", "uint256"], o));
  const param1 = coder.encode(["string"], [assetSymbol]);
  const price = BigInt(77000);
  const result = coder.encode(
    ["uint256", "uint256"],
    [BigInt(76000), BigInt(80000)]
  );
  const dataProvided = coder.encode(
    ["string", "uint256", "uint256"],
    [assetSymbol, maturity, price]
  );
  const param2 = coder.encode(
    ["string", "uint256"],
    [assetSymbol, maturity]
  );
  const airDropBalls = BigInt(10000 * 1e18);

  await ballsToken.transfer(otherAccount, airDropBalls);

  const pollParam = param1;
  const pollTopicId = topicIds.general;
  const pollMaturity = maturity;
  const pollOptions = options;
  const userPrediction = coder.encode(
    ["uint256", "uint256"],
    [BigInt(76000), BigInt(80000)]
  );
  const ticketQuantity = BigInt(1);
  const poolStake = BigInt(1000 * 1e18);
  const createStakeFee = await pool.createAmountAndFee(poolStake);
  const joinStakeFee = await pool.joinAmountAndFee(poolStake);

  await ballsToken.connect(otherAccount).approve(pool, createStakeFee);

  await expect(
    pool
      .connect(otherAccount)
      .createChallenge(
        pollParam,
        pollTopicId,
        pollMaturity,
        pollOptions,
        userPrediction,
        ticketQuantity,
        poolStake
      )
  ).emit(pool, "NewChallengePool"); // creates challenge 0

  return {
    registry,
    owner,
    feeAccount,
    otherAccount,
    kojo,
    kwame,
    kofi,
    assetPriceProvider,
    assetSymbol,
    maturity,
    ballsToken,
    pool,
    topicIds,
    airDropBalls,
    createStakeFee,
    joinStakeFee,
    poolStake,
    ticketQuantity,
    userPrediction,
    param1,
    param2,
    price,
    options,
    ama,
    abena,
    adwoa,
    yaa,
    dataProvided,
    result
  };
}

describe("MultiChallengePoolAssetRange", function () {
  before(function () {
    // runs once before the first test in this block
    reset();
  });
  describe("Deployment", function () {
    it("Should Deploy Pool", async function () {
      await loadFixture(deployChallengePool);
    });
  });
  describe("Create Challenge", function () {
    it("Should Create Challenge", async function () {
      await loadFixture(deployCreateChallenges);
    });
    it("Should Fail to Create Challenge", async function () {
      const { otherAccount, pool, topicIds, assetSymbol, param1, options } =
        await loadFixture(deployCreateChallenges);
      const coder = new ethers.AbiCoder();
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 100;

      const pollParam = param1;
      const pollTopicId = topicIds.general;
      const pollMaturity = maturity;
      const pollOptions = options;
      const userPrediction = coder.encode(
        ["uint256", "uint256"],
        [BigInt(76000), BigInt(80000)]
      );
      const ticketQuantity = BigInt(1);
      const poolStake = BigInt(1000 * 1e18);
      const bigPoolStake = BigInt(10000 * 1e18);
      const invalidUserPrediction = coder.encode(
        ["uint256", "uint256"],
        [BigInt(80000), BigInt(90000)]
      );
      const invalidPollOptionsLength = Array.from(
        { length: 101 },
        (_, i) => options[0]
      );
      const invalidPollParam = [
        coder.encode(["uint256", "uint256"], [BigInt(60000), BigInt(65000)]),
        coder.encode(["uint256", "uint256"], [BigInt(66000), BigInt(70000)]),
        coder.encode(["uint256", "uint256"], [BigInt(76000), BigInt(70000)]),
      ];
      const invalidPollOption = [
        coder.encode(["uint256", "uint256"], [BigInt(60000), BigInt(65000)]),
        coder.encode(["uint256", "uint256"], [BigInt(76000), BigInt(80000)]),
        ethers.toUtf8Bytes(""),
      ];
      await expect(
        pool
          .connect(otherAccount)
          .createChallenge(
            pollParam,
            pollTopicId,
            pollMaturity,
            pollOptions,
            userPrediction,
            ticketQuantity,
            bigPoolStake
          )
      ).to.revertedWithCustomError(pool, "UserLacksBalls");
      await expect(
        pool
          .connect(otherAccount)
          .createChallenge(
            pollParam,
            pollTopicId,
            pollMaturity,
            pollOptions,
            invalidUserPrediction,
            ticketQuantity,
            poolStake
          )
      ).to.revertedWithCustomError(pool, "InvalidPrediction");

      await expect(
        pool
          .connect(otherAccount)
          .createChallenge(
            pollParam,
            pollTopicId,
            pollMaturity,
            invalidPollOptionsLength,
            userPrediction,
            ticketQuantity,
            poolStake
          )
      ).to.revertedWithCustomError(pool, "InvalidOptionsLength");

      await expect(
        pool
          .connect(otherAccount)
          .createChallenge(
            pollParam,
            pollTopicId,
            pollMaturity,
            invalidPollParam,
            userPrediction,
            ticketQuantity,
            poolStake
          )
      ).to.revertedWithCustomError(pool, "InvalidPollParam");

      await expect(
        pool
          .connect(otherAccount)
          .createChallenge(
            pollParam,
            pollTopicId,
            pollMaturity,
            invalidPollOption,
            userPrediction,
            ticketQuantity,
            poolStake
          )
      ).to.revertedWithCustomError(pool, "InvalidPollParam");
    });
  });
  describe("Join Challenge", function () {
    it("Should Join Challenge", async function () {
      const { ama, kofi, ballsToken, pool, airDropBalls, joinStakeFee } =
        await loadFixture(deployCreateChallenges);
      const coder = new ethers.AbiCoder();

      const kofiPrediction = coder.encode(
        ["uint256", "uint256"],
        [BigInt(60000), BigInt(65000)]
      );

      const amaPrediction = coder.encode(
        ["uint256", "uint256"],
        [BigInt(66000), BigInt(70000)]
      );

      await ballsToken.transfer(kofi, airDropBalls);

      await ballsToken.connect(kofi).approve(pool, joinStakeFee);

      await ballsToken.transfer(ama, airDropBalls);

      await ballsToken.connect(ama).approve(pool, joinStakeFee);

      await expect(pool.connect(kofi).joinChallenge(0, kofiPrediction, 1)).emit(
        pool,
        "JoinChallengePool"
      );
      await expect(pool.connect(ama).joinChallenge(0, amaPrediction, 1)).emit(
        pool,
        "JoinChallengePool"
      );
    });
    it("Should Fail to Join Challenge", async function () {
      const { yaa, abena, ballsToken, pool, airDropBalls, joinStakeFee } =
        await loadFixture(deployCreateChallenges);
      const coder = new ethers.AbiCoder();
      const abenaPrediction = coder.encode(
        ["uint256", "uint256"],
        [BigInt(60000), BigInt(65000)]
      );

      await ballsToken.transfer(abena, airDropBalls);

      await ballsToken.connect(abena).approve(pool, joinStakeFee);

      await expect(
        pool.connect(abena).joinChallenge(0, ethers.toUtf8Bytes(""), 1)
      ).revertedWithCustomError(pool, "InvalidPrediction");

      await expect(
        pool
          .connect(abena)
          .joinChallenge(
            1,
            coder.encode(
              ["uint256", "uint256"],
              [BigInt(66000), BigInt(70000)]
            ),
            1
          )
      ).revertedWithCustomError(pool, "InvalidChallenge");

      await expect(
        pool
          .connect(yaa)
          .joinChallenge(
            0,
            coder.encode(
              ["uint256", "uint256"],
              [BigInt(60000), BigInt(65000)]
            ),
            100
          )
      ).revertedWithCustomError(pool, "UserLacksBalls");

      await expect(
        pool.connect(abena).joinChallenge(0, abenaPrediction, 1)
      ).emit(pool, "JoinChallengePool");
      await ballsToken.connect(abena).approve(pool, joinStakeFee);
      await expect(
        pool.connect(abena).joinChallenge(0, abenaPrediction, 1)
      ).revertedWithCustomError(pool, "PlayerAlreadyInPool");
      // await time.increase(60 * 60 * 101);
      // await expect(pool.connect(abena).joinChallenge(0, abenaPrediction, 1))
      //   .revertedWithCustomError(pool, "ActionNotAllowedForState")
      //   .withArgs(6);
    });
  });
  describe("Close Challenge", function () {
    it("Should Close Challenge", async function () {
      const {
        kojo,
        assetPriceProvider,
        assetSymbol,
        ballsToken,
        pool,
        airDropBalls,
        joinStakeFee,
        owner,
        adwoa,
        param2,
        result,
        price,
        maturity,
        dataProvided
      } = await loadFixture(deployCreateChallenges);
      const coder = new ethers.AbiCoder();
      const adwoaPrediction = coder.encode(
        ["uint256", "uint256"],
        [BigInt(60000), BigInt(65000)]
      );

      await ballsToken.transfer(adwoa, airDropBalls);

      await ballsToken.connect(adwoa).approve(pool, joinStakeFee);

      await expect(
        pool.connect(adwoa).joinChallenge(0, adwoaPrediction, 1)
      ).emit(pool, "JoinChallengePool");

      await time.increase(60 * 60 * 101);
      await expect(assetPriceProvider.provideData(dataProvided))
        .to.emit(assetPriceProvider, "MultiAssetPriceProvided")
        .withArgs(await owner.getAddress(), assetSymbol,maturity, price);
      const priceData = await assetPriceProvider
        .connect(adwoa)
        .getData(param2);
      const [_price] = coder.decode(["uint256"], priceData);

      expect(_price).equals(price);

      await expect(pool.connect(kojo).closeChallenge(0))
        .emit(pool, "ClosedChallengePool")
        .withArgs(0, await kojo.getAddress(), 1, result);
    });
    it("Should Fail to Close Challenge", async function () {
      const { ballsToken, pool, airDropBalls, joinStakeFee, adwoa } =
        await loadFixture(deployCreateChallenges);
      const coder = new ethers.AbiCoder();
      const adwoaPrediction = coder.encode(
        ["uint256", "uint256"],
        [BigInt(60000), BigInt(65000)]
      );

      await ballsToken.transfer(adwoa, airDropBalls);

      await ballsToken.connect(adwoa).approve(pool, joinStakeFee);

      await expect(
        pool.connect(adwoa).joinChallenge(0, adwoaPrediction, 1)
      ).emit(pool, "JoinChallengePool");

      await expect(pool.connect(adwoa).closeChallenge(0))
        .revertedWithCustomError(pool, "ActionNotAllowedForState")
        .withArgs(0);
      await expect(
        pool.connect(adwoa).closeChallenge(99)
      ).revertedWithCustomError(pool, "InvalidChallenge");

      await time.increase(60 * 60 * 101);
      await expect(pool.connect(adwoa).closeChallenge(0))
        .emit(pool, "StaleChallengePool")
        .withArgs(
          0,
          await adwoa.getAddress(),
          BigInt(await time.latest()) +
            (await pool.staleExtensionPeriod()) +
            BigInt(1),
          1,
          2
        );
      await expect(pool.connect(adwoa).closeChallenge(0))
        .revertedWithCustomError(pool, "NextStalePoolRetryNotReached")
        .withArgs(1);
      await time.increase(60 * 60 * 1);
      await expect(pool.connect(adwoa).closeChallenge(0))
        .emit(pool, "StaleChallengePool")
        .withArgs(
          0,
          await adwoa.getAddress(),
          BigInt(await time.latest()) +
            (await pool.staleExtensionPeriod()) +
            BigInt(1),
          2,
          2
        );
      await expect(pool.connect(adwoa).closeChallenge(0))
        .revertedWithCustomError(pool, "NextStalePoolRetryNotReached")
        .withArgs(2);
      await time.increase(60 * 60 * 1);
      await expect(pool.connect(adwoa).closeChallenge(0))
        .emit(pool, "StaleChallengePool")
        .withArgs(
          0,
          await adwoa.getAddress(),
          BigInt(await time.latest()) +
            (await pool.staleExtensionPeriod()) +
            BigInt(1),
          3,
          2
        );
      await expect(pool.connect(adwoa).closeChallenge(0))
        .revertedWithCustomError(pool, "NextStalePoolRetryNotReached")
        .withArgs(3);
      await time.increase(60 * 60 * 1);
      await expect(pool.connect(adwoa).closeChallenge(0))
        .emit(pool, "ManualChallengePool")
        .withArgs(0, await adwoa.getAddress(), 3);
      await expect(pool.connect(adwoa).closeChallenge(0))
        .revertedWithCustomError(pool, "ActionNotAllowedForState")
        .withArgs(3);
    });
  });
  describe("Withdraw Winnings", function () {
    it("Should Withdraw Winnings", async function () {
      const {
        otherAccount,
        kojo,
        kwame,
        ballsToken,
        pool,
        airDropBalls,
        assetPriceProvider,
        assetSymbol,
        joinStakeFee,
        adwoa,
        param2,
        price,
        result,
        owner,
        poolStake,
        maturity,
        dataProvided
      } = await loadFixture(deployCreateChallenges);
      const coder = new ethers.AbiCoder();
      const kwamePrediction = coder.encode(
        ["uint256", "uint256"],
        [BigInt(66000), BigInt(70000)]
      );
      await ballsToken.transfer(kwame, airDropBalls);

      await ballsToken.connect(kwame).approve(pool, joinStakeFee);

      await expect(
        pool.connect(kwame).joinChallenge(0, kwamePrediction, 1)
      ).emit(pool, "JoinChallengePool");
      const adwoaPrediction = coder.encode(
        ["uint256", "uint256"],
        [BigInt(60000), BigInt(65000)]
      );

      await ballsToken.transfer(adwoa, airDropBalls);

      await ballsToken.connect(adwoa).approve(pool, joinStakeFee);

      await expect(
        pool.connect(adwoa).joinChallenge(0, adwoaPrediction, 1)
      ).emit(pool, "JoinChallengePool");

      await time.increase(60 * 60 * 101);
      await expect(assetPriceProvider.provideData(dataProvided))
        .to.emit(assetPriceProvider, "MultiAssetPriceProvided")
        .withArgs(await owner.getAddress(), assetSymbol, maturity, price);
      const priceData = await assetPriceProvider
        .connect(adwoa)
        .getData(param2);
      const [_price] = coder.decode(["uint256"], priceData);

      expect(_price).equals(price);

      await expect(pool.connect(kojo).closeChallenge(0))
        .emit(pool, "ClosedChallengePool")
        .withArgs(0, await kojo.getAddress(), 1, result);

      await expect(pool.connect(otherAccount).withdrawWinnings(0))
        .emit(pool, "WinningsWithdrawn")
        .withArgs(
          await otherAccount.getAddress(),
          0,
          BigInt(3) * poolStake,
          BigInt(2) * poolStake
        );
    });
    it("Should Fail to Withdraw Winnings", async function () {
      const {
        otherAccount,
        kojo,
        kwame,
        ballsToken,
        pool,
        airDropBalls,
        assetPriceProvider,
        assetSymbol,
        joinStakeFee,
        adwoa,
        param2,
        price,
        param1,
        owner,
        poolStake,
        maturity,
        dataProvided,
        result
      } = await loadFixture(deployCreateChallenges);
      const coder = new ethers.AbiCoder();
      const kwamePrediction = coder.encode(
        ["uint256", "uint256"],
        [BigInt(66000), BigInt(70000)]
      );
      await ballsToken.transfer(kwame, airDropBalls);

      await ballsToken.connect(kwame).approve(pool, joinStakeFee);

      await expect(
        pool.connect(kwame).joinChallenge(0, kwamePrediction, 1)
      ).emit(pool, "JoinChallengePool");

      const adwoaPrediction = coder.encode(
        ["uint256", "uint256"],
        [BigInt(60000), BigInt(65000)]
      );

      await ballsToken.transfer(adwoa, airDropBalls);

      await ballsToken.connect(adwoa).approve(pool, joinStakeFee);

      await expect(
        pool.connect(adwoa).joinChallenge(0, adwoaPrediction, 1)
      ).emit(pool, "JoinChallengePool");

      await time.increase(60 * 60 * 101);
      await expect(assetPriceProvider.provideData(dataProvided))
        .to.emit(assetPriceProvider, "MultiAssetPriceProvided")
        .withArgs(await owner.getAddress(), assetSymbol,maturity, price);
      const priceData = await assetPriceProvider
        .connect(adwoa)
        .getData(param2);
      const [_price] = coder.decode(["uint256"], priceData);

      expect(_price).equals(price);

      await expect(pool.connect(kojo).closeChallenge(0))
        .emit(pool, "ClosedChallengePool")
        .withArgs(0, await kojo.getAddress(), 1, result);

      await expect(pool.connect(otherAccount).withdrawWinnings(0))
        .emit(pool, "WinningsWithdrawn")
        .withArgs(
          await otherAccount.getAddress(),
          0,
          BigInt(3) * poolStake,
          BigInt(2) * poolStake
        );
      await expect(
        pool.connect(otherAccount).withdrawWinnings(0)
      ).revertedWithCustomError(pool, "PlayerWinningAlreadyWithdrawn");
      await expect(
        pool.connect(kwame).withdrawWinnings(0)
      ).revertedWithCustomError(pool, "PlayerDidNotWinPool");
      await expect(
        pool.connect(kojo).withdrawWinnings(0)
      ).revertedWithCustomError(pool, "PlayerNotInPool");
    });
  });
});