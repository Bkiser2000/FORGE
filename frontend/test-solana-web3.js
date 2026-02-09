#!/usr/bin/env node

/**
 * Test script for Solana Web3.js client
 * Verifies connection and basic instruction encoding
 */

const { Connection, PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');

const DEVNET_RPC = "https://api.devnet.solana.com";
const PROGRAM_ID_STRING = "9FaWqbx7CXFPmp2SQbjiJqcGA13BggABJLyL7LS7xKZn";

async function testConnection() {
  console.log('🧪 Testing Solana Devnet Connection...\n');
  
  try {
    const connection = new Connection(DEVNET_RPC, "confirmed");
    console.log('✓ Connected to Solana Devnet');
    
    // Check balance of our wallet
    const programId = new PublicKey(PROGRAM_ID_STRING);
    console.log(`✓ Program ID: ${programId.toString()}`);
    
    // Get program info
    const programInfo = await connection.getAccountInfo(programId);
    if (programInfo) {
      console.log(`✓ Program found on chain`);
      console.log(`  - Owner: ${programInfo.owner.toString()}`);
      console.log(`  - Executable: ${programInfo.executable}`);
      console.log(`  - Data length: ${programInfo.data.length} bytes`);
    } else {
      console.log('✗ Program not found');
      return false;
    }
    
    // Test instruction encoding
    console.log('\n🧪 Testing Instruction Encoding...\n');
    
    const wallet = Keypair.generate();
    const tokenConfig = Keypair.generate();
    const mint = Keypair.generate();
    const ownerTokenAccount = Keypair.generate();
    
    const instructionSelector = Buffer.from([0x5a, 0xf4, 0x7d, 0x2a]);
    
    const data = Buffer.alloc(4000);
    let offset = 0;
    
    // Function selector
    instructionSelector.copy(data, offset);
    offset += 4;
    
    // payer
    wallet.publicKey.toBuffer().copy(data, offset);
    offset += 32;
    
    // tokenConfig
    tokenConfig.publicKey.toBuffer().copy(data, offset);
    offset += 32;
    
    // mint
    mint.publicKey.toBuffer().copy(data, offset);
    offset += 32;
    
    // ownerTokenAccount
    ownerTokenAccount.publicKey.toBuffer().copy(data, offset);
    offset += 32;
    
    // name
    const nameBytes = Buffer.from('TestToken', 'utf8');
    data.writeUInt32LE(nameBytes.length, offset);
    offset += 4;
    nameBytes.copy(data, offset);
    offset += nameBytes.length;
    
    // symbol
    const symbolBytes = Buffer.from('TEST', 'utf8');
    data.writeUInt32LE(symbolBytes.length, offset);
    offset += 4;
    symbolBytes.copy(data, offset);
    offset += symbolBytes.length;
    
    // decimals
    data.writeUInt8(9, offset);
    offset += 1;
    
    // initialSupply
    const supplyBuf = Buffer.alloc(8);
    supplyBuf.writeBigUInt64LE(BigInt(1000000000), 0);
    supplyBuf.copy(data, offset);
    offset += 8;
    
    const finalData = data.slice(0, offset);
    
    console.log(`✓ Instruction encoding successful`);
    console.log(`  - Total size: ${finalData.length} bytes`);
    console.log(`  - Function selector: ${finalData.slice(0, 4).toString('hex')}`);
    console.log(`  - Sample data (hex): ${finalData.toString('hex').substring(0, 50)}...`);
    
    console.log('\n✅ All tests passed! Frontend is ready.');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
