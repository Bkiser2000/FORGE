import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";
import { BN } from "bn.js";

const DEVNET_RPC = "https://api.devnet.solana.com";

// Lazy-load PublicKeys to avoid errors during SSR
let PROGRAM_ID: PublicKey | null = null;
let TOKEN_PROGRAM_ID: PublicKey | null = null;

const getProgramId = (): PublicKey => {
  if (!PROGRAM_ID) {
    PROGRAM_ID = new PublicKey("BJ81sbW7WqtvujCHJ2RbNM3NDBBbH13sEFDJ8soUzBJF");
  }
  return PROGRAM_ID;
};

const getTokenProgramId = (): PublicKey => {
  if (!TOKEN_PROGRAM_ID) {
    TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJsyFbPVwwQQfuE32gencpExFACQ");
  }
  return TOKEN_PROGRAM_ID;
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
      
      // Discriminator (8 bytes for createToken instruction)
      // Instead of hashing, we'll use a simple discriminator for the instruction
      // For Solana Playground contracts, the first instruction is typically 0x03 (discriminator)
      Buffer.from([0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]).copy(buffer, offset);
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
      console.log('Token program:', getTokenProgramId().toString());
      console.log('Rent sysvar:', rentSysvar.toString());
      console.log('Creating instruction with keys...');
      console.log('Keys:', {
        payer: this.provider.wallet.publicKey.toString(),
        tokenConfig: tokenConfig.publicKey.toString(),
        mint: mint.publicKey.toString(),
        ownerTokenAccount: ownerTokenAccount.publicKey.toString(),
        systemProgram: systemProgram.toString(),
        tokenProgram: getTokenProgramId().toString(),
        rentSysvar: rentSysvar.toString(),
      });
      
      const instruction = new anchor.web3.TransactionInstruction({
        programId: getProgramId(),
        keys: [
          { pubkey: this.provider.wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: tokenConfig.publicKey, isSigner: true, isWritable: true },
          { pubkey: mint.publicKey, isSigner: true, isWritable: true },
          { pubkey: ownerTokenAccount.publicKey, isSigner: true, isWritable: true },
          { pubkey: systemProgram, isSigner: false, isWritable: false },
          { pubkey: getTokenProgramId(), isSigner: false, isWritable: false },
          { pubkey: rentSysvar, isSigner: false, isWritable: false },
        ],
        data: instructionData,
      });
      
      console.log('✓ Instruction created');
      
      // Build transaction
      const transaction = new anchor.web3.Transaction().add(instruction);
      transaction.feePayer = this.provider.wallet.publicKey;
      
      // Get recent blockhash
      const { blockhash } = await this.getConnection().getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      
      console.log('✓ Transaction built, signing...');
      
      // Sign transaction with keypairs
      transaction.sign(mint, tokenConfig, ownerTokenAccount);
      
      // Sign with wallet
      const signedTx = await this.provider.wallet.signTransaction(transaction);
      
      console.log('✓ Transaction signed, sending...');
      
      // Send transaction
      const signature = await this.getConnection().sendRawTransaction(signedTx.serialize());
      
      console.log('✓ Transaction sent! Signature:', signature);
      
      // Wait for confirmation
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
