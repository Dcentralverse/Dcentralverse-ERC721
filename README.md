# ERC721 collection with signature mint

## Prerequisites (IMPORTANT - you must do this first)
1. Install all needed dependencies by running this command:

```yarn```

2. Make copy of `.env.template` file and rename that copy to `.env`. Now fill `.env` with your private keys of wallet, Alchemy API key and PolygonScan API key. `DEPLOYER_PRIVATE_KEY` will be used for contract deployment, and `SIGNER_PRIVATE_KEY` will be used for signing data for NFT minting. In this example they are different wallets, but if you want you could use same private key for both. `.env` should look similar to this:
```
DEPLOYER_PRIVATE_KEY=78decf5ba8354e324df32ebfe4c68c2f7ebc4bb7e6265c83ab
SIGNER_PRIVATE_KEY=9e74dca87a477b75c12359d8b3f8d4ea427d95d1ff63d987d4c9bf1190366ab2
ALCHEMY_API_KEY=rGjB0KgZ24srbupx9535ddJtlIlviXlGObd
POLYGONSCAN_API_KEY=G7KKIRE743NMJ28113TZUPIFX1
```

## How to deploy a contract?

1. You need to open two deploy scripts (`scripts/deploy-decentralverse-lands.js` and `scripts/deploy-decentralverse-assets.js`) and lets modify both of them before deployment. We need to modify `NAME`,`SYMBOL` and `BASE_URI` variables. For example I named this collection "DecentralverseLands" with symbol "LAND" and used base URI "https://metadata.decentralverse.com/":

```
const NAME = "DecentralverseLands";
const SYMBOL = "LAND";
const BASE_URI = "https://metadata.decentralverse.com/";
```
Save the files.

3. Before deployment you need to have a little bit of MATIC in your wallet. Now we are ready to deploy these contracts to Polygon Mainnet, you just need to run this commands:

```
yarn hardhat run scripts/deploy-decentralverse-lands.js --network matic
yarn hardhat run scripts/deploy-decentralverse-assets.js --network matic
```

For each command you should get output similar to this:
```
Deploying contract with the account:  0x593092c91bCfEe1Bd73EFcf9729E049e70133154
Success! Collection was deployed to:  0xC73B09dfa8618Af23a3A7463A8a7ddE7Dc2a0aef

Successfully submitted source code for contract
contracts/Collection.sol:Collection at 0xC73B09dfa8618Af23a3A7463A8a7ddE7Dc2a0aef
for verification on the block explorer. Waiting for verification result...

Successfully verified contract Collection on Etherscan.
https://polygonscan.com/address/0xC73B09dfa8618Af23a3A7463A8a7ddE7Dc2a0aef#code
Done in 27.83s.
```
Congrats, your collections are now successfully deployed!

Note: If there is some problem with contract verification, you can run verification manually. You need to input collection address, name, symbol and base URI that you used in deployment process.
```
yarn hardhat verify --network matic <collection address> "<name>" "<symbol>" "<baseURI>"
```
In my example it would look like this for DecentralverseLands contract:
```
yarn hardhat verify --network matic 0xC73B09dfa8618Af23a3A7463A8a7ddE7Dc2a0aef "DecentralverseLands" "LAND" "https://metadata.decentralverse.com/"
```

## How to add signer in contract?

Your deployed contracts currently doesn't have any signer approved in contract, so we need to add at least one signer for minting process to work correctly. In this example we will add signer that represents `SIGNER_PRIVATE_KEY` from 'Prerequisites' section, because we will use that private key to create our signatures.

1. Open script `scripts/add-signer.js` and lets modify it. We need to modify `collectionAddress` and `signerAddress` variables. For `collectionAddress` you just enter address of one of your deployed contracts (we got this from previous section), and for `signerAddress` you enter public address of signer that represents `SIGNER_PRIVATE_KEY`. For example:
```
const collectionAddress = "0xC73B09dfa8618Af23a3A7463A8a7ddE7Dc2a0aef";
const signerAddress = "0x7E076BDd93FAB77513700b91466437f4F2595AfF";
```

