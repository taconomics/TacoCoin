// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../../nfts/core/interfaces/IERC1155Tradable.sol";
import "../interfaces/IRedeemableStrategy.sol";

contract RedeemableNFT is Ownable {
  using SafeMath for uint256;

  struct NFT {
    IRedeemableStrategy strategy;
    uint256 pointsToRedeem;
  }

  IERC1155Tradable public nftsContract;
  mapping(uint256 => NFT) public nfts;
  mapping(address => uint256) public points;

  constructor(address _nftsAddress) public Ownable() {
    nftsContract = IERC1155Tradable(_nftsAddress);
  }

  event NFTAdded(
    uint256 indexed nftId,
    uint256 indexed pointsToRedeem,
    address indexed strategyAddress
  );

  event NFTStrategyUpdated(
    uint256 indexed nftId,
    address indexed previousStrategyAddress,
    address indexed newStrategyAddress
  );

  function addNFT(
    uint256 nftId,
    uint256 pointsToRedeem,
    address strategy
  ) public onlyOwner {
    nfts[nftId] = NFT(IRedeemableStrategy(strategy), pointsToRedeem);
    emit NFTAdded(nftId, pointsToRedeem, strategy);
  }

  function updateNFTStrategy(uint256 nftId, address strategy) public onlyOwner {
    NFT storage nft = nfts[nftId];
    require(nft.pointsToRedeem != 0, "RedeemableNFT#updateNFTStrategy: NFT not found");

    nft.strategy = IRedeemableStrategy(strategy);

    emit NFTStrategyUpdated(
      nftId,
      address(nft.strategy),
      strategy
    );
  }

  function _increasePoints(address account, uint256 pointsToAdd) internal {
    points[account] = points[account].add(pointsToAdd);
  }

  function _redeem(uint256 nftId) internal {
    NFT storage nft = nfts[nftId];

    require(nft.pointsToRedeem != 0, "RedeemableNFT#_redeem: NFT not found");
    require(points[msg.sender] >= nft.pointsToRedeem, "RedeemableNFT#_redeem: Not enough points to redeem for NFT");
    require(nftsContract.mintable(nftId), "RedeemableNFT#_redeem: Max NFTs minted");
    require(
      address(nft.strategy) == address(0) || nft.strategy.canRedeem(msg.sender, nftId),
      "RedeemableNFT#_redeem: Sender doesn't meet the requirements to mint."
    );

    points[msg.sender] = points[msg.sender].sub(nft.pointsToRedeem);
    nftsContract.mint(msg.sender, nftId, 1, "");
  }

}
