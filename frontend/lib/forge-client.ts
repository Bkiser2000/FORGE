import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey, Connection, Transaction, TransactionInstruction, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const DEVNET_RPC = "https://api.devnet.solana.com";

// Use string representations directly - avoid creating multiple PublicKey objects
const PROGRAM_ID_STRING = "BJ81sbW7WqtvujCHJ2RbNM3NDBBbH13sEFDJ8soUzBJF";

// Cache ONLY the program ID (which we need first)
// TOKEN_PROGRAM_ID is imported from @solana/spl-token
let PROGRAM_ID: PublicKey | null = null;

const initializePublicKeysEagerly = () => {
  if (PROGRAM_ID !== null) return; // Already initialized
  
  console.log('Initializing PROGRAM_ID...');
  try {
    PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);
    console.log('✓ PROGRAM_ID initialized:', PROGRAM_ID.toString());
  } catch (err) {
    console.error('Failed to create PROGRAM_ID:', err);
    // Fail fast - if we can't create the program ID, nothing works
    throw err;
  }
};

const getProgramId = (): PublicKey => {
  if (typeof window === 'undefined') {
    throw new Error("getProgramId() called on server");
  }
  if (!PROGRAM_ID) {
    throw new Error("PROGRAM_ID not initialized - call initializePublicKeysEagerly first");
  }
  return PROGRAM_ID;
};

// Token program ID is imported from @solana/spl-token - no creation needed
const getTokenProgramId = (): PublicKey => {
  if (typeof window === 'undefined') {
    throw new Error("getTokenProgramId() called on server");
  }
  return TOKEN_PROGRAM_ID;
};

const getTokenProgramIdString = (): string => {
  return TOKEN_PROGRAM_ID.toString();
};

export interface CreateTokenParams {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: number;
}

export interface TokenConfig {
  mint: string;
  owner: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  createdAt: number;
}

export class ForgeClient {
  private connection: Connection | null = null;
  private wallet: any;
  private provider: AnchorProvider | null = null;

  constructor(wallet: any) {
    // Initialize PublicKeys eagerly on first ForgeClient instantiation
    initializePublicKeysEagerly();
    
    this.wallet = wallet;
    
    if (wallet && wallet.publicKey) {
      // Create a wallet adapter compatible object for Anchor
      const walletAdapter = {
        publicKey: wallet.publicKey,
        signAllTransactions: wallet.signAllTransactions || async function(txs: any[]) {
          if (wallet.signTransaction) {
            return Promise.all(txs.map(function(tx) { return wallet.signTransaction(tx); }));
          }
          return txs;
        },
        signTransaction: wallet.signTransaction || async function(tx: any) { return tx; },
      };

      // Lazy-initialize connection on first use to avoid blocking
      if (!this.connection) {
        this.connection = new Connection(DEVNET_RPC, "confirmed");
      }

      this.provider = new AnchorProvider(
        this.connection,
        walletAdapter as any,
        { commitment: "confirmed", preflightCommitment: "confirmed" }
      );
      anchor.setProvider(this.provider);
    }
  }

  private getConnection(): Connection {
    if (!this.connection) {
      this.connection = new Connection(DEVNET_RPC, "confirmed");
    }
    return this.connection;
  }

  async createToken(params: CreateTokenParams): Promise<string> {
    if (!this.provider) throw new Error("Wallet not connected");

    try {
      console.log('=== Starting Token Creation ===');
      console.log('Parameters:', params);

      // Generate keypairs
      const mint = anchor.web3.Keypair.generate();
      const tokenConfig = anchor.web3.Keypair.generate();
      const ownerTokenAccount = anchor.web3.Keypair.generate();

      console.log('Sending createToken RPC...');
      
      // Manually serialize the instruction to avoid BN issues
      const instructionData = Buffer.alloc(1000);
      let offset = 0;
      
      // Discriminator (8 bytes) - first 8 bytes of SHA256 hash of "global:createToken"
      const discriminator = Buffer.from([0xf6, 0x5b, 0xe9, 0x57, 0xf8, 0xa2, 0xcd, 0x5e]);
      instructionData.write(discriminator.toString('hex'), offset, 8, 'hex');
      offset += 8;
      
      // String length and value for name
      instructionData.writeUInt32LE(params.name.length, offset);
      offset += 4;
      instructionData.write(params.name, offset);
      offset += params.name.length;
      
      // String length and value for symbol
      instructionData.writeUInt32LE(params.symbol.length, offset);
      offset += 4;
      instructionData.write(params.symbol, offset);
      offset += params.symbol.length;
      
      // Decimals (u8)
      instructionData.writeUInt8(params.decimals, offset);
      offset += 1;
      
      // Initial supply (u64)
      instructionData.writeBigUInt64LE(BigInt(Math.floor(params.initialSupply)), offset);
      offset += 8;
      
      const finalData = instructionData.slice(0, offset);
      
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
      
      const recentBlockhash = await this.getConnection().getLatestBlockhash();
      const transaction = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: this.provider.wallet.publicKey,
      });
      transaction.add(instruction);
      
