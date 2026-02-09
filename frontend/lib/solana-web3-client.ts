import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const DEVNET_RPC = "https://api.devnet.solana.com";
const PROGRAM_ID_STRING = "78Xz6aQi6iozz4rhZqbpaGZjiQSTYw6m8Fh7bpr1WLxR";

let PROGRAM_ID: PublicKey | null = null;

const initializePublicKeysEagerly = () => {
  if (PROGRAM_ID !== null) return;
  
  console.log('Initializing PROGRAM_ID...');
  try {
    PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);
    console.log('✓ PROGRAM_ID initialized:', PROGRAM_ID.toString());
  } catch (err) {
    console.error('Failed to create PROGRAM_ID:', err);
    throw err;
  }
};

const getProgramId = (): PublicKey => {
  if (!PROGRAM_ID) {
    throw new Error("PROGRAM_ID not initialized - call initializePublicKeysEagerly first");
  }
  return PROGRAM_ID;
};

export interface CreateTokenParams {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: number;
}

export class SolanaForgeClient {
  private provider: any = null;

  constructor(provider?: any) {
    this.provider = provider;
    initializePublicKeysEagerly();
  }

  getConnection(): Connection {
    return new Connection(DEVNET_RPC, "confirmed");
  }

  connectWallet(provider: any): void {
    this.provider = provider;
    console.log('✓ Wallet connected:', provider.wallet.publicKey.toString());
  }

