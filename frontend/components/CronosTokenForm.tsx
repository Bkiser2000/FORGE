import React, { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { CronosTokenClient } from '../lib/cronos-client';
import { ClientOnly } from './ClientOnly';

interface CronosTokenFormProps {
  onSuccess?: (tokenAddress: string) => void;
}

const CronosTokenFormContent: React.FC<CronosTokenFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    initialSupply: 1000,
    maxSupply: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_CRONOS_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000';
  const CRONOS_RPC = 'https://evm-t3.cronos.org'; // Cronos testnet

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setError(null);
        // Switch to Cronos network after connecting
        await switchToCronosNetwork();
      }
    } catch (err) {
      setError('Failed to connect wallet');
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToCronosNetwork = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x152' }], // 338 in hex
      });
    } catch (err: any) {
      if (err.code === 4902) {
        // Network not added, add it
        try {
          await window.ethereum.request({
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
                blockExplorerUrls: ['https://cronoscan.com/'],
              },
            ],
          });
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Supply') ? parseInt(value) || 0 : value
    }));
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
      // Ensure we're on the correct network
      await switchToCronosNetwork();

      // Get provider and signer
      const provider = new BrowserProvider(window.ethereum);
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
      });

      console.log('Token created at:', tokenAddress);
      setSuccess(`Token created successfully! Address: ${tokenAddress}`);
      onSuccess?.(tokenAddress);

      // Reset form
      setFormData({
        name: '',
        symbol: '',
        initialSupply: 1000,
        maxSupply: 0,
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
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

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

export const CronosTokenForm: React.FC<CronosTokenFormProps> = (props) => (
  <ClientOnly>
    <CronosTokenFormContent {...props} />
  </ClientOnly>
);

export default CronosTokenForm;
