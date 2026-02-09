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
import { AbiCoder } from 'ethers';

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
   * Uses proper Solidity ABI encoding for function arguments
   */
  async createToken(params: CreateTokenParams): Promise<string> {
    if (!this.provider) throw new Error("Wallet not connected");

    try {
      console.log('=== Starting Token Creation (Solang with ABI Encoding) ===');
      console.log('Parameters:', params);

      // Generate keypairs for accounts
      const mint = Keypair.generate();
      const tokenConfig = Keypair.generate();
      const ownerTokenAccount = Keypair.generate();

      console.log('Generated keypairs:');
      console.log('  Mint:', mint.publicKey.toString());
      console.log('  TokenConfig:', tokenConfig.publicKey.toString());
      console.log('  OwnerTokenAccount:', ownerTokenAccount.publicKey.toString());

      // Solang function selector for createToken (first 4 bytes of keccak256 hash)
      const functionSelector = Buffer.from([0x5a, 0xf4, 0x7d, 0x2a]);

      // Use ethers AbiCoder to encode the function parameters in Solidity ABI format
      const abiCoder = AbiCoder.defaultAbiCoder();
      
      // Solana public keys are 32 bytes (bytes32 in Solidity), not 20-byte Ethereum addresses
      // Convert PublicKey buffers to bytes32 format (0x-prefixed hex)
      const payerBytes32 = '0x' + this.provider.wallet.publicKey.toBuffer().toString('hex');
      const tokenConfigBytes32 = '0x' + tokenConfig.publicKey.toBuffer().toString('hex');
      const mintBytes32 = '0x' + mint.publicKey.toBuffer().toString('hex');
      const ownerTokenAccountBytes32 = '0x' + ownerTokenAccount.publicKey.toBuffer().toString('hex');
      
      console.log('Encoding with bytes32 format:');
      console.log('  Payer:', payerBytes32);
      console.log('  TokenConfig:', tokenConfigBytes32);
      console.log('  Mint:', mintBytes32);
      console.log('  OwnerTokenAccount:', ownerTokenAccountBytes32);
      
      // Encode parameters according to Solidity function signature:
      // Using bytes32 instead of address since Solana keys are 32 bytes
      const encodedParams = abiCoder.encode(
        ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'string', 'string', 'uint8', 'uint64'],
        [
          payerBytes32,
          tokenConfigBytes32,
          mintBytes32,
          ownerTokenAccountBytes32,
          params.name,
          params.symbol,
          params.decimals,
          params.initialSupply
        ]
      );

      // Remove '0x' prefix and convert to buffer
      const encodedBuffer = Buffer.from(encodedParams.slice(2), 'hex');
      
      // Combine function selector with encoded parameters
      const instructionData = Buffer.concat([functionSelector, encodedBuffer]);
      
      console.log('Instruction data length:', instructionData.length);
      console.log('Instruction data (hex, first 100 chars):', instructionData.toString('hex').substring(0, 100) + '...');

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
        data: instructionData,
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
