const createSignature = async (signer, { domain, value }) => {
  const { name, chainId, verifyingContract } = domain;
  const { account, tokenId, price, nonce } = value;

  const signature = await signer._signTypedData(
    // Domain
    {
      name: name,
      version: "1.0.0",
      chainId: chainId,
      verifyingContract: verifyingContract,
    },
    // Types
    {
      NFT: [
        { name: "account", type: "address" },
        { name: "tokenId", type: "uint256" },
        { name: "price", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ],
    },
    // Value
    {
      account,
      tokenId,
      price,
      nonce,
    }
  );

  return signature;
};

module.exports = {
  createSignature,
};
