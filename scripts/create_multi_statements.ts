import { ethers } from "hardhat";

async function main() {
  const shadow = await ethers.getContractAt(
    "MultiGeneralStatementProvider",
    process.env.MULTI_GENERAL_STATEMENT_PROVIDER!
  );
  const coder = new ethers.AbiCoder();
  const statementId = 20;
  const maturity = 1729987200;
  const result = ethers.toUtf8Bytes("");
  const statement = "Winner of Men's Ballon D'or";
  const options = [
    "Jude Bellingham",
    "Hakan Calhanoglu",
    "Dani Carvajal",
    "Ruben Dias",
    "Artem Dovbyk",
    "Phil Foden",
    "Alejandro Grimaldo",
    "Erling Haaland",
    "Mats Hummels",
    "Harry Kane",
    "Toni Kroos",
    "Ademola Lookman",
    "Emiliano Martinez",
    "Lautaro Martinez",
    "Kylian Mbappe",
    "Martin Odegaard",
    "Dani Olmo",
    "Cole Palmer",
    "Declan Rice",
    "Rodri",
    "Antonio Rudiger",
    "Bukayo Saka",
    "William Saliba",
    "Federico Valverde",
    "Vinícius Junior",
    "Vitinha",
    "Nico Williams",
    "Florian Wirtz",
    "Granit Xhaka",
    "Lamine Yamal",
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