2. Now you just need run this command:
```
yarn hardhat run .\scripts\add-signer.js --network matic
```

You should get output similar to this, if everything is successful:
```
Calling contract with the account:  0x593092c91bCfEe1Bd73EFcf9729E049e70133154
You successfully added 0x7E076BDd93FAB77513700b91466437f4F2595AfF as signer!
```
Repeat this same process for another collection contract.

## How to generate a signature and use it for NFT minting process?

1. Open script `scripts/generate-signature.js` and lets modify it so we can generate our first signature. We need to fill multiple variables:
- `name` (name that you used for your collection in contract deployment process)
- `collectionAddress` (address of deployed collection contract)
- `account` (address of user that you want give permission to mint particular NFT)
- `tokenId` (tokenId that you want to mint)
- `price` (price that you want to charge for this particular NFT)
- `nonce` (nonce that you want to use for this particular signature)

Nonce can't be reused twice in same collection contract, so you will need to generate unique nonce for each signature (for example start with zero and increment it by one).

Also it is not possible to mint same tokenId twice in same collection contract, so you will need to generate unique tokenId for each signature.

For example:
```
const name = "Land";
const collectionAddress = "0xC73B09dfa8618Af23a3A7463A8a7ddE7Dc2a0aef";
const account = "0x78e7C4C88d44aD2178a2Cf5cC8883a761996e2E9";
const tokenId = 1250;
const price = ethers.utils.parseEther("0.01");
const nonce = 0;
```
In my example price is 0.01 MATIC. `name` and `collectionAddress` will be always the same, and you will just change `account`, `tokenId`, `price` and `nonce` for every NFT.

It is same logic for another collection contract.

2. Now lets generate signature by using our signer wallet. You just need to run this command:
```
yarn hardhat run .\scripts\generate-signature.js --network matic
```

You should get output like this:
```
We are signing data with this account:  0x7E076BDd93FAB77513700b91466437f4F2595AfF
Success! Signature is:  0x95e9528234164cf8415d9101dc34131230dd6af30c869d75dd9bca04d8debd1e0071c87c0b715029f8e6ed668971d75e50e30b62dc72591431acfaa834ee19f61b
Done in 4.47s.
```

So now we have successfully generated signature, and now that can be used for NFT minting process.

3. To mint you just need to pass signature, data that we used in signing process and also some MATIC tokens to pay for NFT (in our example its 0.01 MATIC). 

I will use ethers.js to call an mint function on our contract.
You will probably need to create an instance of contract using users connected wallet, and then we can call any function on that contract. Use contract ABI that is located in `abi/Collection.json`.

```
await collection
    .mint(
        tokenId,
        price,
        nonce,
        signature,
        { value: price }
    );
```
In our example it will be:
```
await collection
    .mint(
        1250,
        ethers.utils.parseEther("0.01"),
        0,
        "0x95e9528234164cf8415d9101dc34131230dd6af30c869d75dd9bca04d8debd1e0071c87c0b715029f8e6ed668971d75e50e30b62dc72591431acfaa834ee19f61b",
        { value: ethers.utils.parseEther("0.01") }
    );
```

Of course this mint process will only succeed if its called by account address that we put in signing process (in our example `0x78e7C4C88d44aD2178a2Cf5cC8883a761996e2E9`), and if correct data (same data that we used in signing process) is provided to mint function.

## How to change base URI?

You can change base URI of your collection anytime by calling `reveal` function. This function will change base URI. You can call this function only by owner of contract. Make sure that link has `/` at the end, because contract will concatenate this base URI and tokenId of NFT to get full URI.

```
await collection.reveal("https://newmetadata.decentralverse.com/");
```

## How to seal contract permanently?

You can seal contract permanently by calling `sealContractPermanently` function. This function will seal contract permanently and it will not be possible to change base URI anymore. You can call this function only by owner of contract.

```
await collection.sealContractPermanently();
```