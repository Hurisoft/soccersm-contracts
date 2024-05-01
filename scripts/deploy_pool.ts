import { ethers } from "hardhat";
import 'dotenv/config';

async function main() {
  const shadow = await ethers.getContractFactory("Soccersm");

  const pool = await shadow.deploy(process.env.REGISTRY_CONTRACT!);

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
