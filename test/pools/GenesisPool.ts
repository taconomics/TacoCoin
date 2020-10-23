import { ethers } from "@nomiclabs/buidler";
import { expect } from "chai";
import { Signer } from "ethers";

import { StakeableTokenWrapperFactory } from '../../../src/types/StakeableTokenWrapperFactory';
import { StakeableTokenWrapper } from '../../../src/types/StakeableTokenWrapper';

import { KarmaTokenMockFactory } from "../../../src/types/KarmaTokenMockFactory";
import { KarmaTokenMock } from "../../../src/types/KarmaTokenMock";

describe("StakeableTokenWrapper", function() {
  let deployer: Signer;
  let staker: Signer;
  let stakeableTokenWrapper: StakeableTokenWrapper;
  let underlyingToken: KarmaTokenMock;
});