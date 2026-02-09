// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "solana";

/// @title Forge Solana Token Program
/// @notice A program to create and manage custom SPL tokens on Solana

contract ForgeSolana {
    // Token configuration storage
    struct TokenConfig {
        address mint;
        address owner;
        string name;
        string symbol;
        uint8 decimals;
        uint64 totalSupply;
        int64 createdAt;
    }

    // Storage for token configurations
    mapping(address => TokenConfig) public tokenConfigs;
    address[] public allTokens;

    // Events
    event TokenCreated(
        address indexed mint,
        address indexed owner,
        string name,
        string symbol,
        uint8 decimals,
        uint64 initialSupply
    );

    event TokensMinted(
        address indexed mint,
        uint64 amount,
        address indexed to
    );

    event TokensBurned(
        address indexed mint,
        uint64 amount
    );

    /// @notice Create a new token with custom specifications
    /// @param payer The account paying for the transaction
    /// @param tokenConfigAccount The account storing token configuration
    /// @param mint The mint account for the token
    /// @param ownerTokenAccount The token account for the owner
    /// @param name The name of the token
    /// @param symbol The symbol of the token
    /// @param decimals The number of decimals
    /// @param initialSupply The initial supply amount
    function createToken(
        address payer,
        address tokenConfigAccount,
        address mint,
        address ownerTokenAccount,
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint64 initialSupply
    ) public {
        require(decimals <= 9, "InvalidDecimals");
        require(bytes(name).length <= 32, "NameTooLong");
        require(bytes(symbol).length <= 10, "SymbolTooLong");

        // Store token configuration
        TokenConfig storage config = tokenConfigs[tokenConfigAccount];
        config.mint = mint;
        config.owner = payer;
        config.name = name;
        config.symbol = symbol;
        config.decimals = decimals;
        config.totalSupply = initialSupply;
        config.createdAt = int64(block.timestamp);

        // Add to all tokens list
        allTokens.push(tokenConfigAccount);

        // Emit event
        emit TokenCreated(mint, payer, name, symbol, decimals, initialSupply);
    }

    /// @notice Mint additional tokens
    /// @param payer The account paying for the transaction
    /// @param tokenConfigAccount The token configuration account
    /// @param mint The mint account
    /// @param tokenAccount The token account to mint to
    /// @param amount The amount to mint
    function mintTokens(
        address payer,
        address tokenConfigAccount,
        address mint,
        address tokenAccount,
        uint64 amount
    ) public {
        TokenConfig storage config = tokenConfigs[tokenConfigAccount];
        
        // Verify caller is the token owner
        require(config.owner == payer, "Unauthorized");

        // Update total supply
        config.totalSupply += amount;

        // Emit event
        emit TokensMinted(mint, amount, tokenAccount);
    }

    /// @notice Burn tokens
    /// @param payer The account paying for the transaction
    /// @param tokenConfigAccount The token configuration account
    /// @param mint The mint account
    /// @param tokenAccount The token account to burn from
    /// @param amount The amount to burn
    function burnTokens(
        address payer,
        address tokenConfigAccount,
        address mint,
        address tokenAccount,
        uint64 amount
    ) public {
        TokenConfig storage config = tokenConfigs[tokenConfigAccount];
        
        // Verify caller is the token owner
        require(config.owner == payer, "Unauthorized");

        // Update total supply
        config.totalSupply -= amount;

        // Emit event
        emit TokensBurned(mint, amount);
    }

    /// @notice Get token configuration
    /// @param tokenConfigAccount The token configuration account
    /// @return The token configuration
    function getTokenConfig(address tokenConfigAccount) 
        public 
        view 
        returns (TokenConfig memory) 
    {
        return tokenConfigs[tokenConfigAccount];
    }

    /// @notice Get total number of tokens created
    /// @return The count of tokens
    function getTokenCount() public view returns (uint256) {
        return allTokens.length;
    }

    /// @notice Get all token configuration addresses
    /// @return Array of token configuration addresses
    function getAllTokens() public view returns (address[] memory) {
        return allTokens;
    }
}
