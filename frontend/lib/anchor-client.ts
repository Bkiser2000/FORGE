import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Keypair,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { 
  Program, 
  AnchorProvider, 
  Idl,
  BN,
} from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

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
   * Uses raw web3.js instructions for more control over account passing
   */
  async createToken(params: CreateTokenParams): Promise<string> {
    this.ensureConnected();

    try {
      console.log('Creating token:', params);

      const connection = this.provider!.connection;
      const payer = this.provider!.wallet.publicKey;
      const mint = Keypair.generate();
      const tokenConfig = Keypair.generate();
      
      const ownerAta = await getAssociatedTokenAddress(
        mint.publicKey,
        payer
      );

      console.log('Generated keypairs:');
      console.log('  mint:', mint.publicKey.toString());
      console.log('  tokenConfig:', tokenConfig.publicKey.toString());
      console.log('  ownerAta:', ownerAta.toString());
      console.log('  payer:', payer.toString());

      // Build the instruction data using the Anchor discriminator + arguments
      // Anchor discriminator is first 8 bytes: Sha256("account:CreateToken")
      const discriminator = Buffer.from([
        0x15, 0x5f, 0x4d, 0x35, 0xc4, 0xb5, 0x76, 0xa8, // Anchor discriminator for createToken
      ]);

      // Encode the parameters
      // String encoding in Anchor: 4 bytes length + string data
      const nameBuffer = Buffer.from(params.name, 'utf-8');
      const symbolBuffer = Buffer.from(params.symbol, 'utf-8');
      
      // Build the data buffer
      let dataBuffer = discriminator;
      
      // Append name (4 bytes length + data)
      const nameLengthBuffer = Buffer.alloc(4);
      nameLengthBuffer.writeUInt32LE(nameBuffer.length, 0);
      dataBuffer = Buffer.concat([dataBuffer, nameLengthBuffer, nameBuffer]);
      
      // Append symbol (4 bytes length + data)
      const symbolLengthBuffer = Buffer.alloc(4);
      symbolLengthBuffer.writeUInt32LE(symbolBuffer.length, 0);
      dataBuffer = Buffer.concat([dataBuffer, symbolLengthBuffer, symbolBuffer]);
      
      // Append decimals (1 byte)
      const decimalsBuffer = Buffer.alloc(1);
      decimalsBuffer.writeUInt8(params.decimals, 0);
      dataBuffer = Buffer.concat([dataBuffer, decimalsBuffer]);
      
      // Append initialSupply (8 bytes, u64)
      const supplyBuffer = Buffer.alloc(8);
      supplyBuffer.writeBigUInt64LE(BigInt(params.initialSupply), 0);
      dataBuffer = Buffer.concat([dataBuffer, supplyBuffer]);

      console.log('Instruction data length:', dataBuffer.length);
      console.log('Instruction data:', dataBuffer.toString('hex'));

      // Create the instruction with all required accounts in the correct order
      const instruction = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: payer, isSigner: true, isWritable: true },           // payer
          { pubkey: tokenConfig.publicKey, isSigner: true, isWritable: true }, // tokenConfig
          { pubkey: mint.publicKey, isSigner: true, isWritable: true },  // mint
          { pubkey: ownerAta, isSigner: false, isWritable: true },       // ownerTokenAccount
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // systemProgram
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // tokenProgram
          { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent
        ],
        data: dataBuffer,
      });

      console.log('Instruction created with', instruction.keys.length, 'accounts');

      // Create and send transaction
      const { blockhash } = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: payer,
      }).add(instruction);

      transaction.partialSign(mint, tokenConfig);
      
      const signedTx = await this.provider!.wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      console.log('Transaction sent:', signature);
      await connection.confirmTransaction(signature, 'confirmed');
      console.log('✓ Token created! Signature:', signature);
      return signature;
    } catch (error) {
      console.error('Failed to create token:', error);
      throw error;
    }
  }
}

export default AnchorForgeClient;
