const { ethers } = require("hardhat");

async function main() {
  const collectionAddress = "0xC73B09dfa8618Af23a3A7463A8a7ddE7Dc2a0aef";
  const signerAddress = "0x7E076BDd93FAB77513700b91466437f4F2595AfF";

  const [deployer] = await ethers.getSigners();
  console.log("Calling contract with the account: ", deployer.address);

  const Collection = await ethers.getContractFactory("Collection");
  const collection = Collection.attach(collectionAddress);

  const tx = await collection.addSigner(signerAddress);
  await tx.wait();

  const isSigner = await collection.isSigner(signerAddress);
  if (isSigner) {
    console.log(`You successfully added ${signerAddress} as signer!`);
  } else {
    console.log("Something went wrong, please try again!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
