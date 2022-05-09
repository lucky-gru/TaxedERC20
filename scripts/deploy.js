const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  // We get the contract to deploy
  const TaxedToken = await ethers.getContractFactory("TaxedToken");

  const taxedToken = await TaxedToken.deploy(3, 50, "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");

  await taxedToken.deployed();

  console.log("TaxedToken deployed to:", taxedToken.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });