import { ethers } from "@nomiclabs/buidler";
import { expect } from "chai";
import { Signer } from "ethers";

import { StakeableTokenWrapperFactory } from '../../../src/types/StakeableTokenWrapperFactory';
import { StakeableTokenWrapper } from '../../../src/types/StakeableTokenWrapper';

import { KarmaTokenMockFactory } from "../../../src/types/KarmaTokenMockFactory";

describe("StakeableTokenWrapper", function() {
  let deployer: Signer;
  let stakeableTokenWrapper: StakeableTokenWrapper;

  it("should deploy", async function () {
    [deployer] = await ethers.getSigners();

    const karmaTokenFactory = new KarmaTokenMockFactory(deployer);
    const karmaToken = await karmaTokenFactory.deploy();
    await karmaToken.deployed();

    stakeableTokenWrapper = await (new StakeableTokenWrapperFactory(deployer)).deploy(karmaToken.address);
  });
});