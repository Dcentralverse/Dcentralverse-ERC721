// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "erc721a/contracts/ERC721A.sol";
import "./SignerRole.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

error SignatureUsed();
error InvalidSignature();
error InvalidValue();
error InvalidURI();

contract Collection is ERC721A, EIP712, SignerRole {
    mapping(uint256 => string) private _tokenURIs;

    mapping(bytes => bool) private _usedSignatures;

    event Mint(uint256 tokenId, address user, string cid, uint256 price);

    constructor(string memory name_, string memory symbol_)
        ERC721A(name_, symbol_)
        EIP712(name_, "1.0.0")
    {}

    function mint(
        string calldata cid,
        uint256 price,
        bytes calldata signature
    ) external payable {
        if (_usedSignatures[signature]) revert SignatureUsed();
        if (!_verify(_hash(msg.sender, cid, price), signature))
            revert InvalidSignature();
        if (msg.value < price) revert InvalidValue();

        _usedSignatures[signature] = true;

        uint256 currentTokenId = _currentIndex;

        _safeMint(msg.sender, 1);

        _setTokenURI(currentTokenId, cid);

        emit Mint(currentTokenId, msg.sender, cid, price);
    }

    function withdrawAllFunds() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

        return string(abi.encodePacked(_baseURI(), _tokenURIs[tokenId]));
    }

    function _setTokenURI(uint256 tokenId, string calldata tokenURI_) internal {
        if (bytes(tokenURI_).length == 0) revert InvalidURI();

        _tokenURIs[tokenId] = tokenURI_;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://";
    }

    function _hash(
        address account,
        string calldata cid,
        uint256 price
    ) internal view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        keccak256(
                            "NFT(address account,string cid,uint256 price)"
                        ),
                        account,
                        keccak256(abi.encodePacked(cid)),
                        price
                    )
                )
            );
    }

    function _verify(bytes32 digest, bytes calldata signature)
        internal
        view
        returns (bool)
    {
        return isSigner(ECDSA.recover(digest, signature));
    }
}
