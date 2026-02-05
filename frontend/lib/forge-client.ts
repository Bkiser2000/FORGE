import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Idl } from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";

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

      console.log('✓ IDL loaded successfully:', idl.name, '- Version:', idl.version);
      console.log('IDL type:', typeof idl, 'IDL keys:', Object.keys(idl || {}).slice(0, 10));
      console.log('Program ID:', PROGRAM_ID.toString());
      console.log('Provider wallet:', this.provider?.wallet?.publicKey?.toString());
      
      let program;
      try {
        console.log('Step 1: Checking IDL structure...');
        console.log('  Has metadata:', !!(idl as any).metadata);
        console.log('  Has accounts:', !!(idl as any).accounts);
        console.log('  Has instructions:', Array.isArray((idl as any).instructions) ? (idl as any).instructions.length : 'not array');
        
        // Add metadata if missing (required for Anchor 0.32+)
        const idlWithMetadata = {
          ...idl,
          metadata: (idl as any).metadata || { name: "forge_solana", spec: "0.1.0" }
        };
        
        console.log('Step 2: Creating Program instance...');
        // Use any cast to bypass TypeScript issues
        program = new (anchor.Program as any)(idlWithMetadata, PROGRAM_ID, this.provider);
        console.log('✓ Program instance created successfully');
      } catch (err1) {
        console.error('❌ Constructor failed:', err1 instanceof Error ? err1.message : String(err1));
        console.error('Full error:', err1);
        throw new Error(`Failed to create Program: ${err1 instanceof Error ? err1.message : String(err1)}`);
      }

      // Generate keypairs for new accounts
      const tokenConfig = anchor.web3.Keypair.generate();
      const mint = anchor.web3.Keypair.generate();
      const ownerTokenAccount = anchor.web3.Keypair.generate();
      
      console.log('Generated keypairs:');
      console.log('  tokenConfig:', tokenConfig.publicKey.toString());
      console.log('  mint:', mint.publicKey.toString());
      console.log('  ownerTokenAccount:', ownerTokenAccount.publicKey.toString());

      // Convert supply to the correct format for u64
      const supplyWithDecimals = params.initialSupply * Math.pow(10, params.decimals);
      console.log('Supply calculation:', { initialSupply: params.initialSupply, decimals: params.decimals, total: supplyWithDecimals });
      
      // Pass supply amount directly - Anchor will handle conversion
      const supplyAmount = Math.floor(supplyWithDecimals);
      console.log('Supply amount:', supplyAmount, 'Type:', typeof supplyAmount);

      console.log('Building transaction...');
      let builder;
      try {
        builder = program.methods
          .createToken(
            params.name,
            params.symbol,
            params.decimals,
            supplyAmount
          );
        console.log('✓ Method builder created successfully');
      } catch (builderErr) {
        console.error('❌ Error building method:', builderErr);
        throw new Error(`Failed to build createToken method: ${builderErr instanceof Error ? builderErr.message : String(builderErr)}`);
      }

      try {
        builder = builder
          .accounts({
            payer: this.provider.wallet.publicKey,
            tokenConfig: tokenConfig.publicKey,
            mint: mint.publicKey,
            ownerTokenAccount: ownerTokenAccount.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: new PublicKey("TokenkegQfeZyiNwAJsyFbPVwwQQfuE32gencpExFACQ"),
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([tokenConfig, mint, ownerTokenAccount]);
        console.log('✓ Accounts and signers configured');
      } catch (accountsErr) {
        console.error('❌ Error configuring accounts:', accountsErr);
        throw new Error(`Failed to configure accounts: ${accountsErr instanceof Error ? accountsErr.message : String(accountsErr)}`);
      }

      console.log('Sending transaction...');
      let tx;
      try {
        tx = await builder.rpc();
        console.log('=== Transaction Successful ===');
        console.log('Transaction hash:', tx);
      } catch (rpcErr) {
        console.error('❌ RPC Error:', rpcErr);
        throw new Error(`Transaction failed: ${rpcErr instanceof Error ? rpcErr.message : String(rpcErr)}`);
      }
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
