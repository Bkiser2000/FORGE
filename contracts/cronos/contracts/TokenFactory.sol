// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ForgeToken.sol";

/**
 * @title TokenFactory
 * @dev Factory contract for creating custom tokens
 */
contract TokenFactory {
    // Track created tokens
    address[] public deployedTokens;
    mapping(address => address[]) public creatorTokens;
    
    // Events
    event TokenDeployed(
        address indexed tokenAddress,
        string name,
        string symbol,
        address indexed creator
    );

    /**
     * @dev Create a new token
     * @param name Token name
     * @param symbol Token symbol
     * @param initialSupply Initial supply
     * @param maxSupply Maximum supply (0 for unlimited)
     * @return newToken Address of created token
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 maxSupply
    ) public returns (address) {
        require(initialSupply > 0, "Initial supply must be greater than 0");
        require(bytes(name).length > 0, "Name is required");
        require(bytes(symbol).length > 0, "Symbol is required");

        ForgeToken newToken = new ForgeToken(
            name,
            symbol,
            initialSupply,
            maxSupply
        );

        address tokenAddress = address(newToken);
        deployedTokens.push(tokenAddress);
        creatorTokens[msg.sender].push(tokenAddress);

        emit TokenDeployed(tokenAddress, name, symbol, msg.sender);
        return tokenAddress;
    }

    /**
     * @dev Get all deployed tokens count
     */
    function getTokenCount() public view returns (uint256) {
        return deployedTokens.length;
    }

    /**
     * @dev Get tokens created by a specific address
     * @param creator Creator address
     */
    function getCreatorTokens(address creator)
        public
        view
        returns (address[] memory)
    {
        return creatorTokens[creator];
    }

    /**
     * @dev Get all deployed tokens
     */
    function getAllTokens() public view returns (address[] memory) {
        return deployedTokens;
    }
}
