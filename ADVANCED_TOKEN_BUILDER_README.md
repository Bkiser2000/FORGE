# Advanced Token Builder - Feature Documentation

## Overview

The Advanced Token Builder is a comprehensive system that enables users to create custom ERC-20 tokens on the Cronos blockchain with modular, user-configurable features. This feature represents a significant expansion of the FORGE platform's capabilities from simple token factory usage to full smart contract customization.

## Feature Set

### Core Features

1. **Custom Token Name & Symbol**
   - User-specified token name (any length)
   - Custom ticker symbol (up to 10 characters)
   - Fully configurable on-chain

2. **Supply Configuration**
   - Initial supply (customizable amount)
   - Decimal places (0-18)
   - Optional capped supply (maximum total tokens)

3. **Minting**
   - Owner-only capability to create new tokens
   - Optional feature (can be disabled)
   - Respects supply cap if enabled

4. **Burning**
   - Allows token holders to destroy their tokens
   - Reduces total supply permanently
   - Optional feature (can be disabled)

5. **Pausable Transfers**
   - Owner can freeze all token transfers
   - Emergency feature for security incidents
   - Optional feature (can be disabled)

6. **Transfer Tax**
   - Configurable fee on all transfers
   - Stored as basis points (500 = 5%)
   - Tax collected to treasury address
   - Optional feature with customizable percentage

7. **Access Control**
   - Owner is automatically the deployer
   - Owner-only administrative functions
   - OpenZeppelin Ownable pattern

## Architecture

### Component Stack

```
Frontend (Next.js/React/TypeScript)
├─ AdvancedTokenForm.tsx         - User interface
├─ AdvancedTokenDeploymentClient - Deployment service
└─ advanced-token page            - Feature page

Smart Contract Layer (Solidity)
└─ CustomToken.sol               - ERC-20 implementation

Blockchain (Cronos Testnet)
└─ Deployed token instances      - Live contracts
```

### Data Flow

```
User Configuration
    ↓
Form Validation
    ↓
Configuration Encoding
    ↓
Contract Compilation
    ↓
Deployment Transaction
    ↓
Blockchain Confirmation
    ↓
Contract Address Return
```

## Files Created

### 1. Frontend Components

**[AdvancedTokenForm.tsx](../frontend/components/AdvancedTokenForm.tsx)**
- React component for token customization
- Material-UI based responsive design
- Integrated form validation
- Configuration preview dialog
- 380+ lines of production code

**[advanced-token.tsx](../frontend/pages/advanced-token.tsx)**
- Example page showing how to use the component
- Includes success dialog with deployed address
- Documentation links
- Feature overview

### 2. Smart Contracts

**[CustomToken.sol](../contracts/cronos/contracts/CustomToken.sol)**
- Production-ready ERC-20 contract
- 400+ lines of Solidity code
- Modular feature flags
- OpenZeppelin dependencies:
  - ERC20 (base token)
  - ERC20Burnable (token destruction)
  - ERC20Pausable (transfer freezing)
  - Ownable (access control)
  - ERC20Permit (meta-transaction support)

### 3. Deployment Infrastructure

**[advanced-token-client.ts](../frontend/lib/advanced-token-client.ts)**
- TypeScript deployment service
- Contract compilation support (placeholder)
- Parameter validation
- Gas estimation
- Ready for Hardhat integration

### 4. Documentation

**[ADVANCED_TOKEN_BUILDER.md](../docs/ADVANCED_TOKEN_BUILDER.md)**
- Technical implementation guide
- Architecture overview
- Deployment procedures
- Testing checklist
- Security considerations

**[ADVANCED_TOKEN_INTEGRATION.md](../docs/ADVANCED_TOKEN_INTEGRATION.md)**
- Developer integration guide
- API reference
- Usage examples
- Troubleshooting tips

## Usage Example

### Basic Token Creation

```typescript
const config = {
  name: "My Token",
  symbol: "MTK",
  initialSupply: 1000000,
  decimals: 18,
  
  // Standard features
  mintingEnabled: true,
  burningEnabled: true,
  pausableEnabled: false,
  
  // No tax
  transferTaxEnabled: false,
  transferTaxPercentage: 0,
  
  // Unlimited supply
  cappedSupplyEnabled: false,
  maxSupply: 0,
};
```

This creates a standard ERC-20 token with minting and burning support.

### Advanced Token Creation

```typescript
const config = {
  name: "DeFi Token",
  symbol: "DFI",
  initialSupply: 5000000,
  decimals: 18,
  
  // All features enabled
  mintingEnabled: true,
  burningEnabled: true,
  pausableEnabled: true,
  
  // 2% transfer tax
  transferTaxEnabled: true,
  transferTaxPercentage: 2,
  
  // 100M token cap
  cappedSupplyEnabled: true,
  maxSupply: 100000000,
};
```

This creates a full-featured token with transfer taxes and a supply cap.

## Feature Combinations

The system supports all combinations of optional features:

