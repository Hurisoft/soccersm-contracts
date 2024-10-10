import {
  time,
  loadFixture,
  reset,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  deployMultiGeneralStatementProviderWithKofiProvder,
  deployMultiGeneralStatementProviderWithKojoReader,
} from "./fixtures";

export async function deployMultiGeneralStatementProvider() {
  const [owner, feeAccount, otherAccount, kojo, kwame, kofi] =
    await ethers.getSigners();

  const MultiGeneralStatementProvider = await ethers.getContractFactory(
    "MultiGeneralStatementProvider"
  );
  const provider = await MultiGeneralStatementProvider.deploy();

  await provider.addProvider(owner);
  await provider.addReader(kwame);
  console.log(await provider.getAddress(), "MultiGeneralStatementProvider");

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

describe("MultiGeneralStatementProvider", function () {
  before(function () {
    // runs once before the first test in this block
    reset()
  });
  describe("Deployment", function () {
    it("Should Deploy Pool", async function () {
      await loadFixture(deployMultiGeneralStatementProvider);
    });
  });
  describe("Add Provider", function () {
    it("Should Add Provider", async function () {
      const { provider, kofi } = await loadFixture(
        deployMultiGeneralStatementProvider
      );
      const newProvider = await kofi.getAddress();
      await provider.addProvider(newProvider);
      expect(await provider.isProvider(newProvider)).to.be.true;
    });
    it("Should Fail to Add Provider", async function () {
      const { provider, otherAccount, kofi } = await loadFixture(
        deployMultiGeneralStatementProvider
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
        deployMultiGeneralStatementProvider
      );
      const newProvider = await kofi.getAddress();
      await provider.addProvider(newProvider);
      await provider.removeProvider(newProvider);
      expect(await provider.isProvider(newProvider)).to.be.false;
    });
    it("Should Fail to Remove Provider", async function () {
      const { provider, otherAccount, kofi } = await loadFixture(
        deployMultiGeneralStatementProvider
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
        deployMultiGeneralStatementProvider
      );
      const newReader = await kofi.getAddress();
      await provider.addReader(newReader);
      expect(await provider.isReader(newReader)).to.be.true;
    });
    it("Should Fail to Add Reader", async function () {
      const { provider, otherAccount, kofi } = await loadFixture(
        deployMultiGeneralStatementProvider
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
        deployMultiGeneralStatementProvider
      );
      const newReader = await kofi.getAddress();
      await provider.removeReader(newReader);
      expect(await provider.isReader(newReader)).to.be.false;
    });
    it("Should Fail to Remove Reader", async function () {
      const { provider, otherAccount, kofi } = await loadFixture(
        deployMultiGeneralStatementProvider
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
        deployMultiGeneralStatementProvider
      );
      const coder = new ethers.AbiCoder();
      const statementId = 1;
      const statement = "Ghana 2024 Elections Result.";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 60;
      const result = ethers.toUtf8Bytes("");
      const options = [
        ethers.toUtf8Bytes("NPP"),
        ethers.toUtf8Bytes("NDC"),
        ethers.toUtf8Bytes("NEW FORCE"),
      ];
      const dataRequest = coder.encode(["uint256"], [statementId]);
      const dataProvided = coder.encode(
        ["uint256", "string", "uint256", "bytes", "bytes[]"],
        [statementId, statement, maturity, result, options]
      );
      await expect(provider.provideData(dataProvided))
        .to.emit(provider, "MultiGeneralStatementProvided")
        .withArgs(await owner.getAddress(), statementId, statement, result);
      await expect(provider.connect(kwame).requestData(dataRequest))
        .to.emit(provider, "MultiGeneralStatementRequested")
        .withArgs(await kwame.getAddress(), statementId);
    });
    it("Should Fail to Request Data", async function () {
      const { provider, kofi, kojo } = await loadFixture(
        deployMultiGeneralStatementProviderWithKojoReader
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
        deployMultiGeneralStatementProviderWithKofiProvder
      );
      const coder = new ethers.AbiCoder();
      const statementId = 1;
      const statement = "Ghana 2024 Elections Result.";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 64;
      const result = ethers.toUtf8Bytes("");
      const options = [
        ethers.toUtf8Bytes("NPP"),
        ethers.toUtf8Bytes("NDC"),
        ethers.toUtf8Bytes("NEW FORCE"),
      ];
      const dataRequest = coder.encode(["uint256"], [statementId]);
      const dataProvided = coder.encode(
        ["uint256", "string", "uint256", "bytes", "bytes[]"],
        [statementId, statement, maturity, result, options]
      );
      await expect(provider.connect(kofi).provideData(dataProvided))
        .to.emit(provider, "MultiGeneralStatementProvided")
        .withArgs(await kofi.getAddress(), statementId, statement, result);
    });
    it("Should Fail to Provide Data", async function () {
      const { provider, kofi, kojo } = await loadFixture(
        deployMultiGeneralStatementProviderWithKofiProvder
      );
      const coder = new ethers.AbiCoder();
      const statementId = 1;
      const statement = "Ghana 2024 Elections Result.";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 64;
      const result = ethers.toUtf8Bytes("");
      const options = [
        ethers.toUtf8Bytes("NPP"),
        ethers.toUtf8Bytes("NDC"),
        ethers.toUtf8Bytes("NEW FORCE"),
      ];
      const param = coder.encode(
        ["uint256", "string", "uint256", "bytes", "bytes[]"],
        [statementId, statement, maturity, result, options]
      );
      const result2 = ethers.toUtf8Bytes("NPP");
      const param2 = coder.encode(
        ["uint256", "string", "uint256", "bytes", "bytes[]"],
        [statementId, statement, maturity, result2, options]
      );
      const statement2 = "Ghana 2025 Elections Result.";
      const maturity2 = Math.floor(Date.now() / 1000) + 60 * 60 * 65;
      const result3 = ethers.toUtf8Bytes("NDC");
      const param3 = coder.encode(
        ["uint256", "string", "uint256", "bytes", "bytes[]"],
        [statementId, statement2, maturity, result3, options]
      );
      const param4 = coder.encode(
        ["uint256", "string", "uint256", "bytes", "bytes[]"],
        [statementId, statement, maturity2, result3, options]
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
        .to.emit(provider, "MultiGeneralStatementProvided")
        .withArgs(await kofi.getAddress(), statementId, statement, result);
      await expect(provider.connect(kofi).provideData(param3))
        .to.revertedWithCustomError(provider, "InvalidSubmissionDate")
        .withArgs(maturity);
      await time.increase(60 * 60 * 66);
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
        .to.emit(provider, "MultiGeneralStatementProvided")
        .withArgs(await kofi.getAddress(), statementId, statement, result2);
      await expect(
        provider.connect(kofi).provideData(param)
      ).to.revertedWithCustomError(provider, "DataAlreadyProvided");
    });
  });
  describe("Get Data", function () {
    it("Should Get Data", async function () {
      const { provider, kwame, owner } = await loadFixture(
        deployMultiGeneralStatementProvider
      );
      const coder = new ethers.AbiCoder();
      const statementId = 1;
      const statement = "Ghana 2024 Elections Result.";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 64;
      const result = ethers.toUtf8Bytes("");
      const options = [
        ethers.toUtf8Bytes("NPP"),
        ethers.toUtf8Bytes("NDC"),
        ethers.toUtf8Bytes("NEW FORCE"),
      ];
      const dataRequest = coder.encode(["uint256"], [statementId]);
      const dataProvided = coder.encode(
        ["uint256", "string", "uint256", "bytes", "bytes[]"],
        [statementId, statement, maturity, result, options]
      );
      const result2 = ethers.toUtf8Bytes("NEW FORCE");
      const param2 = coder.encode(
        ["uint256", "string", "uint256", "bytes", "bytes[]"],
        [statementId, statement, maturity, result2, options]
      );
      await time.increase(60 * 60 * 3);
      await expect(provider.provideData(dataProvided))
        .to.emit(provider, "MultiGeneralStatementProvided")
        .withArgs(await owner.getAddress(), statementId, statement, result);
      await time.increase(60 * 60 * 65);
      await expect(provider.provideData(param2))
        .to.emit(provider, "MultiGeneralStatementProvided")
        .withArgs(await owner.getAddress(), statementId, statement, result2);
      const statementData = await provider.connect(kwame).getData(dataRequest);
      const [_result2] = coder.decode(["bytes"], statementData);

      expect(_result2).equals(ethers.hexlify(result2));
    });
    it("Should Fail to Get Data", async function () {
      const { provider, kofi, kojo } = await loadFixture(
        deployMultiGeneralStatementProviderWithKojoReader
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
  describe("Has Options", function () {
    it("Should Have Options", async function () {
      const { provider, kwame, owner } = await loadFixture(
        deployMultiGeneralStatementProvider
      );
      const coder = new ethers.AbiCoder();
      const statementId = 1;
      const statement = "Ghana 2024 Elections Result.";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 64;
      const result = ethers.toUtf8Bytes("");
      const options = [
        ethers.toUtf8Bytes("NPP"),
        ethers.toUtf8Bytes("NDC"),
        ethers.toUtf8Bytes("NEW FORCE"),
      ];
      const dataRequest = coder.encode(["uint256"], [statementId]);
      const dataProvided = coder.encode(
        ["uint256", "string", "uint256", "bytes", "bytes[]"],
        [statementId, statement, maturity, result, options]
      );
      const result2 = ethers.toUtf8Bytes("NEW FORCE");
      const param2 = coder.encode(
        ["uint256", "string", "uint256", "bytes", "bytes[]"],
        [statementId, statement, maturity, result2, options]
      );
      await time.increase(60 * 60 * 3);
      await expect(provider.provideData(dataProvided))
        .to.emit(provider, "MultiGeneralStatementProvided")
        .withArgs(await owner.getAddress(), statementId, statement, result);
      await time.increase(60 * 60 * 65);
      await expect(provider.provideData(param2))
        .to.emit(provider, "MultiGeneralStatementProvided")
        .withArgs(await owner.getAddress(), statementId, statement, result2);
      const statementData = await provider.connect(kwame).getData(dataRequest);
      const [_result2] = coder.decode(["bytes"], statementData);

      expect(_result2).equals(ethers.hexlify(result2));
      const optionsExist = await provider
        .connect(kwame)
        .hasOptions(
          coder.encode(["uint256", "bytes[]"], [statementId, options])
        );
      expect(optionsExist).to.be.true;
    });
    it("Should Fail to Have Options", async function () {
      const { provider, kwame, owner } = await loadFixture(
        deployMultiGeneralStatementProvider
      );
      const coder = new ethers.AbiCoder();
      const statementId = 1;
      const statement = "Ghana 2024 Elections Result.";
      const maturity = Math.floor(Date.now() / 1000) + 60 * 60 * 64;
      const result = ethers.toUtf8Bytes("");
      const options = [
        ethers.toUtf8Bytes("NPP"),
        ethers.toUtf8Bytes("NDC"),
        ethers.toUtf8Bytes("NEW FORCE"),
      ];
      const dataRequest = coder.encode(["uint256"], [statementId]);
      const dataProvided = coder.encode(
        ["uint256", "string", "uint256", "bytes", "bytes[]"],
        [statementId, statement, maturity, result, options]
      );
      const result2 = ethers.toUtf8Bytes("NEW FORCE");
      const param2 = coder.encode(
        ["uint256", "string", "uint256", "bytes", "bytes[]"],
        [statementId, statement, maturity, result2, options]
      );
      await time.increase(60 * 60 * 3);
      await expect(provider.provideData(dataProvided))
        .to.emit(provider, "MultiGeneralStatementProvided")
        .withArgs(await owner.getAddress(), statementId, statement, result);
      await time.increase(60 * 60 * 65);
      await expect(provider.provideData(param2))
        .to.emit(provider, "MultiGeneralStatementProvided")
        .withArgs(await owner.getAddress(), statementId, statement, result2);
      const statementData = await provider.connect(kwame).getData(dataRequest);
      const [_result2] = coder.decode(["bytes"], statementData);

      expect(_result2).equals(ethers.hexlify(result2));
      const optionsExist = await provider
        .connect(kwame)
        .hasOptions(
          coder.encode(
            ["uint256", "bytes[]"],
            [statementId, [ethers.toUtf8Bytes("DDD")]]
          )
        );
      expect(optionsExist).to.be.false;
    });
  });
});
