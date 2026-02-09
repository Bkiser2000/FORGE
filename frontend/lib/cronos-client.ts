import { BrowserProvider, Contract, parseUnits, toBeHex } from 'ethers';

// Contract ABIs
const TOKEN_FACTORY_ABI = [
  "function createToken(string memory name, string memory symbol, uint256 initialSupply, uint256 maxSupply, uint8 decimals) public returns (address)",
  "function deployedTokens(uint256) public view returns (address)",
  "function getTokenCount() public view returns (uint256)",
  "function getCreatorTokens(address creator) public view returns (address[])",
  "event TokenDeployed(address indexed tokenAddress, string name, string symbol, address indexed creator)"
];

const FORGE_TOKEN_ABI = [
  "function name() public view returns (string)",
  "function symbol() public view returns (string)",
  "function decimals() public view returns (uint8)",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address account) public view returns (uint256)",
  "function mint(address to, uint256 amount) public",
  "function burn(uint256 amount) public",
  "function pause() public",
  "function unpause() public",
  "event TokenCreated(string indexed name, string indexed symbol, uint8 decimals, uint256 initialSupply, address indexed owner)",
  "event TokensMinted(address indexed to, uint256 amount)",
  "event TokensBurned(address indexed from, uint256 amount)"
];

export interface CreateCronosTokenParams {
  name: string;
  symbol: string;
  initialSupply: number;
  maxSupply?: number;
  decimals?: number;
}

export interface CronosToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  creator: string;
}

export class CronosTokenClient {
  private provider: BrowserProvider;
  private signer: any = null;
  private factoryAddress: string;
  private factoryContract: Contract | null = null;

  // Default to new factory address if not provided
  constructor(
    factoryAddress: string = '0x5c794C6C26c59535F00cCdD25bEB75b4f6D7F95e',
    rpcUrl: string = 'https://evm-t0.cronos.org'
  ) {
    this.factoryAddress = factoryAddress;
    this.provider = new BrowserProvider(window.ethereum);
  }

  /**
   * Connect with a signer (wallet)
   */
  async connectWallet(signer: any): Promise<void> {
    this.signer = signer;
    this.factoryContract = new Contract(
      this.factoryAddress,
      TOKEN_FACTORY_ABI,
      signer
    );
  }

  /**
   * Create a new token
   */
  async createToken(params: CreateCronosTokenParams): Promise<string> {
    if (!this.factoryContract) {
      throw new Error('Wallet not connected. Call connectWallet first.');
    }

    try {
      console.log('Creating token with params:', params);

      const decimals = params.decimals || 18;
      const tx = await this.factoryContract.createToken(
        params.name,
        params.symbol,
        parseUnits(params.initialSupply.toString(), 18),
        params.maxSupply ? parseUnits(params.maxSupply.toString(), 18) : 0,
        decimals
      );

      console.log('Transaction sent:', tx.hash);

      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log('Transaction confirmed:', receipt);
      console.log('Receipt logs count:', receipt?.logs?.length);

      // Extract token address from logs
      let tokenAddress = '';
      
      if (receipt?.logs && receipt.logs.length > 0) {
        console.log('=== Analyzing Receipt Logs ===');
        for (let i = 0; i < receipt.logs.length; i++) {
          const log = receipt.logs[i];
          console.log(`\n[Log ${i}]`);
          console.log('  Address:', log.address);
          console.log('  Topics:', log.topics);
          console.log('  Data:', log.data);
          
          try {
            const iface = this.factoryContract?.interface;
            const parsed = iface?.parseLog(log);
            console.log('  Parsed:', parsed?.name, parsed?.args);
            
            if (parsed?.name === 'TokenDeployed') {
              tokenAddress = parsed.args[0];
              console.log('✓ Found TokenDeployed event, token address:', tokenAddress);
              break;
            }
          } catch (err: any) {
            console.log('  Parse error:', err?.message);
          }
        }
      }

      // Fallback: try to manually find the first log that looks like a contract creation
      if (!tokenAddress && receipt?.logs && receipt.logs.length > 0) {
        console.log('\n=== Trying Manual Log Analysis ===');
        // Try to extract from transaction receipt contractAddress if it exists
        if (receipt?.contractAddress) {
          console.log('Found contractAddress in receipt:', receipt.contractAddress);
          tokenAddress = receipt.contractAddress;
        }
        
        // Also try parsing the logs with a generic approach
        for (const log of receipt.logs) {
          // TokenDeployed event signature: 0x2fc3848b01a71699bfb0a2d695bc7d9f1ed7f14f8f1f8c3b8f9c5f6e7a8b9d0c
          // We can look at topics[0] which is the event signature hash
          if (log.topics && log.topics.length > 0) {
            console.log('Log topic[0]:', log.topics[0]);
            // Try to decode the first indexed argument which should be the token address
            if (log.topics.length > 1) {
              const possibleAddress = '0x' + log.topics[1].slice(-40);
              console.log('Possible token address from topic:', possibleAddress);
              if (possibleAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
                tokenAddress = possibleAddress;
                console.log('✓ Extracted address from topic:', tokenAddress);
                break;
              }
            }
          }
        }
      }

      if (!tokenAddress) {
        console.error('✗ Failed to extract token address from transaction');
        console.error('Receipt object:', receipt);
        throw new Error('Failed to extract token address from transaction logs. Check console for details.');
      }

      console.log('✓ Final token address:', tokenAddress);
      return tokenAddress;
    } catch (error) {
      console.error('Error creating token:', error);
      throw error;
    }
  }

