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

  const MultiGeneralStatementProvider = await ethers.getContractFactory(
    "MultiGeneralStatementProvider"
  );
  const generalStatementProvider = await MultiGeneralStatementProvider.deploy();

  await generalStatementProvider.addProvider(owner);

  const MultiGeneralStatementEvaluator = await ethers.getContractFactory(
    "MultiGeneralStatementEvaluator"
  );

  const generalStatementEvaluator = await MultiGeneralStatementEvaluator.deploy(
    await generalStatementProvider.getAddress()
  );

  await generalStatementProvider.addReader(
    await generalStatementEvaluator.getAddress()
  );

  await generalStatementProvider.addProvider(await kofi.getAddress());

  await registry.createTopic(
    "General Statement",
    "Any and all statements",
    await generalStatementEvaluator.getAddress()
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
    generalStatementEvaluator,
    generalStatementProvider,
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
    generalStatementProvider,
    ballsToken,
    pool,
    topicIds,
    ama,
    abena,
    adwoa,
    yaa,
  } = await loadFixture(deployChallengePool);

  const coder = new ethers.AbiCoder();
  const statementId = 404;
  const statement = "Ghana 2024 Elections Result.";
  const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 100;
  const result = ethers.hexlify(ethers.toUtf8Bytes(""));
  const options = [
    ethers.hexlify(ethers.toUtf8Bytes("NPP")),
    ethers.hexlify(ethers.toUtf8Bytes("NDC")),
    ethers.hexlify(ethers.toUtf8Bytes("NEW FORCE")),
    ethers.hexlify(ethers.toUtf8Bytes("CPP")),
  ];
  const param1 = coder.encode(["uint256"], [statementId]);
  const dataProvided = coder.encode(
    ["uint256", "string", "uint256", "bytes", "bytes[]"],
    [statementId, statement, maturity, result, options]
  );
  const result2 = ethers.toUtf8Bytes("CPP");
  const param2 = coder.encode(
    ["uint256", "string", "uint256", "bytes", "bytes[]"],
    [statementId, statement, maturity, result2, options]
  );
  await expect(generalStatementProvider.provideData(dataProvided))
    .to.emit(generalStatementProvider, "MultiGeneralStatementProvided")
    .withArgs(await owner.getAddress(), statementId, statement, result);

  const airDropBalls = BigInt(10000 * 1e18);

  await ballsToken.transfer(otherAccount, airDropBalls);

  const pollParam = param1;
  const pollTopicId = topicIds.general;
  const pollMaturity = maturity;
  const pollOptions = options;
  const userPrediction = ethers.toUtf8Bytes("NEW FORCE");
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
    generalStatementProvider,
    statement,
    statementId,
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
    result2,
    options,
    ama,
    abena,
    adwoa,
    yaa,
  };
}

