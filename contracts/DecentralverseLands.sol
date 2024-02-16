// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "erc721a/contracts/ERC721A.sol";
import "./SignerRole.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

error NonceUsed();
error InvalidSignature();
error InvalidValue();
error InvalidURI();

contract DecentralverseLands is ERC721A, EIP712, SignerRole {
    bool public isSealed;
    string public baseURI;

    mapping(uint256 => bool) private _usedNonces;

    event Mint(uint256 tokenId, address user, uint256 price);

    error ContractSealed();

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_
    ) ERC721A(name_, symbol_) EIP712(name_, "1.0.0") {
        baseURI = baseURI_;
    }

    function mint(
        uint256 price,
        uint256 nonce,
        bytes calldata signature
    ) external payable {
        if (_usedNonces[nonce]) revert NonceUsed();
        if (!_verify(_hash(msg.sender, price, nonce), signature)) {
            revert InvalidSignature();
        }
        if (msg.value < price) revert InvalidValue();

        _usedNonces[nonce] = true;

        uint256 currentTokenId = _currentIndex;

        _safeMint(msg.sender, 1);

        emit Mint(currentTokenId, msg.sender, price);
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
        uint256 price,
        uint256 nonce
    ) internal view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        keccak256(
                            "NFT(address account,uint256 price,uint256 nonce)"
                        ),
                        account,
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

    function _startTokenId() internal view virtual override returns (uint256) {
        return 1;
    }
}
