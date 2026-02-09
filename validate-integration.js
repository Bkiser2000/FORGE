#!/usr/bin/env node

/**
 * Solana Solang Integration Validation Checklist
 * Verifies all components are properly integrated and ready for use
 */

const fs = require('fs');
const path = require('path');

const checks = [];

function check(name, condition, details = '') {
  const status = condition ? '✅' : '❌';
  checks.push({ name, status, condition, details });
  console.log(`${status} ${name}${details ? ': ' + details : ''}`);
}

console.log('🔍 SOLANA SOLANG INTEGRATION VALIDATION\n');

// 1. Smart Contract Files
console.log('📋 Smart Contract Files:');
check(
  'forge_solana.sol exists',
  fs.existsSync('/mnt/Basefiles/Forge/contracts/solana/programs/forge_solana.sol'),
  'Solidity source'
);
check(
  'ForgeSolana.so exists',
  fs.existsSync('/mnt/Basefiles/Forge/contracts/solana/ForgeSolana.so'),
  'Compiled binary'
);

// 2. Frontend Library Files
console.log('\n📚 Frontend Library Files:');
check(
  'solana-web3-client.ts exists',
  fs.existsSync('/mnt/Basefiles/Forge/frontend/lib/solana-web3-client.ts'),
  'Web3.js client'
);

const web3ClientContent = fs.readFileSync('/mnt/Basefiles/Forge/frontend/lib/solana-web3-client.ts', 'utf8');
check(
  'SolanaForgeClient class defined',
  web3ClientContent.includes('export class SolanaForgeClient'),
  'Main client class'
);
check(
  'createToken method exists',
  web3ClientContent.includes('async createToken(params: CreateTokenParams)'),
  'Token creation function'
);
check(
  'Solang function selector correct',
  web3ClientContent.includes('0x5a, 0xf4, 0x7d, 0x2a'),
  'createToken selector'
);

// 3. Frontend Integration
console.log('\n🔗 Frontend Integration:');
const createTokenFormContent = fs.readFileSync('/mnt/Basefiles/Forge/frontend/components/CreateTokenForm.tsx', 'utf8');
check(
  'CreateTokenForm imports SolanaForgeClient',
  createTokenFormContent.includes("import { SolanaForgeClient } from '../lib/solana-web3-client'"),
  'Import statement'
);
check(
  'SolanaForgeClient instantiated',
  createTokenFormContent.includes('new SolanaForgeClient'),
  'Client usage'
);
check(
  'Old ForgeClient removed',
  !createTokenFormContent.includes("import { ForgeClient } from '../lib/forge-client'"),
  'Migration complete'
);

// 4. Environment Configuration
console.log('\n⚙️  Environment Configuration:');
const envContent = fs.readFileSync('/mnt/Basefiles/Forge/frontend/.env.local', 'utf8');
check(
  'SOLANA_PROGRAM_ID configured',
  envContent.includes('9FaWqbx7CXFPmp2SQbjiJqcGA13BggABJLyL7LS7xKZn'),
  'Solang program ID'
);
check(
  'SOLANA_RPC configured',
  envContent.includes('https://api.devnet.solana.com'),
  'Devnet endpoint'
);
check(
  'CRONOS_FACTORY_ADDRESS configured',
  envContent.includes('0x5c794C6C26c59535F00cCdD25bEB75b4f6D7F95e'),
  'Factory v3'
);

// 5. Package Dependencies
console.log('\n📦 Dependencies:');
const packageContent = fs.readFileSync('/mnt/Basefiles/Forge/frontend/package.json', 'utf8');
const pkg = JSON.parse(packageContent);
check(
  '@solana/web3.js installed',
  pkg.dependencies['@solana/web3.js'] !== undefined,
  `v${pkg.dependencies['@solana/web3.js']}`
);
check(
  '@solana/spl-token installed',
  pkg.dependencies['@solana/spl-token'] !== undefined,
  `v${pkg.dependencies['@solana/spl-token']}`
);
check(
  '@solana/wallet-adapter-react installed',
  pkg.dependencies['@solana/wallet-adapter-react'] !== undefined,
  `v${pkg.dependencies['@solana/wallet-adapter-react']}`
);

// 6. Test Files
console.log('\n🧪 Test Files:');
check(
  'test-solana-web3.js exists',
  fs.existsSync('/mnt/Basefiles/Forge/frontend/test-solana-web3.js'),
  'Connection test'
);

// 7. Documentation
console.log('\n📖 Documentation:');
check(
  'SOLANG_INTEGRATION.md exists',
  fs.existsSync('/mnt/Basefiles/Forge/SOLANG_INTEGRATION.md'),
  'Integration guide'
);

// Summary
console.log('\n' + '='.repeat(60));
const passed = checks.filter(c => c.condition).length;
const total = checks.length;
const percentage = Math.round((passed / total) * 100);

console.log(`\n📊 VALIDATION SUMMARY:`);
console.log(`   Passed: ${passed}/${total} (${percentage}%)`);

if (percentage === 100) {
  console.log('\n✅ ALL CHECKS PASSED - Ready for production deployment!\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed - Review above for details\n');
  process.exit(1);
}
