import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey, Connection, Transaction, TransactionInstruction, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

// Pre-loaded IDL to avoid fetching it at runtime (which triggers BN serializer)
const FORGE_IDL = {
  "version": "0.1.0",
  "name": "forge_solana",
  "metadata": {
    "address": "BJ81sbW7WqtvujCHJ2RbNM3NDBBbH13sEFDJ8soUzBJF"
  },
  "instructions": [
    {
      "name": "createToken",
      "accounts": [
        { "name": "payer", "isMut": true, "isSigner": true },
        { "name": "tokenConfig", "isMut": true, "isSigner": true },
        { "name": "mint", "isMut": true, "isSigner": true },
        { "name": "ownerTokenAccount", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false },
        { "name": "rent", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "name", "type": "string" },
        { "name": "symbol", "type": "string" },
        { "name": "decimals", "type": "u8" },
        { "name": "initialSupply", "type": "u64" }
      ]
    },
    {
      "name": "mintTokens",
      "accounts": [
        { "name": "payer", "isMut": true, "isSigner": true },
        { "name": "tokenConfig", "isMut": true, "isSigner": false },
        { "name": "mint", "isMut": true, "isSigner": false },
        { "name": "tokenAccount", "isMut": true, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false }
      ],
      "args": [{ "name": "amount", "type": "u64" }]
    },
    {
      "name": "burnTokens",
      "accounts": [
        { "name": "payer", "isMut": true, "isSigner": true },
        { "name": "tokenConfig", "isMut": true, "isSigner": false },
        { "name": "mint", "isMut": true, "isSigner": false },
        { "name": "tokenAccount", "isMut": true, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false }
      ],
      "args": [{ "name": "amount", "type": "u64" }]
    }
  ],
  "accounts": [
    {
      "name": "TokenConfig",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "mint", "type": "publicKey" },
          { "name": "owner", "type": "publicKey" },
          { "name": "name", "type": "string" },
          { "name": "symbol", "type": "string" },
          { "name": "decimals", "type": "u8" },
          { "name": "totalSupply", "type": "u64" },
          { "name": "createdAt", "type": "i64" }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "TokenCreated",
      "fields": [
        { "name": "mint", "type": "publicKey", "index": false },
        { "name": "owner", "type": "publicKey", "index": false },
        { "name": "name", "type": "string", "index": false },
        { "name": "symbol", "type": "string", "index": false },
        { "name": "decimals", "type": "u8", "index": false },
        { "name": "initialSupply", "type": "u64", "index": false }
      ]
    },
    {
      "name": "TokensMinted",
      "fields": [
        { "name": "mint", "type": "publicKey", "index": false },
        { "name": "amount", "type": "u64", "index": false },
        { "name": "to", "type": "publicKey", "index": false }
      ]
    },
    {
      "name": "TokensBurned",
      "fields": [
        { "name": "mint", "type": "publicKey", "index": false },
        { "name": "amount", "type": "u64", "index": false }
      ]
    }
  ],
  "errors": [
    { "code": 6000, "name": "InvalidDecimals", "msg": "Invalid decimals value" },
    { "code": 6001, "name": "NameTooLong", "msg": "Token name too long" },
    { "code": 6002, "name": "SymbolTooLong", "msg": "Token symbol too long" },
    { "code": 6003, "name": "Unauthorized", "msg": "Unauthorized" },
    { "code": 6004, "name": "Overflow", "msg": "Overflow" },
    { "code": 6005, "name": "Underflow", "msg": "Underflow" }
  ]
} as any;

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

// Calculate Anchor discriminator: SHA256("anchor:instruction:{name}").slice(0, 8)
const getDiscriminatorSync = (name: string): Buffer => {
  // Use Node.js crypto if available, otherwise this will fail in browser
  // (We need async version for browser)
  try {
    // @ts-ignore - crypto may not be available in browser
    const cryptoModule = require('crypto');
    const hash = cryptoModule.createHash('sha256').update(`anchor:instruction:${name}`).digest();
    return hash.slice(0, 8);
  } catch {
    throw new Error("getDiscriminatorSync requires Node.js crypto module");
  }
};

