// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Blacklistable Token
 * @dev Allows accounts to be blacklisted by owner
 */
abstract contract Blacklistable is Ownable {
    mapping(address => bool) _blacklist;

    event BlacklistUpdated(address indexed user, bool value);

    function blacklistUpdate(address user, bool value)
        public
        virtual
        onlyOwner
    {
        _blacklist[user] = value;
        emit BlacklistUpdated(user, value);
    }

    function isBlackListed(address user) public view returns (bool) {
        return _blacklist[user];
    }
}