  /**
   * Get all tokens created by an address
   */
  async getCreatorTokens(creatorAddress: string): Promise<CronosToken[]> {
    try {
      const factoryRead = new Contract(
        this.factoryAddress,
        TOKEN_FACTORY_ABI,
        this.provider
      );

      const tokenAddresses = await factoryRead.getCreatorTokens(creatorAddress);
      const tokens: CronosToken[] = [];

      for (const tokenAddress of tokenAddresses) {
        const token = await this.getTokenInfo(tokenAddress, creatorAddress);
        tokens.push(token);
      }

      return tokens;
    } catch (error) {
      console.error('Error fetching creator tokens:', error);
      throw error;
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress: string, creator: string): Promise<CronosToken> {
    try {
      const tokenContract = new Contract(
        tokenAddress,
        FORGE_TOKEN_ABI,
        this.provider
      );

      const [name, symbol, decimals, totalSupply] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.totalSupply()
      ]);

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals,
        totalSupply: totalSupply.toString(),
        creator
      };
    } catch (error) {
      console.error('Error fetching token info:', error);
      throw error;
    }
  }

  /**
   * Mint tokens
   */
  async mintTokens(tokenAddress: string, toAddress: string, amount: number): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected. Call connectWallet first.');
    }

    try {
      const tokenContract = new Contract(
        tokenAddress,
        FORGE_TOKEN_ABI,
        this.signer
      );

      const tx = await tokenContract.mint(
        toAddress,
        parseUnits(amount.toString(), 18)
      );

      const receipt = await tx.wait(1);
      return receipt?.transactionHash || '';
    } catch (error) {
      console.error('Error minting tokens:', error);
      throw error;
    }
  }

  /**
   * Burn tokens
   */
  async burnTokens(tokenAddress: string, amount: number): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected. Call connectWallet first.');
    }

    try {
      const tokenContract = new Contract(
        tokenAddress,
        FORGE_TOKEN_ABI,
        this.signer
      );

      const tx = await tokenContract.burn(
        parseUnits(amount.toString(), 18)
      );

      const receipt = await tx.wait(1);
      return receipt?.transactionHash || '';
    } catch (error) {
      console.error('Error burning tokens:', error);
      throw error;
    }
  }

  /**
   * Get total token count
   */
  async getTokenCount(): Promise<number> {
    try {
      const factoryRead = new Contract(
        this.factoryAddress,
        TOKEN_FACTORY_ABI,
        this.provider
      );

      const count = await factoryRead.getTokenCount();
      return Number(count);
    } catch (error) {
      console.error('Error fetching token count:', error);
      throw error;
    }
  }
}

// Export factory
export function createCronosClient(
  factoryAddress: string,
  rpcUrl?: string
): CronosTokenClient {
  return new CronosTokenClient(factoryAddress, rpcUrl);
}
