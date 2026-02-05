import React, { useContext } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { AppBar, Toolbar, Typography, Button, Box, Select, MenuItem } from "@mui/material";
import { WalletContext } from "@/pages/_app";
import Image from "next/image";

interface NavbarProps {
  currentPage: "home" | "create" | "dashboard";
  onPageChange: (page: "home" | "create" | "dashboard") => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onPageChange }) => {
  const walletContext = useContext(WalletContext);
  const { selectedChain, setSelectedChain } = walletContext || {};
  const { connected } = useWallet();

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        background: "linear-gradient(90deg, #0f1419 0%, #1a1f2e 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}
    >
      <Toolbar sx={{ py: 1 }}>
        {/* Logo/Title */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mr: 3 }}>
          <Image 
            src="/FORGE.jpeg" 
            alt="FORGE" 
            width={40} 
            height={40}
            style={{ borderRadius: "8px" }}
          />
          <Typography 
            variant="h6" 
            sx={{ 
              cursor: "pointer", 
              fontWeight: "bold",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
            onClick={() => onPageChange("home")}
          >
            FORGE
          </Typography>
        </Box>

        {/* Navigation Links */}
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 3 }}>
          <Button 
            color="inherit" 
            onClick={() => onPageChange("home")}
            sx={{ 
              color: currentPage === "home" ? "#2563eb" : "inherit",
              fontWeight: currentPage === "home" ? "bold" : "normal",
              textTransform: "none",
              fontSize: "16px",
              "&:hover": { color: "#2563eb" }
            }}
          >
            Home
          </Button>
          <Button 
            color="inherit" 
            onClick={() => onPageChange("create")}
            sx={{ 
              color: currentPage === "create" ? "#2563eb" : "inherit",
              fontWeight: currentPage === "create" ? "bold" : "normal",
              textTransform: "none",
              fontSize: "16px",
              "&:hover": { color: "#2563eb" }
            }}
          >
            Create Token
          </Button>
          <Button 
            color="inherit" 
            onClick={() => onPageChange("dashboard")}
            sx={{ 
              color: currentPage === "dashboard" ? "#2563eb" : "inherit",
              fontWeight: currentPage === "dashboard" ? "bold" : "normal",
              textTransform: "none",
              fontSize: "16px",
              "&:hover": { color: "#2563eb" }
            }}
          >
            Dashboard
          </Button>
        </Box>

        {/* Right Controls */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", ml: "auto" }}>
          {/* Chain Selector */}
          <Select
            value={selectedChain || "solana"}
            onChange={(e) => setSelectedChain?.(e.target.value as "solana" | "cronos")}
            sx={{
              display: { xs: "none", sm: "flex" },
              color: "white",
              fontSize: "0.875rem",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255, 255, 255, 0.2)"
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255, 255, 255, 0.3)"
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#2563eb"
              }
            }}
          >
            <MenuItem value="solana">🔗 Solana</MenuItem>
            <MenuItem value="cronos">🔗 Cronos</MenuItem>
          </Select>

          {/* Wallet Button */}
          <Box sx={{
            '& .wallet-adapter-button': {
              backgroundColor: connected ? '#10b981' : '#2563eb',
              color: 'white',
              fontWeight: 'bold',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s ease',
            },
            '& .wallet-adapter-button:hover': {
              opacity: 0.9,
            },
            '& .wallet-adapter-button:disabled': {
              opacity: 0.5,
              cursor: 'not-allowed',
            },
          }}>
            <WalletMultiButton />
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
