import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Paper,
} from '@mui/material';
import { SolanaForgeClient } from '../lib/solana-web3-client';

const SolangTestPanel: React.FC = () => {
  const { connected, publicKey, signTransaction, signAllTransactions } = useWallet();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ [key: string]: { status: 'success' | 'error'; message: string } }>({});

  const runTest = async (testName: string, testFn: () => Promise<string>) => {
    if (!connected || !publicKey) {
      setResults(prev => ({
        ...prev,
        [testName]: { status: 'error', message: 'Wallet not connected' }
      }));
      return;
    }

    setLoading(true);
    try {
      const client = new SolanaForgeClient({ 
        wallet: { publicKey, signTransaction, signAllTransactions } 
      });
      const signature = await testFn.call(client);
      setResults(prev => ({
        ...prev,
        [testName]: { 
          status: 'success', 
          message: `✓ Success! Tx: ${signature.slice(0, 8)}...` 
        }
      }));
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        [testName]: { 
          status: 'error', 
          message: `✗ ${error?.message || 'Unknown error'}` 
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ 
      background: 'rgba(26, 31, 46, 0.8)',
      border: '1px solid rgba(255, 193, 7, 0.3)',
      borderRadius: '16px',
      mb: 4 
    }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#ffc107', fontWeight: 'bold' }}>
          🧪 Solang Dispatcher Tests
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}>
          Test different instruction data formats to debug the dispatcher
        </Typography>

        <Stack spacing={2}>
          <Button
            variant="contained"
            onClick={() => runTest('emptyData', function(this: SolanaForgeClient) { 
              return this.testEmptyData(); 
            })}
            disabled={loading || !connected}
            sx={{ background: 'rgba(255, 193, 7, 0.2)', color: '#ffc107', border: '1px solid #ffc107' }}
          >
            {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Test 1: Empty Data
          </Button>

          <Button
            variant="contained"
            onClick={() => runTest('singleByte', function(this: SolanaForgeClient) { 
              return this.testSingleByte(); 
            })}
            disabled={loading || !connected}
            sx={{ background: 'rgba(255, 193, 7, 0.2)', color: '#ffc107', border: '1px solid #ffc107' }}
          >
            {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Test 2: Single Byte
          </Button>

          <Button
            variant="contained"
            onClick={() => runTest('anchorSelector', function(this: SolanaForgeClient) { 
              return this.testAnchorSelector(); 
            })}
            disabled={loading || !connected}
            sx={{ background: 'rgba(255, 193, 7, 0.2)', color: '#ffc107', border: '1px solid #ffc107' }}
          >
            {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Test 3: Anchor Selector (4-byte)
          </Button>

          <Button
            variant="contained"
            onClick={() => runTest('constructor', function(this: SolanaForgeClient) { 
              return this.testConstructor(); 
            })}
            disabled={loading || !connected}
            sx={{ background: 'rgba(255, 193, 7, 0.2)', color: '#ffc107', border: '1px solid #ffc107' }}
          >
            {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Test 4: Constructor (new)
          </Button>

          <Divider sx={{ my: 1 }} />

          {Object.entries(results).map(([testName, result]) => (
            <Alert 
              key={testName}
              severity={result.status === 'success' ? 'success' : 'error'}
              sx={{ 
                background: result.status === 'success' 
                  ? 'rgba(76, 175, 80, 0.1)' 
                  : 'rgba(244, 67, 54, 0.1)',
                border: `1px solid ${result.status === 'success' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}`,
                mb: 1
              }}
            >
              <Typography variant="body2">
                <strong>{testName}:</strong> {result.message}
              </Typography>
            </Alert>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default SolangTestPanel;
