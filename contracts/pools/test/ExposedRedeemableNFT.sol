// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "../core/RedeemableNFT.sol";

contract ExposedRedeemableNFT is RedeemableNFT {

  constructor(address _nftsAddress)
  public
  RedeemableNFT(_nftsAddress)
  {}

  function addNFT(
    uint256 nftId,
    uint256 pointsToRedeem,
    address strategy
  ) public {
    _addNFT(nftId, pointsToRedeem, strategy);
  }

  function updateNFTStrategy(uint256 nftId, address strategy) public {
    _updateNFTStrategy(nftId, strategy);
  }

  function redeem(uint256 nftId) public {
    _redeem(nftId);
  }

  function increasePoints(address account, uint256 pointsToAdd) public {
    _increasePoints(account, pointsToAdd);
  }
}