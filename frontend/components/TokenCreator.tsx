import React, { useState, useContext } from "react";
import { WalletContext } from "@/pages/_app";

interface TokenConfig {
  name: string;
  symbol: string;
  initialSupply: string;
  decimals: string;
  maxSupply: string;
  description: string;
}

const TokenCreator: React.FC = () => {
  const walletContext = useContext(WalletContext);
  const { connectedWallet, selectedChain } = walletContext || {};

  const [tokenConfig, setTokenConfig] = useState<TokenConfig>({
    name: "",
    symbol: "",
    initialSupply: "",
    decimals: "18",
    maxSupply: "0",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTokenConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connectedWallet) {
      alert("Please connect your wallet first");
      return;
    }

    if (!tokenConfig.name || !tokenConfig.symbol || !tokenConfig.initialSupply) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Simulated API call
      console.log("Creating token on", selectedChain, "with config:", tokenConfig);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSuccessMessage(
        `✅ Token "${tokenConfig.name}" created successfully! Transaction: 0x...`
      );
      
      // Reset form
      setTokenConfig({
        name: "",
        symbol: "",
        initialSupply: "",
        decimals: "18",
        maxSupply: "0",
        description: "",
      });

      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      alert("Error creating token. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full py-12 px-4">
      <div className="max-w-2xl mx-auto fade-in">
        <h2 className="text-4xl font-bold gradient-text mb-2">Create Your Token</h2>
        <p className="text-gray-400 mb-8">
          Customize every aspect of your token. Deploy on {selectedChain === "solana" ? "Solana" : "Cronos"} network.
        </p>

        {successMessage && (
          <div className="card bg-green-900 bg-opacity-20 border-green-500 mb-8">
            <p className="text-green-300">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleCreateToken} className="space-y-6">
          {/* Token Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Token Name *</label>
            <input
              type="text"
              name="name"
              value={tokenConfig.name}
              onChange={handleInputChange}
              placeholder="e.g., My Awesome Token"
              className="input-field"
              maxLength={32}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {tokenConfig.name.length}/32 characters
            </p>
          </div>

          {/* Token Symbol */}
          <div>
            <label className="block text-sm font-medium mb-2">Token Symbol *</label>
            <input
              type="text"
              name="symbol"
              value={tokenConfig.symbol}
              onChange={handleInputChange}
              placeholder="e.g., MAT"
              className="input-field uppercase"
              maxLength={10}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {tokenConfig.symbol.length}/10 characters
            </p>
          </div>

          {/* Decimals */}
          <div>
            <label className="block text-sm font-medium mb-2">Decimals</label>
            <select
              name="decimals"
              value={tokenConfig.decimals}
              onChange={handleInputChange}
              className="input-field"
            >
              {[...Array(10)].map((_, i) => (
                <option key={i} value={i.toString()}>
                  {i} Decimals
                </option>
              ))}
              <option value="18">18 Decimals (Standard)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Determines how many decimal places your token can be divided into
            </p>
          </div>

          {/* Initial Supply */}
          <div>
            <label className="block text-sm font-medium mb-2">Initial Supply *</label>
            <input
              type="number"
              name="initialSupply"
              value={tokenConfig.initialSupply}
              onChange={handleInputChange}
              placeholder="e.g., 1000000"
              className="input-field"
              min="1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Total tokens to mint at creation
            </p>
          </div>

          {/* Maximum Supply */}
          <div>
            <label className="block text-sm font-medium mb-2">Maximum Supply (Optional)</label>
            <input
              type="number"
              name="maxSupply"
              value={tokenConfig.maxSupply}
              onChange={handleInputChange}
              placeholder="0 for unlimited"
              className="input-field"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Set a cap or leave as 0 for unlimited supply
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              name="description"
              value={tokenConfig.description}
              onChange={handleInputChange}
              placeholder="Describe your token..."
              className="input-field resize-none"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {tokenConfig.description.length}/500 characters
            </p>
          </div>

          {/* Summary Card */}
          <div className="card bg-blue-900 bg-opacity-20 border-blue-400">
            <h3 className="text-lg font-semibold mb-4">Preview</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Network:</span>
                <span className="capitalize font-medium">
                  {selectedChain === "solana" ? "Solana" : "Cronos"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Token Name:</span>
                <span className="font-medium">{tokenConfig.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Symbol:</span>
                <span className="font-medium">{tokenConfig.symbol || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Initial Supply:</span>
                <span className="font-medium">{tokenConfig.initialSupply || "—"}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !connectedWallet}
            className={`w-full btn-primary py-4 text-lg font-semibold transition ${
              loading || !connectedWallet ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Creating Token..." : "Create Token"}
          </button>

          {!connectedWallet && (
            <p className="text-center text-yellow-400 text-sm">
              ⚠️ Please connect your wallet to create a token
            </p>
          )}
        </form>
      </div>
    </section>
  );
};

export default TokenCreator;
