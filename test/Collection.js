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

    const NAME = "Land";
    const SYMBOL = "LND";

    const Collection = await ethers.getContractFactory("Collection");
    collection = await Collection.deploy(NAME, SYMBOL);
    await collection.deployed();

    defaultSignData = {
      domain: {
        name: NAME,
        chainId: chainId,
        verifyingContract: collection.address,
      },
      value: { account: "", cid: "", price: "" },
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
            cid: "QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD",
            price: tokenPrice,
          },
        };
        const signature = await createSignature(signer, signData);

        expect(await collection.balanceOf(user1.address)).to.equal(0);

        const tx = await collection
          .connect(user1)
          .mint(
            "QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD",
            tokenPrice,
            signature,
            { value: tokenPrice }
          );

        const receipt = await tx.wait();
        const eventData = receipt.events.find(({ event }) => event === "Mint");
        const [tokenId, address, cid, price] = eventData.args;

        expect(tokenId).to.equal(0);
        expect(address).to.equal(user1.address);
        expect(cid).to.equal("QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD");
        expect(price).to.equal(tokenPrice);

        expect(await collection.balanceOf(user1.address)).to.equal(1);
      });

      it("should not allow to mint with same signature twice", async function () {
        const tokenPrice = ethers.utils.parseEther("0.01");

        const signData = {
          ...defaultSignData,
          value: {
            account: user1.address,
            cid: "QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD",
            price: tokenPrice,
          },
        };
        const signature = await createSignature(signer, signData);

        await collection
          .connect(user1)
          .mint(
            "QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD",
            tokenPrice,
            signature,
            { value: tokenPrice }
          );

        await expect(
          collection
            .connect(user1)
            .mint(
              "QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD",
              tokenPrice,
              signature,
              { value: tokenPrice }
            )
        ).to.be.revertedWith("SignatureUsed");
      });

      it("should not allow to mint if CID is empty string", async function () {
        const tokenPrice = ethers.utils.parseEther("0.01");

        const signData = {
          ...defaultSignData,
          value: {
            account: user1.address,
            cid: "",
            price: tokenPrice,
          },
        };
        const signature = await createSignature(signer, signData);

        await expect(
          collection
            .connect(user1)
            .mint("", tokenPrice, signature, { value: tokenPrice })
        ).to.be.revertedWith("InvalidURI");
      });

      it("should not allow to mint if user provides wrong CID", async function () {
        const tokenPrice = ethers.utils.parseEther("0.01");

        const signData = {
          ...defaultSignData,
          value: {
            account: user1.address,
            cid: "QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD",
            price: tokenPrice,
          },
        };
        const signature = await createSignature(signer, signData);

        await expect(
          collection
            .connect(user1)
            .mint(
              "QmSBxebqcuP8GyUxaFVEDqpsmbcjNMxg5y3i1UAHLkhHg5",
              tokenPrice,
              signature,
              { value: tokenPrice }
            )
        ).to.be.revertedWith("InvalidSignature");
      });

      it("should not allow to mint if user provides wrong price", async function () {
        const tokenPrice = ethers.utils.parseEther("0.01");

        const signData = {
          ...defaultSignData,
          value: {
            account: user1.address,
            cid: "QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD",
            price: tokenPrice,
          },
        };
        const signature = await createSignature(signer, signData);

        await expect(
          collection
            .connect(user1)
            .mint(
              "QmSBxebqcuP8GyUxaFVEDqpsmbcjNMxg5y3i1UAHLkhHg5",
              tokenPrice.sub(1),
              signature,
              { value: tokenPrice.sub(1) }
            )
        ).to.be.revertedWith("InvalidSignature");
      });

      it("should not allow to mint if user provides wrong value", async function () {
        const tokenPrice = ethers.utils.parseEther("0.01");

        const signData = {
          ...defaultSignData,
          value: {
            account: user1.address,
            cid: "QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD",
            price: tokenPrice,
          },
        };
        const signature = await createSignature(signer, signData);

        await expect(
          collection
            .connect(user1)
            .mint(
              "QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD",
              tokenPrice,
              signature,
              { value: tokenPrice.sub(1) }
            )
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
            cid: "QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD",
            price: tokenPrice,
          },
        };
        const signature = await createSignature(signer, signData);

        await expect(
          collection
            .connect(user2)
            .mint(
              "QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD",
              tokenPrice,
              signature,
              { value: tokenPrice }
            )
        ).to.be.revertedWith("InvalidSignature");
      });

      it("should not allow to mint if user provides signature signed by himself", async function () {
        const tokenPrice = ethers.utils.parseEther("0.01");

        const signData = {
          ...defaultSignData,
          value: {
            account: user1.address,
            cid: "QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD",
            price: tokenPrice,
          },
        };
        const signature = await createSignature(user1, signData);

        await expect(
          collection
            .connect(user1)
            .mint(
              "QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD",
              tokenPrice,
              signature,
              { value: tokenPrice }
            )
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
          cid: "QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD",
          price: tokenPrice,
        },
      };
      const signature = await createSignature(signer, signData);

      await collection
        .connect(user1)
        .mint(
          "QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD",
          tokenPrice,
          signature,
          { value: tokenPrice }
        );

      expect(await collection.tokenURI(0)).to.equal(
        "ipfs://QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD"
      );
    });

    it("should not allow to read URI of nonexistent token", async function () {
      const tokenPrice = ethers.utils.parseEther("0.01");

      const signData = {
        ...defaultSignData,
        value: {
          account: user1.address,
          cid: "QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD",
          price: tokenPrice,
        },
      };
      const signature = await createSignature(signer, signData);

      await collection
        .connect(user1)
        .mint(
          "QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD",
          tokenPrice,
          signature,
          { value: tokenPrice }
        );

      await expect(collection.tokenURI(1)).to.be.revertedWith(
        "URIQueryForNonexistentToken"
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
          cid: "QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD",
          price: tokenPrice,
        },
      };
      const signature = await createSignature(signer, signData);

      await collection
        .connect(user1)
        .mint(
          "QmbJxj9yTDhDHXYQUHjyz74GxP1VCwF3pkVWCvBTejF3kD",
          tokenPrice,
          signature,
          { value: tokenPrice }
        );

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
