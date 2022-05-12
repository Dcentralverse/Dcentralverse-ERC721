const createSignature = async (signer, { domain, value }) => {
  const { name, chainId, verifyingContract } = domain;
  const { account, cid, price } = value;

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
        { name: "cid", type: "string" },
        { name: "price", type: "uint256" },
      ],
    },
    // Value
    {
      account,
      cid,
      price,
    }
  );

  return signature;
};

module.exports = {
  createSignature,
};
