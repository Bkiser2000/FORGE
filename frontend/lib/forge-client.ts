import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { BN } from "bn.js";

const DEVNET_RPC = "https://api.devnet.solana.com";

// Compute Anchor instruction discriminator from instruction name using Web Crypto API
const computeDiscriminator = async (ixName: string): Promise<Buffer> => {
  const name = `instruction:${ixName}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(name);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as BufferSource);
  return Buffer.from(hashBuffer).slice(0, 8);
};

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

      // Get IDL - prioritize local cache for development
      console.log('Attempting to fetch IDL...');
      let idl: any = null;
      
      // Try to load local IDL first (more reliable for development)
      try {
        console.log('Fetching local IDL from /forge-idl.json...');
        const response = await fetch('/forge-idl.json', {
          cache: 'no-cache',
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const parsedIdl = await response.json();
        console.log('Local IDL fetch response:', typeof parsedIdl, Object.keys(parsedIdl || {}).slice(0, 5));
        
        if (!parsedIdl) {
          throw new Error('Local IDL parsed as null/undefined');
        }
        if (!parsedIdl.instructions) {
          throw new Error('Local IDL missing instructions field');
        }
        
        idl = parsedIdl;
        console.log('✓ IDL loaded from local cache. Instructions:', idl.instructions.length);
      } catch (fetchErr) {
        console.warn('Failed to load IDL from local cache, trying on-chain...', fetchErr);
        
        // Fallback to on-chain IDL
        try {
          console.log('Trying to fetch IDL from on-chain...');
          idl = await anchor.Program.fetchIdl(getProgramId(), this.provider);
          if (idl) {
            console.log('✓ IDL fetched from on-chain');
          } else {
            throw new Error('On-chain IDL returned null');
          }
        } catch (onChainErr) {
          console.error('Failed to fetch IDL from on-chain:', onChainErr);
          throw new Error(
            `IDL not found in local cache or on-chain. Local error: ${fetchErr instanceof Error ? fetchErr.message : 'Unknown'}, On-chain error: ${onChainErr instanceof Error ? onChainErr.message : 'Unknown'}`
          );
        }
      }

      if (!idl) {
        throw new Error("IDL is null/undefined after all attempts - Contract may not be properly configured");
      }
      if (!idl.instructions || idl.instructions.length === 0) {
        throw new Error("IDL has no instructions - Contract IDL may be corrupted");
      }

      console.log('✓ IDL loaded successfully:', (idl as any).name);
      
      // Build transaction manually without using anchor.Program to avoid "_bn" parsing error
      console.log('Building createToken instruction manually...');
      
      // Generate keypairs for mint and tokenConfig accounts
      const mint = anchor.web3.Keypair.generate();
      const tokenConfig = anchor.web3.Keypair.generate();
      
      console.log('Generated keypairs:');
      console.log('  mint:', mint.publicKey.toString());
      console.log('  tokenConfig:', tokenConfig.publicKey.toString());

      // Create ownerTokenAccount - just generate a keypair for simplicity
      const ownerTokenAccount = anchor.web3.Keypair.generate();
      
      console.log('Generated ownerTokenAccount:', ownerTokenAccount.publicKey.toString());
      
      // Encode the arguments manually to avoid Anchor parsing
      const buffer = Buffer.alloc(1000);
      let offset = 0;
      
      // Discriminator (8 bytes) - Anchor IDL uses camelCase: "createToken"
      // Even though Rust function is create_token, the discriminator is based on IDL name
      const discriminator = await computeDiscriminator('createToken');
      console.log('Computed discriminator for "createToken":', discriminator.toString('hex'));
      console.log('Discriminator bytes:', Array.from(discriminator).map(b => '0x' + b.toString(16).padStart(2, '0')).join(', '));
      discriminator.copy(buffer, offset);
      offset += 8;
      
      // Encode string arguments with length prefix
      const nameBuffer = Buffer.from(params.name, 'utf8');
      buffer.writeUInt32LE(nameBuffer.length, offset);
      offset += 4;
      nameBuffer.copy(buffer, offset);
      offset += nameBuffer.length;
      
      const symbolBuffer = Buffer.from(params.symbol, 'utf8');
      buffer.writeUInt32LE(symbolBuffer.length, offset);
      offset += 4;
      symbolBuffer.copy(buffer, offset);
      offset += symbolBuffer.length;
      
      // Decimals (u8)
      buffer.writeUInt8(params.decimals, offset);
      offset += 1;
      
      // InitialSupply (u64 - as little-endian)
      const supplyBN = new BN(params.initialSupply);
      const supplyBuffer = supplyBN.toArray('le', 8);
      Buffer.from(supplyBuffer).copy(buffer, offset);
      offset += 8;
      
      const instructionData = buffer.slice(0, offset);
      
      console.log('✓ Instruction data built, length:', instructionData.length);
      console.log('Building instruction with accounts...');
      
      // Use program ID constants
      const systemProgram = anchor.web3.SystemProgram.programId;
      const rentSysvar = anchor.web3.SYSVAR_RENT_PUBKEY;
      
      console.log('System program:', systemProgram.toString());
      console.log('Rent sysvar:', rentSysvar.toString());
      
      // Create keys array - use pre-initialized PROGRAM_ID and imported TOKEN_PROGRAM_ID
      console.log('Creating instruction with keys...');
      let keys: any[];
      try {
        // All PublicKeys that were already generated
        const walletPubkey = this.provider.wallet.publicKey;
        const tokenConfigPubkey = tokenConfig.publicKey;
        const mintPubkey = mint.publicKey;
        const ownerTokenAccountPubkey = ownerTokenAccount.publicKey;
        
        console.log('Pre-collected existing PublicKeys');
        
        // Get TOKEN_PROGRAM_ID from imported constant (no creation)
        const tokenProgramIdKey = getTokenProgramId();
        console.log('✓ Got token program ID:', tokenProgramIdKey.toString());
        
        keys = [
          { pubkey: walletPubkey, isSigner: true, isWritable: true },
          { pubkey: tokenConfigPubkey, isSigner: true, isWritable: true },
          { pubkey: mintPubkey, isSigner: true, isWritable: true },
          { pubkey: ownerTokenAccountPubkey, isSigner: true, isWritable: true },
          { pubkey: systemProgram, isSigner: false, isWritable: false },
          { pubkey: tokenProgramIdKey, isSigner: false, isWritable: false },
          { pubkey: rentSysvar, isSigner: false, isWritable: false },
        ];
        
        console.log('✓ Keys array built successfully');
      } catch (keyErr) {
        console.error('Error creating keys array:', keyErr);
        throw new Error(`Failed to create instruction keys: ${keyErr instanceof Error ? keyErr.message : 'Unknown error'}`);
      }
      
      console.log('Keys:', {
        payer: this.provider.wallet.publicKey.toString(),
        tokenConfig: tokenConfig.publicKey.toString(),
        mint: mint.publicKey.toString(),
        ownerTokenAccount: ownerTokenAccount.publicKey.toString(),
        systemProgram: systemProgram.toString(),
        tokenProgram: getTokenProgramIdString(),
        rentSysvar: rentSysvar.toString(),
      });
      
      let instruction: anchor.web3.TransactionInstruction;
      try {
        const programIdForInstruction = getProgramId();
        instruction = new anchor.web3.TransactionInstruction({
          programId: programIdForInstruction,
          keys: keys,
          data: instructionData,
        });
        console.log('✓ Instruction created successfully');
      } catch (instrErr) {
        console.error('Error creating TransactionInstruction:', instrErr);
        throw new Error(`Failed to create instruction: ${instrErr instanceof Error ? instrErr.message : 'Unknown error'}`);
      }
      
      // Build transaction
      const transaction = new anchor.web3.Transaction().add(instruction);
      transaction.feePayer = this.provider.wallet.publicKey;
      
      // Get recent blockhash - do this as late as possible, right before signing
      console.log('Getting fresh blockhash...');
      const { blockhash } = await this.getConnection().getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
      console.log('✓ Got blockhash:', blockhash);
      
      console.log('✓ Transaction built, signing...');
      
      // Sign transaction with keypairs
      transaction.sign(mint, tokenConfig, ownerTokenAccount);
      
      // Sign with wallet
      const signedTx = await this.provider.wallet.signTransaction(transaction);
      
      console.log('✓ Transaction signed, sending...');
      
      // Send transaction with retry logic for blockhash expiration
      let signature: string;
      let retries = 3;
      
      while (retries > 0) {
        try {
          // Send transaction
          signature = await this.getConnection().sendRawTransaction(signedTx.serialize(), {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
          });
          console.log('✓ Transaction sent! Signature:', signature);
          break;
        } catch (sendErr) {
          retries--;
          if (retries > 0 && sendErr instanceof Error && sendErr.message.includes('Blockhash not found')) {
            console.warn('Blockhash expired, retrying with fresh blockhash...', sendErr.message);
            
            // Get a fresh blockhash and re-sign
            const { blockhash: newBlockhash } = await this.getConnection().getLatestBlockhash('finalized');
            const newTransaction = new anchor.web3.Transaction().add(instruction);
            newTransaction.feePayer = this.provider.wallet.publicKey;
            newTransaction.recentBlockhash = newBlockhash;
            newTransaction.sign(mint, tokenConfig, ownerTokenAccount);
            const newSignedTx = await this.provider.wallet.signTransaction(newTransaction);
            
            // Update for next attempt
            Object.assign(signedTx, newSignedTx);
          } else {
            console.error('Failed to send transaction:', sendErr);
            throw sendErr;
          }
        }
      }
      
      if (!signature!) {
        throw new Error('Failed to send transaction after retries');
      }
      
      // Wait for confirmation
      console.log('Waiting for transaction confirmation...');
      const confirmation = await this.getConnection().confirmTransaction(signature, 'confirmed');
      console.log('✓ Transaction confirmed');
      
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

      const idlWithProgramId = { ...idl, metadata: { address: getProgramId().toString() } };
      const program = new anchor.Program(idlWithProgramId as any, this.provider);
      const tokenConfigKey = new PublicKey(tokenConfigPubkey);

      // This would need the actual mint and token account addresses
      // In a real implementation, you'd fetch these from chain
      const tx = await program.methods
        .mintTokens(Math.floor(amount))
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

      const idlWithProgramId = { ...idl, metadata: { address: getProgramId().toString() } };
      const program = new anchor.Program(idlWithProgramId as any, this.provider);
      const tokenConfigKey = new PublicKey(tokenConfigPubkey);

      const tx = await program.methods
        .burnTokens(Math.floor(amount))
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
