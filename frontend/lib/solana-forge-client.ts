import {
  Connection,
  PublicKey,
  Keypair,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

// Lazy-load program IDs to avoid build-time execution
let TOKEN_PROGRAM_ID: PublicKey | null = null;
let ASSOCIATED_TOKEN_PROGRAM_ID: PublicKey | null = null;

function getTokenProgramId(): PublicKey {
  if (!TOKEN_PROGRAM_ID) {
    TOKEN_PROGRAM_ID = new PublicKey(
      "TokenkegQfeZyiNwAJsyFbPVwwQQfk5LsKZoHon136"
    );
  }
  return TOKEN_PROGRAM_ID;
}

function getAssociatedTokenProgramId(): PublicKey {
  if (!ASSOCIATED_TOKEN_PROGRAM_ID) {
    ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
      "ATokenGPvbdGVqstVQmcLsNZAqeEDVTXH9EYDias7RAJ8"
    );
  }
  return ASSOCIATED_TOKEN_PROGRAM_ID;
}

export interface TokenParams {
  name: string;
  symbol: string;
  initialSupply: bigint;
  maxSupply: bigint;
  decimals: number;
}

export interface CreatedToken {
  mint: PublicKey;
  owner: PublicKey;
  txSignature: string;
}

export class SolanaForgeClient {
  private connection: Connection;
  private walletPublicKey: PublicKey | null = null;
  private wallet: any = null;

  constructor(rpcEndpoint: string = "https://api.devnet.solana.com") {
    this.connection = new Connection(rpcEndpoint, "confirmed");
  }

  connectWallet(provider: any) {
    this.wallet = provider;
    this.walletPublicKey = provider.publicKey;
    console.log("Wallet connected:", this.walletPublicKey.toString());
    return this.walletPublicKey;
  }

  /**
   * Create a new token using Solana's native SPL Token program
   * This bypasses custom contract issues and uses battle-tested infrastructure
   */
  async createToken(params: TokenParams): Promise<CreatedToken> {
    if (!this.wallet || !this.walletPublicKey) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log("Creating SPL token with params:", params);

      // Generate new mint keypair
      const mintKeypair = Keypair.generate();
      console.log("Generated mint:", mintKeypair.publicKey.toString());

      // Get or create associated token account for the owner
      const ata = await getOrCreateAssociatedTokenAccount(
        this.connection,
        this.wallet,
        mintKeypair.publicKey,
        this.walletPublicKey,
        false,
        "confirmed",
        undefined,
        getTokenProgramId(),
        getAssociatedTokenProgramId()
      );

      console.log("Associated token account:", ata.address.toString());

      // Create the mint
      const mint = await createMint(
        this.connection,
        this.wallet,
        this.walletPublicKey, // mint authority
        this.walletPublicKey, // freeze authority
        Number(params.decimals),
        mintKeypair,
        undefined,
        getTokenProgramId()
      );

      console.log("✅ Mint created:", mint.toString());

      // Mint initial supply to the owner's ATA
      if (params.initialSupply > BigInt(0)) {
        const txSignature = await mintTo(
          this.connection,
          this.wallet,
          mint,
          ata.address,
          this.walletPublicKey,
          Number(params.initialSupply),
          [],
          undefined,
          getTokenProgramId()
        );

        console.log("✅ Initial supply minted:", txSignature);

        return {
          mint,
          owner: this.walletPublicKey,
          txSignature,
        };
      }

      // Return mint info even if no initial minting
      return {
        mint,
        owner: this.walletPublicKey,
        txSignature: "no_mint_tx",
      };
    } catch (error: any) {
      console.error("❌ Create token error:", error);
      if (error.logs) {
        console.error("Transaction logs:", error.logs);
      }
      throw error;
    }
  }

  /**
   * Mint additional tokens to an account
   */
  async mintTokens(
    mint: PublicKey,
    to: PublicKey,
    amount: bigint
  ): Promise<string> {
    if (!this.wallet || !this.walletPublicKey) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log("Minting tokens:", {
        mint: mint.toString(),
        to: to.toString(),
        amount: amount.toString(),
      });

      const signature = await mintTo(
        this.connection,
        this.wallet,
        mint,
        to,
        this.walletPublicKey,
        Number(amount),
        [],
        undefined,
        getTokenProgramId()
      );

      console.log("✅ Tokens minted:", signature);
      return signature;
    } catch (error: any) {
      console.error("❌ Mint error:", error);
      throw error;
    }
  }

  /**
   * Get token supply
   */
  async getTokenSupply(mint: PublicKey): Promise<bigint> {
    try {
      const supply = await this.connection.getTokenSupply(mint);
      return BigInt(supply.value.amount);
    } catch (error) {
      console.error("Error getting token supply:", error);
      throw error;
    }
  }
}

export default SolanaForgeClient;
