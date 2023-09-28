const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

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
    expect(await wallet.getUserTokenBalance(user.address, ticker)).to.equal(bal/BigInt(2));
  });
});
