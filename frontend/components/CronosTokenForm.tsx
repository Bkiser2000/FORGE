import React, { useState, useEffect, useContext } from 'react';
import { BrowserProvider, formatUnits } from 'ethers';
import { CronosTokenClient } from '../lib/cronos-client';
import { WalletContext } from '@/pages/_app';

interface CronosTokenFormProps {
  onSuccess?: (tokenAddress: string) => void;
}

export const CronosTokenForm: React.FC<CronosTokenFormProps> = ({ onSuccess }) => {
  const walletContext = useContext(WalletContext);
  const { connectedWallet } = walletContext || {};
  
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    initialSupply: 1000,
    maxSupply: 0,
    decimals: 18,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // TokenFactory contract address on Cronos Testnet
  // v3: Exact supply (no 10^decimals multiplication)
  const FACTORY_ADDRESS = '0x5c794C6C26c59535F00cCdD25bEB75b4f6D7F95e';
  const CRONOS_RPC = 'https://evm-t3.cronos.org'; // Cronos testnet

  useEffect(() => {
    console.log('[CronosTokenForm] Initializing with factory address:', FACTORY_ADDRESS);
    // Use the wallet from context if available
    if (connectedWallet) {
      console.log('[CronosTokenForm] Using connected wallet from context:', connectedWallet);
      setAccount(connectedWallet);
    } else {
      // Otherwise check for existing connection
      checkWalletConnection();
    }
  }, [connectedWallet]);

  // Detect and use only MetaMask
  const getMetaMaskProvider = () => {
    if (typeof window === 'undefined') return null;
    
    // Get MetaMask specifically
    if (window.ethereum?.isMetaMask) {
      return window.ethereum;
    }
    
    // Check for Ethereum providers array (EIP-6963)
    if (window.ethereum?.providers?.length > 0) {
      const metaMask = window.ethereum.providers.find((p: any) => p.isMetaMask);
      if (metaMask) return metaMask;
    }
    
    return null;
  };

  const checkWalletConnection = async () => {
    const provider = getMetaMaskProvider();
    if (!provider) {
      console.log('MetaMask not found');
      return;
    }
    
    try {
      const accounts = await provider.request({
        method: 'eth_accounts',
      });
      if (accounts && accounts.length > 0) {
        console.log('Found connected account:', accounts[0]);
        setAccount(accounts[0]);
      }
    } catch (err) {
      console.error('Error checking wallet connection:', err);
    }
  };

  const connectWallet = async () => {
    const provider = getMetaMaskProvider();
    if (!provider) {
      setError('MetaMask is not installed. Please install MetaMask extension.');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });
      if (accounts && accounts.length > 0) {
        console.log('Connected account:', accounts[0]);
        setAccount(accounts[0]);
        setError(null);
        
        // Set up account change listener
        provider.on('accountsChanged', (newAccounts: string[]) => {
          console.log('Accounts changed:', newAccounts);
          if (newAccounts.length > 0) {
            setAccount(newAccounts[0]);
          } else {
            setAccount(null);
          }
        });
        
        // Switch to Cronos network after connecting
        await switchToCronosNetwork();
      }
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err?.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToCronosNetwork = async () => {
    const provider = getMetaMaskProvider();
    if (!provider) {
      setError('MetaMask is not installed');
      return;
    }

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x152' }], // 338 in hex
      });
      console.log('Switched to Cronos testnet');
    } catch (err: any) {
      if (err.code === 4902) {
        // Network not added, add it
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x152',
                chainName: 'Cronos Testnet',
                rpcUrls: [CRONOS_RPC],
                nativeCurrency: {
                  name: 'CRO',
                  symbol: 'CRO',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://testnet.cronoscan.com/'],
              },
            ],
          });
          console.log('Added and switched to Cronos testnet');
        } catch (addErr) {
          setError('Failed to add Cronos network');
          console.error(addErr);
        }
      } else {
        setError('Failed to switch network');
        console.error(err);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'decimals' 
        ? parseInt(value) 
        : name.includes('Supply') 
          ? parseInt(value) || 0 
          : value
    }));
  };

  // Calculate and display supply recommendations based on decimals
  const getSupplyRecommendations = (decimals: number) => {
    const recommendations: { [key: number]: { min: string; max: string; description: string } } = {
      6: { min: '1,000,000', max: '1,000,000,000', description: 'Coins (similar to USDC, USDT)' },
      8: { min: '1,000,000', max: '21,000,000', description: 'Standard (similar to Bitcoin)' },
      9: { min: '1,000,000', max: '100,000,000', description: 'Alternative standard' },
      18: { min: '1,000', max: '1,000,000,000', description: 'Ethereum standard (wei-based)' },
    };
    return recommendations[decimals] || recommendations[18];
  };

  const verifyNetwork = async (): Promise<boolean> => {
    const provider = getMetaMaskProvider();
    if (!provider) {
      setError('MetaMask not found');
      return false;
    }

    try {
      const chainId = await provider.request({ method: 'eth_chainId' });
      console.log('Current chain ID:', chainId);
      
      // Cronos testnet is 0x152 (338 in decimal)
      if (chainId !== '0x152') {
        console.warn(`Wrong network. Current: ${chainId}, Expected: 0x152`);
        setError(`Wrong network detected. Chain ID: ${chainId}. Please switch to Cronos Testnet (0x152).`);
        await switchToCronosNetwork();
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error verifying network:', err);
      return false;
    }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    if (!formData.name || !formData.symbol) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Verify we're on the correct network
      const isCorrectNetwork = await verifyNetwork();
      if (!isCorrectNetwork) {
        setLoading(false);
        return;
      }
      
      // Ensure we're on the correct network
      await switchToCronosNetwork();

      // Get MetaMask provider specifically
      const metaMaskProvider = getMetaMaskProvider();
      if (!metaMaskProvider) {
        throw new Error('MetaMask provider not found');
      }

      // Get provider and signer using MetaMask specifically
      const provider = new BrowserProvider(metaMaskProvider);
      const signer = await provider.getSigner();
      
      console.log('Connected signer address:', await signer.getAddress());
      console.log('Factory address:', FACTORY_ADDRESS);

      const client = new CronosTokenClient(FACTORY_ADDRESS, CRONOS_RPC);
      await client.connectWallet(signer);

      console.log('Starting token creation...');
      const tokenAddress = await client.createToken({
        name: formData.name,
        symbol: formData.symbol,
        initialSupply: formData.initialSupply,
        maxSupply: formData.maxSupply || undefined,
        decimals: formData.decimals,
      });

      console.log('Token created at:', tokenAddress);
      const supplyInfo = formData.maxSupply > 0 
        ? `Initial: ${formData.initialSupply}, Max: ${formData.maxSupply}`
        : `Initial: ${formData.initialSupply}, Max: Unlimited`;
      setSuccess(`✓ Token created! Address: ${tokenAddress} | Supply: ${supplyInfo}`);
      onSuccess?.(tokenAddress);

      // Reset form
      setFormData({
        name: '',
        symbol: '',
        initialSupply: 1000,
        maxSupply: 0,
        decimals: 18,
      });
    } catch (err: any) {
      console.error('Error creating token:', err);
      const errorMessage = err?.reason || err?.message || 'Failed to create token';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cronos-token-form">
      {!account ? (
        <div className="wallet-connection">
          <p>Connect your MetaMask wallet to create tokens on Cronos</p>
          <button onClick={connectWallet} disabled={isConnecting} className="btn-connect">
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </button>
        </div>
      ) : (
        <>
          <div className="account-info">
            <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
            <p style={{ fontSize: '12px', opacity: 0.7 }}>
              Factory: {FACTORY_ADDRESS.slice(0, 10)}...{FACTORY_ADDRESS.slice(-8)}
            </p>
            <button onClick={switchToCronosNetwork} className="btn-switch">
              Switch to Cronos Testnet
            </button>
          </div>

          <form onSubmit={handleCreateToken} className="form">
            <div className="form-group">
              <label htmlFor="name">Token Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g., My Token"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="symbol">Token Symbol *</label>
              <input
                id="symbol"
                name="symbol"
                type="text"
                placeholder="e.g., MYT"
                value={formData.symbol}
                onChange={handleInputChange}
                maxLength={10}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="decimals">Decimals (Token Precision) *</label>
                <select
                  id="decimals"
                  name="decimals"
                  value={formData.decimals}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                  }}
                  required
                >
                  <option value="6">6 Decimals (Coins - like USDC)</option>
                  <option value="8">8 Decimals (Standard - like Bitcoin)</option>
                  <option value="9">9 Decimals (Alternative Standard)</option>
                  <option value="18">18 Decimals (Ethereum Standard)</option>
                </select>
                <small style={{ opacity: 0.6, display: 'block', marginTop: '4px', fontSize: '12px' }}>
                  {(() => {
                    const rec = getSupplyRecommendations(formData.decimals);
                    return `Recommended: ${rec.min} - ${rec.max} tokens (${rec.description})`;
                  })()}
                </small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="initialSupply">Initial Supply *</label>
                <input
                  id="initialSupply"
                  name="initialSupply"
                  type="number"
                  min="1"
                  placeholder="1000"
                  value={formData.initialSupply}
                  onChange={handleInputChange}
                  required
                />
                <small style={{ opacity: 0.6, display: 'block', marginTop: '4px' }}>
                  Enter the number of tokens (e.g., 1000 = 1000 tokens with {formData.decimals} decimals)
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="maxSupply">Max Supply (0 = unlimited)</label>
                <input
                  id="maxSupply"
                  name="maxSupply"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.maxSupply}
                  onChange={handleInputChange}
                />
                <small style={{ opacity: 0.6, display: 'block', marginTop: '4px' }}>
                  Maximum tokens that can ever exist (0 for no limit)
                </small>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && (
              <div className="success-message">
                <div>✓ {success}</div>
                <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8, wordBreak: 'break-all' }}>
                  Token successfully created!
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-create">
              {loading ? 'Creating token...' : 'Create Token'}
            </button>
          </form>
        </>
      )}

      <style jsx>{`
        .cronos-token-form {
          width: 100%;
        }

        .wallet-connection {
          text-align: center;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px dashed rgba(255, 255, 255, 0.1);
        }

        .wallet-connection p {
          margin: 0 0 1rem 0;
          color: #a0a0a0;
        }

        .btn-connect {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-connect:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
        }

        .btn-connect:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .account-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
        }

        .account-info p {
          margin: 0;
          color: #a0a0a0;
        }

        .btn-switch {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-switch:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group label {
          color: #fff;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .form-group input {
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #fff;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: rgba(245, 87, 108, 0.5);
          background: rgba(255, 255, 255, 0.08);
        }

        .form-group input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .error-message {
          padding: 1rem;
          background: rgba(220, 53, 69, 0.15);
          border: 1px solid rgba(220, 53, 69, 0.3);
          color: #ff6b7a;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .success-message {
          padding: 1rem;
          background: rgba(40, 167, 69, 0.15);
          border: 1px solid rgba(40, 167, 69, 0.3);
          color: #51cf66;
          border-radius: 6px;
          font-size: 0.9rem;
          word-break: break-all;
        }

        .btn-create {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-create:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
        }

        .btn-create:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .account-info {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default CronosTokenForm;
