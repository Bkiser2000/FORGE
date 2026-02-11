import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  Keypair,
  TransactionInstruction,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import * as borsh from '@coral-xyz/borsh';

const DEVNET_RPC = "https://api.devnet.solana.com";
// Solang-compiled program
const PROGRAM_ID = new PublicKey("Fx634QQpNVFugKodwYtHagsHUz5Wx5UgokDJtijjsBtK");

export interface CreateTokenParams {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: number;
}

/**
 * Solang dispatcher-based client for Solana
 * Works with the Solang-compiled contract on Solana
 */
export class SolanaSolangClient {
  private provider: any = null;
  private connection: Connection;

  constructor(provider?: any) {
    this.connection = new Connection(DEVNET_RPC, "confirmed");
    if (provider) {
      this.connectWallet(provider);
    }
  }

  connectWallet(provider: any): void {
    try {
      this.provider = provider;
      console.log('✓ Solang wallet connected:', provider.wallet.publicKey.toString());
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  private ensureConnected(): void {
    if (!this.provider) {
      throw new Error("Wallet not connected. Call connectWallet first.");
    }
  }

  /**
   * Create a new token using Solang program
   * Solang uses a dispatcher that routes based on function selector
   */
  async createToken(params: CreateTokenParams): Promise<string> {
    this.ensureConnected();

    try {
      console.log('Creating token via Solang:', params);

      const payer = this.provider.wallet.publicKey;
      const dataAccount = Keypair.generate();

      console.log('Generated keypair:');
      console.log('  dataAccount:', dataAccount.publicKey.toString());
      console.log('  payer:', payer.toString());

      // Step 1: Create the data account
      console.log('Step 1: Creating data account...');
      const createAccountTx = new Transaction({
        recentBlockhash: (await this.connection.getLatestBlockhash()).blockhash,
        feePayer: payer,
      });

      createAccountTx.add(
        SystemProgram.createAccount({
          fromPubkey: payer,
          newAccountPubkey: dataAccount.publicKey,
          lamports: await this.connection.getMinimumBalanceForRentExemption(1024),
          space: 1024,
          programId: PROGRAM_ID,
        })
      );

      createAccountTx.partialSign(dataAccount);
      const createSig = await this.provider.wallet.signTransaction(createAccountTx);
      const sig1 = await this.connection.sendRawTransaction(createSig.serialize());
      await this.connection.confirmTransaction(sig1, 'confirmed');
      console.log('✓ Data account created:', sig1);

      // Step 2: Build the Solang function call instruction
      // Solang dispatcher uses 8-byte function selectors (Keccak256 hash, first 8 bytes)
      console.log('Step 2: Building Solang createToken instruction...');
      
      // Selector for createToken: calculated from Keccak256("createToken(bytes32,bytes32,bytes32,bytes32,string,string,uint8,uint64)")
      // First 8 bytes: 209ec10320b21360
      const selector = Buffer.from([0x20, 0x9e, 0xc1, 0x03, 0x20, 0xb2, 0x13, 0x60]);

      // Build the instruction data with Solang ABI encoding
      let instructionData = Buffer.concat([selector]);

      // Solang uses fixed-size fields for primitives
      // For strings, they're typically encoded as offset + length + data (similar to Solidity)
      
      // Encode name string (32 bytes for offset, then length + data)
      const nameBuffer = Buffer.from(params.name, 'utf-8');
      const nameLengthBuffer = Buffer.alloc(8);
      nameLengthBuffer.writeBigUInt64LE(BigInt(nameBuffer.length), 0);
      
      // Encode symbol string  
      const symbolBuffer = Buffer.from(params.symbol, 'utf-8');
      const symbolLengthBuffer = Buffer.alloc(8);
      symbolLengthBuffer.writeBigUInt64LE(BigInt(symbolBuffer.length), 0);

      // Encode decimals (uint8)
      const decimalsBuffer = Buffer.alloc(1);
      decimalsBuffer.writeUInt8(params.decimals, 0);

      // Encode initialSupply (uint64)
      const supplyBuffer = Buffer.alloc(8);
      supplyBuffer.writeBigUInt64LE(BigInt(params.initialSupply), 0);

      // For string parameters, encode as: length (8 bytes) + data
      instructionData = Buffer.concat([
        instructionData,
        nameLengthBuffer, nameBuffer,
        symbolLengthBuffer, symbolBuffer,
        decimalsBuffer,
        supplyBuffer,
      ]);

      console.log('Instruction data length:', instructionData.length);
      console.log('Instruction data:', instructionData.toString('hex'));

      // Create the instruction
      const instruction = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: dataAccount.publicKey, isSigner: false, isWritable: true },
        ],
        data: instructionData,
      });

      // Step 3: Send the instruction
      console.log('Step 3: Sending createToken instruction...');
      const { blockhash } = await this.connection.getLatestBlockhash();
      const tx = new Transaction({
        recentBlockhash: blockhash,
        feePayer: payer,
      }).add(instruction);

      const signedTx = await this.provider.wallet.signTransaction(tx);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      console.log('Transaction sent:', signature);
      
      await this.connection.confirmTransaction(signature, 'confirmed');
      console.log('✓ Token created! Signature:', signature);
      return signature;
    } catch (error) {
      console.error('Failed to create token:', error);
      throw error;
    }
  }

  /**
   * Test the Solang dispatcher with a simple call
   */
  async testCall(): Promise<string> {
    this.ensureConnected();

    try {
      console.log('Testing Solang dispatcher...');

      const payer = this.provider.wallet.publicKey;
      const dataAccount = Keypair.generate();

      // Create account
      const createAccountTx = new Transaction({
        recentBlockhash: (await this.connection.getLatestBlockhash()).blockhash,
        feePayer: payer,
      });

      createAccountTx.add(
        SystemProgram.createAccount({
          fromPubkey: payer,
          newAccountPubkey: dataAccount.publicKey,
          lamports: await this.connection.getMinimumBalanceForRentExemption(1024),
          space: 1024,
          programId: PROGRAM_ID,
        })
      );

      createAccountTx.partialSign(dataAccount);
      const createSig = await this.provider.wallet.signTransaction(createAccountTx);
      const sig1 = await this.connection.sendRawTransaction(createSig.serialize());
      await this.connection.confirmTransaction(sig1, 'confirmed');

      // Call testCall() function
      // Selector: b7f05836c7e1329a
      const selector = Buffer.from([0xb7, 0xf0, 0x58, 0x36, 0xc7, 0xe1, 0x32, 0x9a]);

      const instruction = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: dataAccount.publicKey, isSigner: false, isWritable: true },
        ],
        data: selector,
      });

      const { blockhash } = await this.connection.getLatestBlockhash();
      const tx = new Transaction({
        recentBlockhash: blockhash,
        feePayer: payer,
      }).add(instruction);

      const signedTx = await this.provider.wallet.signTransaction(tx);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      
      await this.connection.confirmTransaction(signature, 'confirmed');
      console.log('✓ Test call succeeded! Signature:', signature);
      return signature;
    } catch (error) {
      console.error('Test call failed:', error);
      throw error;
    }
  }
}

export default SolanaSolangClient;
