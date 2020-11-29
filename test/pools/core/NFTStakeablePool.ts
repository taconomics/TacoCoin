import { ethers, network } from "@nomiclabs/buidler";
import { expect } from "chai";
import { Signer } from "ethers";

import { NftStakeablePoolFactory } from '../../../src/types/NftStakeablePoolFactory';
import { NftStakeablePool } from '../../../src/types/NftStakeablePool';

import { TaconomicsFactory } from '../../../src/types/TaconomicsFactory';
import { Taconomics } from '../../../src/types/Taconomics';

import { KarmaTokenMockFactory } from "../../../src/types/KarmaTokenMockFactory";
import { KarmaTokenMock } from "../../../src/types/KarmaTokenMock";

import { NeverStakeStrategyFactory } from '../../../src/types/NeverStakeStrategyFactory';
import { EvenRedeemStrategyFactory } from '../../../src/types/EvenRedeemStrategyFactory';

describe("NFTStakeablePool", function() {
  let deployer: Signer;
  let deployerAddress: string;
  let redeemer: Signer;
  let nftStakeablePool: NftStakeablePool;
  let taconomics: Taconomics;
  let staker: Signer;
  let underlyingToken: KarmaTokenMock;

  beforeEach(async function () {
    [deployer, staker, redeemer] = await ethers.getSigners();

    deployerAddress = await deployer.getAddress();

    const karmaTokenFactory = new KarmaTokenMockFactory(deployer);
    underlyingToken = await karmaTokenFactory.deploy();
    await underlyingToken.deployed();

    taconomics = await (new TaconomicsFactory(deployer)).deploy(
      "0xa5409ec958c83c3f309868babaca7c86dcb077c1",
      "https://localhost:3000/tacos/",
      "https://localhost:3000/contract/taconomics-erc1155"
    );
    await taconomics.deployed();
    await taconomics.create(1, 0, []);

    nftStakeablePool = await (new NftStakeablePoolFactory(deployer)).deploy(
      "Test Pool",
      taconomics.address,
      underlyingToken.address,
      "0x0000000000000000000000000000000000000000"
    );
    await nftStakeablePool.deployed();

    await taconomics.addMinter(nftStakeablePool.address);
  });

  describe("#stake", function() {
    it("Cannot stake before approving underlying", async function () {
      await expect(nftStakeablePool.stake(100))
        .to.be.revertedWith("ERC20: transfer amount exceeds allowance");
    });

    it("Cannot stake when underlying balance is 0", async function () {
      await underlyingToken.connect(staker).approve(nftStakeablePool.address, 100);
      await expect(nftStakeablePool.connect(staker).stake(100))
        .to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Can stake, after approval and with enough balance", async function () {
      const stakerAddress = await staker.getAddress();
      await underlyingToken.transfer(stakerAddress, 100);
      await underlyingToken.connect(staker).approve(nftStakeablePool.address, 100);
      await nftStakeablePool.connect(staker).stake(100);

      expect(await underlyingToken.balanceOf(nftStakeablePool.address)).to.equal(100);
    });

    it("contract balance of underlying has the total staked balance", async function () {
      const stakerAddress = await staker.getAddress();
      await underlyingToken.transfer(stakerAddress, 100);
      await underlyingToken.connect(staker).approve(nftStakeablePool.address, 100);
      await nftStakeablePool.connect(staker).stake(100);

      expect(await nftStakeablePool.balanceOf(stakerAddress)).to.equal(100);
      expect(await underlyingToken.balanceOf(nftStakeablePool.address)).to.equal(100);

      await underlyingToken.approve(nftStakeablePool.address, 120);
      await nftStakeablePool.stake(120);

      expect(await nftStakeablePool.balanceOf(deployerAddress)).to.equal(120);
      expect(await underlyingToken.balanceOf(nftStakeablePool.address)).to.equal(220);
    });

    it("succesfully updates lastUpdateTime", async function () {
      const stakerAddress = await staker.getAddress();
      await underlyingToken.transfer(stakerAddress, 100);
      await underlyingToken.connect(staker).approve(nftStakeablePool.address, 100);

      expect(await nftStakeablePool.lastUpdateTime(stakerAddress)).to.equal(0);
      await nftStakeablePool.connect(staker).stake(100);
      expect(await nftStakeablePool.lastUpdateTime(stakerAddress)).not.to.equal(0);
    });

    it("cannot stake when strategy returns false", async function () {
      const neverStakeStrategy = await (new NeverStakeStrategyFactory(deployer)).deploy();
      const stakerAddress = await staker.getAddress();
      await nftStakeablePool.setStakeableStrategy(neverStakeStrategy.address);

      await underlyingToken.transfer(stakerAddress, 100);
      await underlyingToken.connect(staker).approve(nftStakeablePool.address, 100);

      await expect(nftStakeablePool.connect(staker).stake(100))
        .to.be.revertedWith("StakeableToken#_stake: Sender doesn't meet the requirements to stake.");
    });
  });

  describe("#earnedPoints", function() {
    let stakerAddress: string;
    beforeEach(async function() {
      stakerAddress = await staker.getAddress();
      await underlyingToken.transfer(stakerAddress, 50000);
      await underlyingToken.connect(staker).approve(nftStakeablePool.address, 9999999);
      await nftStakeablePool.connect(staker).stake(10000);
    });

    it("starts with 0 points", async function() {
      expect(await nftStakeablePool.earnedPoints(stakerAddress)).to.equal(0);
      expect(await nftStakeablePool.points(stakerAddress)).to.equal(0);
    });

    it("generates as many points as staked balance per day", async function() {
      await network.provider.send("evm_increaseTime", [86400]);
      await network.provider.send("evm_mine");
      expect(await nftStakeablePool.earnedPoints(stakerAddress)).to.equal(10000);
      expect(await nftStakeablePool.points(stakerAddress)).to.equal(0);
    });

    it("generates half the points in half the day", async function() {
      await network.provider.send("evm_increaseTime", [86400/2]);
      await network.provider.send("evm_mine");
      expect(await nftStakeablePool.earnedPoints(stakerAddress)).to.equal(5000);
      expect(await nftStakeablePool.points(stakerAddress)).to.equal(0);
    });

    it("generates as many points as staked balance per day, even after staking more", async function() {
      await network.provider.send("evm_increaseTime", [86400]);
      await nftStakeablePool.connect(staker).stake(10000);
      expect(await nftStakeablePool.earnedPoints(stakerAddress)).to.equal(10000);
      expect(await nftStakeablePool.points(stakerAddress)).to.equal(10000);
    });

    it("uses new balance for subsequent earned points", async function() {
      await network.provider.send("evm_increaseTime", [86400]);
      await nftStakeablePool.connect(staker).stake(10000);
      expect(await nftStakeablePool.earnedPoints(stakerAddress)).to.equal(10000);
      expect(await nftStakeablePool.points(stakerAddress)).to.equal(10000);
      await network.provider.send("evm_increaseTime", [86400]);
      await network.provider.send("evm_mine");
      expect(await nftStakeablePool.earnedPoints(stakerAddress)).to.equal(30000);
      expect(await nftStakeablePool.points(stakerAddress)).to.equal(10000);
    });
  });

  describe("#withdraw", function() {
    it("cannot withdraw when nothing is staked", async function() {
      await expect(nftStakeablePool.withdraw(100))
        .to.be.revertedWith("Cannot withdraw more than what's staked.");
    });

    it("can withdraw exactly the same amount that was staked", async function() {
      await underlyingToken.approve(nftStakeablePool.address, 120);
      await nftStakeablePool.stake(120);

      expect(await underlyingToken.balanceOf(nftStakeablePool.address)).to.equal(120);

      await nftStakeablePool.withdraw(120);
      expect(await underlyingToken.balanceOf(nftStakeablePool.address)).to.equal(0);
    });

    it("can withdraw less than what was staked", async function() {
      await underlyingToken.approve(nftStakeablePool.address, 120);
      await nftStakeablePool.stake(120);

      expect(await underlyingToken.balanceOf(nftStakeablePool.address)).to.equal(120);

      await nftStakeablePool.withdraw(60);
      expect(await underlyingToken.balanceOf(nftStakeablePool.address)).to.equal(60);
    });

    it("cannot withdraw more than what was staked", async function() {
      await underlyingToken.approve(nftStakeablePool.address, 120);
      await nftStakeablePool.stake(120);

      expect(await underlyingToken.balanceOf(nftStakeablePool.address)).to.equal(120);

      await expect(nftStakeablePool.withdraw(200))
        .to.be.revertedWith("Cannot withdraw more than what's staked.");
    });

    it("succesfully updates lastUpdateTime", async function () {
      await underlyingToken.approve(nftStakeablePool.address, 120);

      expect(await nftStakeablePool.lastUpdateTime(deployerAddress)).to.equal(0);

      await nftStakeablePool.stake(120);

      const lastUpdateTime = await nftStakeablePool.lastUpdateTime(deployerAddress);
      expect(lastUpdateTime.toNumber()).to.be.greaterThan(0);

      await nftStakeablePool.withdraw(60);
      expect((await nftStakeablePool.lastUpdateTime(deployerAddress)).toNumber()).to.be.greaterThan(lastUpdateTime.toNumber());
    });
  });

  describe("#balanceOf", function() {
    let stakerAddress: string;

    beforeEach(async function() {
      stakerAddress = await staker.getAddress();
    });

    it("is 0 for every new address", async function() {
      expect(await nftStakeablePool.balanceOf(stakerAddress)).to.equal(0);
      expect(await nftStakeablePool.balanceOf(deployerAddress)).to.equal(0);
    });

    it("balance can be validated after staking", async function () {
      await underlyingToken.transfer(stakerAddress, 100);
      await underlyingToken.connect(staker).approve(nftStakeablePool.address, 100);
      await nftStakeablePool.connect(staker).stake(100);

      expect(await nftStakeablePool.balanceOf(stakerAddress)).to.equal(100);
    });

    it("balance is correct for different addresses", async function () {
      await underlyingToken.transfer(stakerAddress, 100);
      await underlyingToken.connect(staker).approve(nftStakeablePool.address, 100);
      await nftStakeablePool.connect(staker).stake(100);

      await underlyingToken.approve(nftStakeablePool.address, 120);
      await nftStakeablePool.stake(120);

      expect(await nftStakeablePool.balanceOf(stakerAddress)).to.equal(100);
      expect(await nftStakeablePool.balanceOf(deployerAddress)).to.equal(120);
    });
  });

  describe("#totalSupply", function() {
    it("is 0 when nobody has staked", async function() {
      expect(await nftStakeablePool.totalSupply()).to.equal(0);
      expect(await underlyingToken.balanceOf(nftStakeablePool.address)).to.equal(0);
    });

    it("increases when underlying is staked", async function() {
      expect(await nftStakeablePool.totalSupply()).to.equal(0);
      expect(await underlyingToken.balanceOf(nftStakeablePool.address)).to.equal(0);

      await underlyingToken.approve(nftStakeablePool.address, 120);
      await nftStakeablePool.stake(120);

      expect(await nftStakeablePool.totalSupply()).to.equal(120);
      expect(await underlyingToken.balanceOf(nftStakeablePool.address)).to.equal(120);
    });

    it("decreases after withdrawal", async function() {
      expect(await nftStakeablePool.totalSupply()).to.equal(0);
      expect(await underlyingToken.balanceOf(nftStakeablePool.address)).to.equal(0);

      await underlyingToken.approve(nftStakeablePool.address, 120);
      await nftStakeablePool.stake(120);

      expect(await nftStakeablePool.totalSupply()).to.equal(120);
      expect(await underlyingToken.balanceOf(nftStakeablePool.address)).to.equal(120);

      await nftStakeablePool.withdraw(30);

      expect(await nftStakeablePool.totalSupply()).to.equal(90);
      expect(await underlyingToken.balanceOf(nftStakeablePool.address)).to.equal(90);
    });
  });

  describe("addNFT", function () {
    it("fails to add a new NFT when the NFT does not exists", async function () {
      await expect(nftStakeablePool.addNFT(2, 10000, "0x0000000000000000000000000000000000000000"))
        .to.be.revertedWith("RedeemableNFT#_addNFT: NFT doesn't exist");
    });

    it("succesfully adds a new NFT when the NFT exists", async function () {
      await nftStakeablePool.addNFT(1, 10000, "0x0000000000000000000000000000000000000000");
      expect((await nftStakeablePool.nfts(1)).pointsToRedeem).to.equal(10000);
    });

    it("emits NFTAdded event", async function () {
      await expect(nftStakeablePool.addNFT(1, 10000, "0x0000000000000000000000000000000000000000"))
        .to.emit(nftStakeablePool, 'NFTAdded').withArgs(1, 10000, "0x0000000000000000000000000000000000000000", deployerAddress);
    });
  });

  describe("updateNFTStrategy", function () {
    it("cannot update strategy of non redeemable NFT", async function () {
      await expect(nftStakeablePool.updateNFTStrategy(1, "0x0000000000000000000000000000000000000001"))
        .to.be.revertedWith("RedeemableNFT#updateNFTStrategy: NFT not found");
    });

    it("succesfully updates strategy of NFT and emits event", async function () {
      await nftStakeablePool.addNFT(1, 10000, "0x0000000000000000000000000000000000000000");
      expect((await nftStakeablePool.nfts(1)).strategy).to.equal("0x0000000000000000000000000000000000000000");

      await expect(nftStakeablePool.updateNFTStrategy(1, "0x0000000000000000000000000000000000000001"))
        .to.emit(nftStakeablePool, 'NFTStrategyUpdated')
        .withArgs(1, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000001");

      expect((await nftStakeablePool.nfts(1)).strategy).to.equal("0x0000000000000000000000000000000000000001");
    });
  });

  describe("redeem", function () {
    let stakerAddress: string;
    beforeEach(async function () {
      stakerAddress = await staker.getAddress();
      await underlyingToken.transfer(stakerAddress, 50000);
      await underlyingToken.connect(staker).approve(nftStakeablePool.address, 9999999);
      await nftStakeablePool.connect(staker).stake(10000);
    });

    it("cannot redeem a non existant NFT", async function () {
      await expect(nftStakeablePool.redeem(1)).to.be.revertedWith("RedeemableNFT#_redeem: NFT not found");
    });

    it("cannot redeem when user doesn't have enough points", async function () {
      await nftStakeablePool.addNFT(1, 10000, "0x0000000000000000000000000000000000000000");
      await expect(nftStakeablePool.redeem(1))
        .to.be.revertedWith("RedeemableNFT#_redeem: Not enough points to redeem for NFT");
    });

    it("cannot redeem when all nfts have been minted", async function () {
      await taconomics.mint("0x0000000000000000000000000000000000000001", 1, 100, []);
      await nftStakeablePool.addNFT(1, 10000, "0x0000000000000000000000000000000000000000");

      await network.provider.send("evm_increaseTime", [86409]);
      await network.provider.send("evm_mine");

      await expect(nftStakeablePool.connect(staker).redeem(1))
        .to.be.revertedWith("RedeemableNFT#_redeem: Max NFTs minted");
    });

    it("cannot redeem when strategy doesn't allow it", async function () {
      const redeemStrategy = await (new EvenRedeemStrategyFactory(deployer)).deploy();
      await redeemStrategy.deployed();
      await nftStakeablePool.addNFT(1, 10000, redeemStrategy.address);

      await network.provider.send("evm_increaseTime", [86409]);
      await network.provider.send("evm_mine");

      await expect(nftStakeablePool.connect(staker).redeem(1))
        .to.be.revertedWith("RedeemableNFT#_redeem: Sender doesn't meet the requirements to mint.");
    });

    it("can redeem when everything allows it and emits event", async function () {
      await taconomics.create(2, 0, []);

      const redeemStrategy = await (new EvenRedeemStrategyFactory(deployer)).deploy();
      await redeemStrategy.deployed();
      await nftStakeablePool.addNFT(1, 10000, redeemStrategy.address);
      await nftStakeablePool.addNFT(2, 10000, redeemStrategy.address);

      await network.provider.send("evm_increaseTime", [86409]);
      await network.provider.send("evm_mine");

      await expect(nftStakeablePool.connect(staker).redeem(2))
        .to.emit(nftStakeablePool, 'NFTRedeemed')
        .withArgs(stakerAddress, 10000);

      expect(await nftStakeablePool.points(stakerAddress)).to.equal(1);
    });
  });

});