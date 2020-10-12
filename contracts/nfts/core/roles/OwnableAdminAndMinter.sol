// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract OwnableAdminAndMinter is Ownable, AccessControl {
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  
  constructor() internal Ownable() {
    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    _setupRole(MINTER_ROLE, _msgSender());
  }

  modifier onlyAdmin() {
    require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Roles: caller does not have the Admin role");
    _;
  }

  modifier onlyMinter() {
    require(hasRole(MINTER_ROLE, _msgSender()), "Roles: caller does not have the Minter role");
    _;
  }

  function revokeRole(bytes32 role, address account) public override {
    require(account != owner() || role != DEFAULT_ADMIN_ROLE, "Roles: owner cannot lose the Admin role");
    super.revokeRole(role, account);
  }

  function removeAdmin(address account) public {
    revokeRole(DEFAULT_ADMIN_ROLE, account);
  }

  function removeMinter(address account) public {
    revokeRole(MINTER_ROLE, account);
  }

  function addAdmin(address account) public {
    grantRole(DEFAULT_ADMIN_ROLE, account);
  }

  function addMinter(address account) public {
    grantRole(MINTER_ROLE, account);
  }
}
