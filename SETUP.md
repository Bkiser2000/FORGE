# FORGE Configuration & Setup Guide

## Environment Setup

### Frontend Configuration

1. **Create `.env.local` in `frontend/` directory:**

```bash
# RPC Endpoints
NEXT_PUBLIC_CRONOS_RPC=https://evm-t3.cronos.org
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com

# Contract Addresses (set after deployment)
NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS=0x...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=FORGE
```

### Solana Contract Configuration

1. **Update `contracts/solana/Anchor.toml`:**
   - Replace `ForgeYourTokenProgramId11111111` with your program ID after deployment
   - Set appropriate RPC endpoints

### Cronos Contract Configuration

1. **Create `contracts/cronos/.env`:**

```bash
# Network RPC URLs
CRONOS_TESTNET_RPC=https://evm-t3.cronos.org
CRONOS_MAINNET_RPC=https://evm.cronos.org

# Deployment Account (Keep Secure!)
PRIVATE_KEY=your_private_key_here_without_0x

# Block Explorer (for contract verification)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Installation Steps

### Step 1: Clone Repository
```bash
cd /mnt/Basefiles/Forge
git init
git add .
git commit -m "Initial FORGE commit"
```

### Step 2: Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Cronos Contracts
cd ../contracts/cronos
npm install

# Solana Contracts (requires Rust/Anchor)
cd ../solana
cargo build
```

### Step 3: Configure Wallets

#### MetaMask (For Cronos)
1. Install MetaMask browser extension
2. Add Cronos networks:
   - **Testnet**:
     - RPC URL: https://evm-t3.cronos.org
     - Chain ID: 338
     - Currency: TCRO
   - **Mainnet**:
     - RPC URL: https://evm.cronos.org
     - Chain ID: 25
     - Currency: CRO

#### Phantom (For Solana)
1. Install Phantom wallet browser extension
2. Create or import account
3. Switch to Devnet for testing

### Step 4: Deploy Contracts

#### Deploy to Cronos Testnet

```bash
cd contracts/cronos

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to testnet
npm run deploy:devnet
```

#### Deploy to Solana Devnet

```bash
cd contracts/solana

# Build program
anchor build

# Deploy
anchor deploy --provider.cluster devnet
```

### Step 5: Update Contract Addresses

After deployment, update these files with your deployed addresses:

**Frontend** - `frontend/.env.local`:
```
NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS=<TokenFactory address from Cronos deployment>
```

**Solana** - `contracts/solana/Anchor.toml`:
```
[programs.devnet]
forge_solana = "<Your Program ID>"
```

### Step 6: Run Frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` 🎉

## Development Workflow

### Making Changes to Smart Contracts

1. **Cronos**:
   ```bash
   cd contracts/cronos
   # Edit contracts
   npm run compile
   npm test
   npm run deploy:devnet
   ```

2. **Solana**:
   ```bash
   cd contracts/solana
   # Edit lib.rs
   cargo build
   anchor test
   anchor deploy --provider.cluster devnet
   ```

### Making Changes to Frontend

1. Changes in `frontend/` are hot-reloaded automatically
2. Restart dev server if environment variables change
3. Test in different browsers and screen sizes

## Testing

### Test Cronos Contracts
```bash
cd contracts/cronos
npm test
```

### Test Frontend
```bash
cd frontend
npm test
npm run test:watch
```

### Integration Testing
1. Deploy contracts to testnet
2. Update frontend .env with addresses
3. Run frontend locally
4. Test full flow: connect wallet → create token → view in dashboard

## Troubleshooting

### Issue: "MetaMask not installed"
**Solution**: Install MetaMask extension from Chrome Web Store

### Issue: "Insufficient balance"
**Solution**: 
- For Cronos testnet: Get TCRO from faucet
- For Solana devnet: Run `solana airdrop 2 <address>`

### Issue: "Invalid contract address"
**Solution**: 
- Verify address in .env matches deployment output
- Check you're on correct network in wallet

### Issue: "Port 3000 already in use"
**Solution**: 
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Issue: "Module not found" errors
**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Security Checklist

Before deploying to Mainnet:

- [ ] Contracts audited by security firm
- [ ] All environment variables use production values
- [ ] Private keys are stored securely (never commit to git)
- [ ] Contract addresses are correct
- [ ] Frontend validates all inputs
- [ ] Rate limiting implemented
- [ ] Error handling is comprehensive

## Performance Optimization

### Frontend
- Images are optimized
- Code is split at route boundaries
- CSS is minified
- JavaScript is tree-shaken

### Smart Contracts
- Minimal storage usage
- Efficient algorithms
- Gas-optimized functions

## Monitoring & Logging

### Frontend Logging
```typescript
// Development
console.log('Token created:', tokenAddress);

// Production (use service like Sentry)
import Sentry from "@sentry/nextjs";
Sentry.captureException(error);
```

### Contract Events
Monitor events for tracking:
- Cronos: Use ethers.js event listeners
- Solana: Use web3.js event subscription

## Maintenance

### Regular Tasks
- [ ] Update dependencies: `npm update`
- [ ] Check for security vulnerabilities: `npm audit`
- [ ] Review and update documentation
- [ ] Monitor contract events and transactions
- [ ] Check gas prices and optimize if needed

## Support & Documentation

- **General Issues**: See README.md
- **Quick Start**: See docs/QUICKSTART.md
- **Contract Details**: See docs/CONTRACTS.md
- **Frontend Development**: See docs/FRONTEND.md

## Next Steps

1. ✅ Complete installation
2. ✅ Deploy to testnet
3. ✅ Test full workflow
4. ✅ Get community feedback
5. ✅ Audit contracts
6. ⬜ Deploy to mainnet
7. ⬜ Launch publicly
8. ⬜ Add additional features

---

**Questions?** Check the docs or reach out to the development team!
