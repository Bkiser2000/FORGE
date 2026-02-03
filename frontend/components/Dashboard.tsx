import React, { useState } from "react";

interface Token {
  id: string;
  name: string;
  symbol: string;
  totalSupply: string;
  decimals: number;
  chain: "solana" | "cronos";
  createdAt: string;
  address: string;
}

const Dashboard: React.FC = () => {
  // Mock data
  const [tokens] = useState<Token[]>([
    {
      id: "1",
      name: "My First Token",
      symbol: "MFT",
      totalSupply: "1,000,000",
      decimals: 18,
      chain: "cronos",
      createdAt: "2024-02-01",
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f1e1e4",
    },
    {
      id: "2",
      name: "Community Token",
      symbol: "COMM",
      totalSupply: "5,000,000",
      decimals: 9,
      chain: "solana",
      createdAt: "2024-01-28",
      address: "TokenkegQfeZyiNwAJsyFbPVwwQnmZNoKTqprstbVqYi",
    },
  ]);

  const [activeTab, setActiveTab] = useState<"tokens" | "activity">("tokens");

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <section className="w-full py-12 px-4">
      <div className="max-w-6xl mx-auto fade-in">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold gradient-text mb-2">Your Tokens</h2>
          <p className="text-gray-400">
            Manage and monitor all your created tokens across networks
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <p className="text-gray-400 text-sm">Total Tokens</p>
            <p className="text-3xl font-bold gradient-text mt-2">2</p>
          </div>
          <div className="card">
            <p className="text-gray-400 text-sm">Solana Tokens</p>
            <p className="text-3xl font-bold text-purple-400 mt-2">1</p>
          </div>
          <div className="card">
            <p className="text-gray-400 text-sm">Cronos Tokens</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">1</p>
          </div>
          <div className="card">
            <p className="text-gray-400 text-sm">Total Value Minted</p>
            <p className="text-2xl font-bold text-green-400 mt-2">6M</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("tokens")}
            className={`pb-4 px-4 font-medium transition ${
              activeTab === "tokens"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            My Tokens
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`pb-4 px-4 font-medium transition ${
              activeTab === "activity"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Recent Activity
          </button>
        </div>

        {/* Tokens Table */}
        {activeTab === "tokens" && (
          <div className="space-y-4">
            {tokens.length > 0 ? (
              tokens.map((token) => (
                <div key={token.id} className="card hover:border-blue-400 transition">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
                    <div>
                      <p className="font-semibold text-lg">{token.name}</p>
                      <p className="text-gray-400 text-sm">{token.symbol}</p>
                    </div>

                    <div className="hidden sm:block">
                      <p className="text-gray-400 text-sm">Supply</p>
                      <p className="font-medium">{token.totalSupply}</p>
                    </div>

                    <div className="hidden lg:block">
                      <p className="text-gray-400 text-sm">Decimals</p>
                      <p className="font-medium">{token.decimals}</p>
                    </div>

                    <div className="hidden lg:block">
                      <p className="text-gray-400 text-sm">Network</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          token.chain === "solana"
                            ? "bg-purple-900 bg-opacity-50 text-purple-300"
                            : "bg-blue-900 bg-opacity-50 text-blue-300"
                        }`}
                      >
                        {token.chain === "solana" ? "Solana" : "Cronos"}
                      </span>
                    </div>

                    <div className="text-right">
                      <button className="btn-secondary text-sm px-4 py-2">
                        View Details
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Created: {token.createdAt}
                    </p>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs bg-gray-900 px-2 py-1 rounded">
                        {formatAddress(token.address)}
                      </code>
                      <button className="text-gray-400 hover:text-white transition">
                        📋
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card text-center py-12">
                <p className="text-gray-400 text-lg">No tokens created yet</p>
                <p className="text-gray-500 text-sm mt-2">
                  Create your first token to get started
                </p>
              </div>
            )}
          </div>
        )}

        {/* Activity */}
        {activeTab === "activity" && (
          <div className="card">
            <div className="space-y-4">
              <div className="flex items-start space-x-4 pb-4 border-b border-gray-700">
                <div className="w-10 h-10 rounded-full bg-blue-500 bg-opacity-20 flex items-center justify-center text-blue-400">
                  ✓
                </div>
                <div className="flex-1">
                  <p className="font-medium">Created "Community Token" (COMM)</p>
                  <p className="text-sm text-gray-400">on Solana • 4 days ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 pb-4 border-b border-gray-700">
                <div className="w-10 h-10 rounded-full bg-blue-500 bg-opacity-20 flex items-center justify-center text-blue-400">
                  ✓
                </div>
                <div className="flex-1">
                  <p className="font-medium">Created "My First Token" (MFT)</p>
                  <p className="text-sm text-gray-400">on Cronos • 5 days ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center text-green-400">
                  👤
                </div>
                <div className="flex-1">
                  <p className="font-medium">Account created</p>
                  <p className="text-sm text-gray-400">7 days ago</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Dashboard;
