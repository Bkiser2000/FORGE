'use client';

import React, { useContext, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { AppBar, Toolbar, Typography, Button, Box, Select, MenuItem, Menu, ListItemIcon, ListItemText, Tooltip } from "@mui/material";
import { WalletContext } from "@/pages/_app";
import Image from "next/image";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LogoutIcon from "@mui/icons-material/Logout";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

interface NavbarProps {
  currentPage: "home" | "create" | "dashboard";
  onPageChange: (page: "home" | "create" | "dashboard") => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onPageChange }) => {
  const walletContext = useContext(WalletContext);
  const { selectedChain, setSelectedChain } = walletContext || {};
  const { connected, disconnect } = useWallet();
  const [isClient, setIsClient] = useState(false);
  const [metaMaskAccount, setMetaMaskAccount] = useState<string | null>(null);
  const [allAccounts, setAllAccounts] = useState<string[]>([]);
  const [isLoadingMetaMask, setIsLoadingMetaMask] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  // Ensure component only renders on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle chain switching - disconnect current wallet when switching chains
  useEffect(() => {
    if (!isClient) return;

    const handleChainSwitch = async () => {
      if (selectedChain === "solana") {
        // Disconnecting MetaMask when switching to Solana
        console.log('Chain switched to Solana, disconnecting MetaMask');
        setMetaMaskAccount(null);
        setAllAccounts([]);
      } else if (selectedChain === "cronos") {
        // Disconnecting Solana when switching to Cronos
        console.log('Chain switched to Cronos, disconnecting Solana wallet');
        if (connected) {
          try {
            await disconnect();
            console.log('Solana wallet disconnected');
          } catch (err) {
            console.error('Error disconnecting Solana wallet:', err);
          }
        }
        // Also clear MetaMask connection to force fresh connect prompt
        setMetaMaskAccount(null);
        setAllAccounts([]);
      }
    };

    handleChainSwitch();
  }, [selectedChain, connected, disconnect, isClient]);

  // Helper function to get MetaMask provider specifically
  const getMetaMaskProvider = () => {
    if (typeof window === 'undefined') return null;
    
    console.log('[MetaMask Detection] Starting provider detection');
    
    // Strategy 1: Check if window.ethereum itself is MetaMask (most common case)
    if (window.ethereum?.isMetaMask === true) {
      console.log('[MetaMask Detection] ✓ Found MetaMask as primary provider');
      return window.ethereum;
    }
    
    // Strategy 2: Look through providers array for MetaMask specifically
    if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
      console.log(`[MetaMask Detection] Checking ${window.ethereum.providers.length} providers in array`);
      const metaMask = window.ethereum.providers.find((p: any) => p?.isMetaMask === true);
      if (metaMask) {
        console.log('[MetaMask Detection] ✓ Found MetaMask in providers array');
        return metaMask;
      }
    }
    
    console.log('[MetaMask Detection] ✗ MetaMask provider not found');
    return null;
  };

  // Check for MetaMask connection on mount and when chain switches to Cronos
  useEffect(() => {
    if (!isClient || selectedChain !== "cronos") return;

    const checkMetaMaskConnection = async () => {
      console.log('[MetaMask Check] Checking MetaMask connection on Cronos chain');
      const provider = getMetaMaskProvider();
      if (!provider) {
        console.log('[MetaMask Check] No MetaMask provider found, clearing account');
        setMetaMaskAccount(null);
        setAllAccounts([]);
        return;
      }

      try {
        console.log('[MetaMask Check] Requesting eth_accounts...');
        const accounts = await provider.request({ method: 'eth_accounts' });
        console.log('[MetaMask Check] Accounts returned:', accounts);
        if (accounts && Array.isArray(accounts) && accounts.length > 0) {
          console.log('[MetaMask Check] Setting account:', accounts[0]);
          setMetaMaskAccount(accounts[0]);
          setAllAccounts(accounts);
        } else {
          console.log('[MetaMask Check] No accounts found');
          setMetaMaskAccount(null);
          setAllAccounts([]);
        }
      } catch (err) {
        console.error('[MetaMask Check] Error checking connection:', err);
        setMetaMaskAccount(null);
        setAllAccounts([]);
      }
    };

    checkMetaMaskConnection();

    // Listen for account changes only when on Cronos
    const provider = getMetaMaskProvider();
    if (provider) {
      console.log('[MetaMask Listener] Setting up accountsChanged listener for Cronos');
      const handleAccountsChanged = (accounts: any) => {
        console.log('[MetaMask Listener] Accounts changed event:', accounts);
        if (accounts && Array.isArray(accounts) && accounts.length > 0) {
          setMetaMaskAccount(accounts[0]);
          setAllAccounts(accounts);
        } else {
          setMetaMaskAccount(null);
          setAllAccounts([]);
        }
      };
      
      provider.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        console.log('[MetaMask Listener] Removing accountsChanged listener');
        provider.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [isClient, selectedChain]);

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const connectMetaMask = async () => {
    console.log('=== Connect MetaMask clicked ===');
    
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      const provider = getMetaMaskProvider();
      
      if (!provider) {
        console.error('MetaMask provider not found');
        console.log('window:', typeof window);
        console.log('window.ethereum:', window.ethereum);
        console.log('window.ethereum?.isMetaMask:', window.ethereum?.isMetaMask);
        console.log('window.ethereum?.providers:', window.ethereum?.providers);
        alert('MetaMask is not installed. Please install it to continue.');
        return;
      }

      console.log('✓ Found MetaMask provider');
      console.log('Provider object:', provider);
      console.log('Provider isMetaMask:', provider.isMetaMask);
      console.log('Provider request method exists:', typeof provider.request);
      
      setIsLoadingMetaMask(true);
      
      console.log('About to create timeout promise...');
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          console.error('⏱️  TIMEOUT: eth_requestAccounts took more than 10 seconds');
          reject(new Error('MetaMask request timed out after 10 seconds'));
        }, 10000);
        console.log('Timeout set, ID:', timeoutId);
      });
      
      console.log('About to call provider.request...');
      const requestPromise = (async () => {
        console.log('Inside requestPromise');
        try {
          console.log('Calling provider.request with method: eth_requestAccounts');
          const result = await provider.request({ method: 'eth_requestAccounts' });
          console.log('✓ provider.request returned:', result);
          return result;
        } catch (innerErr) {
          console.error('✗ provider.request threw error:', innerErr);
          throw innerErr;
        }
      })();
      
      console.log('About to race promises...');
      const accounts = await Promise.race([requestPromise, timeoutPromise]);
      
      // Clear timeout if promise resolved
      if (timeoutId) {
        clearTimeout(timeoutId);
        console.log('✓ Cleared timeout');
      }
      
      console.log('✓ Got accounts:', accounts);
      
      if (accounts && Array.isArray(accounts) && accounts.length > 0) {
        console.log('✓ Setting account:', accounts[0]);
        setMetaMaskAccount(accounts[0]);
        setAllAccounts(accounts as string[]);
      } else {
        console.warn('⚠️  No accounts or invalid format:', accounts);
      }
    } catch (err: any) {
      console.error('=== ERROR ===');
      console.error('Error type:', err?.constructor?.name);
      console.error('Error message:', err?.message);
      console.error('Error code:', err?.code);
      console.error('Full error:', err);
      alert(`Connection failed: ${err?.message || 'Unknown error'}`);
    } finally {
      // Make sure timeout is cleared
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      console.log('=== Connect attempt finished ===');
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
    setShowWalletSelector(false);
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
            onChange={(e) => {
              const newChain = e.target.value as "solana" | "cronos";
              console.log(`User switching from ${selectedChain} to ${newChain}`);
              setSelectedChain?.(newChain);
            }}
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
            !connected ? (
              <Tooltip title="Choose wallet provider">
                <Box sx={{
                  display: 'flex',
                  gap: 1,
                  '& .wallet-adapter-button': {
                    backgroundColor: '#2563eb',
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
                }}>
                  <WalletMultiButton />
                  <Button
                    size="small"
                    sx={{
                      backgroundColor: '#2563eb',
                      color: 'white',
                      fontWeight: 'bold',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontSize: '12px',
                      minWidth: 'auto',
                      '&:hover': {
                        opacity: 0.9,
                      }
                    }}
                    onClick={() => setShowWalletSelector(!showWalletSelector)}
                  >
                    <SwapHorizIcon sx={{ fontSize: '16px' }} />
                  </Button>
                </Box>
              </Tooltip>
            ) : (
              <Box sx={{
                '& .wallet-adapter-button': {
                  backgroundColor: '#10b981',
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
              }}>
                <WalletMultiButton />
              </Box>
            )
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
                  <Tooltip title="Click to manage account">
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
                  </Tooltip>
                  
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
