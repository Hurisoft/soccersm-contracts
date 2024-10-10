import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

export async function deployBallsFaucet() {
  const [owner, otherAccount, noBalls] = await ethers.getSigners();

  const Balls = await ethers.getContractFactory("BallsToken");
  const balls = await Balls.deploy();

  const Wheel = await ethers.getContractFactory("Wheel");
  const wheel = await Wheel.deploy(balls);

  await balls.transfer(await wheel.getAddress(), BigInt(1e24));

  const airDropBalls = BigInt(10000 * 1e18);

  await balls.transfer(otherAccount, airDropBalls);

  return { balls, owner, otherAccount, wheel, noBalls };
}

describe("BallsFaucet", function () {
  describe("Deployment", function () {
    it("Should Deploy", async function () {
      await loadFixture(deployBallsFaucet);
    });
  });

  describe("Spin Wheel", function () {
    it("Should Spin", async function () {
      const { wheel, otherAccount, balls } = await loadFixture(
        deployBallsFaucet
      );
      await balls
        .connect(otherAccount)
        .approve(await wheel.getAddress(), await wheel.spinStake());
      await expect(wheel.connect(otherAccount).spin())
        .emit(wheel, "NewSpin")
        .withArgs(
          await otherAccount.getAddress(),
          await wheel.spinStake(),
          anyValue
        );

      await wheel.setMixer(10000);
      await balls
        .connect(otherAccount)
        .approve(await wheel.getAddress(), await wheel.spinStake());
      await expect(wheel.connect(otherAccount).spin())
        .emit(wheel, "NewSpin")
        .withArgs(
          await otherAccount.getAddress(),
          await wheel.spinStake(),
          anyValue
        );

      await expect(wheel.connect(otherAccount).spin()).reverted;
    });
    it("Should Not Spin", async function () {
      const { wheel, otherAccount, balls, noBalls } = await loadFixture(
        deployBallsFaucet
      );
      await balls
        .connect(otherAccount)
        .approve(await wheel.getAddress(), await wheel.spinStake());
      await expect(wheel.connect(otherAccount).spin())
        .emit(wheel, "NewSpin")
        .withArgs(
          await otherAccount.getAddress(),
          await wheel.spinStake(),
          anyValue
        );
      await wheel.setMixer(10000);
      await wheel.setSpinStake(BigInt(199 * 1e18));
      await balls
        .connect(otherAccount)
        .approve(await wheel.getAddress(), BigInt(50 * 1e18));
      await expect(wheel.connect(otherAccount).spin()).reverted;
      await balls
        .connect(otherAccount)
        .approve(await wheel.getAddress(), await wheel.spinStake());
      await wheel.setMixer(999);
      await wheel.setWheel([10, 20, 30, 40, 50, 60, 70, 80]);
      await expect(wheel.connect(otherAccount).spin())
        .emit(wheel, "NewSpin")
        .withArgs(
          await otherAccount.getAddress(),
          await wheel.spinStake(),
          anyValue
        );
      await expect(wheel.connect(noBalls).spin()).to.revertedWithCustomError(
        wheel,
        "UserLacksBalls"
      );
    });
    it("Should Not Set", async function () {
      const { wheel, otherAccount, balls, noBalls } = await loadFixture(
        deployBallsFaucet
      );
      await expect(wheel.setMixer(0)).to.revertedWithCustomError(
        wheel,
        "InvalidMixAmount"
      );
      await expect(wheel.setSpinStake(BigInt(199))).to.revertedWithCustomError(
        wheel,
        "InvalidStakeAmount"
      );
      await expect(
        wheel.setWheel([10, 20, 30, 40, 60, 70, 80])
      ).to.revertedWithCustomError(wheel, "InvalidWheel");
      await expect(
        wheel.setWheel([10, 20, 30, 40, 50, 60, 70, 0])
      ).to.revertedWithCustomError(wheel, "InvalidWheel");
      await expect(
        wheel.connect(otherAccount).setMixer(0)
      ).to.revertedWithCustomError(wheel, "OwnableUnauthorizedAccount");
      await expect(
        wheel.connect(otherAccount).setSpinStake(BigInt(199))
      ).to.revertedWithCustomError(wheel, "OwnableUnauthorizedAccount");
      await expect(
        wheel.connect(otherAccount).setWheel([10, 20, 30, 40, 50, 60, 70, 80])
      ).to.revertedWithCustomError(wheel, "OwnableUnauthorizedAccount");
    });
  });
});
