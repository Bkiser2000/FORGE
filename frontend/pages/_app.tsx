import type { AppProps } from "next/app";
import { useState, ReactNode } from "react";
import "../styles/globals.css";

// Simple context for wallet connection
export const WalletContext = React.createContext<any>(null);

function App({ Component, pageProps }: AppProps) {
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<"solana" | "cronos">("cronos");

  return (
    <WalletContext.Provider
      value={{
        connectedWallet,
        setConnectedWallet,
        selectedChain,
        setSelectedChain,
      }}
    >
      <Component {...pageProps} />
    </WalletContext.Provider>
  );
}

export default App;

// Note: Add React import at top of file
import React from "react";
