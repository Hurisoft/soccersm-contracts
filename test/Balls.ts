import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
  import { expect } from "chai";
  import { ethers } from "hardhat";
  
  export async function deployBalls() {
    const [owner, otherAccount, evaluator] = await ethers.getSigners();
  
    const Balls = await ethers.getContractFactory("BallsToken");
    const balls = await Balls.deploy();
  
    return { balls, owner, otherAccount, evaluator };
  }
  
  describe("Balls", function () {

    describe("Deployment", function () {
      it("Should Deploy", async function () {
        await loadFixture(deployBalls);
      });
    });
  });
  