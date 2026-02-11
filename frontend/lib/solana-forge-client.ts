import {
  Connection,
  PublicKey,
  TransactionInstruction,
  Keypair,
  Transaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";

const FORGE_TOKEN_PROGRAM_ID = new PublicKey(
  "ANQMN8NJ388hRxBVgKb3gs6Vb86YiqBvweHM3SAK7RZe"
);
const TOKEN_FACTORY_PROGRAM_ID = new PublicKey(
  "Aji23AvyHMCwaqBheVckw6dhNVhBb8WVHbKVUw8JWvHd"
);

function encodeString(s: string): Buffer {
  const bytes = Buffer.from(s, "utf-8");
  const length = Buffer.alloc(4);
  length.writeUInt32LE(bytes.length, 0);
  return Buffer.concat([length, bytes]);
}

function encodeU256(n: bigint): Buffer {
  const buf = Buffer.alloc(32);
  buf.writeBigUInt64LE(n & BigInt("0xFFFFFFFFFFFFFFFF"), 0);
  buf.writeBigUInt64LE((n >> BigInt(64)) & BigInt("0xFFFFFFFFFFFFFFFF"), 8);
  buf.writeBigUInt64LE((n >> BigInt(128)) & BigInt("0xFFFFFFFFFFFFFFFF"), 16);
  buf.writeBigUInt64LE((n >> BigInt(192)) & BigInt("0xFFFFFFFFFFFFFFFF"), 24);
  return buf;
}

function encodeU8(n: number): Buffer {
  const buf = Buffer.alloc(1);
  buf.writeUInt8(n, 0);
  return buf;
}

export interface TokenParams {
  name: string;
  symbol: string;
  initialSupply: bigint;
  maxSupply: bigint;
  decimals: number;
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
    return this.walletPublicKey;
  }

  async createToken(params: TokenParams): Promise<string> {
    if (!this.wallet || !this.walletPublicKey) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log("Creating token with params:", params);

      const dataAccount = Keypair.generate();
      const rentExempt =
        await this.connection.getMinimumBalanceForRentExemption(10000);

      const transaction = new Transaction();

      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: this.walletPublicKey,
          newAccountPubkey: dataAccount.publicKey,
          lamports: rentExempt,
          space: 10000,
          programId: FORGE_TOKEN_PROGRAM_ID,
        })
      );

      let instructionData = Buffer.concat([
        encodeString(params.name),
        encodeString(params.symbol),
        encodeU256(params.initialSupply),
        encodeU256(params.maxSupply),
        encodeU8(params.decimals),
        this.walletPublicKey.toBuffer(),
      ]);

      console.log(
        "Instruction data length:",
        instructionData.length,
        "bytes"
      );
      console.log(
        "Instruction data (first 100 hex):",
        instructionData.toString("hex").slice(0, 100)
      );

      const initInstruction = new TransactionInstruction({
        programId: FORGE_TOKEN_PROGRAM_ID,
        keys: [
          {
            pubkey: dataAccount.publicKey,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: SYSVAR_RENT_PUBKEY,
            isSigner: false,
            isWritable: false,
          },
        ],
        data: instructionData,
      });

      transaction.add(initInstruction);

      transaction.feePayer = this.walletPublicKey;
      const blockHash = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockHash.blockhash;

      console.log("Signing transaction...");
      const signedTx = await this.wallet.signTransaction(transaction);

      console.log("Partially signing with data account...");
      signedTx.partialSign(dataAccount);

      console.log("Sending transaction...");
      const signature = await this.connection.sendRawTransaction(
        signedTx.serialize(),
        { skipPreflight: false }
      );

      console.log("Confirming transaction...");
      await this.connection.confirmTransaction(signature);

      console.log("✅ Token created successfully!");
      console.log("Data account:", dataAccount.publicKey.toString());
      console.log("Transaction signature:", signature);

      return signature;
    } catch (error: any) {
      console.error("❌ Create token error:", error);
      if (error.logs) {
        console.error("Transaction logs:", error.logs);
      }
      throw error;
    }
  }

  async registerToken(
    tokenAddress: PublicKey,
    params: TokenParams
  ): Promise<string> {
    if (!this.wallet || !this.walletPublicKey) {
      throw new Error("Wallet not connected");
    }

    try {
      const dataAccount = Keypair.generate();
      const rentExempt =
        await this.connection.getMinimumBalanceForRentExemption(10000);

      const transaction = new Transaction();

      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: this.walletPublicKey,
          newAccountPubkey: dataAccount.publicKey,
          lamports: rentExempt,
          space: 10000,
          programId: TOKEN_FACTORY_PROGRAM_ID,
        })
      );

      let instructionData = Buffer.concat([
        tokenAddress.toBuffer(),
        encodeString(params.name),
        encodeString(params.symbol),
        this.walletPublicKey.toBuffer(),
      ]);

      const registerInstruction = new TransactionInstruction({
        programId: TOKEN_FACTORY_PROGRAM_ID,
        keys: [
          {
            pubkey: dataAccount.publicKey,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: SYSVAR_RENT_PUBKEY,
            isSigner: false,
            isWritable: false,
          },
        ],
        data: instructionData,
      });

      transaction.add(registerInstruction);

      transaction.feePayer = this.walletPublicKey;
      const blockHash = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockHash.blockhash;

      const signedTx = await this.wallet.signTransaction(transaction);
      signedTx.partialSign(dataAccount);

      const signature = await this.connection.sendRawTransaction(
        signedTx.serialize()
      );

      await this.connection.confirmTransaction(signature);

      console.log("Token registered in factory");
      console.log("Transaction signature:", signature);

      return signature;
    } catch (error: any) {
      console.error("Register token error:", error);
      if (error.logs) {
        console.error("Transaction logs:", error.logs);
      }
      throw error;
    }
  }

  async mintTokens(
    tokenDataAccount: PublicKey,
    to: PublicKey,
    amount: bigint
  ): Promise<string> {
    if (!this.wallet || !this.walletPublicKey) {
      throw new Error("Wallet not connected");
    }

    try {
      let instructionData = Buffer.concat([
        this.walletPublicKey.toBuffer(),
        to.toBuffer(),
        encodeU256(amount),
      ]);

      const mintInstruction = new TransactionInstruction({
        programId: FORGE_TOKEN_PROGRAM_ID,
        keys: [
          {
            pubkey: tokenDataAccount,
            isSigner: false,
            isWritable: true,
          },
        ],
        data: instructionData,
      });

      const transaction = new Transaction();
      transaction.add(mintInstruction);
      transaction.feePayer = this.walletPublicKey;

      const blockHash = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockHash.blockhash;

      const signedTx = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(
        signedTx.serialize()
      );

      await this.connection.confirmTransaction(signature);

      console.log("Tokens minted");
      console.log("Transaction signature:", signature);

      return signature;
    } catch (error: any) {
      console.error("Mint error:", error);
      if (error.logs) {
        console.error("Transaction logs:", error.logs);
      }
      throw error;
    }
  }
}

export default SolanaForgeClient;
