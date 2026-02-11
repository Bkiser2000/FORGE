import {
  Connection,
  PublicKey,
  TransactionInstruction,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";

// Deployed program IDs from Solang compilation
const FORGE_TOKEN_PROGRAM_ID = new PublicKey(
  "ANQMN8NJ388hRxBVgKb3gs6Vb86YiqBvweHM3SAK7RZe"
);
const TOKEN_FACTORY_PROGRAM_ID = new PublicKey(
  "Aji23AvyHMCwaqBheVckw6dhNVhBb8WVHbKVUw8JWvHd"
);

// Solang function selectors (8-byte, Keccak256-based)
const INITIALIZE_SELECTOR = Buffer.from([
  0x6d, 0x0b, 0xd5, 0xf4, 0x9b, 0x11, 0x6f, 0x10,
]); // initialize
const MINT_SELECTOR = Buffer.from([
  0x84, 0x60, 0xbe, 0x69, 0xb3, 0xc9, 0x08, 0xae,
]); // mint
const TRANSFER_SELECTOR = Buffer.from([
  0x52, 0xa3, 0x8a, 0xc6, 0x6b, 0xda, 0x9c, 0x80,
]); // transfer
const BURN_SELECTOR = Buffer.from([
  0x42, 0x96, 0x6c, 0x68, 0x02, 0xc8, 0xa6, 0x1e,
]); // burn
const PAUSE_SELECTOR = Buffer.from([
  0x24, 0x7f, 0x28, 0x21, 0x10, 0xab, 0x44, 0xc5,
]); // pause
const UNPAUSE_SELECTOR = Buffer.from([
  0x3b, 0xcd, 0x62, 0x07, 0x28, 0x77, 0x52, 0x6f,
]); // unpause

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

  /**
   * Create a new token via ForgeToken contract
   */
  async createToken(params: TokenParams): Promise<string> {
    if (!this.wallet || !this.walletPublicKey) {
      throw new Error("Wallet not connected");
    }

    // Create data account to store token state
    const dataAccount = Keypair.generate();
    const rentExempt =
      await this.connection.getMinimumBalanceForRentExemption(10000);

    const transaction = new Transaction();

    // Step 1: Create data account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: this.walletPublicKey,
        newAccountPubkey: dataAccount.publicKey,
        lamports: rentExempt,
        space: 10000,
        programId: FORGE_TOKEN_PROGRAM_ID,
      })
    );

    // Step 2: Build initialize instruction
    const initData = this.buildInitializeData(params, this.walletPublicKey);

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
      data: initData,
    });

    transaction.add(initInstruction);

    // Sign and send transaction
    transaction.feePayer = this.walletPublicKey;
    const blockHash = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockHash.blockhash;

    const signedTx = await this.wallet.signTransaction(transaction);
    const signature = await this.connection.sendRawTransaction(
      signedTx.serialize()
    );

    await this.connection.confirmTransaction(signature);

    console.log("Token created with data account:", dataAccount.publicKey.toString());
    console.log("Transaction signature:", signature);

    return signature;
  }

  /**
   * Register token in TokenFactory
   */
  async registerToken(
    tokenAddress: PublicKey,
    params: TokenParams
  ): Promise<string> {
    if (!this.wallet || !this.walletPublicKey) {
      throw new Error("Wallet not connected");
    }

    // Create data account for factory
    const dataAccount = Keypair.generate();
    const rentExempt =
      await this.connection.getMinimumBalanceForRentExemption(10000);

    const transaction = new Transaction();

    // Create account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: this.walletPublicKey,
        newAccountPubkey: dataAccount.publicKey,
        lamports: rentExempt,
        space: 10000,
        programId: TOKEN_FACTORY_PROGRAM_ID,
      })
    );

    // Build register instruction
    const registerData = this.buildRegisterTokenData(
      tokenAddress,
      params,
      this.walletPublicKey
    );

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
      data: registerData,
    });

    transaction.add(registerInstruction);

    transaction.feePayer = this.walletPublicKey;
    const blockHash = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockHash.blockhash;

    const signedTx = await this.wallet.signTransaction(transaction);
    const signature = await this.connection.sendRawTransaction(
      signedTx.serialize()
    );

    await this.connection.confirmTransaction(signature);

    console.log("Token registered in factory");
    console.log("Transaction signature:", signature);

    return signature;
  }

  /**
   * Mint tokens
   */
  async mintTokens(
    tokenDataAccount: PublicKey,
    to: PublicKey,
    amount: bigint
  ): Promise<string> {
    if (!this.wallet || !this.walletPublicKey) {
      throw new Error("Wallet not connected");
    }

    const mintData = this.buildMintData(to, amount, this.walletPublicKey);

    const mintInstruction = new TransactionInstruction({
      programId: FORGE_TOKEN_PROGRAM_ID,
      keys: [
        {
          pubkey: tokenDataAccount,
          isSigner: false,
          isWritable: true,
        },
      ],
      data: mintData,
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
  }

  /**
   * Build initialize instruction data
   */
  private buildInitializeData(
    params: TokenParams,
    owner: PublicKey
  ): Buffer {
    let buffer = Buffer.concat([INITIALIZE_SELECTOR]);

    // Add string parameters (name, symbol)
    buffer = Buffer.concat([buffer, this.encodeString(params.name)]);
    buffer = Buffer.concat([buffer, this.encodeString(params.symbol)]);

    // Add uint256 parameters
    buffer = Buffer.concat([
      buffer,
      this.encodeUint256(params.initialSupply),
    ]);
    buffer = Buffer.concat([buffer, this.encodeUint256(params.maxSupply)]);

    // Add uint8 decimals
    const decimalsBuffer = Buffer.alloc(1);
    decimalsBuffer.writeUInt8(params.decimals, 0);
    buffer = Buffer.concat([buffer, decimalsBuffer]);

    // Add owner (bytes32)
    buffer = Buffer.concat([buffer, owner.toBuffer()]);

    return buffer;
  }

  /**
   * Build register token instruction data
   */
  private buildRegisterTokenData(
    tokenAddress: PublicKey,
    params: TokenParams,
    creator: PublicKey
  ): Buffer {
    let buffer = Buffer.alloc(0);

    // Add token address
    buffer = Buffer.concat([buffer, tokenAddress.toBuffer()]);

    // Add name and symbol
    buffer = Buffer.concat([buffer, this.encodeString(params.name)]);
    buffer = Buffer.concat([buffer, this.encodeString(params.symbol)]);

    // Add creator
    buffer = Buffer.concat([buffer, creator.toBuffer()]);

    return buffer;
  }

  /**
   * Build mint instruction data
   */
  private buildMintData(
    to: PublicKey,
    amount: bigint,
    caller: PublicKey
  ): Buffer {
    let buffer = Buffer.concat([MINT_SELECTOR]);

    // Add caller (bytes32)
    buffer = Buffer.concat([buffer, caller.toBuffer()]);

    // Add to (bytes32)
    buffer = Buffer.concat([buffer, to.toBuffer()]);

    // Add amount (uint256)
    buffer = Buffer.concat([buffer, this.encodeUint256(amount)]);

    return buffer;
  }

  /**
   * Encode string as 8-byte length + UTF-8 data
   */
  private encodeString(str: string): Buffer {
    const utf8Buffer = Buffer.from(str, "utf8");
    const lengthBuffer = Buffer.alloc(8);
    lengthBuffer.writeBigUInt64LE(BigInt(utf8Buffer.length), 0);
    return Buffer.concat([lengthBuffer, utf8Buffer]);
  }

  /**
   * Encode uint256 as little-endian 8-byte buffer
   */
  private encodeUint256(value: bigint): Buffer {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64LE(value, 0);
    return buffer;
  }
}

export default SolanaForgeClient;
