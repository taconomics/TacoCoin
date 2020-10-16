// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract OwnableAndRoles is Ownable, AccessControl {
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");
  
  constructor() internal Ownable() {
    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    _setupRole(MINTER_ROLE, _msgSender());
    _setupRole(CREATOR_ROLE, _msgSender());
  }

  modifier onlyAdmin() {
    require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Roles: caller does not have the Admin role");
    _;
  }

  modifier onlyMinter() {
    require(hasRole(MINTER_ROLE, _msgSender()), "Roles: caller does not have the Minter role");
    _;
  }

  modifier onlyCreator() {
    require(hasRole(CREATOR_ROLE, _msgSender()), "Roles: caller does not have the Creator role");
    _;
  }

  function revokeRole(bytes32 role, address account) public override {
    require(
      role != DEFAULT_ADMIN_ROLE || account != owner(),
      "Roles: Owner cannot lose the admin role."
    );
    require(
      role != DEFAULT_ADMIN_ROLE || getRoleMemberCount(role) > 1,
      "Roles: There must always be at least 1 Admin."
    );
    super.revokeRole(role, account);
  }

  function removeAdmin(address account) public {
    revokeRole(DEFAULT_ADMIN_ROLE, account);
  }

  function removeMinter(address account) public {
    revokeRole(MINTER_ROLE, account);
  }

  function removeCreator(address account) public {
    revokeRole(CREATOR_ROLE, account);
  }

  function addAdmin(address account) public {
    grantRole(DEFAULT_ADMIN_ROLE, account);
  }

  function addMinter(address account) public {
    grantRole(MINTER_ROLE, account);
  }

  function addCreator(address account) public {
    grantRole(CREATOR_ROLE, account);
  }
}
