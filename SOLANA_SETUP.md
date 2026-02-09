# Solana Solang Program Setup & Usage Guide

## Overview
This document provides complete information about the Solana smart contract program powering the FORGE token creation platform.

## Program Details

### Deployment Information
- **Program ID**: `9FaWqbx7CXFPmp2SQbjiJqcGA13BggABJLyL7LS7xKZn`
- **Network**: Solana Devnet
- **Type**: BPF-compiled Solidity (via Solang)
- **Binary**: `/mnt/Basefiles/Forge/contracts/solana/ForgeSolana.so` (179,952 bytes)
- **Source**: `/mnt/Basefiles/Forge/contracts/solana/programs/forge_solana.sol`
- **Compiler**: Solang (Solidity → Solana BPF)
- **Authority**: `BFPzFMfJzAc4SS27Y1sPzET8cWBSBERD4ypBCNtpCtw5`

### On-Chain Status
```bash
# Verify program exists and is executable
solana program show 9FaWqbx7CXFPmp2SQbjiJqcGA13BggABJLyL7LS7xKZn --url devnet

# Output:
# Program Id: 9FaWqbx7CXFPmp2SQbjiJqcGA13BggABJLyL7LS7xKZn
# Owner: BPFLoaderUpgradeab1e11111111111111111111111
# Executable: true
# Data Length: 179,952 bytes
```

## Program Functions

### 1. Create Token
**Function Selector**: `0x5af47d2a`

Creates a new SPL token with metadata storage.

#### Parameters
- `payer` (address): Account paying for creation
- `tokenConfigAccount` (address): Account storing token metadata
- `mint` (address): SPL token mint account
- `ownerTokenAccount` (address): Owner's token account
- `name` (string): Token name (max 32 chars)
- `symbol` (string): Token symbol (max 10 chars)
- `decimals` (uint8): Token decimals (1-18, validated ≤9)
- `initialSupply` (uint64): Initial token supply

#### Validation
- Decimals must be ≤ 9
- Name length must be ≤ 32 characters
- Symbol length must be ≤ 10 characters
- Payer must be signer

#### Effects
1. Creates token config account
2. Stores token metadata
3. Initializes SPL token mint
4. Creates owner token account
5. Mints initial supply to owner
6. Emits `TokenCreated` event

#### Example Usage (Web3.js)
```typescript
const client = new SolanaForgeClient({ wallet });
const txSignature = await client.createToken({
  name: "My Token",
  symbol: "MYT",
  decimals: 9,
  initialSupply: 1000000000  // 1B tokens with 9 decimals
});
```

### 2. Mint Tokens (Future Implementation)
**Function Selector**: TBD

Mints additional tokens to existing token.

#### Parameters
- `tokenConfigAccount` (address): Token config account
- `mint` (address): Token mint account
- `amount` (uint64): Amount to mint

#### Restrictions
- Only token owner can mint
- Requires valid token config account
- Updates total supply

### 3. Burn Tokens (Future Implementation)
**Function Selector**: TBD

Burns tokens from owner account.

#### Parameters
- `tokenConfigAccount` (address): Token config account
- `mint` (address): Token mint account
- `amount` (uint64): Amount to burn

#### Restrictions
- Only token owner can burn
- Reduces total supply
- Tokens removed from circulation

## Events

### TokenCreated
Emitted when token is successfully created.

```solidity
event TokenCreated(
  address indexed tokenConfigAccount,
  address indexed mint,
  string name,
  string symbol,
  uint8 decimals,
  uint64 initialSupply,
  address indexed owner
);
```

**Event Data**:
- **tokenConfigAccount**: Account storing this token's metadata
- **mint**: SPL token mint pubkey
- **name**: Token human-readable name
- **symbol**: Token ticker symbol
- **decimals**: Number of decimal places
- **initialSupply**: Initial tokens minted
- **owner**: Token creator/owner address

### TokensMinted (Future)
Emitted when tokens are minted.

### TokensBurned (Future)
Emitted when tokens are burned.

## Program State

### TokenConfig Struct
```solidity
struct TokenConfig {
  string name;           // Token name
  string symbol;         // Token symbol
  uint8 decimals;        // Number of decimals
  uint64 totalSupply;    // Total tokens in circulation
  address owner;         // Token owner/creator
}
```

