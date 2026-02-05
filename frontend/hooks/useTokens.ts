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
  const [isMounted, setIsMounted] = useState(false);

  // Load tokens from localStorage on mount (client-side only)
  useEffect(() => {
    setIsMounted(true);
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('forgeTokens');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setTokens(parsed);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load tokens from localStorage:', e);
    }
  }, []);

  // Save tokens to localStorage whenever they change (only after mount)
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('forgeTokens', JSON.stringify(tokens));
      } catch (e) {
        console.error('Failed to save tokens to localStorage:', e);
      }
    }
  }, [tokens, isMounted]);

  const addToken = (token: Token) => {
    console.log('Adding token:', token);
    setTokens(prev => {
      const updated = [token, ...prev];
      console.log('Updated tokens:', updated);
      return updated;
    });
  };

  const removeToken = (id: string) => {
    setTokens(prev => prev.filter(t => t.id !== id));
  };

  return {
    tokens,
    addToken,
    removeToken,
    isMounted,
  };
};
