// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "../interfaces/token/IERC20.sol";
import "../interfaces/IStakeableStrategy.sol";

contract StakeableToken {
  using SafeMath for uint256;
  IERC20 public underlying;

  uint256 private _totalSupply;
  mapping(address => uint256) private _balances;
  mapping(address => uint256) private _lastUpdateTime;
  address[] public stakers;
  IStakeableStrategy public stakeableStrategy;

  event StakedTokens(address indexed user, uint256 amount);
  event WithdrawnTokens(address indexed user, uint256 amount);
  event StakeableStrategyUpdated(
    address indexed previousStakeableStrategy,
    address indexed newStakeableStrategy
  );

  constructor(address _underlyingAddress, address _stakeableStrategyAddress) internal {
    underlying = IERC20(_underlyingAddress);
    stakeableStrategy = IStakeableStrategy(_stakeableStrategyAddress);
  }

  modifier updateLastUpdateTime(address account) {
    if (account != address(0)) {
      _lastUpdateTime[account] = now;
    }
    _;
  }

  function totalSupply() public view returns (uint256) {
    return _totalSupply;
  }

  function balanceOf(address account) public view returns (uint256) {
    return _balances[account];
  }

  function getStakers() public view returns(address[] memory) {
        return stakers;
    }

  function _stake(uint256 amount) internal updateLastUpdateTime(msg.sender) {
    require(
      address(stakeableStrategy) == address(0) || stakeableStrategy.canStake(msg.sender),
      "StakeableToken#_stake: Sender doesn't meet the requirements to stake."
    );

    if (_balances[msg.sender] == 0) {
      stakers.push(msg.sender);
    }

    _totalSupply = _totalSupply.add(amount);
    _balances[msg.sender] = _balances[msg.sender].add(amount);
    underlying.transferFrom(msg.sender, address(this), amount);

    emit StakedTokens(msg.sender, amount);
  }

  function _withdraw(uint256 amount) internal {
    _withdrawTo(amount, msg.sender);
  }

  function _withdrawTo(uint256 amount, address _to) internal updateLastUpdateTime(msg.sender) {
    require(amount > 0, "Cannot withdraw 0");
    require(_balances[msg.sender] >= amount, "Cannot withdraw more than what's staked.");

    _totalSupply = _totalSupply.sub(amount);
    _balances[msg.sender] = _balances[msg.sender].sub(amount);
    underlying.transfer(_to, amount);

    emit WithdrawnTokens(msg.sender, amount);
  }

  function lastUpdateTime(address account) public view returns(uint256) {
    return _lastUpdateTime[account];
  }

  function _setStakeableStrategy(address _stakeableStrategyAddress) internal {
    emit StakeableStrategyUpdated(
      address(stakeableStrategy),
      _stakeableStrategyAddress
    );

    stakeableStrategy = IStakeableStrategy(_stakeableStrategyAddress);
  }
}
