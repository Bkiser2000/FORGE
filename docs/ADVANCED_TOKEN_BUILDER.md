# Advanced Token Builder - Implementation Guide

## Overview

The Advanced Token Builder allows users to create custom ERC-20 tokens on Cronos with modular features. This document outlines the architecture, components, and implementation details.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Frontend (Next.js)                              │
├─────────────────────────────────────────────────────────┤
│ AdvancedTokenForm.tsx                                   │
│  └─ User Configuration Interface                        │
│     └─ TokenConfig Parameters                           │
│        └─ Deployed via AdvancedTokenDeploymentClient    │
└─────────────────────────────────────────────────────────┘
         │
         │ Compiles & Deploys
         ▼
┌─────────────────────────────────────────────────────────┐
│         Hardhat/Compiler Service                        │
├─────────────────────────────────────────────────────────┤
│ Compiles CustomToken.sol with user configuration       │
│ Generates bytecode and ABI                              │
│ Returns deployment-ready contract data                 │
└─────────────────────────────────────────────────────────┘
         │
         │ Deploys to Cronos
         ▼
┌─────────────────────────────────────────────────────────┐
│         Cronos Testnet (EVM)                            │
├─────────────────────────────────────────────────────────┤
│ CustomToken Contract Instance                           │
│  └─ Unique address for each deployed token             │
│     └─ Available on blockchain immediately             │
└─────────────────────────────────────────────────────────┘
```

## Components

### 1. AdvancedTokenForm.tsx

**Location:** `frontend/components/AdvancedTokenForm.tsx`

**Purpose:** User interface for token customization

**Key Features:**
- Token basic information (name, symbol, supply, decimals)
- Feature toggles:
  - ✓ Minting (owner-only)
  - ✓ Burning (token holders or burner role)
  - ✓ Pausable (freeze transfers)
  - ✓ Transfer Tax (configurable percentage)
  - ✓ Capped Supply (maximum tokens)
- Configuration preview dialog
- Input validation
- Error handling

**TokenConfig Interface:**
```typescript
interface TokenConfig {
  name: string;
  symbol: string;
  initialSupply: number;
  decimals: number;
  // Features
  mintingEnabled: boolean;
  burningEnabled: boolean;
  pausableEnabled: boolean;
  transferTaxEnabled: boolean;
  transferTaxPercentage: number;
  cappedSupplyEnabled: boolean;
  maxSupply: number;
}
```

### 2. CustomToken.sol

**Location:** `contracts/cronos/contracts/CustomToken.sol`

**Purpose:** Production-ready ERC-20 with modular features

**Constructor Parameters:**
```solidity
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
)
```

**Key Methods:**
- `mint(address to, uint256 amount)` - Create new tokens (if enabled)
- `burn(uint256 amount)` - Destroy tokens (if enabled)
- `burnFrom(address account, uint256 amount)` - Burn on behalf of holder
- `pause() / unpause()` - Freeze transfers (if enabled)
- `setTransferTax(uint256 percentage, address collector)` - Configure tax

**Tax System:**
- Tax stored as basis points (500 = 5%)
- Applied to all transfers
- Accumulated in treasury address

### 3. AdvancedTokenDeploymentClient

**Location:** `frontend/lib/advanced-token-client.ts`

**Purpose:** Handle contract compilation and deployment

**Key Methods:**
```typescript
// Deploy custom token
deployCustomToken(config: TokenConfig): Promise<string>

// Validate configuration
validateConfiguration(config: TokenConfig): void

// Prepare deployment parameters
prepareDeploymentParams(config: TokenConfig): any[]

// Estimate gas costs
estimateGas(config: TokenConfig): Promise<string>
```

## Implementation Steps

### Step 1: Hardhat Integration

Install Hardhat and configure for contract compilation:

```bash
cd contracts/cronos
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

Configure `hardhat.config.js`:
```javascript
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    cronosTestnet: {
      url: "https://evm-t3.cronos.org:8545",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
```

### Step 2: Contract Compilation Service

Create a backend service to compile and deploy:

```typescript
// lib/advanced-token-client.ts - Implementation

async deployCustomToken(config: TokenConfig): Promise<string> {
  // 1. Generate contract code from template
  const contractCode = this.generateContractCode(config);
  
  // 2. Write to temporary file
  // 3. Compile with Hardhat
  // 4. Get bytecode and ABI
  // 5. Deploy via ethers.js
  // 6. Return address
}
```

### Step 3: Frontend Integration

Update `AdvancedTokenForm.tsx` to call deployment client:

