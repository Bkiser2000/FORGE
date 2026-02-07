import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface NetworkOption {
  id: 'solana' | 'cronos';
  name: string;
  icon: string;
  description: string;
}

const NETWORKS: NetworkOption[] = [
  {
    id: 'solana',
    name: 'Solana',
    icon: '◎',
    description: 'Create tokens on Solana devnet'
  },
  {
    id: 'cronos',
    name: 'Cronos',
    icon: '⛓️',
    description: 'Create tokens on Cronos testnet'
  }
];

interface NetworkSelectorProps {
  onNetworkChange?: (network: 'solana' | 'cronos') => void;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({ onNetworkChange }) => {
  const [selectedNetwork, setSelectedNetwork] = useState<'solana' | 'cronos'>('solana');
  const solanaWallet = useWallet();

  const handleNetworkChange = (networkId: 'solana' | 'cronos') => {
    setSelectedNetwork(networkId);
    onNetworkChange?.(networkId);
  };

  return (
    <div className="network-selector">
      <h2>Select Blockchain Network</h2>
      <div className="network-grid">
        {NETWORKS.map((network) => (
          <button
            key={network.id}
            className={`network-card ${selectedNetwork === network.id ? 'active' : ''}`}
            onClick={() => handleNetworkChange(network.id)}
          >
            <div className="network-icon">{network.icon}</div>
            <div className="network-name">{network.name}</div>
            <div className="network-description">{network.description}</div>
            {selectedNetwork === network.id && (
              <div className="network-status">✓ Selected</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NetworkSelector;
