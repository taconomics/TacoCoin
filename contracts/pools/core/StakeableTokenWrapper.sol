// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "../interfaces/token/IERC20.sol";

contract StakeableTokenWrapper {
  using SafeMath for uint256;
  IERC20 public underlying;

  constructor(address _underlyingAddress) public {
    underlying = IERC20(_underlyingAddress);
  }

  uint256 private _totalSupply;
  mapping(address => uint256) private _balances;

  function totalSupply() public view returns (uint256) {
    return _totalSupply;
  }

  function balanceOf(address account) public view returns (uint256) {
    return _balances[account];
  }

  function stake(uint256 amount) public virtual {
    _totalSupply = _totalSupply.add(amount);
    _balances[msg.sender] = _balances[msg.sender].add(amount);
    underlying.transferFrom(msg.sender, address(this), amount);
  }

  function withdraw(uint256 amount) public virtual {
    _withdrawTo(amount, msg.sender);
  }

  function _withdrawTo(uint256 amount, address _to) internal {
    require(_balances[msg.sender] >= amount, "Cannot withdraw more than what's staked.");
    _totalSupply = _totalSupply.sub(amount);
    _balances[msg.sender] = _balances[msg.sender].sub(amount);
    underlying.transfer(_to, amount);
  }
}