```typescript
const handleCreateToken = async () => {
  const validationError = validateConfig();
  if (validationError) {
    setMessage({ type: 'error', text: validationError });
    return;
  }

  const provider = new BrowserProvider(metaMaskProvider);
  const signer = await provider.getSigner();
  
  const client = new AdvancedTokenDeploymentClient(provider, signer);
  
  try {
    const address = await client.deployCustomToken(config);
    setMessage({ 
      type: 'success', 
      text: `✓ Contract deployed at ${address}` 
    });
    onSuccess?.(address);
  } catch (err) {
    setMessage({ type: 'error', text: err.message });
  }
};
```

### Step 4: Transaction Monitoring

Implement transaction status tracking:

```typescript
interface DeploymentStatus {
  step: 'compiling' | 'deploying' | 'confirming' | 'complete';
  txHash?: string;
  blockNumber?: number;
  contractAddress?: string;
  estimatedTime?: number;
}
```

## Deployment Flow

```
User fills form
    ↓
Validates configuration
    ↓
Connects to wallet (MetaMask)
    ↓
Compiles contract with parameters
    ↓
Estimates gas cost
    ↓
Signs transaction
    ↓
Broadcasts to Cronos testnet
    ↓
Waits for confirmation
    ↓
Returns contract address
    ↓
Updates user dashboard
```

## Testing Checklist

### Unit Tests
- [ ] TokenConfig validation
- [ ] Parameter encoding
- [ ] Gas estimation

### Integration Tests
- [ ] Contract compilation with all feature combinations
- [ ] Deployment to testnet
- [ ] Mint/burn/pause/tax operations
- [ ] Transfer with tax calculation

### E2E Tests
- [ ] Complete user flow (form → deploy → verify)
- [ ] MetaMask connection
- [ ] Transaction confirmation
- [ ] Contract verification on block explorer

## Feature Combinations

The system supports $2^5 = 32$ unique feature combinations:

### Example: Full-Featured Token
```
- Minting: ✓
- Burning: ✓
- Pausable: ✓
- Transfer Tax: ✓ (2%)
- Capped Supply: ✓ (1M tokens)
```

Constructor Call:
```solidity
new CustomToken(
    "Full Featured Token",
    "FFT",
    1000000,    // 1M initial supply
    18,
    true,       // minting enabled
    true,       // burning enabled
    true,       // pausable enabled
    true,       // transfer tax enabled
    200,        // 2% tax (200 basis points)
    true,       // capped supply enabled
    1000000     // 1M max supply
)
```

## Gas Costs Estimation

Expected gas costs for different configurations:

| Configuration | Estimated Gas |
|---------------|--------------|
| Minimal (ERC-20 only) | 650,000 - 750,000 |
| Basic (+Minting) | 700,000 - 800,000 |
| Standard (+Tax) | 900,000 - 1,000,000 |
| Full-Featured | 1,100,000 - 1,200,000 |

*Note: Exact costs depend on Cronos network conditions*

## Error Handling

### Validation Errors
```typescript
- Invalid token name/symbol
- Decimals out of range (0-18)
- Supply validation (initial < max if capped)
- Tax percentage out of range (0-100)
```

### Deployment Errors
```typescript
- Insufficient balance for gas
- Network timeout
- Contract compilation failure
- Transaction rejected by user
```

### Post-Deployment
```typescript
- Contract verification on Cronoscan
- Function availability checks
- Owner/admin capabilities verification
```

## Security Considerations

1. **Owner Verification:** Contract deployer becomes owner
2. **Tax Collection:** Tax collected to configurable address
3. **Pausable Security:** Only owner can pause/unpause
4. **Minting Control:** Only owner can mint (if enabled)
5. **Permit Security:** Uses ERC-2612 for secure approvals

## Future Enhancements

1. **Templates:** Pre-configured templates for common use cases
2. **Batch Deployment:** Deploy multiple tokens in one transaction
3. **Proxy Pattern:** Upgradeable contracts
4. **Multi-chain:** Deploy to multiple EVM chains
5. **Role-Based Access:** Fine-grained permission control
6. **Governance:** DAO-controlled token parameters

## Reference

- **CustomToken.sol:** `/contracts/cronos/contracts/CustomToken.sol`
- **AdvancedTokenForm:** `/frontend/components/AdvancedTokenForm.tsx`
- **Deployment Client:** `/frontend/lib/advanced-token-client.ts`
- **OpenZeppelin Docs:** https://docs.openzeppelin.com/contracts/4.x/
- **Cronos Docs:** https://docs.cronos.org/

## Support

For issues or questions:
1. Check contract compilation errors in Hardhat output
2. Verify wallet connection and gas balance
3. Review Cronos testnet status
4. Check Cronoscan for contract verification
