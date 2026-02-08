'use client';

import React, { useContext, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { AppBar, Toolbar, Typography, Button, Box, Select, MenuItem, Menu, ListItemIcon, ListItemText } from "@mui/material";
import { WalletContext } from "@/pages/_app";
import Image from "next/image";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LogoutIcon from "@mui/icons-material/Logout";

interface NavbarProps {
  currentPage: "home" | "create" | "dashboard";
  onPageChange: (page: "home" | "create" | "dashboard") => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onPageChange }) => {
  const walletContext = useContext(WalletContext);
  const { selectedChain, setSelectedChain } = walletContext || {};
  const { connected } = useWallet();
  const [isClient, setIsClient] = useState(false);
  const [metaMaskAccount, setMetaMaskAccount] = useState<string | null>(null);
  const [allAccounts, setAllAccounts] = useState<string[]>([]);
  const [isLoadingMetaMask, setIsLoadingMetaMask] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  // Ensure component only renders on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Helper function to get MetaMask provider
  const getMetaMaskProvider = () => {
    if (typeof window === 'undefined') return null;
    
    // First, check if window.ethereum exists and is MetaMask
    if (window.ethereum) {
      console.log('window.ethereum exists, isMetaMask:', window.ethereum.isMetaMask);
      if (window.ethereum.isMetaMask) {
        return window.ethereum;
      }
      
      // Check providers array
      if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
        const metaMask = window.ethereum.providers.find((p: any) => {
          console.log('Checking provider:', p.isMetaMask);
          return p?.isMetaMask;
        });
        if (metaMask) {
          console.log('Found MetaMask in providers array');
          return metaMask;
        }
      }
    }
    
    console.log('MetaMask provider not found');
    return null;
  };

  // Check for MetaMask connection on mount and listen for changes
  useEffect(() => {
    if (!isClient) return;

    const checkMetaMaskConnection = async () => {
      console.log('Checking MetaMask connection...');
      const provider = getMetaMaskProvider();
      if (!provider) {
        console.log('No MetaMask provider found');
        setMetaMaskAccount(null);
        setAllAccounts([]);
        return;
      }

      try {
        console.log('Requesting eth_accounts...');
        const accounts = await provider.request({ method: 'eth_accounts' });
        console.log('Accounts returned:', accounts);
        if (accounts && accounts.length > 0) {
          console.log('Setting account:', accounts[0]);
          setMetaMaskAccount(accounts[0]);
          setAllAccounts(accounts);
        }
      } catch (err) {
        console.error('Error checking MetaMask connection:', err);
      }
    };

    checkMetaMaskConnection();

    // Listen for account changes
    const provider = getMetaMaskProvider();
    if (provider) {
      console.log('Setting up accountsChanged listener');
      const handleAccountsChanged = (accounts: string[]) => {
        console.log('Accounts changed event:', accounts);
        if (accounts && accounts.length > 0) {
          setMetaMaskAccount(accounts[0]);
          setAllAccounts(accounts);
        } else {
          setMetaMaskAccount(null);
          setAllAccounts([]);
        }
      };
      
      provider.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        console.log('Removing accountsChanged listener');
        provider.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [isClient]);

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const connectMetaMask = async () => {
    console.log('Connect MetaMask clicked');
    const provider = getMetaMaskProvider();
    
    if (!provider) {
      console.error('MetaMask provider not found');
      console.log('window.ethereum:', window.ethereum);
      console.log('window.ethereum?.isMetaMask:', window.ethereum?.isMetaMask);
      console.log('window.ethereum?.providers:', window.ethereum?.providers);
      alert('MetaMask is not installed. Please install it to continue.');
      return;
    }

    console.log('Found MetaMask provider:', provider);
    console.log('Provider isMetaMask:', provider.isMetaMask);
    
    setIsLoadingMetaMask(true);
    try {
      console.log('Calling eth_requestAccounts...');
      
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('MetaMask request timed out')), 10000)
      );
      
      const requestPromise = provider.request({ method: 'eth_requestAccounts' });
      
      const accounts = await Promise.race([requestPromise, timeoutPromise]);
      
      console.log('Connection successful. Accounts:', accounts);
      
      if (accounts && Array.isArray(accounts) && accounts.length > 0) {
        console.log('Setting account:', accounts[0]);
        setMetaMaskAccount(accounts[0]);
        setAllAccounts(accounts as string[]);
      } else {
        console.warn('No accounts returned or invalid format:', accounts);
      }
    } catch (err: any) {
      console.error('Error type:', err?.constructor?.name);
      console.error('Error message:', err?.message);
      console.error('Full error:', err);
      alert(`Connection failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsLoadingMetaMask(false);
    }
  };

  const copyAddress = async () => {
    if (metaMaskAccount) {
      try {
        await navigator.clipboard.writeText(metaMaskAccount);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const switchToAccount = async (account: string) => {
    const provider = getMetaMaskProvider();
    if (!provider) return;

    try {
      // Some MetaMask versions don't support direct account switching
      // So we request accounts again which allows user to select
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setMetaMaskAccount(account);
      }
      setAnchorEl(null);
    } catch (err) {
      console.error('Error switching account:', err);
    }
  };

  const disconnectMetaMask = () => {
    setMetaMaskAccount(null);
    setAllAccounts([]);
    setAnchorEl(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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

          {/* Wallet Buttons */}
          {selectedChain === "solana" ? (
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
          ) : (
            // MetaMask wallet button for Cronos
            <>
              {!metaMaskAccount ? (
                <Button
                  onClick={connectMetaMask}
                  disabled={isLoadingMetaMask}
                  sx={{
                    backgroundColor: '#2563eb',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: isLoadingMetaMask ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    textTransform: 'none',
                    '&:hover': {
                      opacity: 0.9,
                    },
                    '&:disabled': {
                      opacity: 0.5,
                    }
                  }}
                >
                  {isLoadingMetaMask ? 'Connecting...' : 'Connect MetaMask'}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleMenuOpen}
                    sx={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      fontWeight: 'bold',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      textTransform: 'none',
                      '&:hover': {
                        opacity: 0.9,
                      }
                    }}
                  >
                    {formatWallet(metaMaskAccount)}
                  </Button>
                  
                  {/* Dropdown Menu */}
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    PaperProps={{
                      sx: {
                        backgroundColor: '#1a1f2e',
                        color: 'white',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }
                    }}
                  >
                    {/* Current Account Display */}
                    <MenuItem disabled sx={{ pointerEvents: 'none' }}>
                      <Box sx={{ fontSize: '12px', opacity: 0.7 }}>
                        Connected Account:
                      </Box>
                    </MenuItem>
                    <MenuItem 
                      sx={{ 
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        justifyContent: 'space-between',
                      }}
                    >
                      {metaMaskAccount}
                    </MenuItem>

                    {/* Divider */}
                    <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', my: 0.5 }} />

                    {/* Copy Address */}
                    <MenuItem onClick={copyAddress}>
                      <ListItemIcon sx={{ color: 'white', minWidth: 'auto', mr: 1 }}>
                        <ContentCopyIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>
                        {copied ? 'Copied!' : 'Copy Address'}
                      </ListItemText>
                    </MenuItem>

                    {/* Switch Account (if multiple accounts) */}
                    {allAccounts.length > 1 && (
                      <>
                        <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', my: 0.5 }} />
                        <MenuItem disabled sx={{ pointerEvents: 'none' }}>
                          <Box sx={{ fontSize: '12px', opacity: 0.7 }}>
                            Switch Account:
                          </Box>
                        </MenuItem>
                        {allAccounts.map((account) => (
                          <MenuItem
                            key={account}
                            onClick={() => switchToAccount(account)}
                            selected={account === metaMaskAccount}
                            sx={{
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              backgroundColor: account === metaMaskAccount ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                            }}
                          >
                            {formatWallet(account)}
                          </MenuItem>
                        ))}
                      </>
                    )}

                    {/* Divider */}
                    <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', my: 0.5 }} />

                    {/* Disconnect */}
                    <MenuItem 
                      onClick={disconnectMetaMask}
                      sx={{
                        color: '#ef4444',
                        '&:hover': {
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        }
                      }}
                    >
                      <ListItemIcon sx={{ color: '#ef4444', minWidth: 'auto', mr: 1 }}>
                        <LogoutIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Disconnect</ListItemText>
                    </MenuItem>
                  </Menu>
                </>
              )}
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
