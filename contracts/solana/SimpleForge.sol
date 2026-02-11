// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleForge
 * @dev Minimal stateless token factory for Solana
 * This contract demonstrates token creation events without persistent state
 */
contract SimpleForge {
    event TokenCreated(
        bytes32 indexed creator,
        string name,
        string symbol,
        uint256 initialSupply,
        uint8 decimals
    );

    /**
     * @dev Create token (stateless - just emit event)
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint8 decimals
    ) public {
        require(bytes(name).length > 0, "Name required");
        require(bytes(symbol).length > 0, "Symbol required");
        require(initialSupply > 0, "Supply must be > 0");
        require(decimals <= 18, "Max 18 decimals");

        emit TokenCreated(
            bytes32(0), // In Solana, caller would be passed differently
            name,
            symbol,
            initialSupply,
            decimals
        );
    }

    /**
     * @dev Test function
     */
    function test() public pure returns (string memory) {
        return "SimpleForge on Solana";
    }
}
