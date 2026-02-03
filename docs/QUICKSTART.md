# FORGE Quick Start Guide

## Prerequisites

- Node.js 16+
- Rust 1.56+ (for Solana)
- Git
- A code editor (VS Code recommended)

## Installation

### 1. Clone and Navigate

```bash
cd /mnt/Basefiles/Forge
```

### 2. Set Up Frontend

```bash
cd frontend
npm install
```

Create `.env.local`:
```
NEXT_PUBLIC_CRONOS_RPC=https://evm-t3.cronos.org
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Cronos Contracts

```bash
cd ../contracts/cronos
npm install
```

Create `.env`:
```
CRONOS_TESTNET_RPC=https://evm-t3.cronos.org
PRIVATE_KEY=your_private_key_here
```

### 4. Set Up Solana Contracts (Optional)

```bash
cd ../solana
# Requires Anchor and Rust installed
anchor build
```

## Running Locally

### Start Frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000`

### Deploy Contracts to Testnet

**Cronos:**
```bash
cd contracts/cronos
npm run deploy:devnet
```

**Solana:**
```bash
cd contracts/solana
anchor deploy --provider.cluster devnet
```

## Features Overview

### Creating a Token

1. Connect wallet (MetaMask for Cronos, Phantom for Solana)
2. Navigate to "Create Token"
3. Fill in token details:
   - Name (up to 32 characters)
   - Symbol (up to 10 characters)
   - Initial supply
   - Decimals (0-18)
   - Optional: Max supply cap
4. Review preview
5. Click "Create Token"

### Managing Tokens

1. Go to Dashboard
2. View all your created tokens
3. See token statistics
4. Access token details and mint/burn options

## Testing

### Test Cronos Contracts

```bash
cd contracts/cronos
npm test
```

Tests cover:
- Token creation
- Minting/burning
- Pause functionality
- Access control
- Supply limits

### Test Frontend

```bash
cd frontend
npm test
npm run test:watch
```

## Common Issues

### MetaMask Connection Issues
- Ensure MetaMask is installed
- Set correct network in MetaMask
- Clear browser cache and try again

### Transaction Failures
- Check gas balance in wallet
- Verify network RPC is correct
- Check contract address in environment variables

### Solana Wallet Issues
- Install Phantom wallet
- Create new account or import existing
- Ensure account has devnet SOL for testing

## Deployment

### Deploy to Mainnet

**Note:** Only deploy to mainnet when thoroughly tested!

```bash
# Cronos
cd contracts/cronos
npm run deploy:mainnet

# Solana
cd contracts/solana
anchor deploy --provider.cluster mainnet-beta
```

### Deploy Frontend

Recommended platforms:
- Vercel (easiest for Next.js)
- Netlify
- AWS Amplify
- Self-hosted VPS

## Next Steps

1. **Customize Branding** - Update logo, colors, and text
2. **Add More Features** - Token transfers, staking, governance
3. **Integrate Payments** - Accept payments for token creation
4. **Add Analytics** - Track token creation metrics
5. **Audit Security** - Have contracts audited before mainnet

## Resources

- [Solana Documentation](https://docs.solana.com)
- [Cronos Documentation](https://docs.cronos.org)
- [ethers.js Docs](https://docs.ethers.org)
- [Next.js Guide](https://nextjs.org/docs)
- [Anchor Book](https://book.anchor-lang.com)

## Support

For issues or questions:
1. Check documentation
2. Search GitHub issues
3. Ask in community forums
4. Contact development team
