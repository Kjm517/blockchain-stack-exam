// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleNFT is ERC721, Ownable {
    uint256 private _nextTokenId;
    
    constructor() ERC721("Simple NFT", "SNFT") Ownable(msg.sender) {
        _nextTokenId = 0;
    }
    
    function mint(address to) public onlyOwner returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        
        _safeMint(to, tokenId);
        
        return tokenId;
    }
    
    function publicMint(address to) public returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        
        _safeMint(to, tokenId);
        
        return tokenId;
    }
    
    function getCurrentTokenId() public view returns (uint256) {
        return _nextTokenId;
    }
}