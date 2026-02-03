# FORGE - Multi-Chain Token Minting Platform

A user-friendly decentralized application (dApp) for creating and minting custom crypto tokens on Solana and Cronos networks. Users can specify token parameters like supply, decimals, metadata, and more.

## 🌐 Supported Networks
- **Solana** - High-speed SPL tokens
- **Cronos** - EVM-compatible tokens

## 📋 Features
- ✨ Custom token creation with user-defined specifications
- 🎯 Real-time minting capabilities
- 🔗 Multi-chain support
- 🎨 User-friendly interface
- 🔐 Secure wallet integration
- 📊 Token management dashboard

## 📁 Project Structure

```
Forge/
├── contracts/
│   ├── solana/           # Anchor programs for Solana
│   └── cronos/           # Solidity contracts for Cronos
├── frontend/             # Next.js dApp interface
├── docs/                 # Documentation and guides
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- Rust 1.56+ (for Solana development)
- Git

### Installation

1. **Install Solana Contracts**
   ```bash
   cd contracts/solana
   anchor build
   ```

2. **Install Cronos Contracts**
   ```bash
   cd contracts/cronos
   npm install
   ```

3. **Set up Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🔧 Smart Contracts

### Solana (Anchor)
- Token program for creating SPL tokens
- Customizable parameters: name, symbol, decimals, supply
- Metadata support via Metaplex standards

### Cronos (Solidity)
- ERC20 token factory
- Pausable and ownable features
- Mint/burn capabilities

## 🎨 Frontend Features
- Wallet connection (Phantom for Solana, MetaMask for Cronos)
- Intuitive token creation wizard
- Real-time transaction monitoring
- Token dashboard and management

## 🔐 Security
- Contract auditing recommendations
- Safe integer arithmetic
- Access control patterns
- Rate limiting on minting

## 📝 License
MIT

## 🤝 Contributing
Contributions are welcome! Please submit pull requests with clear descriptions.
# FORGE
