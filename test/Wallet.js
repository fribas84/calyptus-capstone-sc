const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const ticker = ethers.encodeBytes32String("DTK");
describe("Wallet", () => {
  const deployFixture = async () => {
    const [owner, user, user2] = await ethers.getSigners();
    const DummyToken = await ethers.getContractFactory("DummyToken");
    const dummyToken = await DummyToken.deploy();
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = await Faucet.deploy(dummyToken.target);
    await dummyToken.grantMinterRoler(faucet.target);
    const Wallet = await ethers.getContractFactory("Wallet");
    const wallet = await Wallet.deploy();
    return { dummyToken, faucet, wallet, owner, user, user2 };
  };

  const deployAndSetTokenFixture = async () => {
    const [owner, user, user2] = await ethers.getSigners();
    const DummyToken = await ethers.getContractFactory("DummyToken");
    const dummyToken = await DummyToken.deploy();
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = await Faucet.deploy(dummyToken.target);
    await dummyToken.grantMinterRoler(faucet.target);
    const Wallet = await ethers.getContractFactory("Wallet");
    const wallet = await Wallet.deploy();
    await wallet.addToken(ticker, dummyToken.target);
    return { dummyToken, faucet, wallet, owner, user, user2 };
  };

  it("Deploy", async () => {
    const { dummyToken, faucet, wallet, owner } = await deployFixture();
    expect(await faucet.token()).to.equal(dummyToken.target);
    expect(await wallet.owner()).to.equal(owner.address);
  });

  it("Owner can set Dummy Token", async () => {
    const { dummyToken, wallet } = await deployFixture();
    await wallet.addToken(ticker, dummyToken.target);
    expect(
      await wallet.tokenAvailable(ticker)
    ).to.equal(true);
  });

  it("User cannot add Dummy Token", async () => {
    const { dummyToken, faucet, wallet, owner, user } = await deployFixture();
    expect(
      await wallet.addToken(
       ticker,
        dummyToken.target
      )
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("User can deposit Dummy Token", async () => {
    const { dummyToken, wallet, user, faucet } = await deployAndSetTokenFixture();
    await faucet.connect(user).requestTokens();
    const bal = await dummyToken.balanceOf(user.address);
    await dummyToken.connect(user).approve(wallet.target, bal/BigInt(2));
    await wallet.connect(user).deposit(ticker, bal/BigInt(2));
    expect(await wallet.balanceOf(user.address, ticker)).to.equal(bal/BigInt(2));
  });

  it("User can deposit and withdraw Dummy Token", async () => {
    const { dummyToken, wallet, user, faucet } = await deployAndSetTokenFixture();
    await faucet.connect(user).requestTokens();
    const bal = await dummyToken.balanceOf(user.address);
    await dummyToken.connect(user).approve(wallet.target, bal/BigInt(2));
    await wallet.connect(user).deposit(ticker, bal/BigInt(2));
    expect(await wallet.balanceOf(user.address, ticker)).to.equal(bal/BigInt(2));
    await wallet.connect(user).withdraw(ticker, bal/BigInt(2));
    expect(await wallet.balanceOf(user.address, ticker)).to.equal(0);
    expect(await dummyToken.balanceOf(user.address)).to.equal(bal);
  })
  it("User can deposit Ether through receive function", async () => {
    const { wallet, user } = await deployFixture();
    const bal = await ethers.provider.getBalance(user.address);
    await user.sendTransaction({to: wallet.target, value: ethers.parseEther("10.0")});
    expect(await wallet.balanceOf(user.address, ethers.encodeBytes32String("ETH"))).to.equal(ethers.parseEther("10.0"));
  })
  it("User can deposit Ether through receive function and withdraw", async () => {
    const { wallet, user } = await deployFixture();
    await user.sendTransaction({to: wallet.target, value: ethers.parseEther("10.0")});
    const balAfterDeposit = await ethers.provider.getBalance(user.address);
    expect(await wallet.balanceOf(user.address, ethers.encodeBytes32String("ETH"))).to.equal(ethers.parseEther("10.0"));
    await wallet.connect(user).withdraw(ethers.encodeBytes32String("ETH"), ethers.parseEther("10.0"));
    expect(await wallet.balanceOf(user.address, ethers.encodeBytes32String("ETH"))).to.equal(0);
    expect(await ethers.provider.getBalance(user.address)).gt(balAfterDeposit);
  })
  it("User can deposit Eth through depositEther function and withdraw", async () => {
    const { wallet, user } = await deployFixture();
    await wallet.connect(user).depositEth({value: ethers.parseEther("10.0")});
    const balAfterDeposit = await ethers.provider.getBalance(user.address);
    expect(await wallet.balanceOf(user.address, ethers.encodeBytes32String("ETH"))).to.equal(ethers.parseEther("10.0"));
    await wallet.connect(user).withdraw(ethers.encodeBytes32String("ETH"), ethers.parseEther("10.0"));
    expect(await wallet.balanceOf(user.address, ethers.encodeBytes32String("ETH"))).to.equal(0);
    expect(await ethers.provider.getBalance(user.address)).gt(balAfterDeposit);
  });
});
