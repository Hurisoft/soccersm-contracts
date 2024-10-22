import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

async function deployChallengePool() {
  const [owner, feeAccount, otherAccount, kojo, kwame, kofi] =
    await ethers.getSigners();

  const TopicRegistry = await ethers.getContractFactory("TopicRegistry");
  const registry = await TopicRegistry.deploy();

  const FootballScoreProvider = await ethers.getContractFactory(
    "FootballScoreProvider"
  );
  const footBallScoreProvider = await FootballScoreProvider.deploy();

  await footBallScoreProvider.addProvider(owner);

  const FootballOutcomeEvaluator = await ethers.getContractFactory(
    "FootballOutcomeEvaluator"
  );

  const footBallOutcomeEvaluator = await FootballOutcomeEvaluator.deploy(
    footBallScoreProvider
  );

  await footBallScoreProvider.addReader(
    await footBallOutcomeEvaluator.getAddress()
  );

  const FootballOverUnderEvaluator = await ethers.getContractFactory(
    "FootballOverUnderEvaluator"
  );

  const footBallOverUnderEvaluator = await FootballOverUnderEvaluator.deploy(
    footBallScoreProvider
  );

  await footBallScoreProvider.addReader(
    await footBallOverUnderEvaluator.getAddress()
  );

  const FootBallCorrectScoreEvaluator = await ethers.getContractFactory(
    "FootBallCorrectScoreEvaluator"
  );

  const footBallCorrectScoreEvaluator =
    await FootBallCorrectScoreEvaluator.deploy(footBallScoreProvider);

  await footBallScoreProvider.addReader(
    await footBallCorrectScoreEvaluator.getAddress()
  );

  const AssetPriceProvider = await ethers.getContractFactory(
    "AssetPriceProvider"
  );
  const assetPriceProvider = await AssetPriceProvider.deploy();

  await assetPriceProvider.addProvider(owner);

  const AssetPriceBoundedEvaluator = await ethers.getContractFactory(
    "AssetPriceBoundedEvaluator"
  );

  const assetPriceBoundedEvaluator = await AssetPriceBoundedEvaluator.deploy(
    assetPriceProvider
  );

  await assetPriceProvider.addReader(
    await assetPriceBoundedEvaluator.getAddress()
  );

  const AssetPriceTargetEvaluator = await ethers.getContractFactory(
    "AssetPriceTargetEvaluator"
  );

  const assetPriceTargetEvaluator = await AssetPriceTargetEvaluator.deploy(
    assetPriceProvider
  );

  await assetPriceProvider.addReader(
    await assetPriceTargetEvaluator.getAddress()
  );

  const GeneralStatementProvider = await ethers.getContractFactory(
    "GeneralStatementProvider"
  );
  const generalStatementProvider = await GeneralStatementProvider.deploy();

  await generalStatementProvider.addProvider(owner);
  const GeneralStatementEvaluator = await ethers.getContractFactory(
    "GeneralStatementEvaluator"
  );

  const generalStatementEvaluator = await GeneralStatementEvaluator.deploy(
    await generalStatementProvider.getAddress()
  );

  await generalStatementProvider.addReader(
    await generalStatementEvaluator.getAddress()
  );

  await assetPriceProvider.addProvider(await kofi.getAddress());
  await footBallScoreProvider.addProvider(await kofi.getAddress());
  await generalStatementProvider.addProvider(await kofi.getAddress());

  await registry.createTopic(
    "Football Outcome Events",
    "Outcome of football match; home, away, win, home-away, home-draw, away-draw",
    await footBallOutcomeEvaluator.getAddress()
  ); // id 0
  await registry.createTopic(
    "Football Over/Under Events",
    "Whether total goals will be over or under a given value. Values are 1.5, 2.5, 3.5 and 4.5",
    await footBallOverUnderEvaluator.getAddress()
  ); // id 1
  await registry.createTopic(
    "Football Correct Score Events",
    "The correct score of a football match",
    await footBallCorrectScoreEvaluator.getAddress()
  ); // 2
  await registry.createTopic(
    "Asset Price Bounded",
    "Whether asset price will fall within a given bound",
    await assetPriceBoundedEvaluator.getAddress()
  ); // 3
  await registry.createTopic(
    "Asset Price Target",
    "Whether asset price be above or below a given amount",
    await assetPriceTargetEvaluator.getAddress()
  ); // 4
  await registry.createTopic(
    "General Statement",
    "Any and all statements",
    await generalStatementEvaluator.getAddress()
  ); // 5

  const topicIds = {
    outcome: 0,
    overUnder: 1,
    correctScore: 2,
    boundedPrice: 3,
    targetPrice: 4,
    general: 5,
  };
  // deploy test balls
  const BallsToken = await ethers.getContractFactory("BallsToken");
  const ballsToken = await BallsToken.deploy();

  const ONE_HOUR = 60 * 60;
  const ONE_DAY = ONE_HOUR * 24;
  const ONE_WEEK = ONE_DAY * 7;

  const poolFee = 10;
  const joinPeriod = 9000;
  const maxMaturityPeriod = ONE_WEEK * 12;
  const maxPlayersPerPool = 100;
  const minStakeAmount = BigInt(100 * 1e18);
  const maxEventsPerChallenge = 10;
  const minMaturityPeriod = ONE_HOUR;
  const maxStaleRetries = 3;
  const staleExtensionPeriod = ONE_HOUR;
  const feeAddress = feeAccount;
  const balls = ballsToken;
  const topicRegistry = registry;

  // deploy challenge

  const ChallengePool = await ethers.getContractFactory("ChallengePool");
  const pool = await ChallengePool.deploy(
    poolFee,
    joinPeriod,
    maxMaturityPeriod,
    maxPlayersPerPool,
    minStakeAmount,
    maxEventsPerChallenge,
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
    assetPriceProvider,
    footBallOutcomeEvaluator,
    footBallOverUnderEvaluator,
    footBallScoreProvider,
    footBallCorrectScoreEvaluator,
    assetPriceBoundedEvaluator,
    assetPriceTargetEvaluator,
    generalStatementEvaluator,
    generalStatementProvider,
    ballsToken,
    pool,
    topicIds,
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
    footBallOutcomeEvaluator,
    footBallOverUnderEvaluator,
    footBallScoreProvider,
    footBallCorrectScoreEvaluator,
    assetPriceBoundedEvaluator,
    assetPriceTargetEvaluator,
    generalStatementProvider,
    ballsToken,
    pool,
    topicIds,
  } = await loadFixture(deployChallengePool);

  const coder = new ethers.AbiCoder();
  const matchId = 88;

  const outcome1 = "home";
  const maturity1 = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
  const eventParam1 = coder.encode(["uint256", "string"], [matchId, outcome1]);
  const challengeEvent1 = {
    eventParam: eventParam1,
    topicId: topicIds.outcome,
    maturity: maturity1,
  };

  const predictedTotal = 4;
  const outcome2 = "over";
  const maturity2 = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
  const eventParam2 = coder.encode(
    ["uint256", "uint256", "string"],
    [matchId, predictedTotal, outcome2]
  );
  const challengeEvent2 = {
    eventParam: eventParam2,
    topicId: topicIds.overUnder,
    maturity: maturity2,
  };

  const predictedHomeScore = 3;
  const predictedAwayScore = 2;

  const maturity3 = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
  const eventParam3 = coder.encode(
    ["uint256", "uint256", "uint256"],
    [matchId, predictedHomeScore, predictedAwayScore]
  );
  const challengeEvent3 = {
    eventParam: eventParam3,
    topicId: topicIds.correctScore,
    maturity: maturity3,
  };

  const assetSymbol = "XRP";
  const date = Math.floor(Date.now() / 1000) + 60 * 60 * 2;

  const outcome4 = "in";
  const priceLowerBound = BigInt(60000);
  const priceUpperBound = BigInt(100000);
  const eventParam4 = coder.encode(
    ["string", "uint256", "uint256", "string"],
    [assetSymbol, priceLowerBound, priceUpperBound, outcome4]
  );

  const challengeEvent4 = {
    eventParam: eventParam4,
    topicId: topicIds.boundedPrice,
    maturity: date,
  };

  const outcome = "above";
  const predictedPrice = BigInt(1000);
  const eventParam5 = coder.encode(
    ["string", "uint256", "string"],
    [assetSymbol, predictedPrice, outcome]
  );
  const challengeEvent5 = {
    eventParam: eventParam5,
    topicId: topicIds.targetPrice,
    maturity: date,
  };

  const statementId = 101;
  const statement = "Trump will win!";
  const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
  const result = 0;
  const dataProvided = coder.encode(
    ["uint256", "string", "uint256", "uint8"],
    [statementId, statement, maturity, result]
  );
  const eventParam6 = coder.encode(["uint256"], [statementId]);
  await expect(generalStatementProvider.provideData(dataProvided))
    .to.emit(generalStatementProvider, "GeneralStatementProvided")
    .withArgs(await owner.getAddress(), statementId, statement, result);
  const statementData = await generalStatementProvider
    .connect(kwame)
    .getData(eventParam6);
  const [_result2] = coder.decode(["uint256"], statementData);

  expect(_result2).equals(result);
  const challengeEvent6 = {
    eventParam: eventParam6,
    topicId: topicIds.general,
    maturity,
  };

  const challenges = [
    challengeEvent1,
    challengeEvent2,
    challengeEvent3,
    challengeEvent4,
    challengeEvent5,
    challengeEvent6,
  ];

  const _eventsParams = [];
  const _eventsMaturity = [];
  const _eventsTopics = [];

  for (const ch of challenges) {
    _eventsParams.push(ch.eventParam);
    _eventsMaturity.push(ch.maturity);
    _eventsTopics.push(ch.topicId);
  }

  const stake = BigInt(1000 * 1e18); // balls
  const stkFee = await pool.stakeAmountAndFee(stake);
  const prediction = 1; // yes

  const airDropBalls = BigInt(10000 * 1e18);

  await ballsToken.transfer(otherAccount, airDropBalls);

  await ballsToken.connect(otherAccount).approve(pool, stkFee);

  await expect(
    pool
      .connect(otherAccount)
      .createChallenge(
        _eventsParams,
        _eventsMaturity,
        _eventsTopics,
        prediction,
        stake
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
    footBallOutcomeEvaluator,
    footBallOverUnderEvaluator,
    footBallScoreProvider,
    footBallCorrectScoreEvaluator,
    assetPriceBoundedEvaluator,
    assetPriceTargetEvaluator,
    generalStatementProvider,
    statement,
    statementId,
    maturity,
    ballsToken,
    pool,
    topicIds,
    airDropBalls,
    stkFee,
    stake,
    matchId,
    assetSymbol,
    date,
  };
}

describe("ChallengePool", function () {
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
      const { otherAccount, pool, topicIds } = await loadFixture(
        deployCreateChallenges
      );
      const coder = new ethers.AbiCoder();
      const matchId = 99;

      const outcome1 = "home";
      const maturity1 = [Math.floor(Date.now() / 1000) + 60 * 60 * 6];
      const eventParam1 = [
        coder.encode(["uint256", "string"], [matchId, outcome1]),
      ];
      const topicId1 = [topicIds.outcome];
      await expect(
        pool
          .connect(otherAccount)
          .createChallenge(
            eventParam1,
            maturity1,
            topicId1,
            1,
            BigInt(10000 * 1e18)
          )
      ).to.revertedWithCustomError(pool, "UserLacksBalls");
      await expect(
        pool
          .connect(otherAccount)
          .createChallenge(
            eventParam1,
            maturity1,
            topicId1,
            0,
            BigInt(10000 * 1e18)
          )
      ).to.revertedWithCustomError(pool, "InvalidPrediction");
      const eventParam2 = Array.from({ length: 11 }, (_, i) => eventParam1[0]);
      const maturity2 = Array.from({ length: 11 }, (_, i) => maturity1[0]);
      const topicId2 = Array.from({ length: 11 }, (_, i) => topicId1[0]);

      await expect(
        pool
          .connect(otherAccount)
          .createChallenge(
            eventParam2,
            maturity2,
            topicId2,
            1,
            BigInt(10000 * 1e18)
          )
      ).to.revertedWithCustomError(pool, "InvalidEventsLength");

      const eventParam3 = Array.from({ length: 10 }, (_, i) => eventParam1[0]);
      const maturity3 = Array.from({ length: 9 }, (_, i) => maturity1[0]);
      const topicId3 = Array.from({ length: 10 }, (_, i) => topicId1[0]);

      await expect(
        pool
          .connect(otherAccount)
          .createChallenge(
            eventParam3,
            maturity3,
            topicId3,
            1,
            BigInt(10000 * 1e18)
          )
      )
        .to.revertedWithCustomError(pool, "InvalidLengthForEvent")
        .withArgs(eventParam3.length, maturity3.length, topicId3.length);
      await expect(
        pool
          .connect(otherAccount)
          .createChallenge(eventParam1, maturity1, [9], 1, BigInt(1000 * 1e18))
      ).to.revertedWithCustomError(pool, "InvalidEventTopic");
      const maturity4 = [Math.floor(Date.now() / 1000)];
      await expect(
        pool
          .connect(otherAccount)
          .createChallenge(
            eventParam1,
            maturity4,
            topicId1,
            1,
            BigInt(1000 * 1e18)
          )
      )
        .to.revertedWithCustomError(pool, "InvalidEventMaturity")
        .withArgs(anyValue);
      const eventParam4 = [
        coder.encode(["uint256", "string"], [matchId, "outcome1"]),
      ];
      await expect(
        pool
          .connect(otherAccount)
          .createChallenge(
            eventParam4,
            maturity1,
            topicId1,
            1,
            BigInt(1000 * 1e18)
          )
      )
        .to.revertedWithCustomError(pool, "InvalidEventParam")
        .withArgs(anyValue, anyValue);
    });
  });
  describe("Join Challenge", function () {
    it("Should Join Challenge", async function () {
      const { kwame, ballsToken, pool, stkFee, airDropBalls, stake } =
        await loadFixture(deployCreateChallenges);

      const kwamePrediction = 2;

      await ballsToken.transfer(kwame, airDropBalls);

      await ballsToken.connect(kwame).approve(pool, stkFee);

      await expect(
        pool.connect(kwame).joinChallenge(0, kwamePrediction, stake)
      ).emit(pool, "JoinChallengePool");
    });
    it("Should Fail to Join Challenge", async function () {
      const { kojo, kwame, ballsToken, pool, stkFee, airDropBalls, stake } =
        await loadFixture(deployCreateChallenges);

      await ballsToken.transfer(kwame, airDropBalls);

      await ballsToken.connect(kwame).approve(pool, stkFee);

      await expect(
        pool.connect(kwame).joinChallenge(0, 0, stake)
      ).revertedWithCustomError(pool, "InvalidPrediction");

      await expect(
        pool.connect(kwame).joinChallenge(1, 1, stake)
      ).revertedWithCustomError(pool, "InvalidChallenge");

      await expect(
        pool.connect(kojo).joinChallenge(0, 1, stake)
      ).revertedWithCustomError(pool, "UserLacksBalls");

      await pool.connect(kwame).joinChallenge(0, 2, stake);
      await ballsToken.connect(kwame).approve(pool, stkFee);
      await expect(
        pool.connect(kwame).joinChallenge(0, 2, stake)
      ).revertedWithCustomError(pool, "PlayerAlreadyInPool");
      await time.increase(60 * 60 * 2);
      await expect(pool.connect(kwame).joinChallenge(0, 2, stake))
        .revertedWithCustomError(pool, "ActionNotAllowedForState")
        .withArgs(6);
    });
  });
  describe("Close Challenge", function () {
    it("Should Close Challenge", async function () {
      const {
        kojo,
        kwame,
        kofi,
        assetPriceProvider,
        footBallScoreProvider,
        generalStatementProvider,
        statement,
        statementId,
        maturity,
        ballsToken,
        pool,
        stkFee,
        airDropBalls,
        stake,
        matchId,
        assetSymbol,
        date,
      } = await loadFixture(deployCreateChallenges);
      const kwamePrediction = 2;

      await ballsToken.transfer(kwame, airDropBalls);

      await ballsToken.connect(kwame).approve(pool, stkFee);

      await expect(
        pool.connect(kwame).joinChallenge(0, kwamePrediction, stake)
      ).emit(pool, "JoinChallengePool");

      const coder = new ethers.AbiCoder();

      await time.increase(60 * 60 * 3);

      const homeScore = 3;
      const awayScore = 2;
      const param1 = coder.encode(
        ["uint256", "uint256", "uint256"],
        [matchId, homeScore, awayScore]
      );

      await footBallScoreProvider.connect(kofi).provideData(param1);

      const price = BigInt(70000);
      const param2 = coder.encode(
        ["string", "uint256", "uint256"],
        [assetSymbol, date, price]
      );
      await assetPriceProvider.connect(kofi).provideData(param2);

      const dataProvided = coder.encode(
        ["uint256", "string", "uint256", "uint8"],
        [statementId, statement, maturity, 1]
      );
      await expect(
        generalStatementProvider.connect(kofi).provideData(dataProvided)
      )
        .to.emit(generalStatementProvider, "GeneralStatementProvided")
        .withArgs(await kofi.getAddress(), statementId, statement, 1);

      await expect(pool.connect(kojo).closeChallenge(0))
        .emit(pool, "ClosedChallengePool")
        .withArgs(0, await kojo.getAddress(), 1, 1);
    });
    it("Should Fail to Close Challenge", async function () {
      const {
        kwame,
        kofi,
        assetPriceProvider,
        footBallScoreProvider,
        ballsToken,
        pool,
        stkFee,
        airDropBalls,
        stake,
        matchId,
        assetSymbol,
        date,
      } = await loadFixture(deployCreateChallenges);
      const kwamePrediction = 2;

      await ballsToken.transfer(kwame, airDropBalls);

      await ballsToken.connect(kwame).approve(pool, stkFee);

      await expect(
        pool.connect(kwame).joinChallenge(0, kwamePrediction, stake)
      ).emit(pool, "JoinChallengePool");

      await expect(pool.connect(kwame).closeChallenge(0))
        .revertedWithCustomError(pool, "ActionNotAllowedForState")
        .withArgs(0);
      await expect(
        pool.connect(kwame).closeChallenge(99)
      ).revertedWithCustomError(pool, "InvalidChallenge");

      const coder = new ethers.AbiCoder();

      await time.increase(60 * 60 * 3);

      const homeScore = 3;
      const awayScore = 2;
      const param1 = coder.encode(
        ["uint256", "uint256", "uint256"],
        [matchId, homeScore, awayScore]
      );

      await footBallScoreProvider.connect(kofi).provideData(param1);

      await expect(pool.connect(kwame).closeChallenge(0))
        .emit(pool, "StaleChallengePool")
        .withArgs(
          0,
          await kwame.getAddress(),
          BigInt(await time.latest()) +
            (await pool.staleExtensionPeriod()) +
            BigInt(1),
          1,
          2
        );
      await expect(pool.connect(kwame).closeChallenge(0))
        .revertedWithCustomError(pool, "NextStalePoolRetryNotReached")
        .withArgs(1);
      await time.increase(60 * 60 * 1);
      await expect(pool.connect(kwame).closeChallenge(0))
        .emit(pool, "StaleChallengePool")
        .withArgs(
          0,
          await kwame.getAddress(),
          BigInt(await time.latest()) +
            (await pool.staleExtensionPeriod()) +
            BigInt(1),
          2,
          2
        );
      await expect(pool.connect(kwame).closeChallenge(0))
        .revertedWithCustomError(pool, "NextStalePoolRetryNotReached")
        .withArgs(2);
      await time.increase(60 * 60 * 1);
      await expect(pool.connect(kwame).closeChallenge(0))
        .emit(pool, "StaleChallengePool")
        .withArgs(
          0,
          await kwame.getAddress(),
          BigInt(await time.latest()) +
            (await pool.staleExtensionPeriod()) +
            BigInt(1),
          3,
          2
        );
      await expect(pool.connect(kwame).closeChallenge(0))
        .revertedWithCustomError(pool, "NextStalePoolRetryNotReached")
        .withArgs(3);
      await time.increase(60 * 60 * 1);
      await expect(pool.connect(kwame).closeChallenge(0))
        .emit(pool, "ManualChallengePool")
        .withArgs(0, await kwame.getAddress(), 3);
      await expect(pool.connect(kwame).closeChallenge(0))
        .revertedWithCustomError(pool, "ActionNotAllowedForState")
        .withArgs(3);
      const price = BigInt(70000);
      const param2 = coder.encode(
        ["string", "uint256", "uint256"],
        [assetSymbol, date, price]
      );
      await assetPriceProvider.connect(kofi).provideData(param2);
    });
  });
  describe("Withdraw Winnings", function () {
    it("Should Withdraw Winnings", async function () {
      const {
        otherAccount,
        kojo,
        kwame,
        kofi,
        assetPriceProvider,
        footBallScoreProvider,
        ballsToken,
        pool,
        stkFee,
        airDropBalls,
        stake,
        matchId,
        assetSymbol,
        date,
        generalStatementProvider,
        statement,
        statementId,
        maturity,
      } = await loadFixture(deployCreateChallenges);
      const kwamePrediction = 2; // no

      await ballsToken.transfer(kwame, airDropBalls);

      await ballsToken.connect(kwame).approve(pool, stkFee);

      await expect(
        pool.connect(kwame).joinChallenge(0, kwamePrediction, stake)
      ).emit(pool, "JoinChallengePool");

      const coder = new ethers.AbiCoder();

      await time.increase(60 * 60 * 3);

      const homeScore = 3;
      const awayScore = 2;
      const param1 = coder.encode(
        ["uint256", "uint256", "uint256"],
        [matchId, homeScore, awayScore]
      );

      await footBallScoreProvider.connect(kofi).provideData(param1);

      const price = BigInt(70000);
      const param2 = coder.encode(
        ["string", "uint256", "uint256"],
        [assetSymbol, date, price]
      );
      await assetPriceProvider.connect(kofi).provideData(param2);

      const dataProvided = coder.encode(
        ["uint256", "string", "uint256", "uint8"],
        [statementId, statement, maturity, 1]
      );
      await expect(
        generalStatementProvider.connect(kofi).provideData(dataProvided)
      )
        .to.emit(generalStatementProvider, "GeneralStatementProvided")
        .withArgs(await kofi.getAddress(), statementId, statement, 1);

      await expect(pool.connect(kojo).closeChallenge(0))
        .emit(pool, "ClosedChallengePool")
        .withArgs(0, await kojo.getAddress(), 1, 1);
      await expect(pool.connect(otherAccount).withdrawWinnings(0))
        .emit(pool, "WinningsWithdrawn")
        .withArgs(await otherAccount.getAddress(), 0, stake, BigInt(2) * stake);
    });
    it("Should Fail to Withdraw Winnings", async function () {
      const {
        otherAccount,
        kojo,
        kwame,
        kofi,
        assetPriceProvider,
        footBallScoreProvider,
        ballsToken,
        pool,
        stkFee,
        airDropBalls,
        stake,
        matchId,
        assetSymbol,
        date,
        statementId,
        statement,
        generalStatementProvider,
        maturity,
      } = await loadFixture(deployCreateChallenges);
      const kwamePrediction = 2; // no

      await ballsToken.transfer(kwame, airDropBalls);

      await ballsToken.connect(kwame).approve(pool, stkFee);

      await expect(
        pool.connect(kwame).joinChallenge(0, kwamePrediction, stake)
      ).emit(pool, "JoinChallengePool");

      const coder = new ethers.AbiCoder();

      await time.increase(60 * 60 * 3);

      const homeScore = 3;
      const awayScore = 2;
      const param1 = coder.encode(
        ["uint256", "uint256", "uint256"],
        [matchId, homeScore, awayScore]
      );

      await footBallScoreProvider.connect(kofi).provideData(param1);

      const price = BigInt(70000);
      const param2 = coder.encode(
        ["string", "uint256", "uint256"],
        [assetSymbol, date, price]
      );
      await assetPriceProvider.connect(kofi).provideData(param2);

      const dataProvided = coder.encode(
        ["uint256", "string", "uint256", "uint8"],
        [statementId, statement, maturity, 1]
      );
      await expect(
        generalStatementProvider.connect(kofi).provideData(dataProvided)
      )
        .to.emit(generalStatementProvider, "GeneralStatementProvided")
        .withArgs(await kofi.getAddress(), statementId, statement, 1);

      await expect(pool.connect(kojo).closeChallenge(0))
        .emit(pool, "ClosedChallengePool")
        .withArgs(0, await kojo.getAddress(), 1, 1);
      await expect(pool.connect(otherAccount).withdrawWinnings(0)).emit(
        pool,
        "WinningsWithdrawn"
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
