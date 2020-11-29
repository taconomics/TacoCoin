// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "../interfaces/IRedeemableStrategy.sol";

contract EvenRedeemStrategy is IRedeemableStrategy {
  function canRedeem(address account, uint256 nftId) override external returns (bool) {
    return nftId % 2 == 0;
  }
}