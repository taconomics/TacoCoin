// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/Math.sol";
import "../../util/TokenRecover.sol";
import "./StakeableToken.sol";
import "./RedeemableNFT.sol";
import "../interfaces/IRedeemableStrategy.sol";

contract NFTStakeablePool is StakeableToken, RedeemableNFT, TokenRecover {
  uint256 public maximumStake = 10000;
  string public poolName;

  modifier updatePoints(address account) {
    if (account != address(0)) {
      _increasePoints(account, _newlyEarnedPoints(account));
    }
    _;
  }

  constructor(
    string memory _poolName,
    address _nftsAddress,
    address _underlyingAddress,
    address _stakeableStrategyAddress
  )
    public
    RedeemableNFT(_nftsAddress)
    StakeableToken(_underlyingAddress, _stakeableStrategyAddress)
    TokenRecover()
  {
    poolName = _poolName;
    _denyToken(_underlyingAddress);
  }

  /**
   * Owner functions
   */

  function setMaximumStake(uint256 _stakeSize) public onlyOwner {
    maximumStake = _stakeSize;
  }

  function setStakeableStrategy(address _stakeableStrategy) public onlyOwner {
    _setStakeableStrategy(_stakeableStrategy);
  }

  function addNFT(
    uint256 nftId,
    uint256 pointsToRedeem,
    address strategy
  ) public onlyOwner {
    _addNFT(nftId, pointsToRedeem, strategy);
  }

  function updateNFTStrategy(uint256 nftId, address strategy) public onlyOwner {
    _updateNFTStrategy(nftId, strategy);
  }

  /**
   * Points calculations
   */

  function _newlyEarnedPoints(address account) private view returns (uint256) {
    // 1 point per day per staked token
    return now.sub(lastUpdateTime(account)) // Time since last update
      .mul(1e18) // how many points 
      .mul(balanceOf(account)) // per balance
      .div(86400) // per day
      .div(1e18); // normalize
  }

  function earnedPoints(address account) public view returns (uint256) {
    return points[account].add(_newlyEarnedPoints(account));
  }

  /**
   * Stakeable and Redeemable functions
   */

  function stake(uint256 amount) public updatePoints(msg.sender) {
    require(
      amount.add(balanceOf(msg.sender)) <= maximumStake.mul(1e18),
      "NFTStakeablePool#stake: Cannot stake more tokens"
    );

    _stake(amount);
  }

  function withdraw(uint256 amount) public updatePoints(msg.sender) {
    _withdraw(amount);
  }

  function exit() external {
    withdraw(balanceOf(msg.sender));
  }

  function redeem(uint256 nftId) public updatePoints(msg.sender) {
    _redeem(nftId);
  }
}
