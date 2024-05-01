import { ethers } from "hardhat";
import 'dotenv/config';

async function main() {
  const shadow = await ethers.getContractFactory("PoolManager");

  const pm = await shadow.deploy(process.env.POOL_CONTRACT!);

  await pm.waitForDeployment();

  const { ...tx} = pm.deploymentTransaction()?.toJSON();
  tx.data = await pm.getAddress();

  console.log(`deployed to ${JSON.stringify(tx, null, 2)}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
