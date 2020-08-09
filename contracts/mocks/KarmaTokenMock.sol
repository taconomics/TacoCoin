// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "../core/DeflationaryERC20.sol";

contract KarmaTokenMock is DeflationaryERC20 {
    constructor() public DeflationaryERC20("Karma", "KARMA") {
        _mint(msg.sender, 100000000);
    }

    function setKarmaWhale(address whale) external {
        _balances[whale] = _balances[whale].add(50000000);
        emit Transfer(msg.sender, whale, 50000000);
    }

    function setKarmaMember(address member) external {
        _balances[member] = _balances[member].add(2000000);
        emit Transfer(msg.sender, member, 2000000);
    }

    function setKarmaHolderNotMember(address holder) external {
        _balances[holder] = _balances[holder].add(1999999);
        emit Transfer(msg.sender, holder, 1999999);
    }
}
