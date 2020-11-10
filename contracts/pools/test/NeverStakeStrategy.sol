// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "../interfaces/IStakeableStrategy.sol";

contract NeverStakeStrategy is IStakeableStrategy {
  function canStake(address account) override external returns (bool) {
    return false;
  }
}