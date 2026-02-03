import { ethers } from "ethers";

/**
 * Token Factory ABI for Cronos
 */
export const TOKEN_FACTORY_ABI = [
  "function createToken(string name, string symbol, uint256 initialSupply, uint256 maxSupply) public returns (address)",
  "function getTokenCount() public view returns (uint256)",
  "function getCreatorTokens(address creator) public view returns (address[])",
  "function getAllTokens() public view returns (address[])",
];

/**
 * Forge Token ABI for Cronos
 */
export const FORGE_TOKEN_ABI = [
  "function name() public view returns (string)",
  "function symbol() public view returns (string)",
  "function decimals() public view returns (uint8)",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address account) public view returns (uint256)",
  "function mint(address to, uint256 amount) public",
  "function burn(uint256 amount) public",
  "function pause() public",
  "function unpause() public",
  "function paused() public view returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Mint(address indexed to, uint256 amount)",
  "event Burn(address indexed from, uint256 amount)",
];

/**
 * Network Configuration
 */
export const NETWORKS = {
  cronos_testnet: {
    chainId: 338,
    name: "Cronos Testnet",
    rpc: "https://evm-t3.cronos.org",
    explorer: "https://testnet.cronoscan.com",
    nativeCurrency: "TCRO",
  },
  cronos_mainnet: {
    chainId: 25,
    name: "Cronos Mainnet",
    rpc: "https://evm.cronos.org",
    explorer: "https://cronoscan.com",
    nativeCurrency: "CRO",
  },
  solana_devnet: {
    chainId: 103,
    name: "Solana Devnet",
    rpc: "https://api.devnet.solana.com",
    explorer: "https://explorer.solana.com",
  },
  solana_mainnet: {
    chainId: 101,
    name: "Solana Mainnet",
    rpc: "https://api.mainnet-beta.solana.com",
    explorer: "https://explorer.solana.com",
  },
};

/**
 * Create a contract instance
 */
export const getContract = (
  address: string,
  abi: any,
  provider: ethers.Provider | ethers.Signer
) => {
  return new ethers.Contract(address, abi, provider);
};

/**
 * Format token amount with decimals
 */
export const formatTokenAmount = (amount: string, decimals: number): string => {
  return ethers.formatUnits(amount, decimals);
};

/**
 * Parse token amount with decimals
 */
export const parseTokenAmount = (amount: string, decimals: number): string => {
  return ethers.parseUnits(amount, decimals).toString();
};
