import type { AppProps } from "next/app";
import { useState, useEffect } from "react";
import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { SolanaWalletProvider } from "@/components/SolanaWalletProvider";
import "../styles/globals.css";

// Simple context for wallet connection
export const WalletContext = React.createContext<any>(null);

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0f1419",
      paper: "#1a1f2e",
    },
    primary: {
      main: "#2563eb",
    },
    secondary: {
      main: "#00d4ff",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App({ Component, pageProps }: AppProps) {
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<"solana" | "cronos">("solana");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <SolanaWalletProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
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
      </ThemeProvider>
    </SolanaWalletProvider>
  );
}

export default App;
