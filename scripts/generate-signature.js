const { ethers } = require("hardhat");
const { createSignature } = require("./utils/createSignature");

async function main() {
  const name = "Land";
  const collectionAddress = "0xC73B09dfa8618Af23a3A7463A8a7ddE7Dc2a0aef";
  const account = "0x78e7C4C88d44aD2178a2Cf5cC8883a761996e2E9";
  const tokenId = 1250;
  const nonce = 0;
  const price = ethers.utils.parseEther("0.01");

  const { chainId } = await ethers.provider.getNetwork();
  const signData = {
    domain: {
      name: name,
      chainId: chainId,
      verifyingContract: collectionAddress,
    },
    value: {
      account: account,
      tokenId: tokenId,
      price: price,
      nonce: nonce,
    },
  };

  const [, signer] = await ethers.getSigners();
  console.log("We are signing data with this account: ", signer.address);

  const signature = await createSignature(signer, signData);

  console.log("Success! Signature is: ", signature);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
