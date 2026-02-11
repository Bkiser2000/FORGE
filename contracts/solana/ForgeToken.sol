// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ForgeToken
 * @dev Custom token with minting and burning for Solana via Solang
 */
contract ForgeToken {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    uint256 public maxSupply;
    bytes32 public owner;
    bool public paused = false;

    event Transfer(bytes32 indexed from, bytes32 indexed to, uint256 value);
    event Approval(bytes32 indexed owner, bytes32 indexed spender, uint256 value);
    event Burn(bytes32 indexed burner, uint256 value);
    event Mint(bytes32 indexed to, uint256 value);
    event Pause();
    event Unpause();

    function initialize(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        uint256 _maxSupply,
        uint8 _decimals,
        bytes32 _owner
    ) public {
        require(_initialSupply > 0, "Initial supply must be greater than 0");
        require(_decimals <= 18, "Decimals must be 18 or less");
        require(owner == bytes32(0), "Already initialized");

        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        maxSupply = _maxSupply;
        owner = _owner;
        totalSupply = _initialSupply;
    }

    modifier onlyOwner(bytes32 caller) {
        require(caller == owner, "Only owner can call this");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    function transfer(
        bytes32 from,
        bytes32 to,
        uint256 amount
    ) public whenNotPaused returns (bool) {
        require(to != bytes32(0), "Cannot transfer to zero address");
        emit Transfer(from, to, amount);
        return true;
    }

    function approve(bytes32 spender, uint256 amount) public returns (bool) {
        require(spender != bytes32(0), "Cannot approve zero address");
        emit Approval(bytes32(0), spender, amount);
        return true;
    }

    function mint(
        bytes32 caller,
        bytes32 to,
        uint256 amount
    ) public onlyOwner(caller) {
        require(to != bytes32(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");

        if (maxSupply > 0) {
            require(totalSupply + amount <= maxSupply, "Exceeds max supply");
        }

        totalSupply += amount;
        emit Mint(to, amount);
        emit Transfer(bytes32(0), to, amount);
    }

    function burn(bytes32 burner, uint256 amount) public returns (bool) {
        require(amount > 0, "Amount must be greater than 0");

        totalSupply -= amount;
        emit Burn(burner, amount);
        emit Transfer(burner, bytes32(0), amount);
        return true;
    }

    function pause(bytes32 caller) public onlyOwner(caller) {
        paused = true;
        emit Pause();
    }

    function unpause(bytes32 caller) public onlyOwner(caller) {
        paused = false;
        emit Unpause();
    }
}
