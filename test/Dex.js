const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Dex", () => {
  const ticker = ethers.encodeBytes32String("DTK");

  const loadFixtureNoToken = async () => {
    const [owner, user1, user2] = await ethers.getSigners();

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

    return { dummyToken, faucet, dex, owner, user1, user2 };
  };

  const loadFixtureToken = async () => {
    const [owner, user1, user2] = await ethers.getSigners();

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

    //Adding Dummy Token to Dex
    await dex.addToken(ticker, dummyToken.target);

    //Minting DummyToken to users
    await dummyToken.mint(user1.address, 3000);
    await dummyToken.mint(user2.address, 3000);
    await dummyToken.mint(owner.address, 3000);

    return { dummyToken, faucet, dex, owner, user1, user2 };
  };

  describe("Basic and initial tests", () => {
    it("Deploy and ownership", async () => {
      const { dex, owner } = await loadFixtureNoToken();
      expect(await dex.owner()).to.equal(owner.address);
    });

    it("Owner can add a new ticker to Dex", async () => {
      const { dummyToken, dex } = await loadFixtureNoToken();
      const ticker = ethers.encodeBytes32String("DTK");
      await dex.addToken(ticker, dummyToken.target);
      expect(await dex.tokenAvailable(ticker)).to.equal(true);
    });

    it("User can deposit Dummy Token", async () => {
      const { dummyToken, dex, user1, faucet } = await loadFixtureToken();
      await dummyToken.connect(user1).approve(dex.target, 1000);
      await dex.connect(user1).deposit(ticker, 1000);
      expect(await dummyToken.balanceOf(dex.target)).to.equal(1000);
      expect(await dex.balanceOf(user1.address, ticker)).to.equal(1000);
    });
  });

  describe("Create Orders", () => {
    it("Create Sell order", async () => {
      const { dummyToken, dex, user1, faucet } = await loadFixtureToken();
      await dummyToken.connect(user1).approve(dex.target, 1000);
      await dex.connect(user1).deposit(ticker, 1000);
      expect(await dummyToken.balanceOf(dex.target)).to.equal(1000);
      expect(await dex.balanceOf(user1.address, ticker)).to.equal(1000);
      await dex.connect(user1).createLimitOrder(1, ticker, 1000, 20);
      const orders = await dex.getOrderBook(ticker, 1);
      expect(orders.length).to.equal(1);
      expect(orders[0][4]).to.equal(1000);
    });

    it("Should revert when creating buy order whitout Eth in balance", async () => {
      const { dex, user1 } = await loadFixtureNoToken();
      await expect(
        dex.connect(user1).createLimitOrder(0, ticker, 50, 20)
      ).to.revertedWith("Not enough eth in your wallet");
    });

    it("User should be able to create buy order", async () => {
      const { dummyToken, dex, user1 } = await loadFixtureNoToken();
      await dex
        .connect(user1)
        .depositEth({ value: ethers.parseEther("900.0") });
      await dex
        .connect(user1)
        .createLimitOrder(0, ticker, 50, ethers.parseEther("2"));
      const orders = await dex.getOrderBook(ticker, 0);
      expect(orders.length).to.equal(1);
    });

    it("Should revert when buying funds are not enough", async () => {
      const { dummyToken, dex, user1 } = await loadFixtureToken();

      await dex.connect(user1).depositEth({ value: ethers.parseEther("10.0") });
      await expect(
        dex
          .connect(user1)
          .createLimitOrder(0, ticker, 50, ethers.parseEther("2"))
      ).to.revertedWith("Not enough eth in your wallet");
    });

    it("Creating multiple sell orders should be stored in ascending order", async () => {
      const { dummyToken, dex, owner, user1, user2 } = await loadFixtureToken();

      await dummyToken.connect(user1).approve(dex.target, 1000);
      await dex.connect(user1).deposit(ticker, 1000);
      await dex.connect(user1).createLimitOrder(1, ticker, 1000, 30);

      await dummyToken.connect(user2).approve(dex.target, 1000);
      await dex.connect(user2).deposit(ticker, 1000);
      await dex.connect(user2).createLimitOrder(1, ticker, 1000, 20);

      await dummyToken.approve(dex.target, 1000);
      await dex.deposit(ticker, 1000);
      await dex.createLimitOrder(1, ticker, 1000, 25);

      await dummyToken.connect(user1).approve(dex.target, 1000);
      await dex.connect(user1).deposit(ticker, 1000);
      await dex.connect(user1).createLimitOrder(1, ticker, 1000, 5);

      const orders = await dex.getOrderBook(ticker, 1);

      for (let i = 0; i < orders.length - 1; i++) {
        expect(orders[i][6]).to.lt(orders[i + 1][6]);
      }
    });

    it("Creating multiple sell orders should be stored in ascending order", async () => {
      const { dummyToken, dex, owner, user1, user2 } = await loadFixtureToken();

      //Deposit User 1
      await dex.connect(user1).depositEth({ value: ethers.parseEther("100") });
      console.log(
        await dex.balanceOf(user1.address, ethers.encodeBytes32String("ETH"))
      );
      expect(
        await dex.balanceOf(user1.address, ethers.encodeBytes32String("ETH"))
      ).to.equal(ethers.parseEther("100.0"));
      //User 1 create order
      await dex
        .connect(user1)
        .createLimitOrder(0, ticker, 5, ethers.parseEther("2"));

      //Deposit User 2
      await dex
        .connect(user2)
        .depositEth({ value: ethers.parseEther("100.0") });
      expect(
        await dex.balanceOf(user2.address, ethers.encodeBytes32String("ETH"))
      ).to.equal(ethers.parseEther("100.0"));
      //User 2 create order
      await dex
        .connect(user2)
        .createLimitOrder(0, ticker, 50, ethers.parseEther("1"));

      // owner create deposit
      await dex.depositEth({ value: ethers.parseEther("500.0") });
      expect(
        await dex.balanceOf(owner.address, ethers.encodeBytes32String("ETH"))
      ).to.equal(ethers.parseEther("500.0"));
      //owner create order
      await dex.createLimitOrder(0, ticker, 50, ethers.parseEther("3"));

      const orders = await dex.getOrderBook(ticker, 0);
      for (let i = 0; i < orders.length - 1; i++) {
        expect(orders[i][6]).to.gt(orders[i + 1][6]);
      }
    });
  });
});
