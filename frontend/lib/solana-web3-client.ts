import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const DEVNET_RPC = "https://api.devnet.solana.com";
const PROGRAM_ID_STRING = "Fx634QQpNVFugKodwYtHagsHUz5Wx5UgokDJtijjsBtK";

let PROGRAM_ID: PublicKey | null = null;

const initializePublicKeysEagerly = () => {
  if (PROGRAM_ID !== null) return;
  
  console.log('Initializing PROGRAM_ID...');
  try {
    PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);
    console.log('✓ PROGRAM_ID initialized:', PROGRAM_ID.toString());
  } catch (err) {
    console.error('Failed to create PROGRAM_ID:', err);
    throw err;
  }
};

const getProgramId = (): PublicKey => {
  if (!PROGRAM_ID) {
    throw new Error("PROGRAM_ID not initialized - call initializePublicKeysEagerly first");
  }
  return PROGRAM_ID;
};

export interface CreateTokenParams {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: number;
}

export class SolanaForgeClient {
  private provider: any = null;

  constructor(provider?: any) {
    this.provider = provider;
    initializePublicKeysEagerly();
  }

  getConnection(): Connection {
    return new Connection(DEVNET_RPC, "confirmed");
  }

  connectWallet(provider: any): void {
    this.provider = provider;
    console.log('✓ Wallet connected:', provider.wallet.publicKey.toString());
  }

  /**
   * Test the dispatcher - calls a simple no-op function
   */
  async testDispatcher(): Promise<string> {
    if (!this.provider) throw new Error("Wallet not connected");

    try {
      console.log('=== Testing Solang Dispatcher ===');
      
      const data = Buffer.alloc(8);
      let offset = 0;

      // Function selector for testCall() with no parameters
      // keccak256("testCall()") = 29e41e86...
      // Let's use the first 8 bytes
      const functionSelector = Buffer.from([0x29, 0xe4, 0x1e, 0x86, 0x00, 0x00, 0x00, 0x00]);
      functionSelector.copy(data, offset);
      offset += 8;
      console.log('Function selector for testCall():', functionSelector.toString('hex'));

      // Build instruction with ONLY the required accounts for Solang
      const dataAccount = Keypair.generate();
      
      const instruction = new TransactionInstruction({
        keys: [
          // Required by Solang: dataAccount (writable)
          { pubkey: dataAccount.publicKey, isSigner: false, isWritable: true },
          // Required by Solang: clock sysvar
          { pubkey: new PublicKey("SysvarC1ock11111111111111111111111111111111"), isSigner: false, isWritable: false },
        ],
        programId: getProgramId(),
        data: data.slice(0, offset),
      });

      console.log('Test instruction created');

      // Create and send transaction
      const connection = this.getConnection();
      const recentBlockhash = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: this.provider.wallet.publicKey,
      });

      transaction.add(instruction);
      console.log('Transaction built, sending to wallet for signing...');
      const signedTx = await this.provider.wallet.signTransaction(transaction);

      console.log('Sending transaction...');
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      console.log('✓ Test transaction sent! Signature:', signature);
      
      // Wait for confirmation
      console.log('Waiting for confirmation...');
      await connection.confirmTransaction(signature, 'confirmed');
      console.log('✓ Test transaction confirmed!');

