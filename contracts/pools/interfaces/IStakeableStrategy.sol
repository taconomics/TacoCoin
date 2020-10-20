// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

interface IStakeableStrategy {
  function canStake(address account) external returns (bool);
}
