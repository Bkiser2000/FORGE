'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Paper,
} from '@mui/material';
import ForgeClient from '../lib/forge-client';
import { useTokens } from '../hooks/useTokens';

interface CreateTokenFormProps {
  onSuccess?: (txSignature: string) => void;
}

export const CreateTokenForm: React.FC<CreateTokenFormProps> = ({
  onSuccess,
}) => {
  const { connected, publicKey, signAllTransactions, signTransaction } = useWallet();
  const { addToken } = useTokens();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState(9);
  const [initialSupply, setInitialSupply] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCreateToken = async () => {
    console.log('handleCreateToken called');
    console.log('Connected:', connected);
    console.log('PublicKey:', publicKey);
    
    if (!connected || !publicKey) {
      console.error('Wallet not connected');
      setMessage({ type: 'error', text: 'Please connect your wallet first' });
      return;
    }

    if (!name || !symbol) {
      console.error('Missing required fields');
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      console.log('Creating wallet object...');
      const wallet = { 
        publicKey, 
        signTransaction,
        signAllTransactions,
      };
      console.log('Wallet object created:', { 
        hasPublicKey: !!wallet.publicKey,
        hasSignTransaction: !!wallet.signTransaction,
        hasSignAllTransactions: !!wallet.signAllTransactions,
      });
      
      console.log('Initializing ForgeClient...');
      const client = new ForgeClient(wallet);
      console.log('ForgeClient initialized');
      
      console.log('Calling createToken with params:', {
        name,
        symbol,
        decimals,
        initialSupply,
      });
      const txHash = await client.createToken({
        name,
        symbol,
        decimals,
        initialSupply,
      });

      console.log('Token creation successful! txHash:', txHash);

      // Store the token in localStorage
      addToken({
        id: txHash,
        name,
        symbol,
        decimals,
        totalSupply: initialSupply,
        mint: 'pending',
        owner: publicKey.toString(),
        createdAt: Date.now(),
        transactionHash: txHash,
      });

      setMessage({
        type: 'success',
        text: `✅ Token created successfully! Transaction: ${txHash.slice(0, 8)}...`,
      });
      setName('');
      setSymbol('');
      setDecimals(9);
      setInitialSupply(1000);
      
      if (onSuccess) onSuccess(txHash);
    } catch (error: any) {
      console.error('Token creation failed:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      setMessage({
        type: 'error',
        text: `❌ Error: ${error?.message || 'Failed to create token'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '700px', margin: '0 auto', py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          🚀 Create Your Token
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Deploy a custom token on Solana devnet in minutes
        </Typography>
      </Box>

      {/* Main Card */}
      <Card
        sx={{
          background: 'rgba(26, 31, 46, 0.8)',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Wallet Connection Status */}
          <Box sx={{ mb: 3 }}>
            <Paper
              sx={{
                p: 2,
                background: connected
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(239, 68, 68, 0.1)',
                border: connected
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: connected ? '#10b981' : '#ef4444',
                  fontWeight: '600',
                }}
              >
                {connected ? '✓ Wallet Connected' : '✗ Wallet Not Connected'}
              </Typography>
              {connected && publicKey && (
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mt: 0.5 }}
                >
                  {publicKey.toString().slice(0, 8)}...
                  {publicKey.toString().slice(-8)}
                </Typography>
              )}
            </Paper>
          </Box>

          {/* Form Fields */}
          <Stack spacing={3}>
            {/* Token Basics */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#667eea' }}>
                Token Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Token Name"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 32))}
                  fullWidth
                  placeholder="e.g., Bitcoin"
                  disabled={loading || !connected}
                  variant="outlined"
                  helperText={`${name.length}/32 characters`}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.08)',
                      },
                    },
                  }}
                />
                <TextField
                  label="Token Symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase().slice(0, 10))}
                  fullWidth
                  placeholder="e.g., BTC"
                  disabled={loading || !connected}
                  variant="outlined"
                  helperText={`${symbol.length}/10 characters`}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.08)',
                      },
                    },
                  }}
                />
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(102, 126, 234, 0.2)' }} />

            {/* Token Properties */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#667eea' }}>
                Token Properties
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Decimals"
                  type="number"
                  value={decimals}
                  onChange={(e) => setDecimals(Math.min(9, Math.max(0, parseInt(e.target.value) || 0)))}
                  fullWidth
                  disabled={loading || !connected}
                  variant="outlined"
                  inputProps={{ min: 0, max: 9 }}
                  helperText="Precision (0-9)"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.08)',
                      },
                    },
                  }}
                />
                <TextField
                  label="Initial Supply"
                  type="number"
                  value={initialSupply}
                  onChange={(e) => setInitialSupply(Math.max(0, parseInt(e.target.value) || 0))}
                  fullWidth
                  disabled={loading || !connected}
                  variant="outlined"
                  helperText="Total tokens to mint"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.08)',
                      },
                    },
                  }}
                />
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(102, 126, 234, 0.2)' }} />

            {/* Preview */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#667eea' }}>
                Preview
              </Typography>
              <Paper
                sx={{
                  p: 2.5,
                  background: 'rgba(102, 126, 234, 0.1)',
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                  borderRadius: '8px',
                }}
              >
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Name
                    </Typography>
                    <Typography sx={{ fontWeight: '600', fontSize: '0.95rem' }}>
                      {name || '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Symbol
                    </Typography>
                    <Typography sx={{ fontWeight: '600', fontSize: '0.95rem' }}>
                      {symbol || '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Decimals
                    </Typography>
                    <Typography sx={{ fontWeight: '600', fontSize: '0.95rem' }}>
                      {decimals}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Initial Supply
                    </Typography>
                    <Typography sx={{ fontWeight: '600', fontSize: '0.95rem' }}>
                      {initialSupply.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>

            {/* Messages */}
            {message && (
              <Alert
                severity={message.type}
                sx={{
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                }}
              >
                {message.text}
              </Alert>
            )}

            {/* Action Button */}
            <Button
              onClick={handleCreateToken}
              disabled={loading || !connected || !name || !symbol}
              fullWidth
              size="large"
              sx={{
                background: loading
                  ? 'rgba(102, 126, 234, 0.5)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 'bold',
                py: 1.5,
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                '&:hover:not(:disabled)': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                },
                '&:disabled': {
                  opacity: 0.5,
                  cursor: 'not-allowed',
                },
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                  Creating Token...
                </Box>
              ) : (
                '🚀 Create Token'
              )}
            </Button>

            {!connected && (
              <Alert severity="warning">
                Please connect your wallet using the button in the top right to create a token.
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          🌐 Network: Solana Devnet | ⛓️ Transaction fees will apply
        </Typography>
      </Box>
    </Box>
  );
};
