// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title CustomToken
 * @dev A flexible ERC-20 token contract with optional features:
 * - Minting capability (if enabled)
 * - Burning capability (if enabled)
 * - Pausable transfers (if enabled)
 * - Transfer tax/fee mechanism (if enabled)
 * - Capped supply (if enabled)
 */
contract CustomToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ERC20Permit {
    // Feature flags
    bool public mintingEnabled;
    bool public burningEnabled;
    bool public pausableEnabled;
    bool public transferTaxEnabled;
    bool public cappedSupplyEnabled;

    // Configuration
    uint256 public maxSupply;
    uint256 public transferTaxPercentage; // In basis points (e.g., 500 = 5%)
    address public taxCollectorAddress;

    // Events
    event MintingToggled(bool enabled);
    event BurningToggled(bool enabled);
    event PausableToggled(bool enabled);
    event TransferTaxUpdated(uint256 newPercentage, address newCollector);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    modifier whenMintingEnabled() {
        require(mintingEnabled, "Minting is disabled");
        _;
    }

    modifier whenBurningEnabled() {
        require(burningEnabled, "Burning is disabled");
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 decimals,
        bool _mintingEnabled,
        bool _burningEnabled,
        bool _pausableEnabled,
        bool _transferTaxEnabled,
        uint256 _transferTaxPercentage,
        bool _cappedSupplyEnabled,
        uint256 _maxSupply
    ) ERC20(name, symbol) ERC20Permit(name) Ownable(msg.sender) {
        require(decimals <= 18, "Decimals too high");
        require(_transferTaxPercentage <= 10000, "Tax percentage too high");
        if (_cappedSupplyEnabled) {
            require(_maxSupply > 0, "Max supply must be greater than 0");
            require(initialSupply <= _maxSupply, "Initial supply exceeds max supply");
        }

        mintingEnabled = _mintingEnabled;
        burningEnabled = _burningEnabled;
        pausableEnabled = _pausableEnabled;
        transferTaxEnabled = _transferTaxEnabled;
        cappedSupplyEnabled = _cappedSupplyEnabled;
        transferTaxPercentage = _transferTaxPercentage;
        taxCollectorAddress = msg.sender;
        maxSupply = _maxSupply;

        // Adjust initial supply for decimals
        uint256 adjustedSupply = initialSupply * 10 ** decimals;
        _mint(msg.sender, adjustedSupply);
    }

    /**
     * @dev Mint new tokens (only if minting is enabled)
     */
    function mint(address to, uint256 amount) public onlyOwner whenMintingEnabled {
        if (cappedSupplyEnabled) {
            require(totalSupply() + amount <= maxSupply, "Exceeds max supply");
        }
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Override burn to enforce burningEnabled flag
     */
    function burn(uint256 amount) public override whenBurningEnabled {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @dev Override burnFrom to enforce burningEnabled flag
     */
    function burnFrom(address account, uint256 amount) public override whenBurningEnabled {
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount);
    }

    /**
     * @dev Pause token transfers (only if pausable is enabled)
     */
    function pause() public onlyOwner {
        require(pausableEnabled, "Pausing is not enabled");
        _pause();
    }

    /**
     * @dev Unpause token transfers
     */
    function unpause() public onlyOwner {
        require(pausableEnabled, "Pausing is not enabled");
        _unpause();
    }

    /**
     * @dev Update transfer tax percentage and collector
     */
    function setTransferTax(uint256 newPercentage, address newCollector) public onlyOwner {
        require(transferTaxEnabled, "Transfer tax is not enabled");
        require(newPercentage <= 10000, "Tax percentage too high");
        require(newCollector != address(0), "Invalid collector address");
        transferTaxPercentage = newPercentage;
        taxCollectorAddress = newCollector;
        emit TransferTaxUpdated(newPercentage, newCollector);
    }

    /**
     * @dev Override transfer to apply tax if enabled
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        uint256 taxAmount = _calculateTax(amount);
        if (taxAmount > 0) {
            super.transfer(taxCollectorAddress, taxAmount);
        }
        return super.transfer(to, amount - taxAmount);
    }

    /**
     * @dev Override transferFrom to apply tax if enabled
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        uint256 taxAmount = _calculateTax(amount);
        if (taxAmount > 0) {
            super.transferFrom(from, taxCollectorAddress, taxAmount);
        }
        return super.transferFrom(from, to, amount - taxAmount);
    }

    /**
     * @dev Calculate transfer tax
     */
    function _calculateTax(uint256 amount) internal view returns (uint256) {
        if (!transferTaxEnabled || transferTaxPercentage == 0) {
            return 0;
        }
        return (amount * transferTaxPercentage) / 10000;
    }

    /**
     * @dev Override _update to handle pausable
     */
    function _update(address from, address to, uint256 amount) internal override(ERC20, ERC20Pausable) whenNotPaused {
        super._update(from, to, amount);
    }

    /**
     * @dev Get token decimals
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
