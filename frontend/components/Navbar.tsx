'use client';

import React, { useContext, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { AppBar, Toolbar, Typography, Button, Box, Select, MenuItem, Menu, ListItemIcon, ListItemText, Tooltip, Dialog, DialogTitle, DialogContent, List, ListItem } from "@mui/material";
import { WalletContext } from "@/pages/_app";
import Image from "next/image";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LogoutIcon from "@mui/icons-material/Logout";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

interface NavbarProps {
  currentPage: "home" | "create" | "dashboard";
  onPageChange: (page: "home" | "create" | "dashboard") => void;
}

interface EthereumProvider {
  isMetaMask?: boolean;
  isPhantom?: boolean;
  isCoinbaseWallet?: boolean;
  request: (args: any) => Promise<any>;
  on: (event: string, handler: any) => void;
  removeListener: (event: string, handler: any) => void;
}

interface DetectedWallet {
  name: string;
  provider: EthereumProvider;
  isMetaMask: boolean;
  isPhantom: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onPageChange }) => {
  const walletContext = useContext(WalletContext);
  const { selectedChain, setSelectedChain, setConnectedWallet } = walletContext || {};
  const { connected, disconnect } = useWallet();
  const [isClient, setIsClient] = useState(false);
  const [metaMaskAccount, setMetaMaskAccount] = useState<string | null>(null);
  const [allAccounts, setAllAccounts] = useState<string[]>([]);
  const [isLoadingMetaMask, setIsLoadingMetaMask] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<DetectedWallet[]>([]);
  const [selectedWalletAnchor, setSelectedWalletAnchor] = useState<null | HTMLElement>(null);
  const [autoShowWalletDialog, setAutoShowWalletDialog] = useState(false);

  // Ensure component only renders on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle chain switching - properly disconnect and clear state
  useEffect(() => {
    if (!isClient) return;

    const handleChainSwitch = async () => {
      if (selectedChain === "solana") {
        // Switching to Solana - disconnect from EVM wallet
        console.log('[Chain Switch] Switching to Solana - clearing EVM wallet state');
        setMetaMaskAccount(null);
        setAllAccounts([]);
        setSelectedWalletAnchor(null);
        setAutoShowWalletDialog(false);
        
        // Disconnect Solana wallet adapter if connected
        if (connected) {
          try {
            await disconnect();
            console.log('[Chain Switch] Solana wallet disconnected');
          } catch (err) {
            console.error('[Chain Switch] Error disconnecting Solana wallet:', err);
          }
        }
      } else if (selectedChain === "cronos") {
        // Switching to Cronos - disconnect from Solana wallet and clear EVM state
        console.log('[Chain Switch] Switching to Cronos - clearing all wallet state');
        
        // Clear any existing EVM connection
        setMetaMaskAccount(null);
        setAllAccounts([]);
        setSelectedWalletAnchor(null);
        
        // Disconnect Solana wallet if connected
        if (connected) {
          try {
            await disconnect();
            console.log('[Chain Switch] Solana wallet disconnected');
          } catch (err) {
            console.error('[Chain Switch] Error disconnecting Solana wallet:', err);
          }
        }
        
        // Show wallet selection dialog
        setTimeout(() => {
          console.log('[Chain Switch] Showing wallet selection dialog');
          setAutoShowWalletDialog(true);
        }, 100);
      }
    };

    handleChainSwitch();
  }, [selectedChain, connected, disconnect, isClient]);

  // Helper function to detect MetaMask ONLY - no Phantom
  const detectAvailableWallets = (): DetectedWallet[] => {
    if (typeof window === 'undefined') return [];
    
    console.log('[Wallet Detection] Starting to detect MetaMask for Cronos chain');
    const detected: DetectedWallet[] = [];
    
    // STRICT: Only accept MetaMask, explicitly reject Phantom
    // Look for MetaMask-specific providers in the providers array
    
    if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
      console.log(`[Wallet Detection] Checking ${window.ethereum.providers.length} providers in array`);
      
      // First pass: Find MetaMask provider
      window.ethereum.providers.forEach((provider: any, index: number) => {
        console.log(`[Wallet Detection] Provider[${index}]:`, {
          isMetaMask: provider.isMetaMask,
          isPhantom: provider.isPhantom,
          isCoinbaseWallet: provider.isCoinbaseWallet,
          hasUUID: !!provider.providers?.find((p: any) => p.isMetaMask),
        });
        
        // REJECT Phantom explicitly
        if (provider.isPhantom === true) {
          console.log(`[Wallet Detection] ✗ Rejected Phantom in providers[${index}]`);
          return; // Skip this provider
        }
        
        // REJECT anything that's not MetaMask
        if (provider.isMetaMask !== true) {
          console.log(`[Wallet Detection] ✗ Skipped non-MetaMask provider in providers[${index}]`);
          return;
        }
        
        // Accept only pure MetaMask
        if (!detected.find(w => w.isMetaMask)) {
          console.log(`[Wallet Detection] ✓ Found MetaMask in providers[${index}]`);
          detected.push({
            name: 'MetaMask',
            provider: provider as EthereumProvider,
            isMetaMask: true,
            isPhantom: false,
          });
        }
      });
    }
    
    // Fallback: Check primary window.ethereum only if not found in array
    if (detected.length === 0 && window.ethereum) {
      console.log('[Wallet Detection] MetaMask not found in providers array, checking window.ethereum...');
      console.log('[Wallet Detection] window.ethereum:', {
        isMetaMask: window.ethereum.isMetaMask,
        isPhantom: window.ethereum.isPhantom,
      });
      
      // REJECT if Phantom
      if (window.ethereum.isPhantom === true) {
        console.log('[Wallet Detection] ✗ Rejected Phantom as primary provider');
      } else if (window.ethereum.isMetaMask === true) {
        console.log('[Wallet Detection] ✓ Found MetaMask as primary provider');
        detected.push({
          name: 'MetaMask',
          provider: window.ethereum as EthereumProvider,
          isMetaMask: true,
          isPhantom: false,
        });
      } else {
        console.log('[Wallet Detection] ✗ Primary window.ethereum is not MetaMask');
      }
    }
    
    console.log(`[Wallet Detection] Final detected wallets:`, detected.map(w => w.name));
    return detected;
  };

  // Helper function to get MetaMask provider specifically
  const getMetaMaskProvider = (): EthereumProvider | null => {
    const wallets = detectAvailableWallets();
    const metaMask = wallets.find(w => w.isMetaMask);
    if (metaMask) {
      console.log('[MetaMask Provider] Using MetaMask provider:', metaMask.name);
      return metaMask.provider;
    }
    console.log('[MetaMask Provider] MetaMask provider not found');
    return null;
  };

  // When chain switches to Cronos, detect wallets and show selection dialog
  useEffect(() => {
    if (!isClient || selectedChain !== "cronos") return;

    const checkWalletsAndConnection = async () => {
      console.log('[Wallet Detection] Checking available wallets on Cronos chain');
      
      // Detect all available EVM wallets - do this fresh each time
      const wallets = detectAvailableWallets();
      console.log('[Wallet Detection] Detected wallets:', wallets.map(w => w.name));
      setAvailableWallets(wallets);
      
      // Wait a moment for state to update, then show dialog if wallets available
      if (wallets.length > 0) {
        console.log('[Wallet Detection] Will show wallet selection dialog');
        setAutoShowWalletDialog(true);
      } else {
        console.log('[Wallet Detection] No wallets detected');
      }
    };

    // Small delay to ensure state is cleared first
    const timer = setTimeout(checkWalletsAndConnection, 50);
    
    return () => clearTimeout(timer);
  }, [isClient, selectedChain]);

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const connectWithWallet = async (wallet: DetectedWallet) => {
    console.log(`=== Attempting to connect with ${wallet.name} ===`);
    
    // SAFETY CHECK: Make absolutely sure we're not connecting to Phantom
    if (wallet.name === 'Phantom' || wallet.isPhantom) {
      console.error('❌ REJECTED: Attempting to connect to Phantom on Cronos chain');
      alert('Phantom is not supported on Cronos chain. Please use MetaMask.');
      return;
    }
    
    // Clear any existing account state BEFORE attempting connection
    console.log(`[${wallet.name}] Clearing existing account state`);
    setMetaMaskAccount(null);
    setAllAccounts([]);
    
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      // Get a fresh provider reference by re-detecting
      console.log(`[${wallet.name}] Re-detecting wallet provider to ensure fresh reference`);
      const freshWallets = detectAvailableWallets();
      console.log(`[${wallet.name}] Fresh detection found: ${freshWallets.map(w => w.name).join(', ')}`);
      
      const freshWallet = freshWallets.find(w => w.name === wallet.name);
      
      if (!freshWallet) {
        console.error(`${wallet.name} not found in fresh detection`);
        alert(`${wallet.name} is not available. Please ensure it's installed.`);
        return;
      }
      
      const provider = freshWallet.provider;
      
      if (!provider) {
        console.error(`${wallet.name} provider not found`);
        alert(`${wallet.name} is not installed. Please install it to continue.`);
        return;
      }

      // STRICT VERIFICATION: Check that provider is actually MetaMask
      console.log(`[${wallet.name}] Verifying provider is actually MetaMask...`);
      if (provider.isPhantom === true) {
        console.error(`❌ VERIFICATION FAILED: Provider claims to be Phantom (isPhantom=${provider.isPhantom})`);
        alert('Phantom was selected. Please use MetaMask instead.');
        return;
      }
      
      if (provider.isMetaMask !== true) {
        console.error(`❌ VERIFICATION FAILED: Provider is not MetaMask (isMetaMask=${provider.isMetaMask})`);
        alert('Invalid wallet provider detected. Please use MetaMask.');
        return;
      }

      console.log(`✓ Verified ${wallet.name} provider is authentic`);
      setIsLoadingMetaMask(true);
      
      // Clear dialog
      setAutoShowWalletDialog(false);
      setSelectedWalletAnchor(null);
      
      // IMPORTANT: Revoke previous connections to ensure clean slate
      // This forces MetaMask to show the account selection dialog
      console.log(`[${wallet.name}] Attempting to revoke previous connection for clean state...`);
      try {
        await provider.request({ 
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }]
        });
        console.log(`[${wallet.name}] Previous permissions revoked`);
      } catch (revokeErr: any) {
        // This may fail on older MetaMask versions, which is OK
        console.log(`[${wallet.name}] Revoke failed (normal for some MetaMask versions):`, revokeErr.message);
      }
      
      // Small delay after revoke to ensure clean state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`[${wallet.name}] Creating timeout promise...`);
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          console.error(`⏱️  TIMEOUT: eth_requestAccounts took more than 10 seconds with ${wallet.name}`);
          reject(new Error(`${wallet.name} request timed out after 10 seconds`));
        }, 10000);
      });
      
      console.log(`[${wallet.name}] Calling eth_requestAccounts (MetaMask connection prompt will appear)...`);
      const requestPromise = provider.request({ method: 'eth_requestAccounts' });
      
      const accounts = await Promise.race([requestPromise, timeoutPromise]) as string[];
      
      // Clear timeout if promise resolved
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      console.log(`[${wallet.name}] ✓ Got accounts:`, accounts);
      
      if (accounts && Array.isArray(accounts) && accounts.length > 0) {
        console.log(`[${wallet.name}] ✓ Setting account to:`, accounts[0]);
        setMetaMaskAccount(accounts[0]);
        setAllAccounts(accounts);
        // Update the global wallet context so CronosTokenForm can use it
        if (setConnectedWallet) {
          setConnectedWallet(accounts[0]);
          console.log(`[${wallet.name}] ✓ Updated context with connected wallet:`, accounts[0]);
        }
        console.log(`[${wallet.name}] ✓ Successfully connected to account:`, accounts[0]);
      } else {
        console.warn(`[${wallet.name}] ⚠️  No accounts returned:`, accounts);
        setMetaMaskAccount(null);
        setAllAccounts([]);
        if (setConnectedWallet) {
          setConnectedWallet(null);
        }
      }
    } catch (err: any) {
      console.error(`[${wallet.name}] Connection error:`, err);
      if (err.message && !err.message.includes('User rejected')) {
        alert(`Connection failed: ${err?.message || 'Unknown error'}`);
      }
      // Make sure state is cleared on error
      setMetaMaskAccount(null);
      setAllAccounts([]);
    } finally {
      // Make sure timeout is cleared
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      console.log(`[${wallet.name}] Connect attempt finished`);
      setIsLoadingMetaMask(false);
    }
  };

  const connectMetaMask = async () => {
    const metaMaskWallet = availableWallets.find(w => w.isMetaMask);
    if (metaMaskWallet) {
      await connectWithWallet(metaMaskWallet);
    } else {
      alert('MetaMask not found. Please install MetaMask extension.');
    }
  };

  const handleWalletSelect = async (wallet: DetectedWallet) => {
    await connectWithWallet(wallet);
    setAutoShowWalletDialog(false);
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
    console.log('[Disconnect] Clearing all Cronos wallet state');
    setMetaMaskAccount(null);
    setAllAccounts([]);
    setAnchorEl(null);
    setShowWalletSelector(false);
    setSelectedWalletAnchor(null);
    setAutoShowWalletDialog(false);
    setAvailableWallets([]);
    // Clear from context
    if (setConnectedWallet) {
      setConnectedWallet(null);
    }
    console.log('[Disconnect] All state cleared');
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
            // Cronos: Show available EVM wallets - similar to Solana
            <>
              {!metaMaskAccount ? (
                availableWallets.length > 0 ? (
                  <Tooltip title={`${availableWallets.length} wallet provider(s) available`}>
                    <Box sx={{
                      display: 'flex',
                      gap: 1,
                    }}>
                      <Button
                        onClick={(e) => setSelectedWalletAnchor(e.currentTarget)}
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
                        {isLoadingMetaMask ? 'Connecting...' : 'Connect Wallet'}
                      </Button>

                      {/* Wallet Selection Menu */}
                      <Menu
                        anchorEl={selectedWalletAnchor}
                        open={Boolean(selectedWalletAnchor)}
                        onClose={() => setSelectedWalletAnchor(null)}
                        PaperProps={{
                          sx: {
                            backgroundColor: '#1a1f2e',
                            color: 'white',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }
                        }}
                      >
                        {availableWallets.map((wallet) => (
                          <MenuItem
                            key={wallet.name}
                            onClick={() => {
                              handleWalletSelect(wallet);
                              setSelectedWalletAnchor(null);
                            }}
                            disabled={isLoadingMetaMask}
                            sx={{
                              fontSize: '14px',
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                              },
                              '&:disabled': {
                                opacity: 0.5,
                              }
                            }}
                          >
                            {wallet.name}
                          </MenuItem>
                        ))}
                      </Menu>
                    </Box>
                  </Tooltip>
                ) : (
                  <Button
                    disabled
                    sx={{
                      backgroundColor: '#666',
                      color: 'white',
                      fontWeight: 'bold',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'not-allowed',
                      fontSize: '14px',
                      textTransform: 'none',
                      opacity: 0.5,
                    }}
                  >
                    No Wallets
                  </Button>
                )
              ) : (
                <Box sx={{
                  display: 'flex',
                  gap: 1,
                }}>
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
                  
                  {/* Account Management Menu */}
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
                </Box>
              )}
            </>
          )}
        </Box>
      </Toolbar>

      {/* Auto Wallet Selection Dialog for Cronos */}
      <Dialog
        open={autoShowWalletDialog && selectedChain === "cronos"}
        onClose={() => setAutoShowWalletDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a1f2e',
            color: 'white',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          Select Wallet Provider
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <List sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {availableWallets.map((wallet) => (
              <Button
                key={wallet.name}
                onClick={() => handleWalletSelect(wallet)}
                disabled={isLoadingMetaMask}
                fullWidth
                sx={{
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  border: '1px solid rgba(37, 99, 235, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: isLoadingMetaMask ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  padding: '12px 16px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(37, 99, 235, 0.2)',
                    borderColor: 'rgba(37, 99, 235, 0.5)',
                  },
                  '&:disabled': {
                    opacity: 0.5,
                  }
                }}
              >
                {isLoadingMetaMask && wallet === availableWallets[0] ? 'Connecting...' : wallet.name}
              </Button>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </AppBar>
  );
};

export default Navbar;
