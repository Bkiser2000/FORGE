# FORGE Frontend Development Guide

## Project Structure

```
frontend/
├── pages/              # Next.js pages
├── components/         # React components
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
├── utils/             # Helper functions
├── styles/            # CSS styles
├── public/            # Static assets
└── types/             # TypeScript types
```

## Key Technologies

- **Next.js 14** - React framework for production
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **ethers.js** - Ethereum/Cronos interaction
- **@solana/web3.js** - Solana blockchain interaction

## Components

### Navbar
Navigation component with:
- Page navigation
- Chain selector (Solana/Cronos)
- Wallet connection

**Props:**
```typescript
interface NavbarProps {
  currentPage: "home" | "create" | "dashboard";
  onPageChange: (page) => void;
}
```

### HeroSection
Landing page hero with features and CTA.

### TokenCreator
Main token creation form with:
- Token name, symbol, supply configuration
- Decimals selection
- Max supply setting
- Real-time preview
- Form validation

### Dashboard
Token management dashboard featuring:
- Token list with details
- Creation stats
- Activity feed
- Token management actions

## Hooks

### useWallet
Manage wallet connections.

```typescript
const { 
  address, 
  provider, 
  signer, 
  isConnected, 
  connectWallet, 
  disconnectWallet 
} = useWallet();
```

### useCreateToken
Handle token creation flow.

```typescript
const { createToken, loading, error } = useCreateToken();

await createToken(
  factoryAddress,
  { name, symbol, initialSupply, maxSupply },
  signer
);
```

## Utilities

### validation.ts
- `validateTokenName(name)` - Validate token name
- `validateTokenSymbol(symbol)` - Validate token symbol
- `validateSupply(supply)` - Validate supply amount
- `isValidEthereumAddress(address)` - Validate Cronos address
- `isValidSolanaAddress(address)` - Validate Solana address

### contracts.ts
- Contract ABIs for both chains
- Network configurations
- Helper functions for contract interaction

## Styling

The project uses Tailwind CSS with a custom dark theme.

### Color Palette
- Primary: `#4a9eff` (Blue)
- Accent: `#00d4ff` (Cyan)
- Background: `#1a1a2e`, `#16213e`
- Text: `#e0e0e0` (Light gray)

### Custom Classes
- `.glass-effect` - Frosted glass background
- `.gradient-text` - Gradient text effect
- `.btn-primary` / `.btn-secondary` - Button styles
- `.card` - Card container
- `.input-field` - Input styling

## Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_CRONOS_RPC=https://evm-t3.cronos.org
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

### Hot Reload
Changes to files automatically reload in browser.

## Building

```bash
npm run build
npm start
```

## Testing

```bash
npm test
npm run test:watch
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Performance

- Image optimization
- Code splitting
- CSS minification
- JavaScript tree-shaking

## SEO

- Meta tags configured
- Open Graph tags
- Robots.txt
- Sitemap support ready
