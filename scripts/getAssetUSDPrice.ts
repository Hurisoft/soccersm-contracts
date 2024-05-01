import { ethers } from "hardhat";
import 'dotenv/config';

async function main() {
  const shadow = await ethers.getContractAt("SymbolFeedUSD", process.env.SYMBOL_FEED_CONTRACT!);

  const resp = await shadow.getUSDPrice('BTC');

  console.log(resp);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
