# FORGE - Multi-Chain Token Minting Platform

## 📋 Project Overview

FORGE is a comprehensive, user-friendly decentralized application (dApp) for creating and minting custom cryptocurrency tokens on both Solana and Cronos blockchain networks. The platform allows users to build tokens to their exact specifications with an intuitive interface.

## ✨ Key Features

### Smart Contract Features
- ✅ **Customizable Token Creation** - Name, symbol, supply, decimals, max supply
- ✅ **Multi-Chain Deployment** - Deploy on Solana (SPL) or Cronos (ERC20)
- ✅ **Token Management** - Mint, burn, pause functionality
- ✅ **Supply Control** - Optional max supply caps
- ✅ **Secure Access Control** - Owner-based permissions

### Frontend Features
- ✅ **Wallet Integration** - MetaMask (Cronos) and Phantom (Solana)
- ✅ **Token Creation Wizard** - Step-by-step guided interface
- ✅ **Dashboard** - Manage all created tokens
- ✅ **Real-time Preview** - See token details before creation
- ✅ **Activity Tracking** - Monitor token creation history
- ✅ **Multi-Chain Support** - Switch between networks easily

## 🏗️ Project Structure

```
Forge/
├── contracts/                  # Smart Contracts
│   ├── solana/                # Solana Anchor Programs
│   │   ├── Cargo.toml
│   │   ├── Anchor.toml
│   │   └── programs/
│   │       └── forge_solana/
│   │           └── src/lib.rs
│   │
│   └── cronos/                # Cronos EVM Contracts (Solidity)
│       ├── package.json
│       ├── hardhat.config.js
│       ├── contracts/
│       │   ├── ForgeToken.sol
│       │   └── TokenFactory.sol
│       ├── scripts/
│       │   └── deploy.js
│       └── test/
│           └── TokenFactory.test.js
│
├── frontend/                   # Next.js dApp Interface
│   ├── pages/
│   │   ├── index.tsx          # Home page
│   │   └── _app.tsx           # App wrapper
│   ├── components/
│   │   ├── Navbar.tsx         # Navigation
│   │   ├── HeroSection.tsx    # Landing hero
│   │   ├── TokenCreator.tsx   # Token creation form
│   │   └── Dashboard.tsx      # Token management
│   ├── lib/
│   │   └── contracts.ts       # Contract ABIs & configs
│   ├── utils/
│   │   └── validation.ts      # Form validation utilities
│   ├── hooks/
│   │   └── useWallet.ts       # Wallet interaction hooks
│   ├── styles/
│   │   └── globals.css        # Global styling
│   └── public/                # Static assets
│
├── docs/                       # Documentation
│   ├── CONTRACTS.md           # Contract documentation
│   ├── FRONTEND.md            # Frontend development guide
│   └── QUICKSTART.md          # Quick start guide
│
├── .gitignore
├── package.json               # Root workspace config
└── README.md
```

## 🚀 Quick Start

### Installation

```bash
# Navigate to project
cd /mnt/Basefiles/Forge

# Install frontend dependencies
cd frontend
npm install

# Install Cronos contract dependencies
cd ../contracts/cronos
npm install
```

### Running Locally

```bash
# Terminal 1 - Start frontend dev server
cd frontend
npm run dev
# Opens http://localhost:3000

# Terminal 2 - (Optional) Deploy contracts
cd contracts/cronos
npm run deploy:devnet
```

### Creating Your First Token

1. Visit `http://localhost:3000`
2. Click "Connect Wallet" → Select MetaMask or Phantom
3. Go to "Create Token"
4. Fill in token details:
   - Name: e.g., "My Awesome Token"
   - Symbol: e.g., "MAT"
   - Initial Supply: e.g., 1,000,000
   - Decimals: Choose 0-18 (default 18)
   - Max Supply: Optional cap (0 for unlimited)
5. Review the preview
6. Click "Create Token"
7. Confirm transaction in wallet
8. View your token in the Dashboard

## 🔗 Smart Contracts

### Solana (Anchor Framework)

**Location:** `contracts/solana/programs/forge_solana/src/lib.rs`

**Key Functions:**
- `create_token` - Create new SPL token with specifications
- `mint_tokens` - Mint additional tokens
- `burn_tokens` - Burn tokens from circulation

**Key Types:**
- `TokenConfig` - Stores token metadata
- `CreateToken` - Account context for token creation
- `MintTokens` - Account context for minting

### Cronos (Solidity)

**ForgeToken.sol** (`contracts/cronos/contracts/ForgeToken.sol`)
- ERC20 token with minting, burning, pause features
- Owner-based access control
- Optional max supply cap

