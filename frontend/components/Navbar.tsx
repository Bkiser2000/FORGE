import React, { useContext } from "react";
import { AppBar, Toolbar, Typography, Button, Box, Select, MenuItem } from "@mui/material";
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
    setConnectedWallet?.("0x742d35Cc6634C0532925a3b844Bc9e7595f1e1e4");
  };

  const handleDisconnect = () => {
    setConnectedWallet?.(null);
  };

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  return (
    <AppBar position="static" sx={{ background: "rgba(34, 34, 34, 0.95)" }}>
      <Toolbar>
        {/* Logo/Title */}
        <Typography 
          variant="h6" 
          sx={{ flexGrow: 1, cursor: "pointer", fontWeight: "bold" }}
          onClick={() => onPageChange("home")}
        >
          FORGE
        </Typography>

        {/* Navigation Links */}
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 3 }}>
          <Button 
            color="inherit" 
            onClick={() => onPageChange("home")}
            sx={{ 
              color: currentPage === "home" ? "#60a5fa" : "inherit",
              fontWeight: currentPage === "home" ? "bold" : "normal",
              "&:hover": { color: "#60a5fa" }
            }}
          >
            Home
          </Button>
          <Button 
            color="inherit" 
            onClick={() => onPageChange("create")}
            sx={{ 
              color: currentPage === "create" ? "#60a5fa" : "inherit",
              fontWeight: currentPage === "create" ? "bold" : "normal",
              "&:hover": { color: "#60a5fa" }
            }}
          >
            Create
          </Button>
          <Button 
            color="inherit" 
            onClick={() => onPageChange("dashboard")}
            sx={{ 
              color: currentPage === "dashboard" ? "#60a5fa" : "inherit",
              fontWeight: currentPage === "dashboard" ? "bold" : "normal",
              "&:hover": { color: "#60a5fa" }
            }}
          >
            Dashboard
          </Button>
        </Box>

        {/* Right Controls */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", ml: 2 }}>
          {/* Chain Selector */}
          <Select
            value={selectedChain}
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
                borderColor: "#60a5fa"
              }
            }}
          >
            <MenuItem value="cronos">Cronos</MenuItem>
            <MenuItem value="solana">Solana</MenuItem>
          </Select>

          {/* Wallet Button */}
          {connectedWallet ? (
            <Button
              onClick={handleDisconnect}
              sx={{
                color: "white",
                backgroundColor: "rgba(220, 38, 38, 0.2)",
                border: "1px solid rgba(220, 38, 38, 0.5)",
                textTransform: "none",
                fontSize: "0.875rem",
                "&:hover": {
                  backgroundColor: "rgba(220, 38, 38, 0.3)"
                }
              }}
            >
              {formatWallet(connectedWallet)}
            </Button>
          ) : (
            <Button
              onClick={handleConnectWallet}
              sx={{
                color: "white",
                backgroundColor: "#2563eb",
                textTransform: "none",
                fontSize: "0.875rem",
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: "#1d4ed8"
                }
              }}
            >
              Connect
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
