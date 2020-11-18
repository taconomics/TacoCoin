import { ethers } from "@nomiclabs/buidler";
import { expect } from "chai";
import { Signer } from "ethers";

import { NftStakeablePoolFactory } from '../../../src/types/NftStakeablePoolFactory';
import { NftStakeablePool } from '../../../src/types/NftStakeablePool';

import { TaconomicsFactory } from '../../../src/types/TaconomicsFactory';
import { Taconomics } from '../../../src/types/Taconomics';

import { RedeemableNftFactory } from '../../../src/types/RedeemableNftFactory';
import { RedeemableNft } from '../../../src/types/RedeemableNft';

import { KarmaTokenMockFactory } from "../../../src/types/KarmaTokenMockFactory";
import { KarmaTokenMock } from "../../../src/types/KarmaTokenMock";

describe("NFTStakeablePool", function() {
  let deployer: Signer;
  let redeemer: Signer;
  let redeemableNFT: RedeemableNft;
  let taconomics: Taconomics;
});