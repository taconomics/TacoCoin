// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./StakeableToken.sol";
import "./RedeemableNFT.sol";
import "../interfaces/IRedeemableStrategy.sol";

contract NFTStakeablePool is StakeableToken, RedeemableNFT, Ownable {
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
    Ownable()
  {
    poolName = _poolName;
  }

  function setMaximumStake(uint256 _stakeSize) public onlyOwner {
    maximumStake = _stakeSize;
  }

  function setStakeableStrategyAddress(address _stakeableStrategyAddress) public onlyOwner {
    _setStakeableStrategy(_stakeableStrategyAddress);
  }

  function _newlyEarnedPoints(address account) private view returns (uint256) {
    return now.sub(lastUpdateTime(account))
      .mul(1e18)
      .div(86400)
      .mul(balanceOf(account).div(1e8));
  }

  function earnedPoints(address account) public view returns (uint256) {
    return points[account].add(_newlyEarnedPoints(account));
  }

  function stake(uint256 amount) public updatePoints(msg.sender) {
    require(
      amount.add(balanceOf(msg.sender)) <= maximumStake,
      "Cannot stake more tokens"
    );

    _stake(amount);
  }

  function withdraw(uint256 amount) public updatePoints(msg.sender) {
    _withdraw(amount);
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

  function exit() external {
    withdraw(balanceOf(msg.sender));
  }

  function redeem(uint256 nftId) public updatePoints(msg.sender) {
    _redeem(nftId);
  }
}
