// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./lib/ERC1155.sol";
import "./interfaces/IERC1155Tradable.sol";
import "./roles/OwnableAdminAndMinter.sol";

contract OwnableDelegateProxy {}

contract ProxyRegistry {
  mapping(address => OwnableDelegateProxy) public proxies;
}

/**
 * @title ERC1155Tradable
 * ERC1155Tradable - ERC1155 contract that whitelists an operator address, 
 * has create and mint functionality, and supports useful standards from OpenZeppelin,
  like _exists(), name(), symbol(), and totalSupply()
 */
contract ERC1155Tradable is ERC1155, IERC1155Tradable, OwnableAdminAndMinter {
  address proxyRegistryAddress;
  uint256 private _currentTokenID = 0;
  mapping(uint256 => address) public creators;
  mapping(uint256 => uint256) public tokenSupply;
  mapping(uint256 => uint256) public tokenMaxSupply;
  // Contract name
  string public name;
  // Contract symbol
  string public symbol;

  constructor(
    string memory _name,
    string memory _symbol,
    string memory _uri,
    address _proxyRegistryAddress
  )
    public
    OwnableAdminAndMinter()
    ERC1155(_uri)
  {
    name = _name;
    symbol = _symbol;
    proxyRegistryAddress = _proxyRegistryAddress;
  }

  function uri(uint256 _id) public view override returns (string memory) {
    require(_exists(_id), "ERC1155Tradable#uri: NONEXISTENT_TOKEN");
    return super.uri(_id);
  }

  /**
   * @dev Will update the base URL of token's URI
   * @param _newURI New base URL of token's URI
   */
  function setURI(string memory _newURI) public onlyAdmin {
    _setURI(_newURI);
  }

  /**
   * @dev Returns the total quantity for a token ID
   * @param _id uint256 ID of the token to query
   * @return amount of token in existence
   */
  function totalSupply(uint256 _id) public view override returns (uint256) {
    return tokenSupply[_id];
  }

  /**
   * @dev Returns the max quantity for a token ID
   * @param _id uint256 ID of the token to query
   * @return amount of token in existence
   */
  function maxSupply(uint256 _id) public view override returns (uint256) {
    return tokenMaxSupply[_id];
  }

  /**
   * @dev Creates a new token type and assigns _initialSupply to an address
   * @param _maxSupply max supply allowed
   * @param _initialSupply Optional amount to supply the first owner
   * @param _uri Optional URI for this token type
   * @param _data Optional data to pass if receiver is contract
   * @return tokenId The newly created token ID
   */
  function create(
    uint256 _maxSupply,
    uint256 _initialSupply,
    string calldata _uri,
    bytes calldata _data
  ) external override onlyAdmin returns (uint256 tokenId) {
    require(_initialSupply <= _maxSupply, "ERC1155Tradable#create: Initial supply cannot be more than max supply");
    uint256 _id = _getNextTokenID();
    _incrementTokenTypeId();
    creators[_id] = _msgSender();

    if (bytes(_uri).length > 0) {
      emit URI(_uri, _id);
    }

    if (_initialSupply != 0) _mint(_msgSender(), _id, _initialSupply, _data);
    tokenSupply[_id] = _initialSupply;
    tokenMaxSupply[_id] = _maxSupply;
    return _id;
  }

  /**
   * @dev Mints some amount of tokens to an address
   * @param _to          Address of the future owner of the token
   * @param _id          Token ID to mint
   * @param _quantity    Amount of tokens to mint
   * @param _data        Data to pass if receiver is contract
   */
  function mint(
    address _to,
    uint256 _id,
    uint256 _quantity,
    bytes calldata _data
  ) external override onlyMinter {
    uint256 tokenId = _id;
    require(tokenSupply[tokenId] < tokenMaxSupply[tokenId], "ERC1155Tradable#mint: Max supply reached");
    _mint(_to, _id, _quantity, _data);
    tokenSupply[_id] = tokenSupply[_id].add(_quantity);
  }

  /**
   * Override isApprovedForAll to whitelist user's OpenSea proxy accounts to enable gas-free listings.
   */
  function isApprovedForAll(address _owner, address _operator) public view override returns (bool isOperator) {
    // Whitelist OpenSea proxy contract for easy trading.
    ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);
    if (address(proxyRegistry.proxies(_owner)) == _operator) {
      return true;
    }

    return super.isApprovedForAll(_owner, _operator);
  }

  /**
   * @dev Returns whether the specified token exists by checking to see if it has a creator
   * @param _id uint256 ID of the token to query the existence of
   * @return bool whether the token exists
   */
  function _exists(uint256 _id) internal view returns (bool) {
    return creators[_id] != address(0);
  }

  /**
   * @dev calculates the next token ID based on value of _currentTokenID
   * @return uint256 for the next token ID
   */
  function _getNextTokenID() private view returns (uint256) {
    return _currentTokenID.add(1);
  }

  /**
   * @dev increments the value of _currentTokenID
   */
  function _incrementTokenTypeId() private {
    _currentTokenID++;
  }
}