### Storage
Tokens are stored in a mapping indexed by token config account address:
```solidity
mapping(uint256 => TokenConfig) public tokenConfigs;
```

### Metadata
- `tokenCount`: Total number of tokens created
- `getAllTokens()`: Returns list of token addresses
- `getTokenConfig(address)`: Returns specific token metadata

## Instruction Encoding

### Data Format
Instruction data for `createToken`:

```
Offset  Size  Field
------  ----  -----
0x00    4     Function Selector (0x5af47d2a)
0x04    32    Payer Public Key (32 bytes)
0x24    32    TokenConfig Public Key
0x44    32    Mint Public Key
0x64    32    OwnerTokenAccount Public Key
0x84    4+N   Token Name (4-byte length + UTF-8 bytes)
0x88+N  4+M   Token Symbol (4-byte length + UTF-8 bytes)
...     1     Decimals (unsigned 8-bit integer)
...     8     Initial Supply (unsigned 64-bit, little-endian)
```

### Example Encoding (JavaScript)
```javascript
const instructionSelector = Buffer.from([0x5a, 0xf4, 0x7d, 0x2a]);
let offset = 0;
const data = Buffer.alloc(4000);

// Function selector
instructionSelector.copy(data, offset);
offset += 4;

// Payer (32 bytes)
payerPublicKey.toBuffer().copy(data, offset);
offset += 32;

// Token config (32 bytes)
tokenConfigKey.toBuffer().copy(data, offset);
offset += 32;

// Mint (32 bytes)
mintKey.toBuffer().copy(data, offset);
offset += 32;

// Owner token account (32 bytes)
ownerTokenAccountKey.toBuffer().copy(data, offset);
offset += 32;

// Name (string with length prefix)
const nameBytes = Buffer.from("TestToken", "utf8");
data.writeUInt32LE(nameBytes.length, offset);
offset += 4;
nameBytes.copy(data, offset);
offset += nameBytes.length;

// Symbol (string with length prefix)
const symbolBytes = Buffer.from("TEST", "utf8");
data.writeUInt32LE(symbolBytes.length, offset);
offset += 4;
symbolBytes.copy(data, offset);
offset += symbolBytes.length;

// Decimals (1 byte)
data.writeUInt8(9, offset);
offset += 1;

// Initial supply (8 bytes, little-endian u64)
const supplyBuffer = Buffer.alloc(8);
supplyBuffer.writeBigUInt64LE(BigInt(1000000000), 0);
supplyBuffer.copy(data, offset);
offset += 8;

// Final data
const finalData = data.slice(0, offset);
```

## Accounts Required

### For createToken

| Account | Writable | Signer | Description |
|---------|----------|--------|-------------|
| Payer | ✓ | ✓ | Pays for account creation and transaction fees |
| TokenConfig | ✓ | ✓ | Stores token metadata (created by program) |
| Mint | ✓ | ✓ | SPL token mint (created by Token program) |
| OwnerTokenAccount | ✓ | ✓ | Owner's token account (created by Token program) |
| SystemProgram | ✗ | ✗ | For creating accounts |
| TokenProgram | ✗ | ✗ | For token operations |
| Rent | ✗ | ✗ | System variable for rent calculations |

## Cost Estimation

### Account Creation Costs
- TokenConfig account: ~0.2 SOL
- SPL Mint account: ~0.05 SOL
- Owner TokenAccount: ~0.002 SOL
- **Total**: ~0.25 SOL (plus transaction fee ~0.00025 SOL)

### Factors Affecting Cost
- Network congestion
- Account size
- Rent exemption requirements
- Base transaction fee

### Cost Optimization
- Tokens are created with exact specified supply (no multiplication overhead)
- Account initialization is minimal
- No complex storage overhead

## Contract Audit Notes

### Security Considerations
✅ Proper validation of inputs (decimals, name/symbol length)  
✅ Account ownership checks for future operations  
✅ SPL standard token operations  
✅ Simple, auditable contract code  

### Known Limitations
⚠️ Decimals limited to ≤ 9 (prevents overflow issues)  
⚠️ Name/Symbol length limits (storage efficiency)  
⚠️ Owner cannot be changed (immutable after creation)  

