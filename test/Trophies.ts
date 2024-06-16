import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
  import { expect } from "chai";
  import { ethers } from "hardhat";
  
  export async function deployTrophies() {
    const [owner, otherAccount, evaluator] = await ethers.getSigners();
  
    const Trophies = await ethers.getContractFactory("Trophies");
    const trophies = await Trophies.deploy();
  
    return { trophies, owner, otherAccount, evaluator };
  }
  
  describe("Trophies", function () {

    describe("Deployment", function () {
      it("Should Deploy", async function () {
        await loadFixture(deployTrophies);
      });
    });
  });
  