import { ethers } from "hardhat";

async function main() {
  const shadow = await ethers.getContractAt(
    "BallsAirDrop",
    process.env.AIRDROP_BALLS!
  );

  const balls = await ethers.getContractAt("BallsToken", process.env.BALLS!);

  const acnts: string[] = [
  ];

  const _val = BigInt(100 * 1e18);
//   const _total = BigInt(_val * BigInt(acnts.length));

//   await balls.approve(process.env.AIRDROP_BALLS!, _total);

  await shadow.airDrop(acnts, _val);
  console.log("AirDrops ...");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
