const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleNFT", function () {
  let nft;
  let owner;
  let user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const SimpleNFT = await ethers.getContractFactory("SimpleNFT");
    nft = await SimpleNFT.deploy();
    await nft.waitForDeployment();
  });

  it("Should mint a token successfully", async function () {
    await nft.mint(user1.address);
    expect(await nft.ownerOf(0)).to.equal(user1.address);
    console.log("✓ Token minted and owned correctly");
  });
});