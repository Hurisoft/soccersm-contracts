import { ethers } from "hardhat";

async function main() {
  const shadow = await ethers.getContractAt(
    "MultiSend",
    process.env.MULTIPLE_SEND!
  );

  const tanks: string[] = [];

  await shadow.transfer(tanks, ethers.parseEther("0.07"), {
    value: ethers.parseEther("7"),
  });
  console.log("Top Ups Made ...");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
