const { expect } = require("chai");
const { ethers } = require("hardhat");
const { createSignature } = require("./helpers/createSignature");

describe("Collection", function () {
  let owner, signer, user1, user2;
  let collection;
  let defaultSignData;

  beforeEach(async function () {
    [owner, signer, user1, user2] = await ethers.getSigners();

    const { chainId } = await ethers.provider.getNetwork();

    const NAME = "DecentralverseLands";
    const SYMBOL = "LND";
    const BASE_URI = "https://metadata.decentralverse.com/";

    const Collection = await ethers.getContractFactory("DecentralverseLands");
    collection = await Collection.deploy(NAME, SYMBOL, BASE_URI);
    await collection.deployed();

    defaultSignData = {
      domain: {
        name: NAME,
        chainId: chainId,
        verifyingContract: collection.address,
      },
      value: { account: "", price: "", nonce: 0 },
    };

    await collection.addSigner(signer.address);
  });

  describe("Minting", function () {
    describe("User is authorized (signature is valid for particular user)", function () {
      it("should allow to mint if user provides correct data", async function () {
        const tokenPrice = ethers.utils.parseEther("0.01");

        const signData = {
          ...defaultSignData,
          value: {
            account: user1.address,
            tokenId: 1250,
            price: tokenPrice,
            nonce: 0,
          },
        };
        const signature = await createSignature(signer, signData);

        expect(await collection.balanceOf(user1.address)).to.equal(0);

        const tx = await collection
          .connect(user1)
          .mint(1250, tokenPrice, 0, signature, { value: tokenPrice });

        const receipt = await tx.wait();
        const eventData = receipt.events.find(({ event }) => event === "Mint");
        const [tokenId, address, price] = eventData.args;

        expect(tokenId).to.equal(1250);
        expect(address).to.equal(user1.address);
        expect(price).to.equal(tokenPrice);

        expect(await collection.balanceOf(user1.address)).to.equal(1);
        expect(await collection.ownerOf(1250)).to.equal(user1.address);
      });

      it("should not allow to mint with same nonce twice", async function () {
        const tokenPrice = ethers.utils.parseEther("0.01");

        const signData = {
          ...defaultSignData,
          value: {
            account: user1.address,
            tokenId: 1250,
            price: tokenPrice,
            nonce: 0,
          },
        };
        const signature = await createSignature(signer, signData);

        await collection
          .connect(user1)
          .mint(1250, tokenPrice, 0, signature, { value: tokenPrice });

        await expect(
          collection
            .connect(user1)
            .mint(1250, tokenPrice, 0, signature, { value: tokenPrice })
        ).to.be.revertedWith("NonceUsed");
      });

      it("should not allow to mint with same token id", async function () {
        const tokenPrice = ethers.utils.parseEther("0.01");

        const signData = {
          ...defaultSignData,
          value: {
            account: user1.address,
            tokenId: 1250,
            price: tokenPrice,
            nonce: 0,
          },
        };
        const signature = await createSignature(signer, signData);

        await collection
          .connect(user1)
          .mint(1250, tokenPrice, 0, signature, { value: tokenPrice });

        const signData2 = {
          ...defaultSignData,
          value: {
            account: user1.address,
            tokenId: 1250,
            price: tokenPrice,
            nonce: 1,
          },
        };
        const signature2 = await createSignature(signer, signData2);

        await expect(
          collection
            .connect(user1)
            .mint(1250, tokenPrice, 1, signature2, { value: tokenPrice })
        ).to.be.revertedWith("ERC721: token already minted");
      });

      it("should not allow to mint if user provides wrong nonce", async function () {
        const tokenPrice = ethers.utils.parseEther("0.01");

        const signData = {
          ...defaultSignData,
          value: {
            account: user1.address,
            tokenId: 1250,
            price: tokenPrice,
            nonce: 0,
          },
        };
        const signature = await createSignature(signer, signData);

        await expect(
          collection
            .connect(user1)
            .mint(1250, tokenPrice, 1, signature, { value: tokenPrice })
        ).to.be.revertedWith("InvalidSignature");
      });

      it("should not allow to mint if user provides wrong price", async function () {
        const tokenPrice = ethers.utils.parseEther("0.01");

        const signData = {
          ...defaultSignData,
          value: {
            account: user1.address,
            tokenId: 1250,
            price: tokenPrice,
            nonce: 0,
          },
        };
        const signature = await createSignature(signer, signData);

        await expect(
          collection
            .connect(user1)
            .mint(1250, tokenPrice.sub(1), 0, signature, {
              value: tokenPrice.sub(1),
            })
        ).to.be.revertedWith("InvalidSignature");
      });

      it("should not allow to mint if user provides wrong token id", async function () {
        const tokenPrice = ethers.utils.parseEther("0.01");

        const signData = {
          ...defaultSignData,
          value: {
            account: user1.address,
            tokenId: 1250,
            price: tokenPrice,
            nonce: 0,
          },
        };
        const signature = await createSignature(signer, signData);

        await expect(
          collection
            .connect(user1)
            .mint(1251, tokenPrice, 0, signature, { value: tokenPrice })
        ).to.be.revertedWith("InvalidSignature");
      });

      it("should not allow to mint if user provides wrong value", async function () {
        const tokenPrice = ethers.utils.parseEther("0.01");

        const signData = {
          ...defaultSignData,
          value: {
            account: user1.address,
            tokenId: 1250,
            price: tokenPrice,
            nonce: 0,
          },
        };
        const signature = await createSignature(signer, signData);

        await expect(
          collection
            .connect(user1)
            .mint(1250, tokenPrice, 0, signature, { value: tokenPrice.sub(1) })
        ).to.be.revertedWith("InvalidValue");
      });
    });

    describe("User is not authorized (signature is not valid for particular user)", function () {
      it("should not allow to mint if user provides someone else signature and correct data", async function () {
        const tokenPrice = ethers.utils.parseEther("0.01");

        const signData = {
          ...defaultSignData,
          value: {
            account: user1.address,
            tokenId: 1250,
            price: tokenPrice,
            nonce: 0,
          },
        };
        const signature = await createSignature(signer, signData);

        await expect(
          collection
            .connect(user2)
            .mint(1250, tokenPrice, 0, signature, { value: tokenPrice })
        ).to.be.revertedWith("InvalidSignature");
      });

      it("should not allow to mint if user provides signature signed by himself", async function () {
        const tokenPrice = ethers.utils.parseEther("0.01");

        const signData = {
          ...defaultSignData,
          value: {
            account: user1.address,
            tokenId: 1250,
            price: tokenPrice,
            nonce: 0,
          },
        };
        const signature = await createSignature(user1, signData);

        await expect(
          collection
            .connect(user1)
            .mint(1250, tokenPrice, 0, signature, { value: tokenPrice })
        ).to.be.revertedWith("InvalidSignature");
      });
    });
  });

  describe("Token URI", function () {
    it("contract should set correct token URI after minting", async function () {
      const tokenPrice = ethers.utils.parseEther("0.01");

      const signData = {
        ...defaultSignData,
        value: {
          account: user1.address,
          tokenId: 1250,
          price: tokenPrice,
          nonce: 0,
        },
      };
      const signature = await createSignature(signer, signData);

      await collection
        .connect(user1)
        .mint(1250, tokenPrice, 0, signature, { value: tokenPrice });

      expect(await collection.tokenURI(1250)).to.equal(
        "https://metadata.decentralverse.com/1250"
      );
    });

    it("should change base uri", async function () {
      const tokenPrice = ethers.utils.parseEther("0.01");
      const signData = {
        ...defaultSignData,
        value: {
          account: user1.address,
          tokenId: 1250,
          price: tokenPrice,
          nonce: 0,
        },
      };
      const signature = await createSignature(signer, signData);
      await collection
        .connect(user1)
        .mint(1250, tokenPrice, 0, signature, { value: tokenPrice });

      const newBaseURI = "ipfs://test-folder/";
      await collection.reveal(newBaseURI);
      expect(await collection.baseURI()).to.equal(newBaseURI);

      expect(await collection.tokenURI(1250)).to.equal(
        "ipfs://test-folder/1250"
      );
    });

    it("should not allow to change base uri if caller is not owner", async function () {
      await expect(
        collection.connect(user1).reveal("ipfs://test-folder/")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should seal contract permanently and then revert if trying to change base uri", async function () {
      expect(await collection.isSealed()).to.equal(false);

      await collection.sealContractPermanently();

      expect(await collection.isSealed()).to.equal(true);

      await expect(collection.reveal("ipfs://test-folder/")).to.be.revertedWith(
        "ContractSealed"
      );
    });

    it("should not allow to seal contract if contract is already sealed", async function () {
      await collection.sealContractPermanently();

      await expect(collection.sealContractPermanently()).to.be.revertedWith(
        "ContractSealed"
      );
    });

    it("should not allow to seal contract if caller is not owner", async function () {
      await expect(
        collection.connect(user1).sealContractPermanently()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should not allow to read URI of nonexistent token", async function () {
      const tokenPrice = ethers.utils.parseEther("0.01");

      const signData = {
        ...defaultSignData,
        value: {
          account: user1.address,
          tokenId: 1250,
          price: tokenPrice,
          nonce: 0,
        },
      };
      const signature = await createSignature(signer, signData);

      await collection
        .connect(user1)
        .mint(1250, tokenPrice, 0, signature, { value: tokenPrice });

      await expect(collection.tokenURI(1251)).to.be.revertedWith(
        "ERC721Metadata: URI query for nonexistent token"
      );
      await expect(collection.tokenURI(0)).to.be.revertedWith(
        "ERC721Metadata: URI query for nonexistent token"
      );
    });
  });

  describe("Withdraw funds", function () {
    it("should withdraw funds if caller is owner", async function () {
      const tokenPrice = ethers.utils.parseEther("0.01");

      const signData = {
        ...defaultSignData,
        value: {
          account: user1.address,
          tokenId: 1250,
          price: tokenPrice,
          nonce: 0,
        },
      };
      const signature = await createSignature(signer, signData);

      await collection
        .connect(user1)
        .mint(1250, tokenPrice, 0, signature, { value: tokenPrice });

      await expect(await collection.withdrawAllFunds()).to.changeEtherBalance(
        owner,
        tokenPrice
      );
    });

    it("should not allow to withdraw funds if caller is not owner", async function () {
      await expect(
        collection.connect(user2).withdrawAllFunds()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Signer role", function () {
    it("should add new signer if caller is an owner", async function () {
      const newSignerAddress = user2.address;

      expect(await collection.isSigner(newSignerAddress)).to.equal(false);
      await collection.addSigner(newSignerAddress);
      expect(await collection.isSigner(newSignerAddress)).to.equal(true);
    });

    it("should not allow to add new signer if caller is not an owner", async function () {
      const newSignerAddress = user2.address;

      await expect(
        collection.connect(user1).addSigner(newSignerAddress)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should not allow to add same signer twice", async function () {
      const newSignerAddress = user2.address;

      await collection.addSigner(newSignerAddress);
      await expect(collection.addSigner(newSignerAddress)).to.be.revertedWith(
        "Roles: account already has role"
      );
    });

    it("should renounce own signer role correctly if caller is signer", async function () {
      const newSignerAddress = user2.address;

      await collection.addSigner(newSignerAddress);
      expect(await collection.isSigner(newSignerAddress)).to.equal(true);
      await collection.connect(user2).renounceSigner();
      expect(await collection.isSigner(newSignerAddress)).to.equal(false);
    });
  });
});
