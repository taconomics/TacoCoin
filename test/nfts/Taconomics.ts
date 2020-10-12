import { ethers } from "@nomiclabs/buidler";
import { expect } from "chai";

import { TaconomicsFactory } from '../../src/types/TaconomicsFactory';
import { Taconomics } from '../../src/types/Taconomics';
import { Signer } from "ethers";

describe("Taconomics", function() {
  let deployer: Signer;
  let minter: Signer;
  let admin: Signer;
  let user: Signer;

  let taconomics: Taconomics;

  beforeEach(async function () {
    [deployer, minter, admin, user] = await ethers.getSigners();
    taconomics = await (new TaconomicsFactory(deployer)).deploy(
      "0xa5409ec958c83c3f309868babaca7c86dcb077c1",
      "https://game.taconomics.io/tacos/",
      "https://game.taconomics.io/contract/taconomics-erc1155"
    );
    await taconomics.deployed();
  });

  describe("#addAdmin", function () {
    it("existing admin can add new admins", async function () {
      let adminAddress = await admin.getAddress();
      expect(await taconomics.hasRole(await taconomics.DEFAULT_ADMIN_ROLE(), adminAddress)).to.be.false;
      await taconomics.addAdmin(adminAddress);
      expect(await taconomics.hasRole(await taconomics.DEFAULT_ADMIN_ROLE(), adminAddress)).to.be.true;
    });

    it("non admin cannot add new admins", async function () {
      let adminAddress = await admin.getAddress();
      expect(await taconomics.hasRole(await taconomics.DEFAULT_ADMIN_ROLE(), adminAddress)).to.be.false;
      await expect(taconomics.connect(minter).addAdmin(adminAddress))
        .be.revertedWith("AccessControl: sender must be an admin to grant");
    });
  });

  describe("#removeAdmin", function () {
    it("owner cannot stop being admin", async function () {
      await expect(taconomics.removeAdmin(await deployer.getAddress()))
        .to.be.revertedWith("Roles: owner cannot lose the Admin role");
    });

    it("non owner admin can be removed", async function () {
      let adminAddress = await admin.getAddress();
      expect(await taconomics.hasRole(await taconomics.DEFAULT_ADMIN_ROLE(), adminAddress)).to.be.false;
      await taconomics.addAdmin(adminAddress);
      expect(await taconomics.hasRole(await taconomics.DEFAULT_ADMIN_ROLE(), adminAddress)).to.be.true;
      await taconomics.removeAdmin(adminAddress);
      expect(await taconomics.hasRole(await taconomics.DEFAULT_ADMIN_ROLE(), adminAddress)).to.be.false;
    });

    it("non admin cannot remove admin", async function () {
      let adminAddress = await admin.getAddress();
      expect(await taconomics.hasRole(await taconomics.DEFAULT_ADMIN_ROLE(), adminAddress)).to.be.false;
      await taconomics.addAdmin(adminAddress);
      expect(await taconomics.hasRole(await taconomics.DEFAULT_ADMIN_ROLE(), adminAddress)).to.be.true;
      await expect(taconomics.connect(minter).removeAdmin(adminAddress))
        .to.be.revertedWith("AccessControl: sender must be an admin to revoke");
      expect(await taconomics.hasRole(await taconomics.DEFAULT_ADMIN_ROLE(), adminAddress)).to.be.true;
    });
  });

  describe("#addMinter", function () {
    it("admin can add new minter", async function () {
      let minterAddress = await minter.getAddress();
      expect(await taconomics.hasRole(await taconomics.MINTER_ROLE(), minterAddress)).to.be.false;
      await taconomics.addMinter(minterAddress);
      expect(await taconomics.hasRole(await taconomics.MINTER_ROLE(), minterAddress)).to.be.true;
    });

    it("minter cannot add new minters", async function () {
      let minterAddress = await minter.getAddress();
      let userAddress = await user.getAddress();
      await taconomics.addMinter(minterAddress);
      expect(await taconomics.hasRole(await taconomics.MINTER_ROLE(), minterAddress)).to.be.true;
      await expect(taconomics.connect(minter).addMinter(userAddress))
        .be.revertedWith("AccessControl: sender must be an admin to grant");
    });
  });

  describe("#removeMinter", function () {
    let minterAddress: string;

    beforeEach(async function () {
      await taconomics.addMinter(await minter.getAddress());
      minterAddress = await minter.getAddress();
    });

    it("admin can remove minters", async function () {
      expect(await taconomics.hasRole(await taconomics.MINTER_ROLE(), minterAddress)).to.be.true;
      await taconomics.removeMinter(minterAddress);
      expect(await taconomics.hasRole(await taconomics.MINTER_ROLE(), minterAddress)).to.be.false;
    });

    it("non admin cannot remove minters", async function () {
      await expect(taconomics.connect(user).removeMinter(minterAddress))
        .to.be.revertedWith("AccessControl: sender must be an admin to revoke");
    });
  });

  describe("fullty setup", function () {
    beforeEach(async function () {
      await taconomics.addMinter(await minter.getAddress());
      await taconomics.addAdmin(await admin.getAddress());
    });

    // describe("setURI");
  
    describe("#create", function () {
      it("handles non existant tokens", async function () {
        expect(await taconomics.maxSupply(1)).to.eq(0);
        expect(await taconomics.tokenSupply(1)).to.eq(0);
        await expect(taconomics.uri(1)).to.be.revertedWith("ERC1155Tradable#uri: NONEXISTENT_TOKEN");
      });

      it("creates NFT with next id: 1", async function () {
        await taconomics.create(100, 0, []);
        expect(await taconomics.maxSupply(1)).to.eq(100);
        expect(await taconomics.tokenSupply(1)).to.eq(0);
        expect(await taconomics.uri(1)).to.eq("https://game.taconomics.io/tacos/1");
        expect(await taconomics.maxSupply(2)).to.eq(0)
      });

      it("creates NFT with next id: 2", async function () {
        await taconomics.create(100, 0, []);
        expect(await taconomics.maxSupply(1)).to.eq(100);
        expect(await taconomics.tokenSupply(1)).to.eq(0);
        expect(await taconomics.uri(1)).to.eq("https://game.taconomics.io/tacos/1");
        expect(await taconomics.maxSupply(2)).to.eq(0)

        await taconomics.create(10, 0, []);
        expect(await taconomics.maxSupply(2)).to.eq(10)
        expect(await taconomics.tokenSupply(1)).to.eq(0);
        expect(await taconomics.uri(2)).to.eq("https://game.taconomics.io/tacos/2");
      });

      it("non-admins cannot create new NFTs", async function () {
        await expect(taconomics.connect(minter).create(100, 0 , []))
          .to.be.revertedWith("Roles: caller does not have the Admin role");
      });

      it("new admins can create new NFTs", async function () {
        await taconomics.connect(admin).create(100, 0, []);
        expect(await taconomics.maxSupply(1)).to.eq(100);
      });
    });

    describe("#mint and #mintable", function () {
      let deployerAddress: string;

      beforeEach(async function() {
        deployerAddress = await deployer.getAddress();
        await taconomics.create(1, 0, []);
      });

      it("returns true when token is still mintable", async function() {
        expect(await taconomics.mintable(1)).to.be.true;
      });

      it("can mint one token", async function () {
        await taconomics.mint(deployerAddress, 1, 1, []);
        expect(await taconomics.maxSupply(1)).to.eq(1);
        expect(await taconomics.tokenSupply(1)).to.eq(1);
        expect(await taconomics.balanceOf(deployerAddress, 1)).to.eq(1);
      });

      it("cannot mint more than one token", async function () {
        await taconomics.mint(deployerAddress, 1, 1, []);
        expect(await taconomics.mintable(1)).to.be.false;
        await expect(taconomics.mint(deployerAddress, 1, 1, []))
          .to.be.revertedWith("ERC1155Tradable#mint: Max supply reached");
      });

      it("non-minters cannot mint new NFTs", async function () {
        await expect(taconomics.connect(user).mint(deployerAddress, 1, 1, []))
          .to.be.revertedWith("Roles: caller does not have the Minter role");
      });

      it("new admins cannot mint new NFTs", async function () {
        await expect(taconomics.connect(admin).mint(deployerAddress, 1, 1, []))
          .to.be.revertedWith("Roles: caller does not have the Minter role");
      });

      it("new minter can mint new NFTs", async function () {
        await taconomics.connect(minter).mint(deployerAddress, 1, 1, []);
        expect(await taconomics.maxSupply(1)).to.eq(1);
        expect(await taconomics.tokenSupply(1)).to.eq(1);
        expect(await taconomics.balanceOf(deployerAddress, 1)).to.eq(1);
      });
    });
  });
});