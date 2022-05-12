const { ethers } = require("hardhat");

async function main() {
  const NAME = "Land";
  const SYMBOL = "LND";

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with the account: ", deployer.address);

  const Collection = await ethers.getContractFactory("Collection");
  const collection = await Collection.deploy(NAME, SYMBOL);
  await collection.deployed();

  console.log("Success! Collection was deployed to: ", collection.address);

  await run("verify:verify", {
    address: collection.address,
    constructorArguments: [NAME, SYMBOL],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
