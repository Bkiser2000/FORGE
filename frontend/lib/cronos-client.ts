import { BrowserProvider, Contract, parseUnits, toBeHex } from 'ethers';

// Contract ABIs
const TOKEN_FACTORY_ABI = [
  "function createToken(string memory name, string memory symbol, uint256 initialSupply, uint256 maxSupply) public returns (address)",
  "function deployedTokens(uint256) public view returns (address)",
  "function getTokenCount() public view returns (uint256)",
  "function getCreatorTokens(address creator) public view returns (address[])",
  "event TokenDeployed(address indexed tokenAddress, string name, string indexed symbol, address indexed creator)"
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

  constructor(
    factoryAddress: string,
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

      const tx = await this.factoryContract.createToken(
        params.name,
        params.symbol,
        parseUnits(params.initialSupply.toString(), 18),
        params.maxSupply ? parseUnits(params.maxSupply.toString(), 18) : 0
      );

      console.log('Transaction sent:', tx.hash);

      const receipt = await tx.wait(1); // Wait for 1 confirmation
      console.log('Transaction confirmed:', receipt);
      console.log('Receipt logs count:', receipt?.logs?.length);

      // Extract token address from logs
      let tokenAddress = '';
      
      if (receipt?.logs && receipt.logs.length > 0) {
        for (let i = 0; i < receipt.logs.length; i++) {
          try {
            const log = receipt.logs[i];
            const iface = this.factoryContract?.interface;
            const parsed = iface?.parseLog(log);
            console.log(`Log ${i}:`, parsed?.name, parsed?.args);
            
            if (parsed?.name === 'TokenDeployed') {
              // TokenDeployed event: (address indexed tokenAddress, string name, string indexed symbol, address indexed creator)
              tokenAddress = parsed.args[0];
              console.log('✓ Found TokenDeployed event, token address:', tokenAddress);
              break;
            }
          } catch (err) {
            console.log(`Log ${i} parse error:`, err);
          }
        }
      }

      if (!tokenAddress) {
        console.warn('⚠️  No TokenDeployed event found in logs, attempting alternative extraction');
        // Fallback: try to extract from receipt events
        if (receipt?.events) {
          const deployEvent = receipt.events.find((e: any) => e.event === 'TokenDeployed');
          if (deployEvent) {
            tokenAddress = deployEvent.args[0];
            console.log('✓ Found token address from receipt.events:', tokenAddress);
          }
        }
      }

      if (!tokenAddress) {
        console.error('✗ Failed to extract token address from transaction');
        throw new Error('Failed to extract token address from transaction logs');
      }

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
