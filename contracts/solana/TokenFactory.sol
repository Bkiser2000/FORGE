// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TokenFactory
 * @dev Factory contract for managing tokens on Solana via Solang
 */
contract TokenFactory {
    uint256 constant MAX_TOKENS = 1000;
    
    address[MAX_TOKENS] public deployedTokens;
    uint256 public tokenCount = 0;
    
    event TokenRegistered(
        address indexed tokenAddress,
        string name,
        string symbol,
        bytes32 indexed creator,
        uint256 tokenIndex
    );

    function getTokenCount() public view returns (uint256) {
        return tokenCount;
    }

    function getTokenByIndex(uint256 index) public view returns (address) {
        require(index < tokenCount, "Index out of bounds");
        return deployedTokens[index];
    }

    function registerToken(
        address tokenAddress,
        string memory name,
        string memory symbol,
        bytes32 creator
    ) public {
        require(tokenCount < MAX_TOKENS, "Token limit reached");
        require(tokenAddress != address(0), "Invalid token address");
        require(bytes(name).length > 0, "Name is required");
        require(bytes(symbol).length > 0, "Symbol is required");

        uint256 tokenIndex = tokenCount;
        deployedTokens[tokenIndex] = tokenAddress;
        tokenCount++;
        
        emit TokenRegistered(tokenAddress, name, symbol, creator, tokenIndex);
    }
}