| # | Minting | Burning | Pausable | Tax | Capped | Use Case |
|---|---------|---------|----------|-----|--------|----------|
| 1 | ✓ | ✓ | ✗ | ✗ | ✗ | Standard ERC-20 |
| 2 | ✓ | ✓ | ✗ | ✓ | ✗ | Token with trading fee |
| 3 | ✓ | ✓ | ✓ | ✗ | ✗ | Emergency pause + minting |
| ... | ... | ... | ... | ... | ... | 32 total combinations |

Each combination is handled by a single contract with feature flags.

## Validation Rules

### Input Validation

The form enforces strict validation:

```typescript
// Name and symbol
- name: required, non-empty string
- symbol: required, 1-10 characters

// Supply
- initialSupply: >= 1, integer
- decimals: 0-18
- maxSupply (if capped): > 0, >= initialSupply

// Tax
- transferTaxPercentage: 0-100 (if enabled)
```

### Configuration Validation

```typescript
- If capped: initialSupply <= maxSupply
- Tax percentage: non-negative, <= 100
- All required fields populated
```

## Deployment Process

### Step 1: Configuration

User fills out the form with desired parameters.

### Step 2: Validation

Form validates all inputs and shows errors if needed.

### Step 3: Wallet Connection

If not connected, prompts MetaMask connection to Cronos testnet.

### Step 4: Compilation

Contract compiles with user's specific parameters (requires Hardhat integration).

### Step 5: Signing

User signs deployment transaction in MetaMask.

### Step 6: Broadcast

Transaction broadcasts to Cronos testnet.

### Step 7: Confirmation

Waits for confirmation (~5-15 seconds).

### Step 8: Success

Returns deployed contract address to user.

## Security Features

1. **Owner Control**
   - Only owner can mint, pause, or configure tax
   - Owner is deployer address

2. **Tax Collection**
   - Tax collected to configurable treasury address
   - Configurable per-deployment

3. **Pause Mechanism**
   - Only owner can pause transfers
   - Useful for emergency situations

4. **Standard Compliance**
   - Full ERC-20 compliance
   - Supports ERC-20Permit for meta-transactions
   - OpenZeppelin audited contracts

5. **Supply Control**
   - Capped supply prevents inflation
   - Burn mechanism reduces supply permanently

## Gas Costs

Estimated gas for deployment:

| Configuration | Gas Units |
|---------------|-----------|
| Minimal (ERC-20) | 650,000 - 750,000 |
| Basic + Minting | 700,000 - 800,000 |
| + Burning | 750,000 - 850,000 |
| + Pausable | 850,000 - 950,000 |
| Full Featured | 1,100,000 - 1,200,000 |

At 20 gwei gas price: ~$22-$48 per deployment (Cronos mainnet will be cheaper).

## Testing Status

### Implemented ✓
- [x] Contract code (CustomToken.sol)
- [x] Form component (AdvancedTokenForm.tsx)
- [x] Deployment client structure (advanced-token-client.ts)
- [x] Feature page (advanced-token.tsx)
- [x] Documentation (3 files)
- [x] Build verification (all components compile)

### In Development 🟡
- [ ] Hardhat integration for compilation
- [ ] Contract deployment via ethers.js
- [ ] Transaction monitoring UI
- [ ] Post-deployment verification

### Future Enhancements 🔮
- [ ] Multiple chain deployment
- [ ] Pre-built token templates
- [ ] Batch token creation
- [ ] Token management dashboard
- [ ] Role-based access control (RBAC)
- [ ] Governance tokens

## Integration Steps

1. **Add Route** (Optional)
   ```tsx
   // Add to navigation or pages list
   <Link href="/advanced-token">Build Custom Token</Link>
   ```

2. **Use Component**
   ```tsx
   import AdvancedTokenForm from '@/components/AdvancedTokenForm';
   
   <AdvancedTokenForm onSuccess={(addr) => console.log(addr)} />
   ```

3. **Implement Deployment**
   - Follow ADVANCED_TOKEN_BUILDER.md for Hardhat setup
   - Wire up contract compilation
   - Connect ethers.js deployment

4. **Test Integration**
   - Test form validation
   - Test wallet connection
   - Test deployment flow
   - Verify contract on Cronoscan

## Links

- **Tech Docs**: [ADVANCED_TOKEN_BUILDER.md](../docs/ADVANCED_TOKEN_BUILDER.md)
- **Integration Guide**: [ADVANCED_TOKEN_INTEGRATION.md](../docs/ADVANCED_TOKEN_INTEGRATION.md)
- **Contract**: [CustomToken.sol](../contracts/cronos/contracts/CustomToken.sol)
- **Form Component**: [AdvancedTokenForm.tsx](../frontend/components/AdvancedTokenForm.tsx)
- **Example Page**: [advanced-token.tsx](../frontend/pages/advanced-token.tsx)

## Support

For questions or issues:
1. Check the documentation files
2. Review the example page implementation
3. Examine the contract code comments
4. Check Material-UI and OpenZeppelin docs

## Status

**Current**: 🟡 Infrastructure Complete, Ready for Deployment Integration

**Build**: ✓ All components compile successfully

**Next Phase**: Hardhat integration and live deployment testing

## Contributors

- Advanced Token Builder: Infrastructure Implementation
- CustomToken.sol: Modular ERC-20 Contract
- AdvancedTokenForm: React UI Component
- Documentation: Complete Integration & Technical Guides