      // Sign with the generated keypairs first
      transaction.partialSign(mint, tokenConfig, ownerTokenAccount);
      
      // Then sign with wallet
      const signed = await this.provider.wallet.signTransaction(transaction);
      
      // Send and confirm
      const signature = await this.getConnection().sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });
      
      await this.getConnection().confirmTransaction(signature, 'confirmed');

      console.log('✓ Transaction sent! Signature:', signature);
      return signature;
    } catch (error) {
      console.error("=== Error Creating Token ===");
      console.error('Error:', error);
      if (error instanceof Error) {
        console.error('Message:', error.message);
      }
      throw error;
    }
  }

  async mintTokens(tokenConfigPubkey: string, amount: number): Promise<string> {
    if (!this.provider) throw new Error("Wallet not connected");

    try {
      const tokenConfigKey = new PublicKey(tokenConfigPubkey);

      // Manually serialize the instruction
      const instructionData = Buffer.alloc(100);
      let offset = 0;
      
      // Discriminator for mintTokens
      const discriminator = Buffer.from([0xef, 0x2e, 0x8d, 0x8c, 0x1f, 0xba, 0xe9, 0x6f]);
      instructionData.write(discriminator.toString('hex'), offset, 8, 'hex');
      offset += 8;
      
      // Amount (u64)
      instructionData.writeBigUInt64LE(BigInt(Math.floor(amount)), offset);
      offset += 8;
      
      const finalData = instructionData.slice(0, offset);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: this.provider.wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: tokenConfigKey, isSigner: false, isWritable: true },
          { pubkey: this.provider.wallet.publicKey, isSigner: false, isWritable: true }, // mint
          { pubkey: this.provider.wallet.publicKey, isSigner: false, isWritable: true }, // token account
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: getProgramId(),
        data: finalData,
      });
      
      const recentBlockhash = await this.getConnection().getLatestBlockhash();
      const transaction = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: this.provider.wallet.publicKey,
      });
      transaction.add(instruction);
      
      const signed = await this.provider.wallet.signTransaction(transaction);
      const tx = await this.getConnection().sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });
      
      await this.getConnection().confirmTransaction(tx, 'confirmed');
      return tx;
    } catch (error) {
      console.error("Error minting tokens:", error);
      throw error;
    }
  }

  async burnTokens(tokenConfigPubkey: string, amount: number): Promise<string> {
    if (!this.provider) throw new Error("Wallet not connected");

    try {
      const tokenConfigKey = new PublicKey(tokenConfigPubkey);

      // Manually serialize the instruction
      const instructionData = Buffer.alloc(100);
      let offset = 0;
      
      // Discriminator for burnTokens
      const discriminator = Buffer.from([0x74, 0xee, 0x47, 0x17, 0x79, 0x4d, 0xc7, 0x5c]);
      instructionData.write(discriminator.toString('hex'), offset, 8, 'hex');
      offset += 8;
      
      // Amount (u64)
      instructionData.writeBigUInt64LE(BigInt(Math.floor(amount)), offset);
      offset += 8;
      
      const finalData = instructionData.slice(0, offset);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: this.provider.wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: tokenConfigKey, isSigner: false, isWritable: true },
          { pubkey: this.provider.wallet.publicKey, isSigner: false, isWritable: true }, // mint
          { pubkey: this.provider.wallet.publicKey, isSigner: false, isWritable: true }, // token account
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: getProgramId(),
        data: finalData,
      });
      
      const recentBlockhash = await this.getConnection().getLatestBlockhash();
      const transaction = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: this.provider.wallet.publicKey,
      });
      transaction.add(instruction);
      
      const signed = await this.provider.wallet.signTransaction(transaction);
      const tx = await this.getConnection().sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });
      
      await this.getConnection().confirmTransaction(tx, 'confirmed');
      return tx;
    } catch (error) {
      console.error("Error burning tokens:", error);
      throw error;
    }
  }

  getProgramId(): PublicKey {
    return getProgramId();
  }
}

export default ForgeClient;