      return signature;
    } catch (error) {
      console.error("=== Test Failed ===");
      console.error('Error:', error);
      if (error instanceof Error) {
        console.error('Message:', error.message);
      }
      throw error;
    }
  }
   * Create a new token using Solang-compiled program with web3.js
   * Uses raw bytes32 encoding for Solana (no Ethereum ABI wrapper)
   */
  async createToken(params: CreateTokenParams): Promise<string> {
    if (!this.provider) throw new Error("Wallet not connected");

    try {
      console.log('=== Starting Token Creation (Solang Raw Encoding) ===');
      console.log('Parameters:', params);

      // Generate keypairs for accounts - these will be passed as data, not as account signers
      const mint = Keypair.generate();
      const tokenConfig = Keypair.generate();
      const ownerTokenAccount = Keypair.generate();

      console.log('Generated keypairs (as data references):');
      console.log('  Mint:', mint.publicKey.toString());
      console.log('  TokenConfig:', tokenConfig.publicKey.toString());
      console.log('  OwnerTokenAccount:', ownerTokenAccount.publicKey.toString());

      // For Solang on Solana, we MUST include the 8-byte function selector
      // Solang uses: first 8 bytes of keccak256(function_signature)
      // For createToken: keccak256("createToken(bytes32,bytes32,bytes32,bytes32,string,string,uint8,uint64)")
      // = 209ec10320b2136062c6d6684fb1783ac684ae15e5dfd72805fc4eb206ba701c
      
      const data = Buffer.alloc(4000);
      let offset = 0;

      // Function selector - 8 bytes in big-endian (standard for dispatching)
      const functionSelector = Buffer.from([0x20, 0x9e, 0xc1, 0x03, 0x20, 0xb2, 0x13, 0x60]);
      functionSelector.copy(data, offset);
      offset += 8;
      console.log('Function selector:', functionSelector.toString('hex'));

      // Encode parameters as simple concatenation
      // Each bytes32 is just the 32 bytes
      // Strings are: 4-byte length (u32, little-endian) + UTF-8 data
      // Numbers are little-endian
      
      // payer (bytes32)
      this.provider.wallet.publicKey.toBuffer().copy(data, offset);
      offset += 32;
      console.log('Encoded payer');

      // tokenConfigAccount (bytes32)
      tokenConfig.publicKey.toBuffer().copy(data, offset);
      offset += 32;
      console.log('Encoded tokenConfigAccount');

      // mint (bytes32)
      mint.publicKey.toBuffer().copy(data, offset);
      offset += 32;
      console.log('Encoded mint');

      // ownerTokenAccount (bytes32)
      ownerTokenAccount.publicKey.toBuffer().copy(data, offset);
      offset += 32;
      console.log('Encoded ownerTokenAccount');

      // name (string: 4-byte length LE + UTF-8 data)
      const nameBytes = Buffer.from(params.name, 'utf8');
      data.writeUInt32LE(nameBytes.length, offset);
      offset += 4;
      nameBytes.copy(data, offset);
      offset += nameBytes.length;
      console.log('Encoded name:', params.name, `(${nameBytes.length} bytes)`);

      // symbol (string: 4-byte length LE + UTF-8 data)
      const symbolBytes = Buffer.from(params.symbol, 'utf8');
      data.writeUInt32LE(symbolBytes.length, offset);
      offset += 4;
      symbolBytes.copy(data, offset);
      offset += symbolBytes.length;
      console.log('Encoded symbol:', params.symbol, `(${symbolBytes.length} bytes)`);

      // decimals (u8, 1 byte)
      data.writeUInt8(params.decimals, offset);
      offset += 1;
      console.log('Encoded decimals:', params.decimals);

      // initialSupply (u64, 8 bytes little-endian)
      data.writeBigUInt64LE(BigInt(Math.floor(params.initialSupply)), offset);
      offset += 8;
      console.log('Encoded initialSupply:', params.initialSupply);

      const finalData = data.slice(0, offset);
      console.log('Total instruction data length:', finalData.length, 'bytes');
      console.log('Instruction data (hex, first 150 chars):', finalData.toString('hex').substring(0, 150) + '...');

      // Build instruction with ONLY the required accounts for Solang
      // Solang requires: dataAccount (mut, NOT a signer) + clock sysvar
      const dataAccount = Keypair.generate();
      
      const instruction = new TransactionInstruction({
        keys: [
          // REQUIRED by Solang metadata: dataAccount (writable for contract storage, NOT a signer)
          { pubkey: dataAccount.publicKey, isSigner: false, isWritable: true },
          // REQUIRED by Solang metadata: clock sysvar
          { pubkey: new PublicKey("SysvarC1ock11111111111111111111111111111111"), isSigner: false, isWritable: false },
        ],
        programId: getProgramId(),
        data: finalData,
      });

      console.log('Instruction created');
      console.log('Data account:', dataAccount.publicKey.toString());
      console.log('Instruction data length:', finalData.length, 'bytes');

      // Create and send transaction
      const connection = this.getConnection();
      const recentBlockhash = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: this.provider.wallet.publicKey,
      });

      transaction.add(instruction);
      // Only wallet (payer) needs to sign - other accounts are just data, not transaction signers
      
      console.log('Transaction built, sending to wallet for signing...');
      const signedTx = await this.provider.wallet.signTransaction(transaction);

      console.log('Sending transaction...');
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      console.log('✓ Transaction sent! Signature:', signature);
      
      // Wait for confirmation
      console.log('Waiting for confirmation...');
      await connection.confirmTransaction(signature, 'confirmed');
      console.log('✓ Transaction confirmed!');

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

  async getTokenCount(): Promise<number> {
    // This would require reading program-derived accounts
    // For now, returning 0 as placeholder
    return 0;
  }
}

// Export singleton instance creation
export const createSolanaForgeClient = (provider?: any) => {
  return new SolanaForgeClient(provider);
};

export { initializePublicKeysEagerly, getProgramId };
