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
    const dummyToken = await DummyToken.deploy("DummyToken1", "DT1");

    const DummyToken2 = await ethers.getContractFactory("DummyToken");
    const dummyToken2 = await DummyToken2.deploy("DummyToken2", "DT2");
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = await Faucet.deploy(dummyToken.target, dummyToken2.target);

    await dummyToken.grantMinterRoler(faucet.target);
    await dummyToken2.grantMinterRoler(faucet.target);

    return { dummyToken, dummyToken2, faucet, owner, user };
  };
  it("Deploy", async () => {
    const { dummyToken, dummyToken2, faucet } = await loadFixture();
    expect(await faucet.token1()).to.equal(dummyToken.target);
    expect(await faucet.token2()).to.equal(dummyToken2.target);
  });
  it("User cannot mint tokens", async () => {
    const { dummyToken, dummyToken2, user } = await loadFixture();
    await expect(dummyToken.connect(user).mint(user.address, 100)).to.be
      .reverted;
    await expect(dummyToken2.connect(user).mint(user.address, 100)).to.be
      .reverted;
  });
  it("Faucet can mint tokens to user", async () => {
    const { dummyToken,dummyToken2, faucet, user } = await loadFixture();
    const userBal = await dummyToken.balanceOf(user.address);
    expect(userBal).to.equal(0);
    await faucet.connect(user).requestTokens(0);
    const userBalAfter = await dummyToken.balanceOf(user.address);
    expect(userBalAfter).to.equal(ethers.parseEther("1000"));
    const userBal2 = await dummyToken2.balanceOf(user.address);
    expect(userBal2).to.equal(0);

    await faucet.connect(user).requestTokens(1);
    const userBalAfter2 = await dummyToken2.balanceOf(user.address);
    expect(userBalAfter2).to.equal(ethers.parseEther("1000"));
  });
  it("User cannot request tokens 2 times in one day", async () => {
    const { dummyToken, faucet, user } = await loadFixture();
    const userBal = await dummyToken.balanceOf(user.address);
    expect(userBal).to.equal(0);
    await faucet.connect(user).requestTokens(0);
    const userBalAfter = await dummyToken.balanceOf(user.address);
    expect(userBalAfter).to.equal(ethers.parseEther("1000"));
    await expect(faucet.connect(user).requestTokens(0)).to.be.revertedWith(
      "You can only request tokens once per day"
    );
  });
  it("User can request tokens after 1 day", async () => {
    const { dummyToken, faucet, user } = await loadFixture();
    const userBal = await dummyToken.balanceOf(user.address);
    expect(userBal).to.equal(0);
    await faucet.connect(user).requestTokens(0);
    const userBalAfter = await dummyToken.balanceOf(user.address);
    expect(userBalAfter).to.equal(ethers.parseEther("1000"));
    await ethers.provider.send("evm_increaseTime", [86400]);
    await faucet.connect(user).requestTokens(0);
    expect(await dummyToken.balanceOf(user.address)).to.equal(
      ethers.parseEther("2000")
    );
  });
});