  /**
   * Create a new token using Solang-compiled program with web3.js
   * Uses raw bytes32 encoding for Solana (no Ethereum ABI wrapper)
   */
  async createToken(params: CreateTokenParams): Promise<string> {
    if (!this.provider) throw new Error("Wallet not connected");

    try {
      console.log('=== Starting Token Creation (Solang Raw Encoding) ===');
      console.log('Parameters:', params);

      // Generate keypairs for accounts
      const mint = Keypair.generate();
      const tokenConfig = Keypair.generate();
      const ownerTokenAccount = Keypair.generate();

      console.log('Generated keypairs:');
      console.log('  Mint:', mint.publicKey.toString());
      console.log('  TokenConfig:', tokenConfig.publicKey.toString());
      console.log('  OwnerTokenAccount:', ownerTokenAccount.publicKey.toString());

      // For Solang on Solana, we need Ethereum-style ABI encoding
      // Even though parameters are bytes32, Solang expects ABI-encoded format
      // This is: selector (8) + parameter offsets/values (padded to 32 bytes)
      
      const data = Buffer.alloc(4000);
      let offset = 0;

      // Function selector (8 bytes)
      const functionSelector = Buffer.from([0x20, 0x9e, 0xc1, 0x03, 0x20, 0xb2, 0x13, 0x60]);
      functionSelector.copy(data, offset);
      offset += 8;
      console.log('Added function selector:', functionSelector.toString('hex'));

      // Encode parameters as 32-byte values (Solang ABI style - padded right for non-standard types)
      // payer (bytes32) - already 32 bytes
      this.provider.wallet.publicKey.toBuffer().copy(data, offset);
      offset += 32;
      console.log('Encoded payer');

      // tokenConfigAccount (bytes32) - already 32 bytes
      tokenConfig.publicKey.toBuffer().copy(data, offset);
      offset += 32;
      console.log('Encoded tokenConfig');

      // mint (bytes32) - already 32 bytes
      mint.publicKey.toBuffer().copy(data, offset);
      offset += 32;
      console.log('Encoded mint');

      // ownerTokenAccount (bytes32) - already 32 bytes
      ownerTokenAccount.publicKey.toBuffer().copy(data, offset);
      offset += 32;
      console.log('Encoded ownerTokenAccount');

      // name (string) - offset to dynamic data (assumed to be after fixed params)
      // For now, inline the string data: 32-byte padded length + data
      const nameBytes = Buffer.from(params.name, 'utf8');
      // In ABI encoding, strings store length then data
      data.writeUInt32BE(nameBytes.length, offset);
      offset += 4;
      nameBytes.copy(data, offset);
      offset += nameBytes.length;
      // Pad to 32-byte boundary if needed
      const namePadding = (32 - (nameBytes.length % 32)) % 32;
      offset += namePadding;
      console.log('Encoded name with', namePadding, 'padding bytes');

      // symbol (string) - same as name
      const symbolBytes = Buffer.from(params.symbol, 'utf8');
      data.writeUInt32BE(symbolBytes.length, offset);
      offset += 4;
      symbolBytes.copy(data, offset);
      offset += symbolBytes.length;
      const symbolPadding = (32 - (symbolBytes.length % 32)) % 32;
      offset += symbolPadding;
      console.log('Encoded symbol with', symbolPadding, 'padding bytes');

      // decimals (uint8) - pad to 32 bytes
      data.writeUInt8(params.decimals, offset);
      offset += 32;
      console.log('Encoded decimals (padded to 32 bytes)');

      // initialSupply (uint64) - pad to 32 bytes, big-endian for ABI compatibility
      data.writeBigUInt64BE(BigInt(Math.floor(params.initialSupply)), offset + 24); // Right-aligned in 32 bytes
      offset += 32;
      console.log('Encoded initialSupply (padded to 32 bytes)');

      const finalData = data.slice(0, offset);
      console.log('Total instruction data length:', finalData.length, 'bytes');
      console.log('Instruction data (hex, first 150 chars):', finalData.toString('hex').substring(0, 150) + '...');

      // Build instruction with REQUIRED accounts for Solang
      // According to metadata: dataAccount (writable) + clock sysvar
      
      // Create a data account (this will store contract state)
      const dataAccount = Keypair.generate();
      
      const instruction = new TransactionInstruction({
        keys: [
          // Required by Solang: dataAccount (writable for contract storage)
          { pubkey: dataAccount.publicKey, isSigner: true, isWritable: true },
          // Required by Solang: clock sysvar
          { pubkey: new PublicKey("SysvarC1ock11111111111111111111111111111111"), isSigner: false, isWritable: false },
          // Additional accounts for context
          { pubkey: this.provider.wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: tokenConfig.publicKey, isSigner: true, isWritable: true },
          { pubkey: mint.publicKey, isSigner: true, isWritable: true },
          { pubkey: ownerTokenAccount.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        ],
        programId: getProgramId(),
        data: finalData,
      });

      console.log('Instruction created with', instruction.keys.length, 'accounts');
      console.log('Data account:', dataAccount.publicKey.toString());

      // Create and send transaction
      const connection = this.getConnection();
      const recentBlockhash = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: this.provider.wallet.publicKey,
      });

      transaction.add(instruction);
      // Sign with all required keypairs
      transaction.partialSign(mint, tokenConfig, ownerTokenAccount, dataAccount);
      
      console.log('Transaction built, sending to wallet for signing...');
      const signedTx = await this.provider.wallet.signTransaction(transaction);

      console.log('Sending transaction...');
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      console.log('✓ Transaction sent! Signature:', signature);
      
      // Wait for confirmation
      console.log('Waiting for confirmation...');
      await connection.confirmTransaction(signature, 'confirmed');
      console.log('✓ Transaction confirmed!');

      return signature;
    } catch (error) {
      console.error("=== Error Creating Token ===");
      console.error('Error:', error);
      if (error instanceof Error) {
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
      }
      throw error;
    }
  }

  async getTokenCount(): Promise<number> {
    // This would require reading program-derived accounts
    // For now, returning 0 as placeholder
    return 0;
  }
}

// Export singleton instance creation
export const createSolanaForgeClient = (provider?: any) => {
  return new SolanaForgeClient(provider);
};

export { initializePublicKeysEagerly, getProgramId };
