// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ForgeToken
 * @dev Custom ERC20 token with minting, burning, and pause capabilities
 */
contract ForgeToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable {
    // Maximum supply cap (optional)
    uint256 public maxSupply;
    
    // Token metadata
    string public tokenURI;
    
    // Custom decimals
    uint8 private _decimals;
    
    // Events
    event TokenCreated(
        string indexed name,
        string indexed symbol,
        uint8 decimals,
        uint256 initialSupply,
        address indexed owner
    );

    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    /**
     * @dev Constructor to create a new token
     * @param name Token name
     * @param symbol Token symbol
     * @param initialSupply Initial supply amount (will be multiplied by 10^decimals)
     * @param _maxSupply Maximum supply cap (0 for unlimited)
     * @param _tokenDecimals Number of decimals for the token
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 _maxSupply,
        uint8 _tokenDecimals
    ) ERC20(name, symbol) {
        require(initialSupply > 0, "Initial supply must be greater than 0");
        require(_tokenDecimals <= 18, "Decimals must be 18 or less");
        
        _decimals = _tokenDecimals;
        maxSupply = _maxSupply;
        uint256 initialAmount = initialSupply * 10 ** _decimals;
        
        // Mint initial supply to creator
        _mint(msg.sender, initialAmount);

        emit TokenCreated(
            name,
            symbol,
            _decimals,
            initialAmount,
            msg.sender
        );
    }

    /**
     * @dev Mint new tokens (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        
        if (maxSupply > 0) {
            require(
                totalSupply() + amount <= maxSupply,
                "Exceeds max supply"
            );
        }

        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Burn tokens
     * @param amount Amount to burn
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @dev Pause token transfers (only owner)
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause token transfers (only owner)
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Set token URI for metadata
     * @param _tokenURI New token URI
     */
    function setTokenURI(string memory _tokenURI) public onlyOwner {
        tokenURI = _tokenURI;
    }

    /**
     * @dev Get remaining mintable amount (if max supply is set)
     */
    function remainingSupply() public view returns (uint256) {
        if (maxSupply == 0) return type(uint256).max;
        uint256 remaining = maxSupply > totalSupply()
            ? maxSupply - totalSupply()
            : 0;
        return remaining;
    }

    /**
     * @dev Override decimals function
     */
    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    // Required overrides for ERC20 extensions
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Pausable) whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}