describe("MultiChallengePoolGeneralStatement", function () {
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
      const { otherAccount, pool, topicIds, statementId, param1, options } =
        await loadFixture(deployCreateChallenges);
      const coder = new ethers.AbiCoder();
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 100;

      const pollParam = param1;
      const pollTopicId = topicIds.general;
      const pollMaturity = maturity;
      const pollOptions = options;
      const userPrediction = ethers.toUtf8Bytes("NEW FORCE");
      const ticketQuantity = BigInt(1);
      const poolStake = BigInt(1000 * 1e18);
      const bigPoolStake = BigInt(10000 * 1e18);
      const invalidUserPrediction = ethers.toUtf8Bytes("NEW");
      const invalidPollOptionsLength = Array.from(
        { length: 101 },
        (_, i) => options[0]
      );
      const invalidPollParam = [
        ethers.toUtf8Bytes("NPP"),
        ethers.toUtf8Bytes("NDC"),
        ethers.toUtf8Bytes("NEW"),
      ];
      const invalidPollOption = [
        ethers.toUtf8Bytes("NPP"),
        ethers.toUtf8Bytes("NDC"),
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

      const kofiPrediction = ethers.toUtf8Bytes("NPP");

      const amaPrediction = ethers.toUtf8Bytes("NDC");

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

      const abenaPrediction = ethers.toUtf8Bytes("NPP");

      await ballsToken.transfer(abena, airDropBalls);

      await ballsToken.connect(abena).approve(pool, joinStakeFee);

      await expect(
        pool.connect(abena).joinChallenge(0, ethers.toUtf8Bytes(""), 1)
      ).revertedWithCustomError(pool, "InvalidPrediction");

      await expect(
        pool.connect(abena).joinChallenge(1, ethers.toUtf8Bytes("NDC"), 1)
      ).revertedWithCustomError(pool, "InvalidChallenge");

      await expect(
        pool.connect(yaa).joinChallenge(0, ethers.toUtf8Bytes("NPP"), 100)
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
        generalStatementProvider,
        statement,
        statementId,
        ballsToken,
        pool,
        airDropBalls,
        joinStakeFee,
        owner,
        adwoa,
        param2,
        param1,
        result2,
      } = await loadFixture(deployCreateChallenges);
      const adwoaPrediction = ethers.toUtf8Bytes("NPP");

      await ballsToken.transfer(adwoa, airDropBalls);

      await ballsToken.connect(adwoa).approve(pool, joinStakeFee);

      await expect(
        pool.connect(adwoa).joinChallenge(0, adwoaPrediction, 1)
      ).emit(pool, "JoinChallengePool");

      const coder = new ethers.AbiCoder();

      await time.increase(60 * 60 * 101);
      await expect(generalStatementProvider.provideData(param2))
        .to.emit(generalStatementProvider, "MultiGeneralStatementProvided")
        .withArgs(await owner.getAddress(), statementId, statement, result2);
      const statementData = await generalStatementProvider
        .connect(adwoa)
        .getData(param1);
      const [_result2] = coder.decode(["bytes"], statementData);

      expect(_result2).equals(ethers.hexlify(result2));

      await expect(pool.connect(kojo).closeChallenge(0))
        .emit(pool, "ClosedChallengePool")
        .withArgs(0, await kojo.getAddress(), 1, ethers.hexlify(result2));
    });
    it("Should Fail to Close Challenge", async function () {
      const { ballsToken, pool, airDropBalls, joinStakeFee, adwoa } =
        await loadFixture(deployCreateChallenges);
      const adwoaPrediction = ethers.toUtf8Bytes("NPP");

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

      const coder = new ethers.AbiCoder();
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
        generalStatementProvider,
        statement,
        statementId,
        joinStakeFee,
        adwoa,
        param2,
        result2,
        param1,
        owner,
        poolStake,
      } = await loadFixture(deployCreateChallenges);
      const kwamePrediction = ethers.toUtf8Bytes("NDC");
      await ballsToken.transfer(kwame, airDropBalls);

      await ballsToken.connect(kwame).approve(pool, joinStakeFee);

      await expect(
        pool.connect(kwame).joinChallenge(0, kwamePrediction, 1)
      ).emit(pool, "JoinChallengePool");

      const adwoaPrediction = ethers.toUtf8Bytes("NPP");

      await ballsToken.transfer(adwoa, airDropBalls);

      await ballsToken.connect(adwoa).approve(pool, joinStakeFee);

      await expect(
        pool.connect(adwoa).joinChallenge(0, adwoaPrediction, 1)
      ).emit(pool, "JoinChallengePool");

      const coder = new ethers.AbiCoder();

      await time.increase(60 * 60 * 101);
      await expect(generalStatementProvider.provideData(param2))
        .to.emit(generalStatementProvider, "MultiGeneralStatementProvided")
        .withArgs(await owner.getAddress(), statementId, statement, result2);
      const statementData = await generalStatementProvider
        .connect(adwoa)
        .getData(param1);
      const [_result2] = coder.decode(["bytes"], statementData);

      expect(_result2).equals(ethers.hexlify(result2));

      await expect(pool.connect(kojo).closeChallenge(0))
        .emit(pool, "ClosedChallengePool")
        .withArgs(0, await kojo.getAddress(), 1, ethers.hexlify(result2));

      await expect(pool.connect(otherAccount).withdrawWinnings(0))
        .emit(pool, "WinningsWithdrawn")
        .withArgs(await otherAccount.getAddress(), 0, poolStake, 0);
    });
    it("Should Fail to Withdraw Winnings", async function () {
      const {
        otherAccount,
        kojo,
        kwame,
        ballsToken,
        pool,
        airDropBalls,
        generalStatementProvider,
        statement,
        statementId,
        joinStakeFee,
        adwoa,
        param2,
        result2,
        param1,
        owner,
        poolStake,
        yaa,
      } = await loadFixture(deployCreateChallenges);
      const kwamePrediction = ethers.toUtf8Bytes("NDC");
      await ballsToken.transfer(kwame, airDropBalls);

      await ballsToken.connect(kwame).approve(pool, joinStakeFee);

      await expect(
        pool.connect(kwame).joinChallenge(0, kwamePrediction, 1)
      ).emit(pool, "JoinChallengePool");

      const adwoaPrediction = ethers.toUtf8Bytes("NPP");

      await ballsToken.transfer(adwoa, airDropBalls);

      await ballsToken.connect(adwoa).approve(pool, joinStakeFee);

      await expect(
        pool.connect(adwoa).joinChallenge(0, adwoaPrediction, 1)
      ).emit(pool, "JoinChallengePool");

      const yaaPrediction = ethers.toUtf8Bytes("CPP");

      await ballsToken.transfer(yaa, airDropBalls);

      await ballsToken.connect(yaa).approve(pool, joinStakeFee);

      await expect(pool.connect(yaa).joinChallenge(0, yaaPrediction, 1)).emit(
        pool,
        "JoinChallengePool"
      );

      const coder = new ethers.AbiCoder();

      await time.increase(60 * 60 * 101);
      await expect(generalStatementProvider.provideData(param2))
        .to.emit(generalStatementProvider, "MultiGeneralStatementProvided")
        .withArgs(await owner.getAddress(), statementId, statement, result2);
      const statementData = await generalStatementProvider
        .connect(adwoa)
        .getData(param1);
      const [_result2] = coder.decode(["bytes"], statementData);

      expect(_result2).equals(ethers.hexlify(result2));

      await expect(pool.connect(kojo).closeChallenge(0))
        .emit(pool, "ClosedChallengePool")
        .withArgs(0, await kojo.getAddress(), 1, ethers.hexlify(result2));

      await expect(pool.connect(yaa).withdrawWinnings(0))
        .emit(pool, "WinningsWithdrawn")
        .withArgs(
          await yaa.getAddress(),
          0,
          BigInt(4) * poolStake,
          BigInt(3) * poolStake
        );
      await expect(
        pool.connect(yaa).withdrawWinnings(0)
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
