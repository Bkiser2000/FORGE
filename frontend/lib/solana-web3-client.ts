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

      // For Solang on Solana, we encode directly as bytes32 without ABI wrapper
      // No function selector needed - Solang routes based on instruction data
      
      const data = Buffer.alloc(4000);
      let offset = 0;

      // Encode as raw bytes32 parameters (32 bytes each)
      // payer (bytes32)
      this.provider.wallet.publicKey.toBuffer().copy(data, offset);
      offset += 32;
      console.log('Encoded payer at offset 0');

      // tokenConfigAccount (bytes32)
      tokenConfig.publicKey.toBuffer().copy(data, offset);
      offset += 32;
      console.log('Encoded tokenConfig at offset 32');

      // mint (bytes32)
      mint.publicKey.toBuffer().copy(data, offset);
      offset += 32;
      console.log('Encoded mint at offset 64');

      // ownerTokenAccount (bytes32)
      ownerTokenAccount.publicKey.toBuffer().copy(data, offset);
      offset += 32;
      console.log('Encoded ownerTokenAccount at offset 96');

      // name (length-prefixed string: 4 bytes length + UTF-8 bytes)
      const nameBytes = Buffer.from(params.name, 'utf8');
      data.writeUInt32LE(nameBytes.length, offset);
      offset += 4;
      nameBytes.copy(data, offset);
      offset += nameBytes.length;
      console.log('Encoded name at offset 128');

      // symbol (length-prefixed string: 4 bytes length + UTF-8 bytes)
      const symbolBytes = Buffer.from(params.symbol, 'utf8');
      data.writeUInt32LE(symbolBytes.length, offset);
      offset += 4;
      symbolBytes.copy(data, offset);
      offset += symbolBytes.length;
      console.log('Encoded symbol');

      // decimals (1 byte - u8)
      data.writeUInt8(params.decimals, offset);
      offset += 1;
      console.log('Encoded decimals:', params.decimals);

      // initialSupply (8 bytes - u64, little endian)
      const supplyBuf = Buffer.alloc(8);
      supplyBuf.writeBigUInt64LE(BigInt(Math.floor(params.initialSupply)), 0);
      supplyBuf.copy(data, offset);
      offset += 8;
      console.log('Encoded initialSupply:', params.initialSupply);

      const finalData = data.slice(0, offset);
      console.log('Total instruction data length:', finalData.length, 'bytes');
      console.log('Instruction data (hex, first 150 chars):', finalData.toString('hex').substring(0, 150) + '...');

      // Build instruction
      const instruction = new TransactionInstruction({
        keys: [
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

      // Create and send transaction
      const connection = this.getConnection();
      const recentBlockhash = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: this.provider.wallet.publicKey,
      });

      transaction.add(instruction);
      transaction.partialSign(mint, tokenConfig, ownerTokenAccount);
      
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
