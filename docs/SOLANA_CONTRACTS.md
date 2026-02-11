# Solana Forge Token Contracts

## Overview

We've successfully compiled and deployed the same token contracts used on Cronos testnet to Solana using **Solang**. This provides a unified contract architecture across both chains.

## Deployed Contracts

### ForgeToken
- **Program ID**: `ANQMN8NJ388hRxBVgKb3gs6Vb86YiqBvweHM3SAK7RZe`
- **Network**: Solana Devnet
- **Binary**: `contracts/solana/ForgeToken.so` (147 KB)
- **Deployment Signature**: `3o3VPzPhwPWSXnJ29jKoiR5v6ZPyMPkRz6zkeNqXcbFQN`

**Features**:
- Token initialization with name, symbol, decimals, initial supply, and max supply
- Mint functionality (owner-only)
- Burn functionality (any account)
- Pause/Unpause functionality (owner-only)
- Transfer and approval (stub implementations for Solana compatibility)

**Key Functions**:
```solidity
initialize(name, symbol, initialSupply, maxSupply, decimals, owner)
mint(caller, to, amount)
burn(burner, amount)
pause(caller)
unpause(caller)
transfer(from, to, amount)
approve(spender, amount)
```

### TokenFactory
- **Program ID**: `Aji23AvyHMCwaqBheVckw6dhNVhBb8WVHbKVUw8JWvHd`
- **Network**: Solana Devnet
- **Binary**: `contracts/solana/TokenFactory.so` (131 KB)
- **Deployment Signature**: `27tovFhfGicqqt9hhwiN7TfDCpkDxU4BY2kcEL8tRBunk`

**Features**:
- Register tokens created via ForgeToken
- Track all deployed tokens
- Support up to 1000 tokens

**Key Functions**:
```solidity
registerToken(tokenAddress, name, symbol, creator)
getTokenCount() -> uint256
getTokenByIndex(index) -> address
```

## Solang vs. EVM Differences

The contracts were adapted from the original Solidity versions for Solana compatibility:

1. **No `msg.sender`**: Solana doesn't have `msg.sender`. Caller accounts are passed as `bytes32` parameters instead.
2. **Account Model**: Instead of contract storage, contracts use Solana's account-based storage model.
3. **Addresses as bytes32**: Solana addresses (public keys) are 32 bytes, so we use `bytes32` for accounts.
4. **No dynamic arrays**: Replaced with static arrays. TokenFactory tracks up to 1000 tokens.
5. **Modified events**: Event parameters use `bytes32` instead of `address` for account types.

## Frontend Integration

### SolanaForgeClient
Located at: `frontend/lib/solana-forge-client.ts`

**Usage**:
```typescript
import SolanaForgeClient from "@/lib/solana-forge-client";

const client = new SolanaForgeClient();
client.connectWallet(walletProvider);

const signature = await client.createToken({
  name: "MyToken",
  symbol: "MYT",
  initialSupply: BigInt(1000000),
  maxSupply: BigInt(0), // unlimited
  decimals: 9,
});

// Register in factory
await client.registerToken(tokenAddress, params);

// Mint tokens
await client.mintTokens(dataAccount, toAddress, BigInt(1000));
```

**Methods**:
- `connectWallet(provider)`: Connect Solana wallet
- `createToken(params)`: Create a new token via ForgeToken
- `registerToken(address, params)`: Register token in TokenFactory
- `mintTokens(dataAccount, to, amount)`: Mint new tokens

### UpdatedComponents
- `components/CreateTokenForm.tsx`: Updated to use `SolanaForgeClient`

## Instruction Encoding

All Solang contracts on Solana use 8-byte function selectors (Keccak256-based):

```
[8-byte selector][encoded parameters]
```

**Parameter Encoding**:
- **Strings**: 8-byte little-endian length + UTF-8 data
- **uint256**: 8-byte little-endian value
- **uint8**: 1-byte value
- **bytes32**: 32-byte raw value

## Compilation

Contracts were compiled with Solang:
```bash
solang compile --target solana ForgeToken.sol TokenFactory.sol -o .
```

This generates:
- `ForgeToken.so` - Compiled program
- `TokenFactory.so` - Compiled program
- `ForgeToken.json` - Contract ABI/metadata
- `TokenFactory.json` - Contract ABI/metadata

## Deployment

Programs were deployed to Solana devnet:
```bash
solana program deploy --url devnet ForgeToken.so
solana program deploy --url devnet TokenFactory.so
```

## Testing

To test the contracts:

1. Open the frontend UI at `http://localhost:3000`
2. Connect your Solana wallet (devnet)
3. Fill in token details and click "Create Token"
4. The frontend will:
   - Create a data account
   - Call the ForgeToken initialize function
   - Register the token in TokenFactory
   - Display transaction signature

## Advantages

✅ **Same contracts** across Cronos and Solana  
✅ **Unified codebase** - no duplicate implementations  
✅ **Proven logic** - uses tested Solidity implementations  
✅ **Solang support** - compiles from high-level Solidity  
✅ **Full feature set** - includes mint, burn, pause/unpause  

## Known Limitations

- **No contract state persistence** across calls - each instruction reads/writes account data
- **Fixed array sizes** - TokenFactory limited to 1000 tokens
- **Simplified token mechanics** - balances managed at account level in Solana
- **Owner model** - owner is set at initialization, no renounce ownership

## Next Steps

1. ✅ Deploy contracts to Solana
2. ✅ Create Solana client
3. ✅ Update frontend components
4. ⏳ End-to-end testing in production
5. ⏳ Consider adding token metadata/URI features
6. ⏳ Implement token transfer with SPL token standard

## Files

- `contracts/solana/ForgeToken.sol` - Token contract source
- `contracts/solana/TokenFactory.sol` - Factory contract source
- `contracts/solana/ForgeToken.so` - Compiled token binary
- `contracts/solana/TokenFactory.so` - Compiled factory binary
- `contracts/solana/ForgeToken.json` - Token contract metadata
- `contracts/solana/TokenFactory.json` - Factory contract metadata
- `frontend/lib/solana-forge-client.ts` - Frontend client library
- `frontend/components/CreateTokenForm.tsx` - Updated UI component
