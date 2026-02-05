import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Idl, Program } from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";
import { BN } from "bn.js";

const PROGRAM_ID = new PublicKey("BJ81sbW7WqtvujCHJ2RbNM3NDBBbH13sEFDJ8soUzBJF");
const DEVNET_RPC = "https://api.devnet.solana.com";

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
  private connection: Connection;
  private wallet: any;
  private provider: AnchorProvider | null = null;

  constructor(wallet: any) {
    this.connection = new Connection(DEVNET_RPC, "confirmed");
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

      this.provider = new AnchorProvider(
        this.connection,
        walletAdapter as any,
        { commitment: "confirmed", preflightCommitment: "confirmed" }
      );
      anchor.setProvider(this.provider);
    }
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
          idl = await anchor.Program.fetchIdl(PROGRAM_ID, this.provider);
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
      
      // The Anchor Program constructor is failing due to IDL structure issues
      // Let's try to diagnose and fix the IDL
      console.log('IDL Keys:', Object.keys(idl || {}).sort());
      console.log('Instructions:', idl.instructions.map((i: any) => i.name));
      console.log('Accounts:', idl.accounts?.map((a: any) => a.name) || []);
      
      // Create the Program instance with the corrected IDL
      console.log('Creating Program instance...');
      const program = new (anchor.Program as any)(idl, PROGRAM_ID, this.provider);
      console.log('✓ Program instance created successfully');

      // Generate keypairs for mint and tokenConfig accounts
      const mint = anchor.web3.Keypair.generate();
      const tokenConfig = anchor.web3.Keypair.generate();
      
      console.log('Generated keypairs:');
      console.log('  mint:', mint.publicKey.toString());
      console.log('  tokenConfig:', tokenConfig.publicKey.toString());

      // Create the ownerTokenAccount address (PDA or derived address)
      const ownerTokenAccount = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("token-account"), this.provider.wallet.publicKey.toBuffer()],
        new PublicKey("TokenkegQfeZyiNwAJsyFbPVwwQQfuE32gencpExFACQ")
      );

      console.log('ownerTokenAccount:', ownerTokenAccount[0].toString());

      // Build and send transaction
      console.log('Building createToken transaction...');
      console.log('Args:', {
        name: params.name,
        symbol: params.symbol,
        decimals: params.decimals,
        initialSupply: params.initialSupply,
        initialSupplyBN: new BN(params.initialSupply).toString()
      });
      
      const tx = await program.methods
        .createToken(
          params.name,
          params.symbol,
          params.decimals,
          new BN(params.initialSupply)
        )
        .accounts({
          payer: this.provider.wallet.publicKey,
          tokenConfig: tokenConfig.publicKey,
          mint: mint.publicKey,
          ownerTokenAccount: ownerTokenAccount[0],
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: new PublicKey("TokenkegQfeZyiNwAJsyFbPVwwQQfuE32gencpExFACQ"),
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([mint, tokenConfig])
        .rpc();

      console.log('✓ Token created successfully! Tx:', tx);
      return tx;
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
      const idl = await anchor.Program.fetchIdl(PROGRAM_ID, this.provider);
      if (!idl) throw new Error("IDL not found");

      const program = new (anchor.Program as any)(idl, PROGRAM_ID, this.provider);
      const tokenConfigKey = new PublicKey(tokenConfigPubkey);

      // This would need the actual mint and token account addresses
      // In a real implementation, you'd fetch these from chain
      const tx = await program.methods
        .mintTokens(Math.floor(amount))
        .accounts({
          payer: this.provider.wallet.publicKey,
          tokenConfig: tokenConfigKey,
          tokenProgram: new PublicKey("TokenkegQfeZyiNwAJsyFbPVwwQQfuE32gencpExFACQ"),
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
      const idl = await anchor.Program.fetchIdl(PROGRAM_ID, this.provider);
      if (!idl) throw new Error("IDL not found");

      const program = new (anchor.Program as any)(idl, PROGRAM_ID, this.provider);
      const tokenConfigKey = new PublicKey(tokenConfigPubkey);

      const tx = await program.methods
        .burnTokens(Math.floor(amount))
        .accounts({
          payer: this.provider.wallet.publicKey,
          tokenConfig: tokenConfigKey,
          tokenProgram: new PublicKey("TokenkegQfeZyiNwAJsyFbPVwwQQfuE32gencpExFACQ"),
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error("Error burning tokens:", error);
      throw error;
    }
  }

  getConnection(): Connection {
    return this.connection;
  }

  getProgramId(): PublicKey {
    return PROGRAM_ID;
  }
}

export default ForgeClient;
