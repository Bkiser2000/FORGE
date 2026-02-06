import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";
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

      // Load IDL - local first (preferred), then on-chain
      let idl: any = null;
      try {
        const response = await fetch('/forge-idl.json', { cache: 'no-cache' });
        if (response.ok) {
          idl = await response.json();
          console.log('✓ IDL loaded from local cache');
        }
      } catch (e) {
        console.log('Local IDL failed, trying on-chain...');
      }

      // Only fetch on-chain if local failed
      if (!idl) {
        idl = await anchor.Program.fetchIdl(getProgramId(), this.provider);
        if (!idl) throw new Error("IDL not found");
        console.log('✓ IDL fetched from on-chain');
        // Add programId to on-chain IDL
        (idl as any).metadata = (idl as any).metadata || {};
        (idl as any).metadata.address = getProgramId().toString();
      }

      // Generate keypairs
      const mint = anchor.web3.Keypair.generate();
      const tokenConfig = anchor.web3.Keypair.generate();
      const ownerTokenAccount = anchor.web3.Keypair.generate();

      // Build instruction manually to avoid Anchor's BN serializer issues
      const createTokenInstruction = await this.buildCreateTokenInstruction(
        params,
        mint,
        tokenConfig,
        ownerTokenAccount,
        idl
      );

      // Get latest blockhash with retry logic
      const connection = this.getConnection();
      let latestBlockhash = await connection.getLatestBlockhash('finalized');
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          console.log(`Attempt ${attempts + 1}/${maxAttempts}: Sending transaction...`);

          // Create transaction
          const tx = new anchor.web3.Transaction()
            .add(createTokenInstruction);

          tx.recentBlockhash = latestBlockhash.blockhash;
          tx.feePayer = this.provider.wallet.publicKey;

          // Sign with all required keypairs
          tx.partialSign(mint, tokenConfig, ownerTokenAccount);
          
          // Get wallet to sign
          const signed = await this.provider.wallet.signTransaction(tx);

          // Send transaction
          const signature = await connection.sendRawTransaction(signed.serialize());
          console.log('✓ Transaction sent! Signature:', signature);

          // Wait for confirmation
          await connection.confirmTransaction({
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            signature: signature,
          });

          console.log('✓ Transaction confirmed!');
          return signature;
        } catch (error: any) {
          attempts++;
          if (attempts >= maxAttempts) throw error;

          console.log(`Attempt ${attempts} failed:`, error?.message);
          // Get fresh blockhash for retry
          latestBlockhash = await connection.getLatestBlockhash('finalized');
        }
      }

      throw new Error('Transaction failed after max retries');
    } catch (error) {
      console.error("=== Error Creating Token ===");
      console.error('Error:', error);
      if (error instanceof Error) {
        console.error('Message:', error.message);
      }
      throw error;
    }
  }

  private async buildCreateTokenInstruction(
    params: CreateTokenParams,
    mint: anchor.web3.Keypair,
    tokenConfig: anchor.web3.Keypair,
    ownerTokenAccount: anchor.web3.Keypair,
    idl: any
  ): Promise<anchor.web3.TransactionInstruction> {
    // Compute discriminator: SHA256("global:instruction:create_token").slice(0, 8)
    const discriminator = await this.computeDiscriminator('createToken');
    console.log('Computed discriminator:', discriminator.toString('hex'));

    // Encode parameters manually
    let data = discriminator;

    // Encode string: name
    const nameBuffer = Buffer.from(params.name, 'utf8');
    const nameLen = Buffer.alloc(4);
    nameLen.writeUInt32LE(nameBuffer.length);
    data = Buffer.concat([data, nameLen, nameBuffer]);
    console.log('After name:', data.toString('hex'));

    // Encode string: symbol
    const symbolBuffer = Buffer.from(params.symbol, 'utf8');
    const symbolLen = Buffer.alloc(4);
    symbolLen.writeUInt32LE(symbolBuffer.length);
    data = Buffer.concat([data, symbolLen, symbolBuffer]);
    console.log('After symbol:', data.toString('hex'));

    // Encode u8: decimals
    data = Buffer.concat([data, Buffer.from([params.decimals])]);
    console.log('After decimals:', data.toString('hex'));

    // Encode u64: initialSupply (little-endian)
    const supplyBuffer = Buffer.alloc(8);
    supplyBuffer.writeBigUInt64LE(BigInt(params.initialSupply));
    data = Buffer.concat([data, supplyBuffer]);
    console.log('After supply:', data.toString('hex'));

    // Build accounts array - order matters! Match IDL exactly
    const accounts = [
      { pubkey: this.provider!.wallet.publicKey, isSigner: true, isWritable: true }, // payer
      { pubkey: tokenConfig.publicKey, isSigner: true, isWritable: true }, // tokenConfig
      { pubkey: mint.publicKey, isSigner: true, isWritable: true }, // mint
      { pubkey: ownerTokenAccount.publicKey, isSigner: true, isWritable: true }, // ownerTokenAccount
      { pubkey: anchor.web3.SystemProgram.programId, isSigner: false, isWritable: false }, // systemProgram
      { pubkey: getTokenProgramId(), isSigner: false, isWritable: false }, // tokenProgram
      { pubkey: anchor.web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent
    ];

    console.log('Instruction data length:', data.length);
    console.log('Full instruction data:', data.toString('hex'));
    console.log('Creating transaction instruction...');

    return new anchor.web3.TransactionInstruction({
      programId: getProgramId(),
      keys: accounts,
      data: data,
    });
  }

  private async computeDiscriminator(instructionName: string): Promise<Buffer> {
    const namespace = `global:instruction:${instructionName}`;
    console.log('Computing discriminator for:', namespace);
    const encoder = new TextEncoder();
    const data = encoder.encode(namespace);
    console.log('Encoded namespace bytes:', Buffer.from(data).toString('hex'));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data as any);
    const hash = Buffer.from(hashBuffer);
    console.log('Full SHA256 hash:', hash.toString('hex'));
    const disc = hash.slice(0, 8);
    console.log('Discriminator (first 8 bytes):', disc.toString('hex'));
    return disc;
  }

  async mintTokens(tokenConfigPubkey: string, amount: number): Promise<string> {
    if (!this.provider) throw new Error("Wallet not connected");

    try {
      const idl = await anchor.Program.fetchIdl(getProgramId(), this.provider);
      if (!idl) throw new Error("IDL not found");

      // Ensure IDL has programId metadata for serialization
      (idl as any).metadata = (idl as any).metadata || {};
      (idl as any).metadata.address = getProgramId().toString();

      const program = new anchor.Program(idl as anchor.Idl, this.provider);
      const tokenConfigKey = new PublicKey(tokenConfigPubkey);

      const tx = await program.methods
        .mintTokens(Math.floor(amount))  // Plain number
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

      // Ensure IDL has programId metadata for serialization
      (idl as any).metadata = (idl as any).metadata || {};
      (idl as any).metadata.address = getProgramId().toString();

      const program = new anchor.Program(idl as anchor.Idl, this.provider);
      const tokenConfigKey = new PublicKey(tokenConfigPubkey);

      const tx = await program.methods
        .burnTokens(Math.floor(amount))  // Plain number
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
