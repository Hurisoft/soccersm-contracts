import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  deployGeneralStatementProviderWithKofiProvder,
  deployGeneralStatementProviderWithKojoReader,
} from "./fixtures";

export async function deployGeneralStatementProvider() {
  const [owner, feeAccount, otherAccount, kojo, kwame, kofi] =
    await ethers.getSigners();

  const GeneralStatementProvider = await ethers.getContractFactory(
    "GeneralStatementProvider"
  );
  const provider = await GeneralStatementProvider.deploy();

  await provider.addProvider(owner);
  await provider.addReader(kwame);
  console.log(await provider.getAddress(), "GeneralStatementProvider");

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

describe("GeneralStatementProvider", function () {
  describe("Deployment", function () {
    it("Should Deploy Pool", async function () {
      await loadFixture(deployGeneralStatementProvider);
    });
  });
  describe("Add Provider", function () {
    it("Should Add Provider", async function () {
      const { provider, kofi } = await loadFixture(
        deployGeneralStatementProvider
      );
      const newProvider = await kofi.getAddress();
      await provider.addProvider(newProvider);
      expect(await provider.isProvider(newProvider)).to.be.true;
    });
    it("Should Fail to Add Provider", async function () {
      const { provider, otherAccount, kofi } = await loadFixture(
        deployGeneralStatementProvider
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
      const { provider, kofi } = await loadFixture(
        deployGeneralStatementProvider
      );
      const newProvider = await kofi.getAddress();
      await provider.addProvider(newProvider);
      await provider.removeProvider(newProvider);
      expect(await provider.isProvider(newProvider)).to.be.false;
    });
    it("Should Fail to Remove Provider", async function () {
      const { provider, otherAccount, kofi } = await loadFixture(
        deployGeneralStatementProvider
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
      const { provider, kofi } = await loadFixture(
        deployGeneralStatementProvider
      );
      const newReader = await kofi.getAddress();
      await provider.addReader(newReader);
      expect(await provider.isReader(newReader)).to.be.true;
    });
    it("Should Fail to Add Reader", async function () {
      const { provider, otherAccount, kofi } = await loadFixture(
        deployGeneralStatementProvider
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
      const { provider, kofi } = await loadFixture(
        deployGeneralStatementProvider
      );
      const newReader = await kofi.getAddress();
      await provider.removeReader(newReader);
      expect(await provider.isReader(newReader)).to.be.false;
    });
    it("Should Fail to Remove Reader", async function () {
      const { provider, otherAccount, kofi } = await loadFixture(
        deployGeneralStatementProvider
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
      const { provider, kwame, owner } = await loadFixture(
        deployGeneralStatementProvider
      );
      const coder = new ethers.AbiCoder();
      const statementId = 1;
      const statement = "Trump will win!";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 4;
      const result = 0;
      const dataRequest = coder.encode(["uint256"], [statementId]);
      const dataProvide = coder.encode(
        ["uint256", "string", "uint256", "uint8"],
        [statementId, statement, maturity, result]
      );
      await expect(provider.provideData(dataProvide))
        .to.emit(provider, "GeneralStatementProvided")
        .withArgs(await owner.getAddress(), statementId, statement, result);
      await expect(provider.connect(kwame).requestData(dataRequest))
        .to.emit(provider, "GeneralStatementRequested")
        .withArgs(await kwame.getAddress(), statementId);
    });
    it("Should Fail to Request Data", async function () {
      const { provider, kofi, kojo } = await loadFixture(
        deployGeneralStatementProviderWithKojoReader
      );
      const coder = new ethers.AbiCoder();
      const statementId = 1;
      const param = coder.encode(["uint256"], [statementId]);
      await expect(
        provider.connect(kofi).requestData(param)
      ).to.revertedWithCustomError(provider, "ReaderOnly");
      await expect(provider.connect(kojo).requestData(param))
        .to.revertedWithCustomError(provider, "InvalidStatementId")
        .withArgs(statementId);
    });
  });
  describe("Provide Data", function () {
    it("Should Provide Data", async function () {
      const { provider, kofi, owner } = await loadFixture(
        deployGeneralStatementProviderWithKofiProvder
      );
      const coder = new ethers.AbiCoder();
      const statementId = 1;
      const statement = "Trump will win!";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 4;
      const result = 0;
      const dataProvide = coder.encode(
        ["uint256", "string", "uint256", "uint8"],
        [statementId, statement, maturity, result]
      );
      await expect(provider.connect(kofi).provideData(dataProvide))
        .to.emit(provider, "GeneralStatementProvided")
        .withArgs(await kofi.getAddress(), statementId, statement, result);
    });
    it("Should Fail to Provide Data", async function () {
      const { provider, kofi, kojo } = await loadFixture(
        deployGeneralStatementProviderWithKofiProvder
      );
      const coder = new ethers.AbiCoder();
      const statementId = 1;
      const statement = "Trump will win!";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 4;
      const result = 0;
      const param = coder.encode(
        ["uint256", "string", "uint256", "uint8"],
        [statementId, statement, maturity, result]
      );
      const result2 = 1;
      const param2 = coder.encode(
        ["uint256", "string", "uint256", "uint8"],
        [statementId, statement, maturity, result2]
      );
      const statement2 = "Trump will not win!";
      const maturity2 = Math.floor(Date.now() / 1000) + 60 * 60 * 5;
      const result3 = 2;
      const param3 = coder.encode(
        ["uint256", "string", "uint256", "uint8"],
        [statementId, statement2, maturity, result3]
      );
      const param4 = coder.encode(
        ["uint256", "string", "uint256", "uint8"],
        [statementId, statement, maturity2, result3]
      );
      await expect(
        provider.connect(kojo).provideData(param)
      ).to.revertedWithCustomError(provider, "ProviderOnly");
      const hasParam = coder.encode(["uint256"], [statementId]);
      expect(await provider.connect(kojo).hasData(hasParam)).to.be.false;
      await expect(
        provider.connect(kofi).provideData(param2)
      ).to.revertedWithCustomError(provider, "InvalidInitialResult");
      await expect(provider.connect(kofi).provideData(param))
        .to.emit(provider, "GeneralStatementProvided")
        .withArgs(await kofi.getAddress(), statementId, statement, result);
      await expect(provider.connect(kofi).provideData(param3))
        .to.revertedWithCustomError(provider, "InvalidSubmissionDate")
        .withArgs(maturity);
      await time.increase(60 * 60 * 5);
      await expect(provider.connect(kofi).provideData(param3))
        .to.revertedWithCustomError(provider, "ModifiedParams")
        .withArgs("statement");
      await expect(provider.connect(kofi).provideData(param4))
        .to.revertedWithCustomError(provider, "ModifiedParams")
        .withArgs("maturity");
      await expect(
        provider.connect(kofi).provideData(param)
      ).to.revertedWithCustomError(provider, "InvalidResult");
      await expect(provider.connect(kofi).provideData(param2))
        .to.emit(provider, "GeneralStatementProvided")
        .withArgs(await kofi.getAddress(), statementId, statement, result2);
      await expect(
        provider.connect(kofi).provideData(param)
      ).to.revertedWithCustomError(provider, "DataAlreadyProvided");
    });
  });
  describe("Get Data", function () {
    it("Should Get Data", async function () {
      const { provider, kwame, owner } = await loadFixture(
        deployGeneralStatementProvider
      );
      const coder = new ethers.AbiCoder();
      const statementId = 1;
      const statement = "Trump will win!";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 4;
      const result = 0;
      const dataRequest = coder.encode(["uint256"], [statementId]);
      const dataProvide = coder.encode(
        ["uint256", "string", "uint256", "uint8"],
        [statementId, statement, maturity, result]
      );
      const result2 = 1;
      const param2 = coder.encode(
        ["uint256", "string", "uint256", "uint8"],
        [statementId, statement, maturity, result2]
      );
      await expect(provider.provideData(dataProvide))
        .to.emit(provider, "GeneralStatementProvided")
        .withArgs(await owner.getAddress(), statementId, statement, result);
      await time.increase(60 * 60 * 5);
      await expect(provider.provideData(param2))
        .to.emit(provider, "GeneralStatementProvided")
        .withArgs(await owner.getAddress(), statementId, statement, result2);
      const statementData = await provider.connect(kwame).getData(dataRequest);
      const [_result2] = coder.decode(["uint256"], statementData);
      expect(_result2).equals(result2);
    });
    it("Should Fail to Get Data", async function () {
      const { provider, kofi, kojo } = await loadFixture(
        deployGeneralStatementProviderWithKojoReader
      );
      const coder = new ethers.AbiCoder();
      const statementId = 1;
      const param = coder.encode(["uint256"], [statementId]);
      await expect(
        provider.connect(kofi).requestData(param)
      ).to.revertedWithCustomError(provider, "ReaderOnly");
      await expect(provider.connect(kojo).requestData(param))
        .to.revertedWithCustomError(provider, "InvalidStatementId")
        .withArgs(statementId);
    });
  });
});
