import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey, Connection, Transaction, TransactionInstruction, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import BN from "bn.js";

// Helper to safely create BN for u64 values
const toBN = (value: number | string): any => {
  const numValue = typeof value === 'string' ? parseInt(value, 10) : Math.floor(value);
  // Create BN instance with proper initialization
  const bn = new BN(numValue);
  return bn;
};

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

      // Get IDL - local first, then on-chain
      let idl: any = null;
      try {
        const response = await fetch('/forge-idl.json', { cache: 'no-cache' });
        if (response.ok) {
          idl = await response.json();
          console.log('✓ IDL loaded from local cache');
        }
      } catch {}

      if (!idl) {
        try {
          idl = await anchor.Program.fetchIdl(getProgramId(), this.provider);
          console.log('✓ IDL fetched from on-chain');
        } catch (err) {
          throw new Error('IDL not found');
        }
      }

      if (!idl) throw new Error("IDL is null");

      // Create program
      const program = new anchor.Program(idl as anchor.Idl, this.provider);

      // Generate keypairs
      const mint = anchor.web3.Keypair.generate();
      const tokenConfig = anchor.web3.Keypair.generate();
      const ownerTokenAccount = anchor.web3.Keypair.generate();

      console.log('Sending createToken RPC...');
      
      // Convert initialSupply to BN for u64 type
      const initialSupplyBN = toBN(params.initialSupply);
      
      // Use Anchor's rpc() method - let it handle everything
      const signature = await program.methods
        .createToken(
          params.name,
          params.symbol,
          params.decimals,
          initialSupplyBN
        )
        .accounts({
          payer: this.provider.wallet.publicKey,
          tokenConfig: tokenConfig.publicKey,
          mint: mint.publicKey,
          ownerTokenAccount: ownerTokenAccount.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: getTokenProgramId(),
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([mint, tokenConfig, ownerTokenAccount])
        .rpc();

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
      const idl = await anchor.Program.fetchIdl(getProgramId(), this.provider);
      if (!idl) throw new Error("IDL not found");

      const program = new anchor.Program(idl as anchor.Idl, this.provider);
      const tokenConfigKey = new PublicKey(tokenConfigPubkey);

      // Convert amount to BN for u64 type
      const amountBN = toBN(amount);
      
      const tx = await program.methods
        .mintTokens(amountBN)
        .accounts({
          payer: this.provider.wallet.publicKey,
          tokenConfig: tokenConfigKey,
          tokenProgram: getTokenProgramId(),
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error("Error minting tokens:", error);
      throw error;
    }
  }

  async burnTokens(tokenConfigPubkey: string, amount: number): Promise<string> {
    if (!this.provider) throw new Error("Wallet not connected");

    try {
      const idl = await anchor.Program.fetchIdl(getProgramId(), this.provider);
      if (!idl) throw new Error("IDL not found");

      const program = new anchor.Program(idl as anchor.Idl, this.provider);
      const tokenConfigKey = new PublicKey(tokenConfigPubkey);

      // Convert amount to BN for u64 type
      const amountBN = toBN(amount);
      
      const tx = await program.methods
        .burnTokens(amountBN)
        .accounts({
          payer: this.provider.wallet.publicKey,
          tokenConfig: tokenConfigKey,
          tokenProgram: getTokenProgramId(),
        })
        .rpc();

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
