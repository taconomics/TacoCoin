import { ethers } from "@nomiclabs/buidler";
import { expect } from "chai";
import { Signer } from "ethers";

import { TaconomicsFactory } from '../../../src/types/TaconomicsFactory';
import { Taconomics } from '../../../src/types/Taconomics';

import { ExposedRedeemableNftFactory } from '../../../src/types/ExposedRedeemableNftFactory';
import { ExposedRedeemableNft } from '../../../src/types/ExposedRedeemableNft';

import { EvenRedeemStrategyFactory } from '../../../src/types/EvenRedeemStrategyFactory';
import { EvenRedeemStrategy } from '../../../src/types/EvenRedeemStrategy';

describe("RedeemableNFT", function() {
  let deployer: Signer;
  let deployerAddress: string;
  let redeemer: Signer;
  let redeemableNFT: ExposedRedeemableNft;
  let taconomics: Taconomics;

  beforeEach(async function () {
    [deployer, redeemer] = await ethers.getSigners();

    deployerAddress = await deployer.getAddress();

    taconomics = await (new TaconomicsFactory(deployer)).deploy(
      "0xa5409ec958c83c3f309868babaca7c86dcb077c1",
      "https://game.taconomics.io/tacos/",
      "https://game.taconomics.io/contract/taconomics-erc1155"
    );
    await taconomics.deployed();

    await taconomics.create(1, 0, []);

    redeemableNFT = await (new ExposedRedeemableNftFactory(deployer)).deploy(taconomics.address);
    await redeemableNFT.deployed();

    await taconomics.addMinter(redeemableNFT.address);
  });

  describe("addNFT", function () {
    it("fails to add a new NFT when the NFT does not exists", async function () {
      await expect(redeemableNFT.addNFT(2, 10000, "0x0000000000000000000000000000000000000000"))
        .to.be.revertedWith("RedeemableNFT#_addNFT: NFT doesn't exist");
    });

    it("succesfully adds a new NFT when the NFT exists", async function () {
      await redeemableNFT.addNFT(1, 10000, "0x0000000000000000000000000000000000000000");
      expect((await redeemableNFT.nfts(1)).pointsToRedeem).to.equal(10000);
    });

    it("emits NFTAdded event", async function () {
      await expect(redeemableNFT.addNFT(1, 10000, "0x0000000000000000000000000000000000000000"))
        .to.emit(redeemableNFT, 'NFTAdded').withArgs(1, 10000, "0x0000000000000000000000000000000000000000", deployerAddress);
    });
  });

  describe("updateNFTStrategy", function () {
    it("cannot update strategy of non redeemable NFT", async function () {
      await expect(redeemableNFT.updateNFTStrategy(1, "0x0000000000000000000000000000000000000001"))
        .to.be.revertedWith("RedeemableNFT#updateNFTStrategy: NFT not found");
    });

    it("succesfully updates strategy of NFT and emits event", async function () {
      await redeemableNFT.addNFT(1, 10000, "0x0000000000000000000000000000000000000000");
      expect((await redeemableNFT.nfts(1)).strategy).to.equal("0x0000000000000000000000000000000000000000");

      await expect(redeemableNFT.updateNFTStrategy(1, "0x0000000000000000000000000000000000000001"))
        .to.emit(redeemableNFT, 'NFTStrategyUpdated')
        .withArgs(1, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000001");

      expect((await redeemableNFT.nfts(1)).strategy).to.equal("0x0000000000000000000000000000000000000001");
    });
  });

  describe("redeem", function () {
    it("cannot redeem a non existant NFT", async function () {
      await expect(redeemableNFT.redeem(1)).to.be.revertedWith("RedeemableNFT#_redeem: NFT not found");
    });

    it("cannot redeem when user doesn't have enough points", async function () {
      await redeemableNFT.addNFT(1, 10000, "0x0000000000000000000000000000000000000000");
      await expect(redeemableNFT.redeem(1))
        .to.be.revertedWith("RedeemableNFT#_redeem: Not enough points to redeem for NFT");
    });

    it("cannot redeem when all nfts have been minted", async function () {
      await taconomics.mint("0x0000000000000000000000000000000000000001", 1, 100, []);
      await redeemableNFT.addNFT(1, 10000, "0x0000000000000000000000000000000000000000");

      const deployerAddress = await deployer.getAddress();
      await redeemableNFT.increasePoints(deployerAddress, 10001);

      await expect(redeemableNFT.redeem(1))
        .to.be.revertedWith("RedeemableNFT#_redeem: Max NFTs minted");
    });

    it("cannot redeem when strategy doesn't allow it", async function () {
      const redeemStrategy = await (new EvenRedeemStrategyFactory(deployer)).deploy();
      await redeemStrategy.deployed();
      await redeemableNFT.addNFT(1, 10000, redeemStrategy.address);

      const deployerAddress = await deployer.getAddress();
      await redeemableNFT.increasePoints(deployerAddress, 10001);

      await expect(redeemableNFT.redeem(1))
        .to.be.revertedWith("RedeemableNFT#_redeem: Sender doesn't meet the requirements to mint.");
    });

    it("can redeem when everything allows it and emits event", async function () {
      await taconomics.create(2, 0, []);

      const redeemStrategy = await (new EvenRedeemStrategyFactory(deployer)).deploy();
      await redeemStrategy.deployed();
      await redeemableNFT.addNFT(1, 10000, redeemStrategy.address);
      await redeemableNFT.addNFT(2, 10000, redeemStrategy.address);

      const deployerAddress = await deployer.getAddress();
      await redeemableNFT.increasePoints(deployerAddress, 10001);

      await expect(redeemableNFT.redeem(2))
        .to.emit(redeemableNFT, 'NFTRedeemed')
        .withArgs(deployerAddress, 10000);

      expect(await redeemableNFT.points(deployerAddress)).to.equal(1);
    });
  });
});
