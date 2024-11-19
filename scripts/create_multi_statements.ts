import { ethers } from "hardhat";

async function main() {
  const shadow = await ethers.getContractAt(
    "MultiGeneralStatementProvider",
    process.env.MULTI_GENERAL_STATEMENT_PROVIDER!
  );
  const coder = new ethers.AbiCoder();
  const statementId = 3;
  const maturity = 1730937600;
  const result = ethers.toUtf8Bytes("");
  const statement = "Mike Tyson vrs. Jake Paul: Who wins?";
  const options = [
    "Mike Tyson",
    "Jake Paul",
    "Draw or Not Scored"
  ].map((op) => ethers.toUtf8Bytes(op));
  const param = coder.encode(
    ["uint256", "string", "uint256", "bytes", "bytes[]"],
    [statementId, statement, maturity, result, options]
  );
  await shadow.provideData(param); // 5

  console.log("Statement Created ... " + statement);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
