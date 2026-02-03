import React, { useContext } from "react";
import { WalletContext } from "@/pages/_app";

interface NavbarProps {
  currentPage: "home" | "create" | "dashboard";
  onPageChange: (page: "home" | "create" | "dashboard") => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onPageChange }) => {
  const walletContext = useContext(WalletContext);
  const { connectedWallet, setConnectedWallet, selectedChain, setSelectedChain } =
    walletContext || {};

  const handleConnectWallet = () => {
    // Placeholder for wallet connection logic
    setConnectedWallet?.("0x742d35Cc6634C0532925a3b844Bc9e7595f1e1e4");
  };

  const handleDisconnect = () => {
    setConnectedWallet?.(null);
  };

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  return (
    <nav className="glass-effect sticky top-0 z-50 border-b border-blue-400 border-opacity-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onPageChange("home")}>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">⚒️</span>
            </div>
            <span className="gradient-text font-bold text-xl hidden sm:inline">FORGE</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <button
              onClick={() => onPageChange("home")}
              className={`transition ${
                currentPage === "home"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onPageChange("create")}
              className={`transition ${
                currentPage === "create"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Create Token
            </button>
            <button
              onClick={() => onPageChange("dashboard")}
              className={`transition ${
                currentPage === "dashboard"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Dashboard
            </button>
          </div>

          {/* Chain Selector & Wallet */}
          <div className="flex items-center space-x-4">
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain?.(e.target.value as "solana" | "cronos")}
              className="input-field text-sm py-2 px-3 w-32"
            >
              <option value="cronos">Cronos</option>
              <option value="solana">Solana</option>
            </select>

            {connectedWallet ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-400">
                  {formatWallet(connectedWallet)}
                </span>
                <button
                  onClick={handleDisconnect}
                  className="btn-secondary text-sm"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button onClick={handleConnectWallet} className="btn-primary text-sm">
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
