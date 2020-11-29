// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./core/ERC1155Tradable.sol";

/**
 * @title Taconomics
 * Taconomics - Collect limited edition NFTs from Taconomics
 */
contract Taconomics is ERC1155Tradable {
  string public contractURI;

  constructor(
    address _proxyRegistryAddress,
    string memory _uri,
    string memory _contractURI
  )
    public
    ERC1155Tradable("Taconomics", "TACOS", _uri, _proxyRegistryAddress)
  {
    contractURI = _contractURI;
  }
}
