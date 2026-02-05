import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ForgeClient } from '../lib/forge-client';

interface CreateTokenFormProps {
  wallet: any;
  onSuccess?: (txSignature: string) => void;
}

export const CreateTokenForm: React.FC<CreateTokenFormProps> = ({
  wallet,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState(9);
  const [initialSupply, setInitialSupply] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCreateToken = async () => {
    if (!wallet || !wallet.connected) {
      setMessage({ type: 'error', text: 'Please connect your wallet first' });
      return;
    }

    if (!name || !symbol) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const client = new ForgeClient(wallet);
      const tx = await client.createToken({
        name,
        symbol,
        decimals,
        initialSupply,
      });

      setMessage({
        type: 'success',
        text: `Token created! Tx: ${tx.slice(0, 8)}...`,
      });
      setName('');
      setSymbol('');
      setInitialSupply(1000);
      
      if (onSuccess) onSuccess(tx);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `Error: ${error.message || 'Failed to create token'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <CardContent>
        <Typography variant="h5" sx={{ mb: 3, color: 'white', fontWeight: 'bold' }}>
          🚀 Create New Token
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Token Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            placeholder="e.g., My Token"
            disabled={loading}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255,255,255,0.9)',
              },
            }}
          />

          <TextField
            label="Token Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            fullWidth
            placeholder="e.g., MTK"
            disabled={loading}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255,255,255,0.9)',
              },
            }}
          />

          <TextField
            label="Decimals"
            type="number"
            value={decimals}
            onChange={(e) => setDecimals(Math.min(9, Math.max(0, parseInt(e.target.value))))}
            fullWidth
            disabled={loading}
            variant="outlined"
            inputProps={{ min: 0, max: 9 }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255,255,255,0.9)',
              },
            }}
          />

          <TextField
            label="Initial Supply"
            type="number"
            value={initialSupply}
            onChange={(e) => setInitialSupply(Math.max(0, parseInt(e.target.value) || 0))}
            fullWidth
            disabled={loading}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255,255,255,0.9)',
              },
            }}
          />

          {message && (
            <Alert severity={message.type}>
              {message.text}
            </Alert>
          )}

          <Button
            onClick={handleCreateToken}
            disabled={loading || !wallet?.connected}
            variant="contained"
            size="large"
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              fontWeight: 'bold',
              py: 1.5,
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                Creating...
              </>
            ) : (
              'Create Token'
            )}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
