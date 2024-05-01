import { ethers } from "hardhat";
import 'dotenv/config';
import * as fs from 'fs';

async function main() {
  const shadow = await ethers.getContractAt("SymbolFeedUSD", process.env.SYMBOL_FEED_CONTRACT!);

  const symbols: string[] = [];
  const aggregators: string[] = [];

  const f = fs.readFileSync('optimistic-goerli-aggregators.txt');

  for(const s of f.toString().split('\n')) {
    const [sym, aggr] = s.split(' ');
    symbols.push(sym);
    aggregators.push(aggr);
  }

  if(symbols.length != aggregators.length) {
    throw new Error("Invalid lengths."); 
  }

  const tx = await shadow.setSymbols(symbols, aggregators);

  console.log(`deployed to ${JSON.stringify(tx, null, 2)}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
