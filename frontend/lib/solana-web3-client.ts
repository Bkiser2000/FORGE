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
const PROGRAM_ID_STRING = "9FaWqbx7CXFPmp2SQbjiJqcGA13BggABJLyL7LS7xKZn";

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
   */
  async createToken(params: CreateTokenParams): Promise<string> {
    if (!this.provider) throw new Error("Wallet not connected");

    try {
      console.log('=== Starting Token Creation (Web3.js) ===');
      console.log('Parameters:', params);

      // Generate keypairs for accounts
      const mint = Keypair.generate();
      const tokenConfig = Keypair.generate();
      const ownerTokenAccount = Keypair.generate();

      // Build instruction data for Solang function
      // Solang uses function selectors (4 bytes) instead of 8-byte Anchor discriminators
      const instructionSelector = Buffer.from([0x5a, 0xf4, 0x7d, 0x2a]); // createToken selector

      // Serialize parameters in order:
      // payer (32 bytes - pubkey)
      // tokenConfigAccount (32 bytes - pubkey)
      // mint (32 bytes - pubkey)
      // ownerTokenAccount (32 bytes - pubkey)
      // name (dynamic - string)
      // symbol (dynamic - string)
      // decimals (1 byte - u8)
      // initialSupply (8 bytes - u64)

      const data = Buffer.alloc(4000);
      let offset = 0;

      // Function selector (4 bytes)
      instructionSelector.copy(data, offset);
      offset += 4;

      // payer (32 bytes)
      this.provider.wallet.publicKey.toBuffer().copy(data, offset);
      offset += 32;

      // tokenConfigAccount (32 bytes)
      tokenConfig.publicKey.toBuffer().copy(data, offset);
      offset += 32;

      // mint (32 bytes)
      mint.publicKey.toBuffer().copy(data, offset);
      offset += 32;

      // ownerTokenAccount (32 bytes)
      ownerTokenAccount.publicKey.toBuffer().copy(data, offset);
      offset += 32;

      // name (dynamic string - 4 byte length prefix + bytes)
      const nameBytes = Buffer.from(params.name, 'utf8');
      data.writeUInt32LE(nameBytes.length, offset);
      offset += 4;
      nameBytes.copy(data, offset);
      offset += nameBytes.length;

      // symbol (dynamic string - 4 byte length prefix + bytes)
      const symbolBytes = Buffer.from(params.symbol, 'utf8');
      data.writeUInt32LE(symbolBytes.length, offset);
      offset += 4;
      symbolBytes.copy(data, offset);
      offset += symbolBytes.length;

      // decimals (1 byte - u8)
      data.writeUInt8(params.decimals, offset);
      offset += 1;

      // initialSupply (8 bytes - u64, little endian)
      const supplyBuf = Buffer.alloc(8);
      supplyBuf.writeBigUInt64LE(BigInt(Math.floor(params.initialSupply)), 0);
      supplyBuf.copy(data, offset);
      offset += 8;

      const finalData = data.slice(0, offset);
      console.log('Instruction data length:', finalData.length);
      console.log('Instruction data (hex):', finalData.toString('hex').substring(0, 100) + '...');

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

      // Create and send transaction
      const connection = this.getConnection();
      const recentBlockhash = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: this.provider.wallet.publicKey,
      });

      transaction.add(instruction);
      transaction.partialSign(mint, tokenConfig, ownerTokenAccount);
      const signedTx = await this.provider.wallet.signTransaction(transaction);

      console.log('Sending transaction...');
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      console.log('✓ Transaction sent! Signature:', signature);
      
      // Wait for confirmation
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
