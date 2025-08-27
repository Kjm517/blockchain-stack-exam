// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC721, Ownable {
    uint256 private _nextTokenId;
    uint256 public constant MAX_SUPPLY = 1000;

    constructor(address initialOwner)
        ERC721("MyToken", "MTK")
        Ownable(initialOwner)
    {}

    function safeMint(address to) public onlyOwner returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(_nextTokenId < MAX_SUPPLY, "Max supply exceeded");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        return tokenId;
    }
    
    function batchMint(address[] calldata recipients) external onlyOwner {
        require(recipients.length <= 20, "Too many recipients");
        require(_nextTokenId + recipients.length <= MAX_SUPPLY, "Would exceed max supply");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Cannot mint to zero address");
            uint256 tokenId = _nextTokenId++;
            _safeMint(recipients[i], tokenId);
        }
    }
    
    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }
    
    function remainingSupply() public view returns (uint256) {
        return MAX_SUPPLY - _nextTokenId;
    }
    
    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < _nextTokenId; i++) {
            if (_ownerOf(i) == owner) {
                tokenIds[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return tokenIds;
    }
}