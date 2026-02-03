const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenFactory", function () {
  let tokenFactory;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const TokenFactory = await ethers.getContractFactory("TokenFactory");
    tokenFactory = await TokenFactory.deploy();
    await tokenFactory.deployed();
  });

  it("Should deploy TokenFactory", async function () {
    expect(tokenFactory.address).to.not.equal(
      "0x0000000000000000000000000000000000000000"
    );
  });

  it("Should create a token", async function () {
    const tx = await tokenFactory.createToken(
      "Test Token",
      "TEST",
      1000,
      10000
    );
    await tx.wait();

    const tokenCount = await tokenFactory.getTokenCount();
    expect(tokenCount).to.equal(1);
  });

  it("Should track creator tokens", async function () {
    await tokenFactory.createToken("Token 1", "TK1", 100, 1000);
    await tokenFactory.createToken("Token 2", "TK2", 200, 2000);

    const creatorTokens = await tokenFactory.getCreatorTokens(owner.address);
    expect(creatorTokens.length).to.equal(2);
  });

  it("Should revert if initial supply is 0", async function () {
    await expect(
      tokenFactory.createToken("Bad Token", "BAD", 0, 1000)
    ).to.be.revertedWith("Initial supply must be greater than 0");
  });

  it("Should mint tokens to creator", async function () {
    const createTx = await tokenFactory.createToken(
      "Mint Test",
      "MINT",
      1000,
      0
    );
    const receipt = await createTx.wait();

    const tokens = await tokenFactory.getCreatorTokens(owner.address);
    const tokenAddress = tokens[0];

    const token = await ethers.getContractAt("ForgeToken", tokenAddress);
    const balance = await token.balanceOf(owner.address);

    // 1000 * 10^18 (default decimals)
    expect(balance).to.equal(ethers.utils.parseEther("1000"));
  });
});

describe("ForgeToken", function () {
  let token;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const ForgeToken = await ethers.getContractFactory("ForgeToken");
    token = await ForgeToken.deploy("Test Token", "TEST", 1000, 10000);
    await token.deployed();
  });

  it("Should have correct name and symbol", async function () {
    expect(await token.name()).to.equal("Test Token");
    expect(await token.symbol()).to.equal("TEST");
  });

  it("Should mint tokens", async function () {
    await token.mint(addr1.address, ethers.utils.parseEther("100"));
    const balance = await token.balanceOf(addr1.address);
    expect(balance).to.equal(ethers.utils.parseEther("100"));
  });

  it("Should burn tokens", async function () {
    const initialBalance = await token.balanceOf(owner.address);
    await token.burn(ethers.utils.parseEther("100"));
    const newBalance = await token.balanceOf(owner.address);
    expect(newBalance).to.equal(
      initialBalance.sub(ethers.utils.parseEther("100"))
    );
  });

  it("Should pause and unpause", async function () {
    await token.pause();
    expect(await token.paused()).to.equal(true);

    await token.unpause();
    expect(await token.paused()).to.equal(false);
  });

  it("Should respect max supply", async function () {
    // Try to mint beyond max supply
    await expect(
      token.mint(addr1.address, ethers.utils.parseEther("15000"))
    ).to.be.revertedWith("Exceeds max supply");
  });
});
