import { ethers } from "hardhat";

async function main() {
  const shadow = await ethers.getContractAt(
    "GeneralStatementProvider",
    process.env.GENERAL_STATEMENT_PROVIDER!
  );
  const coder = new ethers.AbiCoder();
  const statementId = 107;
  const statement = "Namibia will elect their first female President in 2024";
  const maturity = 1730419200;
  const result = 0;
  const param = coder.encode(
    ["uint256", "string", "uint256", "uint8"],
    [statementId, statement, maturity, result]
  );
  await shadow.provideData(param); // 5

  console.log("Statement Created ...");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
