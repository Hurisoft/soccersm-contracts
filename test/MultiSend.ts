import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

export async function deployBallsFaucet() {
  const [owner, a, b, c] = await ethers.getSigners();

  const MultiSend = await ethers.getContractFactory("MultiSend");
  const multiSend = await MultiSend.deploy();

  return { multiSend, owner, a, b, c };
}

describe("MultiSend", function () {
  describe("Deployment", function () {
    it("Should Deploy", async function () {
      await loadFixture(deployBallsFaucet);
    });
  });

  describe("MultiSend", function () {
    it("Should MultiSend", async function () {
      const { multiSend, a, b, c } = await loadFixture(deployBallsFaucet);
      const addresses = [
        await a.getAddress(),
        await b.getAddress(),
        await c.getAddress(),
      ];
      await expect(
        multiSend.transfer(addresses, ethers.parseEther("0.005"), {
          value: ethers.parseEther("0.015"),
        })
      )
        .emit(multiSend, "Sent")
        .withArgs(a.getAddress(), ethers.parseEther("0.005"));
    });
  });
});
