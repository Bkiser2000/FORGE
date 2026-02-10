import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Keypair,
} from '@solana/web3.js';
import { 
  Program, 
  AnchorProvider, 
  Idl,
  BN,
} from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

const DEVNET_RPC = "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey("DkkU1jrPLiK2uEnJTBicEijdyyttr2rXHQWCijtRRgUz");

// Simple IDL type for the Anchor program - Anchor will auto-generate this at runtime
const IDL = require('../idl/forge_solana.json');

export interface CreateTokenParams {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: number;
}

export class AnchorForgeClient {
  private provider: AnchorProvider | null = null;
  private program: Program<any> | null = null;

  constructor(provider?: any) {
    if (provider) {
      this.connectWallet(provider);
    }
  }

  connectWallet(provider: any): void {
    try {
      const connection = new Connection(DEVNET_RPC, "confirmed");
      
      // Create AnchorProvider from wallet
      this.provider = new AnchorProvider(
        connection,
        {
          publicKey: provider.wallet.publicKey,
          signTransaction: provider.wallet.signTransaction.bind(provider.wallet),
          signAllTransactions: provider.wallet.signAllTransactions.bind(provider.wallet),
        },
        { commitment: "confirmed" }
      );

      this.program = new Program(IDL, PROGRAM_ID, this.provider);
      console.log('✓ Anchor wallet connected:', provider.wallet.publicKey.toString());
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  private ensureConnected(): void {
    if (!this.provider || !this.program) {
      throw new Error("Wallet not connected. Call connectWallet first.");
    }
  }

  /**
   * Create a new token using Anchor program
   */
  async createToken(params: CreateTokenParams): Promise<string> {
    this.ensureConnected();

    try {
      console.log('Creating token:', params);

      const mint = Keypair.generate();
      const tokenConfig = Keypair.generate();
      
      const ownerAta = await getAssociatedTokenAddress(
        mint.publicKey,
        this.provider!.wallet.publicKey
      );

      console.log('Generated keypairs:');
      console.log('  mint:', mint.publicKey.toString());
      console.log('  tokenConfig:', tokenConfig.publicKey.toString());
      console.log('  ownerAta:', ownerAta.toString());
      console.log('  payer:', this.provider!.wallet.publicKey.toString());

      const accountsObj = {
        payer: this.provider!.wallet.publicKey,
        mint: mint.publicKey,
        tokenConfig: tokenConfig.publicKey,
        ownerTokenAccount: ownerAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      };

      console.log('Accounts to send:');
      Object.entries(accountsObj).forEach(([key, value]) => {
        console.log(`  ${key}: ${value.toString()}`);
      });

      const tx = await this.program!.methods
        .createToken(
          params.name,
          params.symbol,
          params.decimals,
          new BN(params.initialSupply)
        )
        .accounts(accountsObj)
        .signers([mint, tokenConfig])
        .rpc();

      console.log('✓ Token created! Signature:', tx);
      return tx;
    } catch (error) {
      console.error('Failed to create token:', error);
      throw error;
    }
  }
}

export default AnchorForgeClient;
