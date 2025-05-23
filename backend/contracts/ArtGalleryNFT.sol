// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArtGalleryNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    struct ArtPiece {
        uint256 tokenId;
        string title;
        string description;
        string ipfsHash;
        address artist;
        uint256 mintedAt;
        bool is3D;
        uint256 positionX;
        uint256 positionY;
        uint256 positionZ;
    }

    mapping(uint256 => ArtPiece) public artPieces;
    mapping(address => uint256[]) public artistToTokens;

    uint256 public mintingFee = 0.001 ether;
    uint256 public maxSupply = 1000;

    event ArtMinted(
        uint256 indexed tokenId,
        address indexed artist,
        string title,
        string ipfsHash,
        bool is3D
    );

    event ArtPositioned(
        uint256 indexed tokenId,
        uint256 positionX,
        uint256 positionY,
        uint256 positionZ
    );

    constructor(address initialOwner) ERC721("Gallery Art NFT", "GART") Ownable(initialOwner) {}

    function mintArt(
        string memory _tokenURI,
        string memory _title,
        string memory _description,
        string memory _ipfsHash,
        bool _is3D
    ) public payable returns (uint256) {
        require(msg.value >= mintingFee, "Insufficient minting fee");
        require(_tokenIds < maxSupply, "Maximum supply reached");
        require(bytes(_tokenURI).length > 0, "Token URI cannot be empty");
        require(bytes(_title).length > 0, "Title cannot be empty");

        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);

        uint256 wallPosition = (newTokenId - 1) % 20;
        uint256 posX = (wallPosition % 5) * 4;
        uint256 posY = (wallPosition / 5) * 3 + 2;
        uint256 posZ = ((newTokenId - 1) / 20) * 10;

        artPieces[newTokenId] = ArtPiece({
            tokenId: newTokenId,
            title: _title,
            description: _description,
            ipfsHash: _ipfsHash,
            artist: msg.sender,
            mintedAt: block.timestamp,
            is3D: _is3D,
            positionX: posX,
            positionY: posY,
            positionZ: posZ
        });

        artistToTokens[msg.sender].push(newTokenId);

        emit ArtMinted(newTokenId, msg.sender, _title, _ipfsHash, _is3D);
        emit ArtPositioned(newTokenId, posX, posY, posZ);

        return newTokenId;
    }

    function updateArtPosition(
        uint256 _tokenId,
        uint256 _positionX,
        uint256 _positionY,
        uint256 _positionZ
    ) public {
        require(ownerOf(_tokenId) == msg.sender || owner() == msg.sender, "Not authorized");
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");

        artPieces[_tokenId].positionX = _positionX;
        artPieces[_tokenId].positionY = _positionY;
        artPieces[_tokenId].positionZ = _positionZ;

        emit ArtPositioned(_tokenId, _positionX, _positionY, _positionZ);
    }

    function getAllArtPieces() public view returns (ArtPiece[] memory) {
        ArtPiece[] memory allArt = new ArtPiece[](_tokenIds);
        for (uint256 i = 1; i <= _tokenIds; i++) {
            allArt[i - 1] = artPieces[i];
        }
        return allArt;
    }

    function getArtistTokens(address _artist) public view returns (uint256[] memory) {
        return artistToTokens[_artist];
    }

    function getCurrentTokenId() public view returns (uint256) {
        return _tokenIds;
    }

    function setMintingFee(uint256 _newFee) public onlyOwner {
        mintingFee = _newFee;
    }

    function withdrawFunds() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
}