// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

abstract contract IERC1155Tradable {
  function totalSupply(uint256 _id) public view virtual returns (uint256);

  function maxSupply(uint256 _id) public view virtual returns (uint256);

  function mintable(uint256 _id) public view returns (bool) {
    return totalSupply(_id) < maxSupply(_id);
  }

  function create(
    uint256 _maxSupply,
    uint256 _initialSupply,
    bytes calldata _data
  ) external virtual returns (uint256 tokenId);

  function mint(
    address _to,
    uint256 _id,
    uint256 _quantity,
    bytes calldata _data
  ) external virtual;

  function exists(uint256 _id) public view virtual returns (bool);
}
