import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

export async function deployTopicRegistry() {
  const [owner, otherAccount, evaluator] = await ethers.getSigners();

  const TopicRegistry = await ethers.getContractFactory("TopicRegistry");
  const registry = await TopicRegistry.deploy();

  return { registry, owner, otherAccount, evaluator };
}

describe("TopicRegistry", function () {
  async function createTopics() {
    const { registry, owner, otherAccount, evaluator } = await loadFixture(
      deployTopicRegistry
    );

    const title = "Asset Price Above";
    const description =
      "Predict whether the exit price will be higher than the target price at the end of the given time period.";

    await registry.createTopic(title, description, evaluator);

    return { registry, owner, otherAccount, evaluator };
  }

  describe("Deployment", function () {
    it("Should Deploy", async function () {
      await loadFixture(deployTopicRegistry);
    });
  });

  describe("Create Topic", function () {
    it("Should create topic successfully", async function () {
      const { registry, owner, otherAccount } = await loadFixture(createTopics);
    });
    it("Should fail with empty title or description", async function () {
      const { registry, owner, otherAccount, evaluator } = await loadFixture(
        createTopics
      );
      const emptyTitle = "";
      const emptyDescription = "";
      const title = "Asset Price Above";
      const description =
        "Predict whether the exit price will be higher than the target price at the end of the given time period.";

      await expect(
        registry.createTopic(emptyTitle, description, evaluator)
      ).to.revertedWithCustomError(registry, "EmptyString");

      await expect(
        registry.createTopic(title, emptyDescription, evaluator)
      ).to.revertedWithCustomError(registry, "EmptyString");
    });
    it("Should fail with invalid owner", async function () {
      const { registry, owner, otherAccount, evaluator } = await loadFixture(
        deployTopicRegistry
      );

      const title = "Asset Price Above";
      const description =
        "Predict whether the exit price will be higher than the target price at the end of the given time period.";

      await expect(
        registry
          .connect(otherAccount)
          .createTopic(title, description, evaluator)
      ).to.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });
  });
  describe("Disable Topic", function () {
    it("Should disable topic successfully", async function () {
      const { registry, owner, otherAccount } = await loadFixture(createTopics);
      const topicId = 0;

      await registry.disableTopic(topicId);
    });
    it("Should fail with invalid topic id", async function () {
      const { registry, owner, otherAccount } = await loadFixture(createTopics);
      const topicId = 1;

      await expect(registry.disableTopic(topicId)).to.revertedWithCustomError(
        registry,
        "InvalidTopic"
      );
    });
    it("Should fail with invalid owner", async function () {
      const { registry, owner, otherAccount, evaluator } = await loadFixture(
        deployTopicRegistry
      );

      const topicId = 0;

      await expect(
        registry.connect(otherAccount).disableTopic(topicId)
      ).to.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });
  });
  describe("Enable Topic", function () {
    it("Should enable topic successfully", async function () {
      const { registry, owner, otherAccount } = await loadFixture(createTopics);
      const topicId = 0;

      await registry.disableTopic(topicId);

      await registry.enableTopic(topicId);
    });
    it("Should fail with invalid topic id", async function () {
      const { registry, owner, otherAccount } = await loadFixture(createTopics);
      const topicId = 0;

      await registry.disableTopic(topicId);

      await expect(
        registry.enableTopic(topicId + 1)
      ).to.revertedWithCustomError(registry, "InvalidTopic");
    });
    it("Should fail with invalid owner", async function () {
      const { registry, owner, otherAccount, evaluator } = await loadFixture(
        createTopics
      );

      const topicId = 0;
      await registry.disableTopic(topicId);
      await expect(
        registry.connect(otherAccount).enableTopic(topicId)
      ).to.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });
  });
});
