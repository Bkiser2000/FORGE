/**
 * Validates token name
 */
export const validateTokenName = (name: string): boolean => {
  return name.length > 0 && name.length <= 32;
};

/**
 * Validates token symbol
 */
export const validateTokenSymbol = (symbol: string): boolean => {
  return symbol.length > 0 && symbol.length <= 10 && /^[A-Z0-9]+$/.test(symbol);
};

/**
 * Validates token supply
 */
export const validateSupply = (supply: string): boolean => {
  const num = parseFloat(supply);
  return !isNaN(num) && num > 0 && num < Number.MAX_SAFE_INTEGER;
};

/**
 * Validates decimals
 */
export const validateDecimals = (decimals: string): boolean => {
  const num = parseInt(decimals);
  return num >= 0 && num <= 18;
};

/**
 * Validates Cronos address
 */
export const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Validates Solana address
 */
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    const bs58 = require('bs58');
    const decoded = bs58.decode(address);
    return decoded.length === 32;
  } catch {
    return false;
  }
};

/**
 * Format large numbers with commas
 */
export const formatNumber = (num: number | string): string => {
  return new Intl.NumberFormat().format(Number(num));
};

/**
 * Truncate address for display
 */
export const truncateAddress = (
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string => {
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};