// Async version for browser using SubtleCrypto (globalThis.crypto)
const getDiscriminatorAsync = async (name: string): Promise<Buffer> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(`anchor:instruction:${name}`);
  
  // Use globalThis.crypto.subtle (available in browser and Node.js 15+)
  const cryptoObj = globalThis.crypto || (typeof window !== 'undefined' ? window.crypto : null);
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error("crypto.subtle is not available");
  }
  
  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data as BufferSource);
  const discriminator = Buffer.from(hashBuffer).slice(0, 8);
  console.log(`Calculated discriminator for "${name}":`, discriminator.toString('hex'));
  return discriminator;
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
      const mint = Keypair.generate();
      const tokenConfig = Keypair.generate();
      const ownerTokenAccount = Keypair.generate();

      // Get discriminator with verification logging
      const discriminator = await getDiscriminatorAsync("createToken");
      console.log('✓ Discriminator computed:', discriminator.toString('hex'));

      // Manually serialize the instruction data
      const data = Buffer.alloc(1000);
      let offset = 0;

      // Add discriminator (8 bytes)
      discriminator.copy(data, offset);
      offset += 8;
      console.log('After discriminator, offset:', offset);

      // Serialize name (string = 4 bytes length + UTF-8 data)
      const nameBytes = Buffer.from(params.name, 'utf8');
      data.writeUInt32LE(nameBytes.length, offset);
      offset += 4;
      nameBytes.copy(data, offset);
      offset += nameBytes.length;
      console.log(`After name "${params.name}", offset:`, offset);

      // Serialize symbol (string = 4 bytes length + UTF-8 data)
      const symbolBytes = Buffer.from(params.symbol, 'utf8');
      data.writeUInt32LE(symbolBytes.length, offset);
      offset += 4;
      symbolBytes.copy(data, offset);
      offset += symbolBytes.length;
      console.log(`After symbol "${params.symbol}", offset:`, offset);

      // Serialize decimals (u8 = 1 byte)
      data.writeUInt8(params.decimals, offset);
      offset += 1;
      console.log('After decimals, offset:', offset);

      // Serialize initialSupply (u64 = 8 bytes, little endian)
      data.writeBigUInt64LE(BigInt(Math.floor(params.initialSupply)), offset);
      offset += 8;
      console.log('After initialSupply, offset:', offset);

      const finalData = data.slice(0, offset);
      console.log('Final instruction data (hex):', finalData.toString('hex'));

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

      console.log('Instruction created with program ID:', getProgramId().toString());

      // Create and send transaction
      const connection = this.getConnection();
      const recentBlockhash = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: this.provider.wallet.publicKey,
      });

      transaction.add(instruction);
      
      // Pre-sign with generated keypairs
      transaction.partialSign(mint, tokenConfig, ownerTokenAccount);

      // Sign with wallet
      const signedTx = await this.provider.wallet.signTransaction(transaction);

      console.log('Transaction constructed and signed');
      console.log('Sending createToken RPC...');
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
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
      const tokenConfigKey = new PublicKey(tokenConfigPubkey);
      const program = new Program(FORGE_IDL as any, getProgramId() as any, this.provider as any);

      console.log('Calling program.methods.mintTokens...');
      
      // We need to find the mint and token account from the tokenConfig
      // For now, use placeholder addresses - these would normally be fetched
      const signature = await program.methods
        .mintTokens(amount)
        .accounts({
          payer: this.provider.wallet.publicKey,
          tokenConfig: tokenConfigKey,
          mint: this.provider.wallet.publicKey,
          tokenAccount: this.provider.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('✓ Mint transaction sent! Signature:', signature);
      return signature;
    } catch (error) {
      console.error("Error minting tokens:", error);
      throw error;
    }
  }

  async burnTokens(tokenConfigPubkey: string, amount: number): Promise<string> {
    if (!this.provider) throw new Error("Wallet not connected");

    try {
      const tokenConfigKey = new PublicKey(tokenConfigPubkey);
      const program = new Program(FORGE_IDL as any, getProgramId() as any, this.provider as any);

      console.log('Calling program.methods.burnTokens...');
      
      // We need to find the mint and token account from the tokenConfig
      // For now, use placeholder addresses - these would normally be fetched
      const signature = await program.methods
        .burnTokens(amount)
        .accounts({
          payer: this.provider.wallet.publicKey,
          tokenConfig: tokenConfigKey,
          mint: this.provider.wallet.publicKey,
          tokenAccount: this.provider.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('✓ Burn transaction sent! Signature:', signature);
      return signature;
    } catch (error) {
      console.error("Error burning tokens:", error);
      throw error;
    }
  }
}
