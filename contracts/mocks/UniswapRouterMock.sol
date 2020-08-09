// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

contract UniswapRouterMock {
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity) {
      return (amountTokenMin, amountETHMin, amountETHMin * 2);
    }
}