**TokenFactory.sol** (`contracts/cronos/contracts/TokenFactory.sol`)
- Factory pattern for deploying new tokens
- Tracks all deployed tokens
- Maps tokens to creators

## 🎨 Frontend Components

### Pages
- **index.tsx** - Home with hero section and navigation
- **_app.tsx** - App wrapper with wallet context

### Components
1. **Navbar** - Top navigation with chain selector and wallet connect
2. **HeroSection** - Landing page with features and CTA
3. **TokenCreator** - Form for creating new tokens
4. **Dashboard** - Token management and viewing interface

### Styling
- Tailwind CSS with dark theme
- Gradient text effects
- Glass-morphism design
- Responsive mobile layout
- Custom animations

## 🔒 Security Features

✅ **Smart Contract Level:**
- Access control (owner-only functions)
- Safe integer arithmetic (Solidity 0.8+)
- Maximum supply enforcement
- Pausable token transfers

✅ **Frontend Level:**
- Input validation for all fields
- Wallet connection verification
- Transaction confirmation requirements
- Error handling and user feedback

## 📚 Documentation

### Available Guides
- **README.md** - Project overview
- **docs/QUICKSTART.md** - Getting started in 5 minutes
- **docs/CONTRACTS.md** - Smart contract documentation
- **docs/FRONTEND.md** - Frontend development guide

### Environment Files
- `.env.example` - Environment variable template
- `.env.local` - Frontend environment (create from .env.example)

## 🌐 Network Support

### Cronos
- **Testnet**: https://evm-t3.cronos.org
- **Mainnet**: https://evm.cronos.org
- **Explorer**: https://cronoscan.com

### Solana
- **Devnet**: https://api.devnet.solana.com
- **Mainnet**: https://api.mainnet-beta.solana.com
- **Explorer**: https://explorer.solana.com

## 🛠️ Tech Stack

### Backend (Contracts)
- **Solana**: Rust + Anchor Framework
- **Cronos**: Solidity 0.8.19 + Hardhat

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Web3**: ethers.js, @solana/web3.js
- **State**: React Context API

### Testing
- **Hardhat**: Contract testing (Cronos)
- **Jest**: Frontend testing (optional)

## 📝 Development Commands

### Frontend
```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm start         # Start production server
npm run lint      # Run ESLint
npm test          # Run tests
```

### Cronos Contracts
```bash
npm run compile   # Compile contracts
npm run test      # Run tests
npm run deploy:devnet    # Deploy to testnet
npm run deploy:mainnet   # Deploy to mainnet
npm run verify    # Verify on block explorer
```

### Solana Contracts
```bash
anchor build      # Build program
anchor test       # Run tests
anchor deploy     # Deploy to network
```

## 🚀 Deployment

### Frontend Deployment Options
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Self-hosted VPS**

### Contract Deployment
- **Cronos**: Via Hardhat scripts
- **Solana**: Via Anchor CLI

See [QUICKSTART.md](docs/QUICKSTART.md) for detailed deployment instructions.

## 🔄 Workflow

```
User Flow:
1. Visit FORGE dApp
2. Connect wallet (MetaMask or Phantom)
3. Select blockchain network
4. Create token with custom parameters
5. Sign transaction in wallet
6. Token is deployed
7. View token in dashboard
8. Manage token (mint, burn, pause)
```

## ✅ Roadmap

### Phase 1 (Current) ✅
- ✅ Multi-chain support (Solana & Cronos)
- ✅ Token creation with custom specs
- ✅ Wallet integration
- ✅ Basic dApp interface

### Phase 2 (Planned)
- Token transfer interface
- Token burning UI
- Pause/unpause functionality
- Enhanced dashboard with analytics

### Phase 3 (Future)
- Governance features
- Staking system
- Token marketplace
- Advanced analytics
- Multiple wallet support

## 💡 Key Design Decisions

1. **Monorepo Structure** - Keeps contracts and frontend together
2. **Factory Pattern** - Easy token deployment and tracking
3. **Customization** - Users control all token parameters
4. **Multi-Chain** - Support for different blockchain paradigms
5. **Type Safety** - TypeScript for reliable code

## 🤝 Contributing

Contributions welcome! Areas for contribution:
- Feature development
- Bug fixes
- Documentation improvements
- UI/UX enhancements
- Test coverage

## 📄 License

MIT License - See LICENSE file for details

## 🎯 Summary

FORGE is a complete, production-ready token minting platform that:
- ✅ Supports two major blockchain networks
- ✅ Provides an intuitive user interface
- ✅ Enables fully customizable token creation
- ✅ Includes secure smart contracts
- ✅ Offers comprehensive documentation
- ✅ Follows blockchain best practices

Start creating tokens today with FORGE! 🚀
