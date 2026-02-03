# FORGE Smart Contracts Documentation

## Overview

FORGE provides two smart contract implementations for token creation:
- **Solana**: Anchor program for SPL token creation
- **Cronos (EVM)**: Solidity contracts for ERC20 token creation

## Solana Contracts

### Program: forge_solana

#### Instructions

##### `create_token`
Creates a new SPL token with custom specifications.

**Parameters:**
- `name: String` - Token name (max 32 chars)
- `symbol: String` - Token symbol (max 10 chars)
- `decimals: u8` - Number of decimal places (0-9)
- `initial_supply: u64` - Initial token supply

**Example:**
```javascript
const tx = await program.methods
  .createToken("My Token", "MTK", 9, 1000000000)
  .accounts({
    payer: wallet.publicKey,
    tokenConfig: configAccount.publicKey,
    mint: mintAccount.publicKey,
    ownerTokenAccount: tokenAccount.publicKey,
    systemProgram: web3.SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    rent: web3.SYSVAR_RENT_PUBKEY,
  })
  .rpc();
```

##### `mint_tokens`
Mint additional tokens (owner only).

**Parameters:**
- `amount: u64` - Amount to mint

##### `burn_tokens`
Burn tokens from circulation (any holder).

**Parameters:**
- `amount: u64` - Amount to burn

### Events

- `TokenCreated` - Emitted when a token is created
- `TokensMinted` - Emitted when tokens are minted
- `TokensBurned` - Emitted when tokens are burned

### Errors

- `InvalidDecimals` - Decimals must be 0-9
- `NameTooLong` - Token name exceeds 32 characters
- `SymbolTooLong` - Token symbol exceeds 10 characters
- `Unauthorized` - Caller is not the token owner
- `Overflow` - Arithmetic overflow
- `Underflow` - Arithmetic underflow

## Cronos (EVM) Contracts

### ForgeToken.sol

ERC20 token implementation with advanced features.

#### Functions

##### `constructor`
```solidity
constructor(
  string memory name,
  string memory symbol,
  uint256 initialSupply,
  uint256 _maxSupply
)
```

Create a new token. Initial supply is automatically minted to the creator.

**Parameters:**
- `name` - Token name
- `symbol` - Token symbol
- `initialSupply` - Initial supply (will be multiplied by 10^decimals)
- `_maxSupply` - Maximum supply cap (0 for unlimited)

##### `mint(address to, uint256 amount)`
Mint new tokens (owner only).

**Requirements:**
- Caller must be owner
- Recipient cannot be zero address
- Amount must be greater than 0
- Cannot exceed max supply

##### `burn(uint256 amount)`
Burn tokens from caller's balance.

##### `pause()`
Pause all token transfers (owner only).

##### `unpause()`
Resume token transfers (owner only).

##### `remainingSupply()`
Get remaining mintable tokens.

**Returns:**
- `uint256` - Remaining supply until max, or max uint256 if unlimited

### TokenFactory.sol

Factory for creating multiple tokens.

#### Functions

##### `createToken`
```solidity
function createToken(
  string memory name,
  string memory symbol,
  uint256 initialSupply,
  uint256 maxSupply
) public returns (address)
```

Deploy a new token.

**Returns:**
- Address of created token

##### `getCreatorTokens(address creator)`
Get all tokens created by an address.

##### `getAllTokens()`
Get all deployed tokens.

## Deployment

### Cronos

```bash
cd contracts/cronos
npm install

# Set up environment
cp .env.example .env
# Edit .env with your private key

# Deploy to testnet
npm run deploy:devnet

# Deploy to mainnet
npm run deploy:mainnet
```

### Solana

```bash
cd contracts/solana
anchor build
anchor deploy
```

## Security Considerations

1. **Access Control**: Only token owner can mint additional tokens
2. **Supply Limits**: Optional maximum supply caps prevent unlimited inflation
3. **Pausable**: Tokens can be paused during emergencies
4. **Burnable**: Token holders can burn their own tokens
5. **Safe Math**: Uses Solidity 0.8+ built-in overflow/underflow checks

## Gas Optimization

- Token Factory uses minimal storage
- Token contracts implement efficient ERC20 pattern
- Batch operations supported where possible

## Testing

### Cronos

```bash
cd contracts/cronos
npm test
```

Tests cover:
- Token creation
- Minting and burning
- Pause/unpause functionality
- Supply limits
- Access control
