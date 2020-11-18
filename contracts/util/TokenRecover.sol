// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../pools/interfaces/token/IERC20.sol";

/**
 * @title TokenRecover
 * @author Vittorio Minacori (https://github.com/vittominacori)
 * @author Onchained
 * @dev Allow to recover non denied ERC20 or Ether sent into the contrat by error
 */
contract TokenRecover is Ownable {

  constructor() public Ownable() {}

  mapping(address => bool) public denyList;

  function _denyToken(address tokenAddress) internal {
    denyList[tokenAddress] = true;
  }

  /**
    * @dev Remember that only owner can call so be careful when use on contracts generated from other contracts.
    * @param tokenAddress The token contract address
    * @param tokenAmount Number of tokens to be sent
    */
  function recover(address tokenAddress, uint256 tokenAmount) public onlyOwner {
    require(!denyList[tokenAddress], "TokenRecover#recover: Cannot recover tokens from the denylist");

    if (tokenAddress == address(0)) {
      payable(owner()).transfer(tokenAmount);
    } else {
      IERC20(tokenAddress).transfer(owner(), tokenAmount);
    }
  }
}