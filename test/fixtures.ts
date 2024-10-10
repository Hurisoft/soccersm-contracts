import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

export async function deployFootballScoreProviderWithKofiProvder() {
  const [owner, feeAccount, otherAccount, kojo, kwame, kofi] =
    await ethers.getSigners();

  const FootballScoreProvider = await ethers.getContractFactory(
    "FootballScoreProvider"
  );
  const provider = await FootballScoreProvider.deploy();

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

export async function deployFootballScoreProviderWithKojoReader() {
  const [owner, feeAccount, otherAccount, kojo, kwame, kofi] =
    await ethers.getSigners();

  const FootballScoreProvider = await ethers.getContractFactory(
    "FootballScoreProvider"
  );
  const provider = await FootballScoreProvider.deploy();

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

export async function deployFootballOutcomeEvaluator() {
  const { provider, kofi } = await loadFixture(
    deployFootballScoreProviderWithKofiProvder
  );

  const [owner, feeAccount, otherAccount, kojo, kwame] =
    await ethers.getSigners();

  // deploy football evaluator
  const FootballOutcomeEvaluator = await ethers.getContractFactory(
    "FootballOutcomeEvaluator"
  );

  const evaluator = await FootballOutcomeEvaluator.deploy(provider);

  console.log(await evaluator.getAddress(), "FootballOutcomeEvaluator");

  await provider.addReader(await evaluator.getAddress());

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

export async function deployFootBallCorrectScoreEvaluator() {
  const { provider, kofi } = await loadFixture(
    deployFootballScoreProviderWithKofiProvder
  );

  const [owner, feeAccount, otherAccount, kojo, kwame] =
    await ethers.getSigners();

  // deploy football evaluator
  const FootBallCorrectScoreEvaluator = await ethers.getContractFactory(
    "FootBallCorrectScoreEvaluator"
  );

  const evaluator = await FootBallCorrectScoreEvaluator.deploy(provider);
  console.log(await evaluator.getAddress(), "FootBallCorrectScoreEvaluator");

  await provider.addReader(await evaluator.getAddress());

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

export async function deployFootballOverUnderEvaluator() {
  const { provider, kofi } = await loadFixture(
    deployFootballScoreProviderWithKofiProvder
  );

  const [owner, feeAccount, otherAccount, kojo, kwame] =
    await ethers.getSigners();

  // deploy football evaluator
  const FootballOverUnderEvaluator = await ethers.getContractFactory(
    "FootballOverUnderEvaluator"
  );

  const evaluator = await FootballOverUnderEvaluator.deploy(provider);
  console.log(await evaluator.getAddress(), "FootballOverUnderEvaluator");

  await provider.addReader(await evaluator.getAddress());

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

export async function deployAssetPriceTargetEvaluator() {
  const { provider, kofi } = await loadFixture(
    deployAssetPriceProviderWithKofiProvder
  );

  const [owner, feeAccount, otherAccount, kojo, kwame] =
    await ethers.getSigners();

  // deploy football evaluator
  const AssetPriceTargetEvaluator = await ethers.getContractFactory(
    "AssetPriceTargetEvaluator"
  );

  const evaluator = await AssetPriceTargetEvaluator.deploy(provider);

  console.log(await evaluator.getAddress(), "AssetPriceTargetEvaluator");

  await provider.addReader(await evaluator.getAddress());

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

export async function deployAssetPriceBoundedEvaluator() {
  const { provider, kofi } = await loadFixture(
    deployAssetPriceProviderWithKofiProvder
  );

  const [owner, feeAccount, otherAccount, kojo, kwame] =
    await ethers.getSigners();

  // deploy football evaluator
  const AssetPriceBoundedEvaluator = await ethers.getContractFactory(
    "AssetPriceBoundedEvaluator"
  );

  const evaluator = await AssetPriceBoundedEvaluator.deploy(provider);

  console.log(await evaluator.getAddress(), "AssetPriceBoundedEvaluator");

  await provider.addReader(await evaluator.getAddress());

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

export async function deployGeneralStatementProviderWithKofiProvder() {
  const [owner, feeAccount, otherAccount, kojo, kwame, kofi] =
    await ethers.getSigners();

  const GeneralStatementProvider = await ethers.getContractFactory(
    "GeneralStatementProvider"
  );
  const provider = await GeneralStatementProvider.deploy();

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

export async function deployGeneralStatementProviderWithKojoReader() {
  const [owner, feeAccount, otherAccount, kojo, kwame, kofi] =
    await ethers.getSigners();

  const GeneralStatementProvider = await ethers.getContractFactory(
    "GeneralStatementProvider"
  );
  const provider = await GeneralStatementProvider.deploy();

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

export async function deployGeneralStatementEvaluator() {
  const { provider, kofi } = await loadFixture(
    deployGeneralStatementProviderWithKofiProvder
  );

  const [owner, feeAccount, otherAccount, kojo, kwame] =
    await ethers.getSigners();

  // deploy general statement evaluator
  const GeneralStatementEvaluator = await ethers.getContractFactory(
    "GeneralStatementEvaluator"
  );

  const evaluator = await GeneralStatementEvaluator.deploy(provider);
  console.log(await evaluator.getAddress(), "GeneralStatementEvaluator");

  await provider.addReader(await evaluator.getAddress());

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

export async function deployMultiGeneralStatementProviderWithKofiProvder() {
  const [owner, feeAccount, otherAccount, kojo, kwame, kofi] =
    await ethers.getSigners();

  const MultiGeneralStatementProvider = await ethers.getContractFactory(
    "MultiGeneralStatementProvider"
  );
  const provider = await MultiGeneralStatementProvider.deploy();

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

export async function deployMultiGeneralStatementProviderWithKojoReader() {
  const [owner, feeAccount, otherAccount, kojo, kwame, kofi] =
    await ethers.getSigners();

  const MultiGeneralStatementProvider = await ethers.getContractFactory(
    "MultiGeneralStatementProvider"
  );
  const provider = await MultiGeneralStatementProvider.deploy();

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

export async function deployMultiGeneralStatementEvaluator() {
  const { provider, kofi } = await loadFixture(
    deployGeneralStatementProviderWithKofiProvder
  );

  const [owner, feeAccount, otherAccount, kojo, kwame] =
    await ethers.getSigners();

  // deploy general statement evaluator
  const MultiGeneralStatementEvaluator = await ethers.getContractFactory(
    "MultiGeneralStatementEvaluator"
  );

  const evaluator = await MultiGeneralStatementEvaluator.deploy(provider);
  console.log(await evaluator.getAddress(), "MultiGeneralStatementEvaluator");

  await provider.addReader(await evaluator.getAddress());

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
