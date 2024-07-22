import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

export async function deployBallsFaucet() {
  const [owner, otherAccount] = await ethers.getSigners();

  const Balls = await ethers.getContractFactory("BallsToken");
  const balls = await Balls.deploy();

  const BallsFaucet = await ethers.getContractFactory("BallsFaucet");
  const faucet = await BallsFaucet.deploy(balls);

  await balls.transfer(await faucet.getAddress(), BigInt(1e24));

  return { balls, owner, otherAccount, faucet };
}

describe("BallsFaucet", function () {
  describe("Deployment", function () {
    it("Should Deploy", async function () {
      await loadFixture(deployBallsFaucet);
    });
  });

  describe("Claim Balls", function () {
    it("Should Claim Balls", async function () {
      const { faucet, otherAccount } = await loadFixture(deployBallsFaucet);
      await expect(faucet.connect(otherAccount).claim())
        .emit(faucet, "Claimed")
        .withArgs(await otherAccount.getAddress(), await faucet.dailyClaim());

      await expect(
        faucet.connect(otherAccount).claim()
      ).revertedWithCustomError(faucet, "AlreadyClaimed");

    });
  });
});
