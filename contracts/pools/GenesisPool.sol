// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "./core/StakeableTokenWrapper.sol";
import "../nfts/core/interfaces/IERC1155Tradable.sol";
import "./interfaces/IRedeemableStrategy.sol";
import "./interfaces/IStakeableStrategy.sol";

contract GenesisPool is StakeableTokenWrapper, Ownable {
  IERC1155Tradable public nftsContract;

  struct Staker {
    uint256 startTime;
    uint256 weightedBalance;
    uint256 lastUpdateTime;
    uint256 points;
  }

  struct NFT {
    address creatorAddress;
    address strategyAddress;
    uint256 costInPoints;
    uint8 percentCostOfUnderlying;
  }

  mapping(address => Staker) public stakers;
  mapping(uint256 => NFT) public nfts;

  uint256 public regularStakeSize = 10000;
  uint256 public maximumMultiples = 5;
  address public stakeableStrategyAddress;

  event NFTAdded(
    uint256 indexed nftId,
    uint256 costInPoints,
    uint8 percentCostOfUnderlying,
    address indexed creatorAddress,
    address indexed strategyAddress
  );
  event NFTCostUpdated(
    uint256 indexed nftId,
    uint256 previousCostInPoints,
    uint256 indexed newCostInPoints,
    uint8 previousPercentCostOfUnderlying,
    uint8 indexed newPercentCostOfUnderlying
  );
  event NFTStrategyUpdated(
    uint256 indexed nftId,
    address previousStrategyAddress,
    address indexed newStrategyAddress
  );
  event Staked(address indexed user, uint256 amount);
  event Withdrawn(address indexed user, uint256 amount);
  event Redeemed(address indexed user, uint256 amount);

  modifier updateReward(address account) {
    if (account != address(0)) {
      Staker storage staker = stakers[account];
      staker.points = earned(account);
      staker.weightedBalance = accumulatedWeightedBalance(account);
      staker.lastUpdateTime = now;
    }
    _;
  }

  constructor(
    address _nftsAddress,
    address _underlyingAddress,
    address _stakeableStrategyAddress
  )
    public
    Ownable()
    StakeableTokenWrapper(_underlyingAddress)
  {
    nftsContract = IERC1155Tradable(_nftsAddress);
    stakeableStrategyAddress = _stakeableStrategyAddress;
  }

  function setRegularStakeSize(uint256 _stakeSize) public onlyOwner {
    regularStakeSize = _stakeSize;
  }

  function setMaximumMultiples(uint256 _maxMultiples) public onlyOwner {
    maximumMultiples = _maxMultiples;
  }

  function setStakeableStrategyAddress(address _stakeableStrategyAddress) public onlyOwner {
    stakeableStrategyAddress = _stakeableStrategyAddress;
  }

  function addNFT(
    uint256 nftId,
    uint256 costInPoints,
    uint8 percentCost,
    address creator,
    address strategy
  ) public onlyOwner {
    nfts[nftId] = NFT(creator, strategy, costInPoints, percentCost);
    emit NFTAdded(nftId, costInPoints, percentCost, creator, strategy);
  }

  function updateNFTCost(
    uint256 nftId,
    uint256 costInPoints,
    uint8 percentCost
  ) public onlyOwner {
    NFT storage nft = nfts[nftId];
    require(nft.costInPoints != 0, "GenesisPool#updateNFTCost: NFT not found");

    emit NFTCostUpdated(
      nftId,
      nft.costInPoints,
      costInPoints,
      nft.percentCostOfUnderlying,
      percentCost
    );

    nft.costInPoints = costInPoints;
    nft.percentCostOfUnderlying = percentCost;
  }

  function updateNFTStrategy(uint256 nftId, address strategy) public onlyOwner {
    NFT storage nft = nfts[nftId];
    require(nft.costInPoints != 0, "GenesisPool#updateNFTStrategy: NFT not found");

    emit NFTStrategyUpdated(
      nftId,
      nft.strategyAddress,
      strategy
    );

    nft.strategyAddress = strategy;
  }

  function earned(address account) public view returns (uint256) {
    Staker storage staker = stakers[account];
    return
      staker.points.add(
        now.sub(staker.lastUpdateTime)
        .mul(1e18)
        .div(86400)
        .mul(balanceOf(account).div(1e8))
      );
  }

  function accumulatedWeightedBalance(address account) private view returns (uint256) {
    Staker storage staker = stakers[account];
    return staker.weightedBalance.add(
      balanceOf(account)
      .mul(now.sub(staker.lastUpdateTime))
    );
  }

  function weightedBalance(address account) public view returns (uint256) {
    Staker storage staker = stakers[account];
    return accumulatedWeightedBalance(account).div(now.sub(staker.startTime));
  }

  function stake(uint256 amount) public override updateReward(msg.sender) {
    require(
      amount.add(balanceOf(msg.sender)) <= regularStakeSize.mul(maximumMultiples).mul(underlying.decimals()),
      "Cannot stake more tokens"
    );
    require(
      stakeableStrategyAddress == address(0) ||
      IStakeableStrategy(stakeableStrategyAddress).canStake(msg.sender),
      "GenesisPool#stake: Sender doesn't meet the requirements to stake."
    );

    Staker storage staker = stakers[msg.sender];
    if (staker.startTime == 0) {
      staker.startTime = now;
      staker.weightedBalance = 0;
      staker.lastUpdateTime = now;
      staker.points = 0;
    }

    super.stake(amount);
    emit Staked(msg.sender, amount);
  }

  function withdraw(uint256 amount) public override updateReward(msg.sender) {
    require(amount > 0, "Cannot withdraw 0");

    super.withdraw(amount);
    emit Withdrawn(msg.sender, amount);
  }

  function exit() external {
    withdraw(balanceOf(msg.sender));
  }

  function percentageToRedeem(address account) public view returns (uint256) {
    return Math.max(1e18,
      weightedBalance(account)
      .mul(1e18)
      .div(regularStakeSize)
    );
  }

  function costToRedeem(uint256 nftId, address account) public view returns (uint256) {
    NFT storage nft = nfts[nftId];
    return weightedBalance(account)
      .mul(percentageToRedeem(account))
      .mul(nft.percentCostOfUnderlying)
      .div(1e18)
      .div(100);
  }

  function redeem(uint256 nftId) public updateReward(msg.sender) {
    Staker storage staker = stakers[msg.sender];
    NFT storage nft = nfts[nftId];

    require(nft.costInPoints != 0, "GenesisPool#redeem: NFT not found");
    require(staker.points >= nft.costInPoints, "GenesisPool#redeem: Not enough points to redeem for NFT");
    require(nftsContract.mintable(nftId), "GenesisPool#redeem: Max NFTs minted");
    require(
      nft.strategyAddress == address(0) ||
      IRedeemableStrategy(nft.strategyAddress).canRedeem(msg.sender),
      "GenesisPool#redeem: Sender doesn't meet the requirements to mint."
    );

    staker.points = staker.points.sub(nft.costInPoints);
    _withdrawTo(costToRedeem(nftId, msg.sender), nft.creatorAddress);

    nftsContract.mint(msg.sender, nftId, 1, "");
    emit Redeemed(msg.sender, nft.costInPoints);
  }
}
