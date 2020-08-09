import { ethers } from "@nomiclabs/buidler";
import { expect } from "chai";
import { network } from "@nomiclabs/buidler";
import { TacoToken } from "../src/types/TacoToken";
import { UniswapV2PairMockFactory } from "../src/types/UniswapV2PairMockFactory";
import { UniswapFactoryMockFactory } from "../src/types/UniswapFactoryMockFactory";
import { Signer } from "ethers";
import { TacoTokenFactory } from "../src/types/TacoTokenFactory";
import { BigNumber } from "ethers/utils";
import { UniswapV2PairMock } from "../src/types/UniswapV2PairMock";
import { AddressZero } from "ethers/constants";

export type TaqueroStat = {
  timesCrunched: BigNumber;
  tacosCrunched: BigNumber;
  0: BigNumber;
  1: BigNumber;
};

const TOTAL_SUPPLY = "15624000000000000000000000";
const CIRCULATING_SUPPLY = "14530320000000000000000000";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

describe("TacoToken contract", function() {
  let tacoToken: TacoToken;
  let deployer: Signer;
  let deployerAddr: string;
  let signer1: Signer;
  let addr1: string;
  let signer2: Signer;
  let addr2: string;
  let uniswapPool: UniswapV2PairMock;
  let uniswapPoolAddr: string;
  
  beforeEach(async function () {
    [deployer, signer1, signer2] = await ethers.getSigners();

    deployerAddr = await deployer.getAddress();
    addr1 = await signer1.getAddress();
    addr2 = await signer2.getAddress();

    const uniswapV2PairFactory = new UniswapV2PairMockFactory(deployer);
    uniswapPool = await uniswapV2PairFactory.deploy();
    await uniswapPool.deployed();
    uniswapPoolAddr = uniswapPool.address;

    const uniswapFactoryMockFactory = new UniswapFactoryMockFactory(deployer);
    const uniswapFactory= await uniswapFactoryMockFactory.deploy(uniswapPool.address);
    await uniswapFactory.deployed();

    const tacoTokenFactory = new TacoTokenFactory(deployer);
    tacoToken = await tacoTokenFactory.deploy(TOTAL_SUPPLY, uniswapFactory.address, WETH_ADDRESS);
    await tacoToken.deployed();
    await tacoToken.setUniswapPool();
    await tacoToken.transfer(uniswapPool.address, CIRCULATING_SUPPLY);
  });

  describe("SocialProofable", function() {
    it("returns Twitter handle", async function() {
      expect(await tacoToken.getTwitter()).to.equal("Taconomics101");
    });

    it("returns Telegram handle", async function() {
      expect(await tacoToken.getTelegram()).to.equal("TacoGram");
    });

    it("returns Website", async function() {
      expect(await tacoToken.getWebsite()).to.equal("taconomics.io");
    });

    it("returns Github", async function() {
      expect(await tacoToken.getGithub()).to.equal("taconomics");
    });

    it("can set Twitter proof", async function() {
      expect(await tacoToken.getTwitterProof()).to.equal(0);
      await tacoToken.setTwitterProof(123456789);
      expect(await tacoToken.getTwitterProof()).to.equal(123456789);
    });

    it("can set Github proof", async function() {
      expect(await tacoToken.getGithubProof()).to.equal("0x");
      await tacoToken.setGithubProof("0x05efaa4635fb28cb0de42e2a3d7c3529");
      expect(await tacoToken.getGithubProof()).to.equal("0x05efaa4635fb28cb0de42e2a3d7c3529");
    });
  });

  describe("Pausable", function() {
    it("deployer is unpauser", async function() {
      expect((await tacoToken.pauser())).to.equal(deployerAddr);
    });

    describe("when paused", function() {
      it("should be paused", async function() {
        expect((await tacoToken.paused())).to.be.true;
      });

      it("cannot be crunched", async function() {
        await expect(tacoToken.crunchPool()).to.be.revertedWith("Pausable: Contract is paused");
      });

      describe("connected as pauser", function() {
        beforeEach(async function() {
          await tacoToken.transfer(addr1, 1000);
          await tacoToken.setPauser(addr1);
          tacoToken = tacoToken.connect(signer1);
        });

        it("can unpause", async function() {
          await tacoToken.unpause();
          expect((await tacoToken.paused())).to.be.false;
        });

        it("burns pauser rights after unpausing", async function() {
          await tacoToken.unpause();
          expect((await tacoToken.pauser())).to.equal(AddressZero);
        });

        it("after unpausing, owner cannot longer setPauser", async function() {
          await tacoToken.unpause();
          await expect(tacoToken.connect(deployer).setPauser(deployerAddr))
            .to.be.revertedWith("Pausable: Pauser rights have been burnt. It's no longer able to set newPauser");
        });

        it("can transfer tokens", async function() {
          await tacoToken.transfer(addr2, 1000);
          expect(await (tacoToken.balanceOf(addr2))).to.equal(1000);
        });

        it("cannot assign new pauser, even when being pauser", async function() {
          expect((await tacoToken.pauser())).to.equal(addr1);
          await expect(tacoToken.setPauser(deployerAddr)).to.be.revertedWith("Ownable: caller is not the owner");
        });
      });

      describe("connected as owner", function() {
        it("can assign new pauser", async function() {
          expect((await tacoToken.owner())).to.equal(deployerAddr);
          await tacoToken.setPauser(addr1);
          expect((await tacoToken.pauser())).to.equal(addr1);
        });

        it("can assign new pauser even when owner is not pauser", async function() {
          await tacoToken.setPauser(addr1);
          expect((await tacoToken.pauser())).to.equal(addr1);
          await tacoToken.setPauser(deployerAddr);
          expect((await tacoToken.pauser())).to.equal(deployerAddr);
        });
      });

      describe("connected as non-pauser", function() {
        beforeEach(function () {
          tacoToken = tacoToken.connect(signer1);
        });

        it("cannot unpause", async function() {
          await expect(tacoToken.unpause()).to.be.revertedWith("Pausable: Only Pauser can call this function.")
          expect((await tacoToken.paused())).to.be.true;
        });

        it("cannot transfer tokens", async function() {
          await expect(tacoToken.transfer(addr2, 100000))
            .to.be.revertedWith("TacoToken: Cannot transfer tokens while game is paused and sender is not the Pauser.");
        });

        it("cannot assign new pauser", async function() {
          await expect(tacoToken.setPauser(addr2)).to.be.revertedWith("Ownable: caller is not the owner");
          expect((await tacoToken.pauser())).to.equal(deployerAddr);
        });
      });
    });

    describe("when unpaused", function() {
      beforeEach(async function() {
        await tacoToken.unpause();
      });

      it("should not be paused", async function() {
        expect((await tacoToken.paused())).to.be.false;
      });

      it("can be crunched", async function() {
        await network.provider.send("evm_increaseTime", [300]);
        await tacoToken.crunchPool();
        expect((await tacoToken.totalCrunched())).to.not.equal("0");
      });

      describe("connected as pauser", function() {
        it("can transfer tokens", async function() {
          await tacoToken.transfer(addr1, 1000);
          expect(await (tacoToken.balanceOf(addr1))).to.equal(1000);
        });
      });

      describe("connected as non-pauser", function() {
        beforeEach(async function () {
          await tacoToken.transfer(addr1, 100000);
          tacoToken = tacoToken.connect(signer1);
        });

        it("can transfer tokens", async function() {
          await tacoToken.transfer(addr2, 100000);
          expect(await tacoToken.balanceOf(addr2)).to.equal(100000);
        });
      });
    });
  });

  describe("#setUniswapPool", function() {
    it("owner can only call this function ones", async function() {
      // It was already called in beforeEach
      await expect(tacoToken.setUniswapPool()).to.be.revertedWith("TacoToken: pool already created");
    });

    it("not owner cannnot call this function", async function() {
      await expect(tacoToken.connect(signer1).setUniswapPool()).to.be.revertedWith("Ownable: caller is not the owner");
    })
  });

  describe("#setCrunchRate", function() {
    it("owner can change the crunchRate", async function() {
      expect(await tacoToken.crunchRate()).to.equal(4);
      await tacoToken.setCrunchRate(1);
      expect(await tacoToken.crunchRate()).to.equal(1);
    });

    it("owner cannot set the crunchRate to 0", async function() {
      await expect(tacoToken.setCrunchRate(0)).to.be.revertedWith("TacoToken: crunchRate must be at least 1 and at most 10");
    });

    it("owner can set crunchRate to 10", async function() {
      expect(await tacoToken.crunchRate()).to.equal(4);
      await tacoToken.setCrunchRate(10);
      expect(await tacoToken.crunchRate()).to.equal(10);
    });

    it("owner cannot set the crunchRate to 11", async function() {
      await expect(tacoToken.setCrunchRate(11)).to.be.revertedWith("TacoToken: crunchRate must be at least 1 and at most 10");
    });

    it("not owner cannnot call this function", async function() {
      await expect(tacoToken.connect(signer1).setCrunchRate(1)).to.be.revertedWith("Ownable: caller is not the owner");
    })
  });

  describe("#setRewardForTaquero", function() {
    it("owner can change the rewardForTaquero", async function() {
      expect(await tacoToken.rewardForTaquero()).to.equal(1);
      await tacoToken.setRewardForTaquero(2);
      expect(await tacoToken.rewardForTaquero()).to.equal(2);
    });

    it("owner cannot set the rewardForTaquero to 0", async function() {
      await expect(tacoToken.setRewardForTaquero(0)).to.be.revertedWith("TacoToken: rewardForTaquero must be at least 1 and at most 10");
    });

    it("owner can set rewardForTaquero to 10", async function() {
      expect(await tacoToken.rewardForTaquero()).to.equal(1);
      await tacoToken.setRewardForTaquero(10);
      expect(await tacoToken.rewardForTaquero()).to.equal(10);
    });

    it("owner cannot set the rewardForTaquero to 11", async function() {
      await expect(tacoToken.setRewardForTaquero(11)).to.be.revertedWith("TacoToken: rewardForTaquero must be at least 1 and at most 10");
    });

    it("not owner cannnot call this function", async function() {
      await expect(tacoToken.connect(signer1).setRewardForTaquero(1)).to.be.revertedWith("Ownable: caller is not the owner");
    })
  });

  describe("#setTacoTuesdayRewardMultiplier", function() {
    it("owner can change the tacoTuesdayRewardMultiplier", async function() {
      expect(await tacoToken.tacoTuesdayRewardMultiplier()).to.equal(20);
      await tacoToken.setTacoTuesdayRewardMultiplier(15);
      expect(await tacoToken.tacoTuesdayRewardMultiplier()).to.equal(15);
    });

    it("owner cannot set the tacoTuesdayRewardMultiplier to 9", async function() {
      await expect(tacoToken.setTacoTuesdayRewardMultiplier(9)).to.be.revertedWith("TacoToken: tacoTuesdayRewardMultiplier must be at least 10 and at most 30");
    });

    it("owner can set tacoTuesdayRewardMultiplier to 30", async function() {
      expect(await tacoToken.tacoTuesdayRewardMultiplier()).to.equal(20);
      await tacoToken.setTacoTuesdayRewardMultiplier(30);
      expect(await tacoToken.tacoTuesdayRewardMultiplier()).to.equal(30);
    });

    it("owner cannot set the tacoTuesdayRewardMultiplier to 31", async function() {
      await expect(tacoToken.setTacoTuesdayRewardMultiplier(31)).to.be.revertedWith("TacoToken: tacoTuesdayRewardMultiplier must be at least 10 and at most 30");
    });

    it("not owner cannnot call this function", async function() {
      await expect(tacoToken.connect(signer1).setTacoTuesdayRewardMultiplier(1)).to.be.revertedWith("Ownable: caller is not the owner");
    })
  });

  describe("#crunchPool", function() {
    let ogSupply: BigNumber;
    let ogUniswapBalance: BigNumber;
    let ogSigner1Balance: BigNumber;
    let ogTaqueroStats: TaqueroStat;
    let crunchRate: BigNumber;
    let rewardForTaquero: BigNumber;
    let rewardMultiplier: BigNumber;

    beforeEach(async function() {
      tacoToken = tacoToken.connect(signer1);
      ogSupply = await tacoToken.totalSupply();
      ogUniswapBalance = await tacoToken.balanceOf(uniswapPoolAddr);
      ogSigner1Balance = await tacoToken.balanceOf(addr1);
      ogTaqueroStats = await tacoToken.getTaqueroStats(addr1);
      crunchRate = await tacoToken.crunchRate();
      rewardForTaquero = await tacoToken.rewardForTaquero();
      rewardMultiplier = await tacoToken.rewardMultiplier();
    });

    it("decreases supply & uniswapBalance. increases caller balance", async function() {
      await tacoToken.connect(deployer).unpause();
      await network.provider.send("evm_increaseTime", [300]);
      await tacoToken.crunchPool();

      expect(await tacoToken.totalSupply()).to.be.lt(ogSupply);
      expect(await tacoToken.balanceOf(uniswapPoolAddr)).to.be.lt(ogUniswapBalance);
      expect(await tacoToken.balanceOf(addr1)).to.be.gt(ogSigner1Balance);
    });

    xit("syncs uniswapPool",async function() {
      await tacoToken.connect(deployer).unpause();
      await network.provider.send("evm_increaseTime", [300]);
      await tacoToken.crunchPool();

      expect('sync').to.be.calledOnContract(uniswapPool);
    });

    xit("emits PoolCrunched event",async function() {
      await tacoToken.connect(deployer).unpause();
      await network.provider.send("evm_increaseTime", [300]);

      await expect(await tacoToken.crunchPool()).to.emit(tacoToken, 'PoolCrunched');
    });

    describe("with default crunch rates", function() {
      it("crunch size is reflective of how long has been since last crunch", async function() {
        await tacoToken.connect(deployer).unpause();
        await network.provider.send("evm_increaseTime", [300]);
        await tacoToken.crunchPool();

        const newSupply = await tacoToken.totalSupply();
        const newUniswapBalance = await tacoToken.balanceOf(uniswapPoolAddr);
        const newSigner1Balance = await tacoToken.balanceOf(addr1);

        const expectedUniBalDiff = ogUniswapBalance.mul(crunchRate).mul(300).div(100).div(86400);
        const expectedSignerBalDiff = expectedUniBalDiff.mul(rewardForTaquero).mul(rewardMultiplier).div(1000);
        const expectedSupplyDiff = expectedUniBalDiff.sub(expectedSignerBalDiff);

        expect(ogSupply.sub(newSupply)).to.be.eq(expectedSupplyDiff);
        expect(ogUniswapBalance.sub(newUniswapBalance)).to.be.eq(expectedUniBalDiff);
        expect(newSigner1Balance.sub(ogSigner1Balance)).to.be.eq(expectedSignerBalDiff);
      });

      it("updates the taquero stats", async function() {
        await tacoToken.connect(deployer).unpause();
        await network.provider.send("evm_increaseTime", [300]);
        await tacoToken.crunchPool();

        const expectedUniBalDiff = ogUniswapBalance.mul(crunchRate).mul(300).div(100).div(86400);
        const expectedSignerBalDiff = expectedUniBalDiff.mul(rewardForTaquero).mul(rewardMultiplier).div(1000);

        const newTaqueroStats = await tacoToken.getTaqueroStats(addr1);

        expect(newTaqueroStats.timesCrunched).to.eq(ogTaqueroStats.timesCrunched.add(1));
        expect(newTaqueroStats.tacosCrunched).to.eq(ogTaqueroStats.tacosCrunched.add(expectedSignerBalDiff));
      });
    });

    describe("with different crunch rates", function() {
      let newCrunchRate: BigNumber;
      let newRewardForTaquero: BigNumber;
      let newRewardMultiplier: BigNumber;

      beforeEach(async function() {
        await tacoToken.connect(deployer).setCrunchRate(10);
        await tacoToken.connect(deployer).setRewardForTaquero(2);
        await tacoToken.connect(deployer).setTacoTuesdayRewardMultiplier(30);

        newCrunchRate = await tacoToken.crunchRate();
        newRewardForTaquero = await tacoToken.rewardForTaquero();
        newRewardMultiplier = await tacoToken.rewardMultiplier();
      });

      it("crunch size is reflective of how long has been since last crunch", async function() {
        await tacoToken.connect(deployer).unpause();
        await network.provider.send("evm_increaseTime", [300]);
        await tacoToken.crunchPool();

        const newSupply = await tacoToken.totalSupply();
        const newUniswapBalance = await tacoToken.balanceOf(uniswapPoolAddr);
        const newSigner1Balance = await tacoToken.balanceOf(addr1);

        const unexpectedUniBalDiff = ogUniswapBalance.mul(crunchRate).mul(300).div(100).div(86400);
        const unexpectedSignerBalDiff = unexpectedUniBalDiff.mul(rewardForTaquero).mul(rewardMultiplier).div(1000);
        const unexpectedSupplyDiff = unexpectedUniBalDiff.sub(unexpectedSignerBalDiff);

        expect(ogSupply.sub(newSupply)).to.not.be.eq(unexpectedSupplyDiff);
        expect(ogUniswapBalance.sub(newUniswapBalance)).to.not.be.eq(unexpectedUniBalDiff);
        expect(newSigner1Balance.sub(ogSigner1Balance)).to.not.be.eq(unexpectedSignerBalDiff);

        const expectedUniBalDiff = ogUniswapBalance.mul(newCrunchRate).mul(300).div(100).div(86400);
        const expectedSignerBalDiff = expectedUniBalDiff.mul(newRewardForTaquero).mul(newRewardMultiplier).div(1000);
        const expectedSupplyDiff = expectedUniBalDiff.sub(expectedSignerBalDiff);

        expect(ogSupply.sub(newSupply)).to.be.eq(expectedSupplyDiff);
        expect(ogUniswapBalance.sub(newUniswapBalance)).to.be.eq(expectedUniBalDiff);
        expect(newSigner1Balance.sub(ogSigner1Balance)).to.be.eq(expectedSignerBalDiff);
      });

      it("updates the taquero stats", async function() {
        await tacoToken.connect(deployer).unpause();
        await network.provider.send("evm_increaseTime", [300]);
        await tacoToken.crunchPool();

        const unexpectedUniBalDiff = ogUniswapBalance.mul(crunchRate).mul(300).div(100).div(86400);
        const unexpectedSignerBalDiff = unexpectedUniBalDiff.mul(rewardForTaquero).mul(rewardMultiplier).div(1000);

        const expectedUniBalDiff = ogUniswapBalance.mul(newCrunchRate).mul(300).div(100).div(86400);
        const expectedSignerBalDiff = expectedUniBalDiff.mul(newRewardForTaquero).mul(newRewardMultiplier).div(1000);

        const newTaqueroStats = await tacoToken.getTaqueroStats(addr1);

        expect(newTaqueroStats.tacosCrunched).to.not.eq(ogTaqueroStats.tacosCrunched.add(unexpectedSignerBalDiff));

        expect(newTaqueroStats.timesCrunched).to.eq(ogTaqueroStats.timesCrunched.add(1));
        expect(newTaqueroStats.tacosCrunched).to.eq(ogTaqueroStats.tacosCrunched.add(expectedSignerBalDiff));
      });
    });
  });

  describe("#getCrunchAmount", function() {
    beforeEach(async function() {
      tacoToken = tacoToken.connect(signer1);
    });

    it("returns 0 when the contract is paused", async function() {
      expect(await tacoToken.getCrunchAmount()).to.equal(0);
    });

    it("returns 0 when contract is unpaused but no time has passed", async function() {
      await tacoToken.connect(deployer).unpause();
      expect(await tacoToken.getCrunchAmount()).to.equal(0);
    });

    it("returns right amount when some time has passed since last crunch", async function() {
      await tacoToken.connect(deployer).unpause();
      await network.provider.send("evm_increaseTime", [300]);
      await network.provider.send("evm_mine");

      expect(await tacoToken.getCrunchAmount()).to.be.gt(0);
    });
  });
});
