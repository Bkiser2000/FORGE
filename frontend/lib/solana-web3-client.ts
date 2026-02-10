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
   * Test 1: Send empty instruction data with account creation
   */
  async testEmptyData(): Promise<string> {
    if (!this.provider) throw new Error("Wallet not connected");

    try {
      console.log('=== Test 1: Empty Instruction Data with Account Creation ===');
      
      const connection = this.getConnection();
      const dataAccount = Keypair.generate();
      
      // Create the data account first
      const balance = await connection.getBalance(dataAccount.publicKey);
      console.log('Data account balance:', balance);
      
      if (balance === 0) {
        console.log('Creating data account...');
        const createAccountTx = new Transaction({
          recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
          feePayer: this.provider.wallet.publicKey,
        });
        
        createAccountTx.add(
          SystemProgram.createAccount({
            fromPubkey: this.provider.wallet.publicKey,
            newAccountPubkey: dataAccount.publicKey,
            lamports: await connection.getMinimumBalanceForRentExemption(1024),
            space: 1024,
            programId: getProgramId(),
          })
        );
        
        createAccountTx.partialSign(dataAccount);
        const createSig = await this.provider.wallet.signTransaction(createAccountTx);
        const sig1 = await connection.sendRawTransaction(createSig.serialize());
        console.log('Account creation tx:', sig1);
        await connection.confirmTransaction(sig1, 'confirmed');
        console.log('✓ Account created');
      }
      
      // Now call the program
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: dataAccount.publicKey, isSigner: false, isWritable: true },
          { pubkey: new PublicKey("SysvarC1ock11111111111111111111111111111111"), isSigner: false, isWritable: false },
        ],
        programId: getProgramId(),
        data: Buffer.alloc(0), // Empty data
      });

      const recentBlockhash = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: this.provider.wallet.publicKey,
      });

      transaction.add(instruction);
      const signedTx = await this.provider.wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      console.log('Transaction sent:', signature);
      await connection.confirmTransaction(signature, 'confirmed');
      console.log('✓ Empty data test passed!');
      return signature;
    } catch (error) {
      console.error('Empty data test failed:', error);
      throw error;
    }
  }

  /**
   * Test 2: Single byte with account creation
   */
  async testSingleByte(): Promise<string> {
    if (!this.provider) throw new Error("Wallet not connected");

    try {
      console.log('=== Test 2: Single Zero Byte with Account Creation ===');
      
      const connection = this.getConnection();
      const dataAccount = Keypair.generate();
      
      // Create the data account first
      const balance = await connection.getBalance(dataAccount.publicKey);
      console.log('Data account balance:', balance);
      
      if (balance === 0) {
        console.log('Creating data account...');
        const createAccountTx = new Transaction({
          recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
          feePayer: this.provider.wallet.publicKey,
        });
        
        createAccountTx.add(
          SystemProgram.createAccount({
            fromPubkey: this.provider.wallet.publicKey,
            newAccountPubkey: dataAccount.publicKey,
            lamports: await connection.getMinimumBalanceForRentExemption(1024),
            space: 1024,
            programId: getProgramId(),
          })
        );
        
        createAccountTx.partialSign(dataAccount);
        const createSig = await this.provider.wallet.signTransaction(createAccountTx);
        const sig1 = await connection.sendRawTransaction(createSig.serialize());
        console.log('Account creation tx:', sig1);
        await connection.confirmTransaction(sig1, 'confirmed');
        console.log('✓ Account created');
      }
      
      // Now call the program
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: dataAccount.publicKey, isSigner: false, isWritable: true },
          { pubkey: new PublicKey("SysvarC1ock11111111111111111111111111111111"), isSigner: false, isWritable: false },
        ],
        programId: getProgramId(),
        data: Buffer.from([0x00]), // Single byte
      });

      const recentBlockhash = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: this.provider.wallet.publicKey,
      });

      transaction.add(instruction);
      const signedTx = await this.provider.wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      console.log('Transaction sent:', signature);
      await connection.confirmTransaction(signature, 'confirmed');
      console.log('✓ Single byte test passed!');
      return signature;
    } catch (error) {
      console.error('Single byte test failed:', error);
      throw error;
    }
  }

  /**
   * Test 3: Try with correct 8-byte Solang selector
   */
  async testAnchorSelector(): Promise<string> {
    if (!this.provider) throw new Error("Wallet not connected");

    try {
      console.log('=== Test 3: Solang 8-byte Selector ===');
      
      const connection = this.getConnection();
      const dataAccount = Keypair.generate();
      
      // Create the data account first
      const balance = await connection.getBalance(dataAccount.publicKey);
      
      if (balance === 0) {
        console.log('Creating data account...');
        const createAccountTx = new Transaction({
          recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
          feePayer: this.provider.wallet.publicKey,
        });
        
        createAccountTx.add(
          SystemProgram.createAccount({
            fromPubkey: this.provider.wallet.publicKey,
            newAccountPubkey: dataAccount.publicKey,
            lamports: await connection.getMinimumBalanceForRentExemption(1024),
            space: 1024,
            programId: getProgramId(),
          })
        );
        
        createAccountTx.partialSign(dataAccount);
        const createSig = await this.provider.wallet.signTransaction(createAccountTx);
        const sig1 = await connection.sendRawTransaction(createSig.serialize());
        console.log('Account creation tx:', sig1);
        await connection.confirmTransaction(sig1, 'confirmed');
      }
      
      // Try 8-byte selector (Solang standard)
      // For testCall(): keccak256("testCall()") first 8 bytes = b7f05836c7e1329a
      const selector = Buffer.from([0xb7, 0xf0, 0x58, 0x36, 0xc7, 0xe1, 0x32, 0x9a]);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: dataAccount.publicKey, isSigner: false, isWritable: true },
          { pubkey: new PublicKey("SysvarC1ock11111111111111111111111111111111"), isSigner: false, isWritable: false },
        ],
        programId: getProgramId(),
        data: selector,
      });

      const recentBlockhash = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: this.provider.wallet.publicKey,
      });

      transaction.add(instruction);
      const signedTx = await this.provider.wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      console.log('Transaction sent:', signature);
      await connection.confirmTransaction(signature, 'confirmed');
      console.log('✓ Anchor selector test passed!');
      return signature;
    } catch (error) {
      console.error('Anchor selector test failed:', error);
      throw error;
    }
  }

  /**
   * Test 4: Call contract constructor (new) first
   */
  async testConstructor(): Promise<string> {
    if (!this.provider) throw new Error("Wallet not connected");

    try {
      console.log('=== Test 4: Contract Constructor (new) ===');
      
      const connection = this.getConnection();
      const dataAccount = Keypair.generate();
      
      // Create the data account first
      console.log('Creating data account...');
      const createAccountTx = new Transaction({
        recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
        feePayer: this.provider.wallet.publicKey,
      });
      
      createAccountTx.add(
        SystemProgram.createAccount({
          fromPubkey: this.provider.wallet.publicKey,
          newAccountPubkey: dataAccount.publicKey,
          lamports: await connection.getMinimumBalanceForRentExemption(1024),
          space: 1024,
          programId: getProgramId(),
        })
      );
      
      createAccountTx.partialSign(dataAccount);
      const createSig = await this.provider.wallet.signTransaction(createAccountTx);
      const sig1 = await connection.sendRawTransaction(createSig.serialize());
      console.log('Account creation tx:', sig1);
      await connection.confirmTransaction(sig1, 'confirmed');
      
      // Call constructor: correct selector for new()
      // Keccak256("new()") = cdbf608d9e367ea36fd3859b6a0cad8d9f13d0c440fe7f78adcd83524eab18fa
      // First 8 bytes: cdbf608d9e367ea3
      const constructorSelector = Buffer.from([0xcd, 0xbf, 0x60, 0x8d, 0x9e, 0x36, 0x7e, 0xa3]);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: dataAccount.publicKey, isSigner: false, isWritable: true },
        ],
        programId: getProgramId(),
        data: constructorSelector,
      });

      const recentBlockhash = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: this.provider.wallet.publicKey,
      });

      transaction.add(instruction);
      const signedTx = await this.provider.wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      console.log('Transaction sent:', signature);
      await connection.confirmTransaction(signature, 'confirmed');
      console.log('✓ Constructor test passed!');
      return signature;
    } catch (error) {
      console.error('Constructor test failed:', error);
      throw error;
    }
  }

  /**
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

  /**
   * Test 5: Minimal test - No accounts at all, just selector
   */
  async testMinimalNoAccounts(): Promise<string> {
    if (!this.provider) throw new Error("Wallet not connected");

    try {
      console.log('=== Test 5: Minimal - No Accounts, Just Selector ===');
      
      const connection = this.getConnection();
      
      // Try 8-byte selector with NO accounts
      const selector = Buffer.from([0xb7, 0xf0, 0x58, 0x36, 0xc7, 0xe1, 0x32, 0x9a]);
      
      const instruction = new TransactionInstruction({
        keys: [], // NO ACCOUNTS
        programId: getProgramId(),
        data: selector,
      });

      const recentBlockhash = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: this.provider.wallet.publicKey,
      });

      transaction.add(instruction);
      const signedTx = await this.provider.wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      console.log('Transaction sent:', signature);
      await connection.confirmTransaction(signature, 'confirmed');
      console.log('✓ No accounts test passed!');
      return signature;
    } catch (error) {
      console.error('No accounts test failed:', error);
      throw error;
    }
  }

  /**
   * Test 6: Only selector, no clock sysvar
   */
  async testOnlySelector(): Promise<string> {
    if (!this.provider) throw new Error("Wallet not connected");

    try {
      console.log('=== Test 6: Only Selector, No Clock ===');
      
      const connection = this.getConnection();
      const dataAccount = Keypair.generate();
      
      // Create account
      console.log('Creating data account...');
      const createAccountTx = new Transaction({
        recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
        feePayer: this.provider.wallet.publicKey,
      });
      
      createAccountTx.add(
        SystemProgram.createAccount({
          fromPubkey: this.provider.wallet.publicKey,
          newAccountPubkey: dataAccount.publicKey,
          lamports: await connection.getMinimumBalanceForRentExemption(1024),
          space: 1024,
          programId: getProgramId(),
        })
      );
      
      createAccountTx.partialSign(dataAccount);
      const createSig = await this.provider.wallet.signTransaction(createAccountTx);
      const sig1 = await connection.sendRawTransaction(createSig.serialize());
      await connection.confirmTransaction(sig1, 'confirmed');
      
      // Call with ONLY the selector and NO clock sysvar
      const selector = Buffer.from([0xb7, 0xf0, 0x58, 0x36, 0xc7, 0xe1, 0x32, 0x9a]);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: dataAccount.publicKey, isSigner: false, isWritable: true },
          // NO clock sysvar - maybe it's optional?
        ],
        programId: getProgramId(),
        data: selector,
      });

      const recentBlockhash = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        recentBlockhash: recentBlockhash.blockhash,
        feePayer: this.provider.wallet.publicKey,
      });

      transaction.add(instruction);
      const signedTx = await this.provider.wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      console.log('Transaction sent:', signature);
      await connection.confirmTransaction(signature, 'confirmed');
      console.log('✓ Only selector test passed!');
      return signature;
    } catch (error) {
      console.error('Only selector test failed:', error);
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
