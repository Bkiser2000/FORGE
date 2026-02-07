import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { CreateTokenForm } from './CreateTokenForm';
import { CronosTokenForm } from './CronosTokenForm';
import { NetworkSelector } from './NetworkSelector';

export const UnifiedTokenCreator: React.FC = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<'solana' | 'cronos'>('solana');
  const solanaWallet = useWallet();

  const handleNetworkChange = (network: 'solana' | 'cronos') => {
    setSelectedNetwork(network);
  };

  const handleSolanaTokenCreated = (tokenInfo: any) => {
    console.log('Solana token created:', tokenInfo);
    // Handle token creation event
  };

  const handleCronosTokenCreated = (tokenAddress: string) => {
    console.log('Cronos token created:', tokenAddress);
    // Handle token creation event
  };

  return (
    <div className="unified-token-creator">
      <div className="creator-container">
        <div className="creator-header">
          <h1>🔥 Forge Token Creator</h1>
          <p>Create custom tokens on your preferred blockchain</p>
        </div>

        <NetworkSelector onNetworkChange={handleNetworkChange} />

        <div className="creator-content">
          {selectedNetwork === 'solana' ? (
            <div className="solana-creator">
              <h2>Solana Token Creation</h2>
              <p className="network-info">Creating tokens on Solana devnet</p>
              <CreateTokenForm onSuccess={handleSolanaTokenCreated} />
            </div>
          ) : (
            <div className="cronos-creator">
              <h2>Cronos Token Creation</h2>
              <p className="network-info">Creating tokens on Cronos testnet</p>
              <CronosTokenForm onSuccess={handleCronosTokenCreated} />
            </div>
          )}
        </div>

        <div className="creator-footer">
          <div className="footer-info">
            <div className="info-item">
              <span className="icon">ⓘ</span>
              <span>Both networks support token creation with customizable parameters</span>
            </div>
            <div className="info-item">
              <span className="icon">🔐</span>
              <span>Your private keys are never stored. All interactions are client-side.</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .unified-token-creator {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .creator-container {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .creator-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .creator-header h1 {
          font-size: 2.5rem;
          margin: 0 0 0.5rem 0;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .creator-header p {
          color: #a0a0a0;
          font-size: 1.1rem;
          margin: 0;
        }

        .creator-content {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 2rem;
          margin: 2rem 0;
        }

        .creator-content h2 {
          margin-top: 0;
          color: #fff;
        }

        .network-info {
          color: #888;
          font-size: 0.9rem;
          margin: 0 0 1.5rem 0;
        }

        .creator-footer {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #888;
          font-size: 0.9rem;
        }

        .icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .unified-token-creator {
            padding: 1rem;
          }

          .creator-container {
            padding: 1.5rem;
          }

          .creator-header h1 {
            font-size: 1.8rem;
          }

          .creator-content {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default UnifiedTokenCreator;
