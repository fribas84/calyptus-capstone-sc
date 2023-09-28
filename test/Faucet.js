const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Faucet", () => {
  const loadFixture = async () => {
    const [owner, user] = await ethers.getSigners();

    const DummyToken = await ethers.getContractFactory("DummyToken");
    const dummyToken = await DummyToken.deploy();

    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = await Faucet.deploy(dummyToken.target);

    await dummyToken.grantMinterRoler(faucet.target);

    return { dummyToken, faucet, owner, user };
  };
  it("Deploy", async () => {
    const { dummyToken, faucet } = await loadFixture();
    expect(await faucet.token()).to.equal(dummyToken.target);
  });
  it("User cannot mint tokens", async () => {
    const { dummyToken, user } = await loadFixture();
    await expect(
      dummyToken.connect(user).mint(user.address, 100)
    ).to.be.reverted;
  });
  it("Faucet can mint tokens to user", async () => { 
    const { dummyToken, faucet, user } = await loadFixture();
    const userBal = await dummyToken.balanceOf(user.address);
    expect(userBal).to.equal(0);
    await faucet.connect(user).requestTokens();
    const userBalAfter = await dummyToken.balanceOf(user.address);
    expect(userBalAfter).to.equal(ethers.parseEther("1000"));
  });
  it("User cannot request tokens 2 times in one day", async () => {
    const {dummyToken, faucet, user} = await loadFixture();
    const userBal = await dummyToken.balanceOf(user.address);
    expect(userBal).to.equal(0);
    await faucet.connect(user).requestTokens();
    const userBalAfter = await dummyToken.balanceOf(user.address);
    expect(userBalAfter).to.equal(ethers.parseEther("1000"));
    await expect(faucet.connect(user).requestTokens()).to.be.revertedWith("You can only request tokens once per day");
  });
  it("User can request tokens after 1 day", async () => {
    const {dummyToken, faucet, user} = await loadFixture();
    const userBal = await dummyToken.balanceOf(user.address);
    expect(userBal).to.equal(0);
    await faucet.connect(user).requestTokens();
    const userBalAfter = await dummyToken.balanceOf(user.address);
    expect(userBalAfter).to.equal(ethers.parseEther("1000"));
    await ethers.provider.send("evm_increaseTime", [86400]);
    await faucet.connect(user).requestTokens();
    expect(await dummyToken.balanceOf(user.address)).to.equal(ethers.parseEther("2000"));
  })
});
