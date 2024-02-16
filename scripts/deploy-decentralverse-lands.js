const { ethers } = require("hardhat");

async function main() {
  const NAME = "DecentralverseLands";
  const SYMBOL = "LAND";
  const BASE_URI = "";

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with the account: ", deployer.address);

  const Collection = await ethers.getContractFactory("DecentralverseLands");
  const collection = await Collection.deploy(NAME, SYMBOL, BASE_URI);
  await collection.deployed();

  console.log("Success! Collection was deployed to: ", collection.address);

  await run("verify:verify", {
    address: collection.address,
    constructorArguments: [NAME, SYMBOL, BASE_URI],
    contract: "contracts/DecentralverseLands.sol:DecentralverseLands",
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
