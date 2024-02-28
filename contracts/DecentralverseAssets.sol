// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./SignerRole.sol";

error NonceUsed();
error InvalidSignature();
error InvalidValue();
error InvalidURI();

contract DecentralverseAssets is ERC721, EIP712, SignerRole {
    bool public isSealed;
    string public baseURI;

    mapping(uint256 => bool) private _usedNonces;

    event Mint(uint256 tokenId, address user, uint256 price);

    error ContractSealed();

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_
    ) ERC721(name_, symbol_) EIP712(name_, "1.0.0") {
        baseURI = baseURI_;
    }

    function mint(
        uint256 tokenId,
        uint256 price,
        uint256 nonce,
        bytes calldata signature
    ) external payable {
        if (_usedNonces[nonce]) revert NonceUsed();
        if (!_verify(_hash(msg.sender, tokenId, price, nonce), signature)) {
            revert InvalidSignature();
        }
        if (msg.value < price) revert InvalidValue();

        _usedNonces[nonce] = true;

        _mint(msg.sender, tokenId);

        emit Mint(tokenId, msg.sender, price);
    }

    function withdrawAllFunds() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function reveal(string calldata newUri) external onlyOwner {
        if (isSealed) revert ContractSealed();

        baseURI = newUri;
    }

    function sealContractPermanently() external onlyOwner {
        if (isSealed) revert ContractSealed();

        isSealed = true;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function _hash(
        address account,
        uint256 tokenId,
        uint256 price,
        uint256 nonce
    ) internal view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        keccak256(
                            "NFT(address account,uint256 tokenId,uint256 price,uint256 nonce)"
                        ),
                        account,
                        tokenId,
                        price,
                        nonce
                    )
                )
            );
    }

    function _verify(
        bytes32 digest,
        bytes calldata signature
    ) internal view returns (bool) {
        return isSigner(ECDSA.recover(digest, signature));
    }
}
