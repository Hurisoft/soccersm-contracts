import { ethers } from "hardhat";
import 'dotenv/config';
import * as fs from 'fs';

async function main() {
  const shadow = await ethers.getContractFactory("SymbolFeedUSD");

  const pool = await shadow.deploy();

  await pool.waitForDeployment();

  const { ...tx} = pool.deploymentTransaction()?.toJSON();
  tx.data = await pool.getAddress();

  console.log(`deployed to ${JSON.stringify(tx, null, 2)}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
