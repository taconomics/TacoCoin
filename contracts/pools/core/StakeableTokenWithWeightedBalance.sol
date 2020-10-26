// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./StakeableToken.sol";

contract StakeableTokenWithWeightedBalance is StakeableToken {
  mapping(address => uint256) public startTime;
  mapping(address => uint256) internal _weightedBalance;

  constructor(
    address _underlyingAddress,
    address _stakeableStrategyAddress
  )
    public
    StakeableToken(_underlyingAddress, _stakeableStrategyAddress)
  {}

  modifier updateWeightedBalance(address account) {
    if (account != address(0)) {
      _weightedBalance[account] = _accumulatedWeightedBalance(account);
    }
    _;
  }

  function weightedBalance(address account) public view returns (uint256) {
    return _accumulatedWeightedBalance(account).div(now.sub(startTime[account]));
  }

  function _accumulatedWeightedBalance(address account) private view returns (uint256) {
    return _weightedBalance[account].add(
      balanceOf(account)
      .mul(now.sub(lastUpdateTime(account)))
    );
  }

  function _stake(uint256 amount) internal override virtual updateWeightedBalance(msg.sender) {
    if (startTime[msg.sender] == 0) {
      startTime[msg.sender] = now;
    }

    super._stake(amount);
  }

  function _withdraw(uint256 amount) internal override virtual updateWeightedBalance(msg.sender) {
    super._withdraw(amount);
  }

  function _withdrawTo(
    uint256 amount,
    address _to
  ) internal override virtual updateWeightedBalance(msg.sender) {
    super._withdrawTo(amount, _to);
  }
}
