import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

export async function deployAssetPriceProvider() {
  const [owner, feeAccount, otherAccount, kojo, kwame, kofi] =
    await ethers.getSigners();

  const AssetPriceProvider = await ethers.getContractFactory(
    "AssetPriceProvider"
  );
  const provider = await AssetPriceProvider.deploy();

  await provider.addProvider(owner);

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

export async function deployAssetPriceProviderWithKofiProvder() {
  const [owner, feeAccount, otherAccount, kojo, kwame, kofi] =
    await ethers.getSigners();

  const AssetPriceProvider = await ethers.getContractFactory(
    "AssetPriceProvider"
  );
  const provider = await AssetPriceProvider.deploy();

  await provider.addProvider(kofi);

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

export async function deployAssetPriceProviderWithKojoReader() {
  const [owner, feeAccount, otherAccount, kojo, kwame, kofi] =
    await ethers.getSigners();

  const AssetPriceProvider = await ethers.getContractFactory(
    "AssetPriceProvider"
  );
  const provider = await AssetPriceProvider.deploy();

  await provider.addReader(kojo);

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

describe("AssetPriceProvider", function () {
  describe("Deployment", function () {
    it("Should Deploy Pool", async function () {
      await loadFixture(deployAssetPriceProvider);
    });
  });
  describe("Add Provider", function () {
    it("Should Add Provider", async function () {
      const { provider, kofi } = await loadFixture(deployAssetPriceProvider);
      const newProvider = await kofi.getAddress();
      await provider.addProvider(newProvider);
      expect(await provider.isProvider(newProvider)).to.be.true;
    });
    it("Should Fail to Add Provider", async function () {
      const { provider, otherAccount, kofi } = await loadFixture(
        deployAssetPriceProvider
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
      const { provider, kofi } = await loadFixture(deployAssetPriceProvider);
      const newProvider = await kofi.getAddress();
      await provider.addProvider(newProvider);
      await provider.removeProvider(newProvider);
      expect(await provider.isProvider(newProvider)).to.be.false;
    });
    it("Should Fail to Remove Provider", async function () {
      const { provider, otherAccount, kofi } = await loadFixture(
        deployAssetPriceProvider
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
      const { provider, kofi } = await loadFixture(deployAssetPriceProvider);
      const newReader = await kofi.getAddress();
      await provider.addReader(newReader);
      expect(await provider.isReader(newReader)).to.be.true;
    });
    it("Should Fail to Add Reader", async function () {
      const { provider, otherAccount, kofi } = await loadFixture(
        deployAssetPriceProvider
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
      const { provider, kofi } = await loadFixture(deployAssetPriceProvider);
      const newReader = await kofi.getAddress();
      await provider.removeReader(newReader);
      expect(await provider.isReader(newReader)).to.be.false;
    });
    it("Should Fail to Remove Reader", async function () {
      const { provider, otherAccount, kofi } = await loadFixture(
        deployAssetPriceProvider
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
        deployAssetPriceProviderWithKojoReader
      );
      const coder = new ethers.AbiCoder();
      const assetSymbol = "BTC";
      const date = Math.floor(Date.now() / 1000) - 60 * 60 * 2;
      const param = coder.encode(["string", "uint256"], [assetSymbol, date]);
      await expect(provider.connect(kojo).requestData(param))
        .to.emit(provider, "AssetPriceRequested")
        .withArgs(await kojo.getAddress(), assetSymbol, date);
    });
    it("Should Fail to Request Data", async function () {
      const { provider, kofi } = await loadFixture(
        deployAssetPriceProviderWithKojoReader
      );
      const coder = new ethers.AbiCoder();
      const assetSymbol = "BTC";
      const date = Math.floor(Date.now() / 1000) - 60 * 60 * 2;
      const param = coder.encode(["string", "uint256"], [assetSymbol, date]);
      await expect(
        provider.connect(kofi).requestData(param)
      ).to.revertedWithCustomError(provider, "ReaderOnly");
    });
  });
  describe("Provide Data", function () {
    it("Should Provide Data", async function () {
      const { provider, kofi } = await loadFixture(
        deployAssetPriceProviderWithKofiProvder
      );
      const coder = new ethers.AbiCoder();
      const assetSymbol = "BTC";
      const date = Math.floor(Date.now() / 1000) - 60 * 60 * 2;
      const price = BigInt(60000 * 1e9);
      const param = coder.encode(
        ["string", "uint256", "uint256"],
        [assetSymbol, date, price]
      );
      await expect(provider.connect(kofi).provideData(param))
        .to.emit(provider, "AssetPriceProvided")
        .withArgs(await kofi.getAddress(), assetSymbol, date, price);
      const assetDateParam = coder.encode(
        ["string", "uint256"],
        [assetSymbol, date]
      );
      const assetData = await provider.getData(assetDateParam);

      const [_price] = coder.decode(["uint256"], assetData);

      expect(BigInt(_price)).to.equals(price);
      expect(await provider.hasData(assetDateParam)).to.be.true;
    });
    it("Should Fail to Provide Data", async function () {
      const { provider, kofi, kojo } = await loadFixture(
        deployAssetPriceProviderWithKofiProvder
      );
      const coder = new ethers.AbiCoder();
      const assetSymbol = "BTC";
      const date = Math.floor(Date.now() / 1000) - 60 * 60 * 2;
      const price = BigInt(60000 * 1e9);
      const param = coder.encode(
        ["string", "uint256", "uint256"],
        [assetSymbol, date, price]
      );
      await expect(
        provider.connect(kojo).provideData(param)
      ).to.revertedWithCustomError(provider, "ProviderOnly");
      const hasParam = coder.encode(["string", "uint256"], [assetSymbol, date]);
      expect(await provider.connect(kojo).hasData(hasParam)).to.be.false;
      const futureDate = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
      const futreParam = coder.encode(
        ["string", "uint256", "uint256"],
        [assetSymbol, futureDate, price]
      );
      await expect(provider.connect(kofi).provideData(futreParam))
        .to.revertedWithCustomError(provider, "InvalidSubmissionDate")
        .withArgs(futureDate);
    });
  });
  describe("Get Data", function () {
    it("Should Get Data", async function () {
      const { provider, kofi } = await loadFixture(
        deployAssetPriceProviderWithKofiProvder
      );
      const coder = new ethers.AbiCoder();
      const assetSymbol = "BTC";
      const date = Math.floor(Date.now() / 1000) - 60 * 60 * 2;
      const price = BigInt(60000 * 1e9);
      const param = coder.encode(
        ["string", "uint256", "uint256"],
        [assetSymbol, date, price]
      );
      await expect(provider.connect(kofi).provideData(param))
        .to.emit(provider, "AssetPriceProvided")
        .withArgs(await kofi.getAddress(), assetSymbol, date, price);
      const assetDateParam = coder.encode(
        ["string", "uint256"],
        [assetSymbol, date]
      );
      const assetData = await provider.getData(assetDateParam);

      const [_price] = coder.decode(["uint256"], assetData);

      expect(BigInt(_price)).to.equals(price);
    });
    it("Should Fail to Get Data", async function () {
      const { provider, kofi, kojo } = await loadFixture(
        deployAssetPriceProviderWithKofiProvder
      );
      const coder = new ethers.AbiCoder();
      const assetSymbol = "BTC";
      const date = Math.floor(Date.now() / 1000) - 60 * 60 * 2;
      const param = coder.encode(["string", "uint256"], [assetSymbol, date]);
      await expect(provider.connect(kojo).getData(param))
        .to.revertedWithCustomError(provider, "InvalidAssetSymbolDate")
        .withArgs(assetSymbol, date);
      expect(await provider.connect(kojo).hasData(param)).to.be.false;
    });
  });
});
