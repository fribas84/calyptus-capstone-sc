const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Dex", () => {
  const loadFixture = async () => {
    const [ owner, user1, user2 ] = await ethers.getSigners();
    
    // Dummy Token deployment
    const DummyToken = await ethers.getContractFactory("DummyToken");
    const dummyToken = await DummyToken.deploy();
    
    // Faucet deployment
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = await Faucet.deploy(dummyToken.target);
    await dummyToken.grantMinterRoler(faucet.target);
    
    // Dex Deployment
    const Dex = await ethers.getContractFactory("Dex");
    const dex = await Dex.deploy();



    return{dummyToken,faucet, dex, owner, user1, user2};
  };

  it("Deploy and ownership", async () => {
    const {dex, owner} = await loadFixture();
    expect(await dex.owner()).to.equal(owner.address);
  })
  it("Owner can add a new ticker to Dex", async () => {
    const {dummyToken, dex} = await loadFixture();
    const ticker = ethers.encodeBytes32String("DTK");
    await dex.addToken(ticker, dummyToken.target);
    expect(await dex.tokenAvailable(ticker)).to.equal(true);
  });
  it("User can deposit Dummy Token", async () => {
    const {dummyToken, dex, user1, faucet} = await loadFixture();
    const ticker = ethers.encodeBytes32String("DTK");
    await dex.addToken(ticker, dummyToken.target);
    await dummyToken.mint(user1.address, 100);
    await dummyToken.connect(user1).approve(dex.target, 100);
    await dex.connect(user1).deposit(ticker, 100);
    expect(await dummyToken.balanceOf(dex.target)).to.equal(100);
    expect(await dex.balanceOf(user1.address, ticker)).to.equal(100); 
  });

});
