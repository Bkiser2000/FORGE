import React, { useState } from 'react';
import { Contract, JsonRpcProvider, formatUnits, toBigInt } from 'ethers';

const TOKEN_FACTORY_ABI = [
  "function getCreatorTokens(address creator) public view returns (address[])",
  "function getAllTokens() public view returns (address[])",
  "function getTokenCount() public view returns (uint256)"
];

const FORGE_TOKEN_ABI = [
  "function name() public view returns (string)",
  "function symbol() public view returns (string)",
  "function decimals() public view returns (uint8)",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address account) public view returns (uint256)",
];

interface VerifiedToken {
  address: string;
  name: string;
  symbol: string;
  totalSupply: string;
  yourBalance: string;
  decimals: number;
}

export const TokenVerifier: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [verifiedTokens, setVerifiedTokens] = useState<VerifiedToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const FACTORY_ADDRESS = '0x5c794C6C26c59535F00cCdD25bEB75b4f6D7F95e'; // Current factory (v3: exact supply)
  const OLD_FACTORY_ADDRESSES = [
    '0xa01cEC833f6366F9363cF2FBbE3b5f0DCB60442e', // v2: with decimals multiplication
    '0x0Eded943B926951bA233CE2A6044f20A5936788e', // v1: original factory
  ];
  const CRONOS_RPC = 'https://evm-t3.cronos.org';

  const formatTokenAmount = (amount: string | bigint | number, decimals: number = 18): string => {
    try {
      // Convert input to BigInt if it's a string
      let bigAmount: bigint;
      if (typeof amount === 'string') {
        bigAmount = toBigInt(amount);
      } else if (typeof amount === 'number') {
        bigAmount = toBigInt(amount);
      } else {
        bigAmount = amount;
      }

      // Manually divide by 10^decimals to convert from wei
      const divisor = toBigInt(10 ** decimals);
      const whole = bigAmount / divisor;
      const remainder = bigAmount % divisor;

      // Convert to decimal number
      const wholeNum = Number(whole);
      const remainderNum = Number(remainder) / (10 ** decimals);
      const num = wholeNum + remainderNum;

      // Format with comma separators and minimal decimals
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: num % 1 === 0 ? 0 : 6,
      });
    } catch (err) {
      console.error('Error formatting token amount:', err);
      return amount?.toString() || '0';
    }
  };

  // Estimate initial supply by dividing by 10^decimals
  // (for tokens from v1/v2 factories that multiplied the supply)
  const estimateInitialSupply = (totalSupply: string, decimals: number): string => {
    try {
      let bigAmount: bigint;
      if (typeof totalSupply === 'string') {
        bigAmount = toBigInt(totalSupply);
      } else {
        bigAmount = toBigInt(totalSupply);
      }

      // Divide by 10^decimals to reverse the multiplication
      const divisor = toBigInt(10 ** decimals);
      const estimated = bigAmount / divisor;
      const remainingWei = bigAmount % divisor;

      // If there's a significant remainder, this might not be a multiplied supply
      const remainderThreshold = divisor / toBigInt(100); // 1% threshold
      if (remainingWei > remainderThreshold) {
        // Likely exact supply from v3, not multiplied
        return formatTokenAmount(totalSupply, decimals);
      }

      const estimatedNum = Number(estimated);
      return estimatedNum.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    } catch (err) {
      console.error('Error estimating initial supply:', err);
      return totalSupply?.toString() || '0';
    }
  };

  const verifyTokens = async () => {
    if (!walletAddress) {
      setError('Please enter a wallet address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Verifying tokens for:', walletAddress);

      // Create provider without wallet
      const provider = new JsonRpcProvider(CRONOS_RPC);
      
      // Query current and all previous factories for backward compatibility
      const allFactoryAddresses = [FACTORY_ADDRESS, ...OLD_FACTORY_ADDRESSES];
      const allTokenAddresses = new Set<string>();
      
      for (const factoryAddr of allFactoryAddresses) {
        try {
          const factoryContract = new Contract(
            factoryAddr,
            TOKEN_FACTORY_ABI,
            provider
          );

          const tokenAddresses = await factoryContract.getCreatorTokens(walletAddress);
          console.log(`Found ${tokenAddresses.length} tokens from factory ${factoryAddr}:`, tokenAddresses);
          
          tokenAddresses.forEach((addr: string) => allTokenAddresses.add(addr));
        } catch (err) {
          console.warn(`Error querying factory ${factoryAddr}:`, err);
          // Continue to next factory even if one fails
        }
      }

      console.log('Total unique tokens found:', Array.from(allTokenAddresses).length);

      // Get details for each token
      const tokens: VerifiedToken[] = [];
      for (const tokenAddr of Array.from(allTokenAddresses)) {
        try {
          const tokenContract = new Contract(tokenAddr, FORGE_TOKEN_ABI, provider);
          const [name, symbol, decimals, totalSupply, balance] = await Promise.all([
            tokenContract.name(),
            tokenContract.symbol(),
            tokenContract.decimals(),
            tokenContract.totalSupply(),
            tokenContract.balanceOf(walletAddress),
          ]);

          tokens.push({
            address: tokenAddr,
            name,
            symbol,
            decimals: Number(decimals),
            totalSupply: totalSupply.toString(),
            yourBalance: balance.toString(),
          });
        } catch (err) {
          console.error('Error fetching token details for', tokenAddr, err);
        }
      }

      setVerifiedTokens(tokens);
      console.log('Verified tokens:', tokens);
    } catch (err: any) {
      setError(err?.message || 'Error verifying tokens');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="token-verifier" style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
      <h3>🔍 Token Verifier</h3>
      <p style={{ opacity: 0.7, fontSize: '14px' }}>
        Verify tokens created by querying the smart contract directly
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Enter wallet address (0x...)"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          style={{
            flex: 1,
            padding: '10px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '4px',
            color: 'white',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        />
        <button
          onClick={verifyTokens}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </div>

      {error && (
        <div style={{ color: '#ef4444', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '4px', marginBottom: '16px' }}>
          ✗ {error}
        </div>
      )}

      {verifiedTokens.length > 0 && (
        <div>
          <h4>✓ Tokens Found: {verifiedTokens.length}</h4>
          {verifiedTokens.map((token) => (
            <div
              key={token.address}
              style={{
                padding: '12px',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '4px',
                marginBottom: '8px',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
                {token.name} ({token.symbol})
              </div>
              <div style={{ fontSize: '12px', opacity: 0.7, fontFamily: 'monospace', marginBottom: '8px', wordBreak: 'break-all' }}>
                📍 {token.address}
              </div>
              <div style={{ fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ opacity: 0.7 }}>On-Chain Supply:</span> <strong style={{ color: '#10b981' }}>{formatTokenAmount(token.totalSupply, token.decimals)}</strong> {token.symbol}
              </div>
              <div style={{ fontSize: '12px', marginBottom: '8px', opacity: 0.7, background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '3px' }}>
                💡 <span style={{ opacity: 0.8 }}>Estimated Initial:</span> <strong>{estimateInitialSupply(token.totalSupply, token.decimals)}</strong> {token.symbol}
              </div>
              <div style={{ fontSize: '13px' }}>
                <span style={{ opacity: 0.7 }}>Your Balance:</span> <strong style={{ color: '#3b82f6' }}>{formatTokenAmount(token.yourBalance, token.decimals)}</strong> {token.symbol}
              </div>
            </div>
          ))}
        </div>
      )}

      {verifiedTokens.length === 0 && !loading && !error && walletAddress && (
        <div style={{ opacity: 0.7, fontSize: '14px' }}>
          No tokens found for this address
        </div>
      )}

      <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(59,130,246,0.1)', borderRadius: '4px', fontSize: '12px' }}>
        <strong>Factory Address:</strong> {FACTORY_ADDRESS}
      </div>
    </div>
  );
};
