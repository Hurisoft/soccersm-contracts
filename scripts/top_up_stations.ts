import { ethers } from "hardhat";

async function main() {
  const shadow = await ethers.getContractAt(
    "MultiSend",
    process.env.MULTIPLE_SEND!
  );

  const tanks: string[] = [
    "0xD1A546a17aC49aEECD7720F30E91ce78724680f9",
    "0xcfC6694aCf8E2eFD6f732f8C424038927eb484a0",
    "0xb847BFd4A7d70dFE4f9130519b35979ad9497752",
    "0x384419108921E3283138fcB0493c60C236e6ff5e",
    "0xBFad722D3dcbF9e6F729C01eeD9ADc4C35448d3F",
    "0xb95fDC86bB197232b95c88ae664477f53D9FCF07",
    "0x9488003C23cD6d6Bb516Ed3B8691773C3e164889",
    "0x2962Bd3E84A5fE573Dd9c0dB8a35a82496759cCb",
    "0xcDA0797B5B7CB132E1D83891ef8C101aF45365B1",
    "0x4941A5838F00b810b3B686D58144e22e19bDa4af",
    "0xa50aA5c424d4f9Ff14739250bc8E889e3d04dc12",
    "0x78e860388b188b11D25B0189bAbEA3404CF9e550",
    "0x5545B04Fa1d50Fd2E4E06Bf94bb936E8edE43EfF",
    "0x31F6F8a4D05E6A85b1F2481a0B8730Eb0dDf1759",
    "0x5DD786fAe3d6F2Cd51D2c3Cc794aE131377E48E6",
    "0xB1007e3E11cA104FF3Fb61055e696d1ba1716455",
    "0xc44860B653F03726506b244795824528E83Bff91",
    "0x4cCb897ECd5ff38E17Bc34f2d1a1D3085b412cB6",
    "0xF3a697DE053547653381BB1A2240DAf2925f2f67",
    "0x49139FC6B86E43b348c8642543868b907FA4fFB7",
    "0x46dF4fCB460473B64eE46060De904Ef12F4beaCA",
  ];

  await shadow.transfer(tanks, ethers.parseEther("0.005"), {
    value: ethers.parseEther("0.105"),
  });
  console.log("Top Ups Made ...");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
