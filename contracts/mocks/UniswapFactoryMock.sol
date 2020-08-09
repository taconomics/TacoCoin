// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

contract UniswapFactoryMock {
  address public uniswapPool;

  constructor(address _uniswapPool) public {
    uniswapPool = _uniswapPool;
  }

  function createPair(address tokenA, address tokenB) external returns (address pair) {
    return uniswapPool;
  }
}
