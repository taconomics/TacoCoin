// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

interface IRedeemableStrategy {
  function canRedeem(address account, uint256 nftId) external returns (bool);
}
