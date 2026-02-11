# Integration Guide: Advanced Token Builder

## Quick Start

The Advanced Token Builder is now ready for integration into your application. Here's how to use it:

## Usage in Pages

### Import the Component

```typescript
import AdvancedTokenForm from '@/components/AdvancedTokenForm';
```

### Add to Your Page

```tsx
export default function AdvancedTokenPage() {
  return (
    <Box sx={{ py: 4 }}>
      <AdvancedTokenForm 
        onSuccess={(address) => {
          console.log('Token deployed at:', address);
          // Handle post-deployment
        }}
      />
    </Box>
  );
}
```

## Features Available

### Token Configuration

The form allows users to configure:

| Feature | Description | Default |
|---------|-------------|---------|
| **Name** | Token name (e.g., "My Token") | Required |
| **Symbol** | Token ticker (e.g., "MT") | Required (≤10 chars) |
| **Initial Supply** | Number of tokens to create | 1000 |
| **Decimals** | Decimal places (0-18) | 18 |
| **Minting** | Enable owner to create new tokens | Enabled |
| **Burning** | Enable token holders to burn tokens | Enabled |
| **Pausable** | Enable owner to freeze all transfers | Disabled |
| **Transfer Tax** | Apply fee to all transfers | Disabled |
| **Tax %** | Percentage taken from each transfer | 0% |
| **Capped Supply** | Limit maximum total supply | Disabled |
| **Max Supply** | Maximum tokens ever mintable | 0 |

## Component Structure

### AdvancedTokenForm.tsx
```
├─ User Input Section
│  ├─ Basic Information (name, symbol, supply, decimals)
│  └─ Features (toggles for optional capabilities)
├─ Configuration Summary
│  └─ Live preview of settings
├─ Preview Dialog
│  └─ Full constructor parameters
└─ Deploy Button
   └─ Triggers deployment process
```

### Data Flow
```
User fills form
    ↓
Validation checks
    ↓
Configuration Preview (optional)
    ↓
Deploy button click
    ↓
Connects to MetaMask (if not connected)
    ↓
Creates deployment client
    ↓
Compiles contract with parameters
    ↓
Signs transaction
    ↓
Deploys to Cronos testnet
    ↓
Returns contract address
    ↓
onSuccess callback
```

## API Reference

### TokenConfig Interface

```typescript
interface TokenConfig {
  // Basic Information
  name: string;                      // Token name
  symbol: string;                    // Token ticker
  initialSupply: number;             // Initial token count
  decimals: number;                  // Decimal places (0-18)
  
  // Feature Flags
  mintingEnabled: boolean;           // Allow new token creation
  burningEnabled: boolean;           // Allow token destruction
  pausableEnabled: boolean;          // Allow transfer freezing
  transferTaxEnabled: boolean;       // Enable transfer fee
  transferTaxPercentage: number;     // Fee percentage (0-100)
  cappedSupplyEnabled: boolean;      // Enable max supply limit
  maxSupply: number;                 // Maximum tokens allowed
}
```

### Form Props

```typescript
interface AdvancedTokenFormProps {
  // Optional callback when deployment succeeds
  onSuccess?: (contractAddress: string) => void;
}
```

## Example: Full-Featured Token

```typescript
const customConfig: TokenConfig = {
  name: "GameToken",
  symbol: "GAME",
  initialSupply: 1000000,
  decimals: 18,
  
  // Features
  mintingEnabled: true,              // Allow earning new tokens
  burningEnabled: true,              // Burn unwanted tokens
  pausableEnabled: true,             // Emergency stop transfers
  transferTaxEnabled: true,          // 5% fee on trades
  transferTaxPercentage: 5,
  cappedSupplyEnabled: true,         // Max 10M tokens
  maxSupply: 10000000,
};
```

This creates a token with:
- 1M initial supply
- Ability to mint more (up to 10M cap)
- Token burning support
- Emergency transfer pause
- 5% tax on all transfers

## Validation Rules

The form validates all inputs:

```typescript
// Name and symbol
✓ Name must be non-empty
✓ Symbol must be 1-10 characters

// Supply values
✓ Initial supply ≥ 1
✓ Initial supply ≤ max supply (if capped)

// Decimals
✓ Must be 0-18

// Tax percentage
✓ Must be 0-100 (if enabled)

// Supply cap
✓ Max supply > 0 (if enabled)
```

## Error Handling

The form displays clear error messages:

```
"Token name is required"
"Symbol must be 10 characters or less"
"Initial supply cannot exceed max supply"
"Transfer tax percentage cannot exceed 100%"
"Decimals must be between 0 and 18"
```

## State Management

The form uses React Context to access:
- Connected wallet address
- Wallet connection status

```typescript
const walletContext = useContext(WalletContext);
const { connectedWallet } = walletContext || {};
```

## Styling

The form uses Material-UI components:
- Responsive design (mobile-friendly)
- Matching app color scheme
- Dark/light mode support
- Accessible components

## Next Steps

1. **Add Route**: Create a page using this component
   ```typescript
   // pages/advanced-token.tsx
   import AdvancedTokenForm from '@/components/AdvancedTokenForm';
   
   export default function AdvancedTokenPage() {
     return <AdvancedTokenForm />;
   }
   ```

2. **Add Navigation**: Link from main navigation
   ```tsx
   <Link href="/advanced-token">
     Build Custom Token
   </Link>
   ```

3. **Implement Deployment**: Wire up Hardhat compilation
   - See `ADVANCED_TOKEN_BUILDER.md` for details

4. **Test Locally**: Verify all features work

5. **Deploy to Testnet**: Test with actual MetaMask

## Testing Checklist

- [ ] Form renders correctly
- [ ] All fields accept input
- [ ] Validation prevents invalid configs
- [ ] Preview dialog shows correct parameters
- [ ] Deploy button triggers deployment
- [ ] Success callback fires with address
- [ ] Error messages display properly
- [ ] Responsive on mobile

## Troubleshooting

**Form not rendering:**
- Verify component import path
- Check WalletContext is available
- Ensure Material-UI is installed

**Deploy button disabled:**
- Check if wallet is connected
- Verify no validation errors
- Look at browser console for details

**Deployment fails:**
- Check gas balance in MetaMask
- Verify Cronos testnet is selected
- Check network connection to testnet

## References

- [Advanced Token Builder Docs](./ADVANCED_TOKEN_BUILDER.md)
- [CustomToken.sol](../contracts/cronos/contracts/CustomToken.sol)
- [Deployment Client](../frontend/lib/advanced-token-client.ts)
- [Material-UI Docs](https://mui.com/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
