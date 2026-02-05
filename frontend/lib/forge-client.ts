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
      console.log('Payer:', this.provider.wallet.publicKey.toString());

      // Get IDL
      console.log('Attempting to fetch IDL...');
      let idl: any = null;
      
      try {
        console.log('Fetching local IDL from /forge-idl.json...');
        const response = await fetch('/forge-idl.json', { cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        idl = await response.json();
        console.log('✓ IDL loaded from local cache');
      } catch (fetchErr) {
        console.warn('Failed to load local IDL, trying on-chain...');
        try {
          idl = await anchor.Program.fetchIdl(getProgramId(), this.provider);
          console.log('✓ IDL fetched from on-chain');
        } catch (onChainErr) {
          throw new Error('IDL not found in local cache or on-chain');
        }
      }

      if (!idl) throw new Error("IDL is null/undefined");

      // Setup Anchor program
      const idlWithMetadata = idl as any;
      if (!idlWithMetadata.metadata) {
        idlWithMetadata.metadata = {};
      }
      idlWithMetadata.metadata.address = getProgramId().toString();
      
      const program = new anchor.Program(
        idlWithMetadata as anchor.Idl,
        this.provider
      );

      // Generate keypairs
      const mint = anchor.web3.Keypair.generate();
      const tokenConfig = anchor.web3.Keypair.generate();
      const ownerTokenAccount = anchor.web3.Keypair.generate();
      
      console.log('Generated keypairs:');
      console.log('  mint:', mint.publicKey.toString());
      console.log('  tokenConfig:', tokenConfig.publicKey.toString());
      console.log('  ownerTokenAccount:', ownerTokenAccount.publicKey.toString());

      // Build instruction using Anchor's methods builder
      console.log('Building instruction with Anchor...');
      const instruction = await program.methods
        .createToken(
          params.name,
          params.symbol,
          params.decimals,
          new anchor.BN(params.initialSupply)
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
        .instruction();

      console.log('✓ Instruction built');
      console.log('Instruction data (hex):', instruction.data.toString('hex'));

      // Get recent blockhash with retry
      let blockhash;
      let lastError;
      for (let i = 0; i < 3; i++) {
        try {
          const blockHashObj = await this.getConnection().getLatestBlockhash('confirmed');
          blockhash = blockHashObj.blockhash;
          console.log('✓ Got blockhash:', blockhash);
          break;
        } catch (err) {
          lastError = err;
          console.warn(`Attempt ${i + 1}/3 to get blockhash failed:`, err);
          if (i < 2) await new Promise(r => setTimeout(r, 500));
        }
      }
      if (!blockhash) throw new Error(`Failed to get blockhash after 3 attempts: ${lastError}`);

      // Build transaction
      const transaction = new Transaction({ recentBlockhash: blockhash, feePayer: this.provider.wallet.publicKey });
      transaction.add(instruction);
      transaction.sign(mint, tokenConfig, ownerTokenAccount);

      // Sign and send
      const signature = await this.provider.sendAndConfirm(transaction, [mint, tokenConfig, ownerTokenAccount]);
      console.log('✓ Transaction sent! Signature:', signature);
      
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

  async mintTokens(tokenConfigPubkey: string, amount: number): Promise<string> {
    if (!this.provider) throw new Error("Wallet not connected");

    try {
      const idl = await anchor.Program.fetchIdl(getProgramId(), this.provider);
      if (!idl) throw new Error("IDL not found");

      // Ensure IDL has programId metadata for proper serialization
      const idlWithMetadata = idl as any;
      if (!idlWithMetadata.metadata) {
        idlWithMetadata.metadata = {};
      }
      idlWithMetadata.metadata.address = getProgramId().toString();

      const program = new anchor.Program(
        idlWithMetadata as anchor.Idl,
        this.provider
      );
      const tokenConfigKey = new PublicKey(tokenConfigPubkey);

      const tx = await program.methods
        .mintTokens(new anchor.BN(Math.floor(amount)))
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

      // Ensure IDL has programId metadata for proper serialization
      const idlWithMetadata = idl as any;
      if (!idlWithMetadata.metadata) {
        idlWithMetadata.metadata = {};
      }
      idlWithMetadata.metadata.address = getProgramId().toString();

      const program = new anchor.Program(
        idlWithMetadata as anchor.Idl,
        this.provider
      );
      const tokenConfigKey = new PublicKey(tokenConfigPubkey);

      const tx = await program.methods
        .burnTokens(new anchor.BN(Math.floor(amount)))
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
