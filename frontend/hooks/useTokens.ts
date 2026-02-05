import { useState, useEffect } from 'react';

export interface Token {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  mint: string;
  owner: string;
  createdAt: number;
  transactionHash: string;
}

export const useTokens = () => {
  const [tokens, setTokens] = useState<Token[]>([]);

  // Load tokens from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('forgeTokens');
    if (stored) {
      try {
        setTokens(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load tokens from localStorage:', e);
      }
    }
  }, []);

  // Save tokens to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('forgeTokens', JSON.stringify(tokens));
  }, [tokens]);

  const addToken = (token: Token) => {
    setTokens(prev => [token, ...prev]);
  };

  const removeToken = (id: string) => {
    setTokens(prev => prev.filter(t => t.id !== id));
  };

  return {
    tokens,
    addToken,
    removeToken,
  };
};