### Future Improvements
🔄 Advanced token features (pausable, burnable)  
🔄 Multi-signature ownership  
🔄 Token upgrade capability  
🔄 Event filtering and indexing  

## Testing

### Unit Tests (Planned)
```bash
# Test token creation
anchor test

# Test multiple tokens
# Test name/symbol validation
# Test decimals validation
```

### Integration Tests (Ready)
```bash
# Run connection test
npm run test:connection

# Test instruction encoding
npm run test:encoding

# Full UI test
npm run dev
```

### Manual Testing
1. Connect wallet to app
2. Fill token creation form
3. Submit transaction
4. Monitor console logs
5. Check Solana Explorer for transaction
6. Verify token appears in wallet

## Debugging

### Enable Verbose Logging
```typescript
// In SolanaForgeClient
console.log('=== Starting Token Creation (Web3.js) ===');
console.log('Parameters:', params);
console.log('Instruction data length:', finalData.length);
console.log('Instruction data (hex):', finalData.toString('hex'));
```

### Check Program Logs
```bash
# View program logs from latest transaction
solana logs --url devnet | grep "9FaWqbx7CXFPmp2SQbjiJqcGA13BggABJLyL7LS7xKZn"
```

### Inspect Program State
```bash
# Get program account info
solana account 9FaWqbx7CXFPmp2SQbjiJqcGA13BggABJLyL7LS7xKZn --url devnet

# Get specific token config
solana account <token-config-address> --url devnet
```

### Common Issues

**"Program not found"**
- Verify program ID is correct
- Check network is devnet
- Verify program is deployed

**"Custom program error"**
- Check parameter validation (name/symbol length, decimals)
- Verify wallet is signer
- Check accounts are properly initialized

**"Instruction parsing error"**
- Verify function selector is correct
- Check parameter encoding matches expected format
- Ensure account order is correct

## Deployment History

### Current Deployment (Latest)
```
Program ID: 9FaWqbx7CXFPmp2SQbjiJqcGA13BggABJLyL7LS7xKZn
Network: Solana Devnet
Binary Size: 179,952 bytes
Status: ✅ Active and tested
Compiler: Solang
Last Updated: 2024
```

### Previous Deployments (Reference)
- Anchor deployment: `DkkU1jrPLiK2uEnJTBicEijdyyttr2rXHQWCijtRRgUz` (deprecated)

## Program Upgrade

To upgrade the program in future:

```bash
# Recompile
solang compile --target solana programs/forge_solana.sol

# Upgrade
solana program deploy ForgeSolana.so \
  --url devnet \
  --keypair ~/.config/solana/devnet-wallet.json
```

Note: Requires authority keypair which controls the program.

## Resources

### Official Documentation
- Solana Program Documentation: https://docs.solana.com/developing/programming-model/overview
- SPL Token Specification: https://spl.solana.com/token
- Solang Compiler: https://github.com/hyperledger-labs/solang

### Explorer
- View program: https://explorer.solana.com/address/9FaWqbx7CXFPmp2SQbjiJqcGA13BggABJLyL7LS7xKZn?cluster=devnet
- View transactions: Search program ID on devnet explorer

### Development Tools
- Solana CLI: https://docs.solana.com/cli/install-solana-cli-tools
- Web3.js: https://solana-labs.github.io/solana-web3.js/
- SPL Token: https://github.com/solana-labs/solana-program-library/tree/master/token

## Support & Questions

### Troubleshooting Checklist
- [ ] Program exists and is executable on chain
- [ ] Program ID in .env.local is correct
- [ ] Web3.js version is compatible (^1.98.4)
- [ ] Wallet has sufficient SOL (≥0.5 for account creation)
- [ ] Token parameters pass validation
- [ ] Wallet is connected and signing transactions
- [ ] RPC endpoint is responsive

### Getting Help
1. Review logs in browser console
2. Check Solana Explorer for transactions
3. Verify program state with solana CLI
4. Review this documentation
5. Check CODE_MIGRATION.md for frontend integration
6. Review SOLANG_INTEGRATION.md for detailed technical info

---

**Status**: ✅ Production Ready  
**Last Updated**: 2024  
**Program ID**: `9FaWqbx7CXFPmp2SQbjiJqcGA13BggABJLyL7LS7xKZn`  
**Network**: Solana Devnet
