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
        signAllTransactions: wallet.signAllTransactions || async (txs: any[]) => {
          if (wallet.signTransaction) {
            return Promise.all(txs.map(tx => wallet.signTransaction(tx)));
          }
          return txs;
        },
        signTransaction: wallet.signTransaction || async (tx: any) => tx,
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
      // Get IDL from Anchor
      const idl = await anchor.Program.fetchIdl(PROGRAM_ID, this.provider);
      if (!idl) throw new Error("IDL not found");

      const program = new (anchor.Program as any)(idl, PROGRAM_ID, this.provider);

      // Generate keypairs for new accounts
      const tokenConfig = anchor.web3.Keypair.generate();
      const mint = anchor.web3.Keypair.generate();
      const ownerTokenAccount = anchor.web3.Keypair.generate();

      const tx = await program.methods
        .createToken(
          params.name,
          params.symbol,
          params.decimals,
          new anchor.BN(params.initialSupply * Math.pow(10, params.decimals))
        )
        .accounts({
          payer: this.provider.wallet.publicKey,
          tokenConfig: tokenConfig.publicKey,
          mint: mint.publicKey,
          ownerTokenAccount: ownerTokenAccount.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: new PublicKey("TokenkegQfeZyiNwAJsyFbPVwwQQfuE32gencpExFACQ"),
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([tokenConfig, mint, ownerTokenAccount])
        .rpc();

      return tx;
    } catch (error) {
      console.error("Error creating token:", error);
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
        .mintTokens(new anchor.BN(amount))
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
        .burnTokens(new anchor.BN(amount))
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
