// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Blacklistable.sol";

contract TaxedToken is ERC20, Blacklistable {
    uint256 private _transferFeePercentage;
    uint256 private _burnPercentage;

    address private _fundAddress;

    constructor(
        uint256 transferFeePercentage_,
        uint256 burnPercentage_,
        address fundAddress_
    ) ERC20("Taxed Token", "TTC") {
        _transferFeePercentage = transferFeePercentage_;
        _burnPercentage = burnPercentage_;
        _fundAddress = fundAddress_;
        _mint(msg.sender, 100000000000 * 10**18);
    }

    function transferFeePercentage() public view returns (uint256) {
        return _transferFeePercentage;
    }

    function burnPercentage() public view returns (uint256) {
        return _burnPercentage;
    }

    function fundAddress() public view returns (address) {
        return _fundAddress;
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address recipient, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        uint256 fee = (amount * _transferFeePercentage) / 100;
        uint256 taxedValue = amount - fee;
        uint256 burnAmount = (fee * _burnPercentage) / 100;
        uint256 funds = fee - burnAmount;

        address owner = _msgSender();
        _transfer(owner, recipient, taxedValue);
        _burn(owner, burnAmount);
        _transfer(owner, _fundAddress, funds);

        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `amount`.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        uint256 fee = (amount * _transferFeePercentage) / 100;
        uint256 taxedValue = amount - fee;
        uint256 burnAmount = (fee * _burnPercentage) / 100;
        uint256 funds = fee - burnAmount;

        _transfer(from, to, taxedValue);
        _burn(from, burnAmount);
        _transfer(from, _fundAddress, funds);
        return true;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20) {
        require(
            !isBlackListed(to),
            "Token transfer refused. Receiver is on blacklist"
        );
        super._beforeTokenTransfer(from, to, amount);
    }
}
