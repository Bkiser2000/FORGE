import React, { useState } from 'react';
import { Box, Container, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import Navbar from '@/components/Navbar';
import AdvancedTokenForm from '@/components/AdvancedTokenForm';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function AdvancedTokenPage() {
  const [currentPage, setCurrentPage] = useState<'home' | 'create' | 'dashboard'>('create');
  const [deploymentSuccess, setDeploymentSuccess] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState('');

  const handleTokenCreated = (contractAddress: string) => {
    setDeployedAddress(contractAddress);
    setDeploymentSuccess(true);
  };

  const handleCloseSuccess = () => {
    setDeploymentSuccess(false);
    setDeployedAddress('');
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#0f0f1e' }}>
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
      
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Header */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography 
            variant="h3" 
            sx={{ 
              mb: 2, 
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Advanced Token Builder
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#a0aec0',
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            Create custom ERC-20 tokens on Cronos with modular features. 
            Configure minting, burning, pausable transfers, transfer taxes, and supply caps 
            through an intuitive interface.
          </Typography>
        </Box>

        {/* Features Overview */}
        <Paper 
          sx={{ 
            p: 4, 
            mb: 6, 
            backgroundColor: '#1a1a2e',
            borderLeft: '4px solid #667eea'
          }}
        >
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            Available Features
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
            {[
              { title: 'Minting', desc: 'Owner can create new tokens' },
              { title: 'Burning', desc: 'Token holders can destroy tokens' },
              { title: 'Pausable', desc: 'Owner can freeze all transfers' },
              { title: 'Transfer Tax', desc: 'Configurable fee on transfers' },
              { title: 'Capped Supply', desc: 'Maximum total token limit' },
              { title: 'Custom Decimals', desc: '0-18 decimal places' },
            ].map((feature) => (
              <Box key={feature.title}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  ✓ {feature.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                  {feature.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Main Form */}
        <AdvancedTokenForm onSuccess={handleTokenCreated} />

        {/* Success Dialog */}
        <Dialog open={deploymentSuccess} onClose={handleCloseSuccess} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <CheckCircleIcon sx={{ fontSize: '48px', color: '#48bb78' }} />
            </Box>
            Token Deployed Successfully!
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Your custom token has been successfully deployed to the Cronos testnet.
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: '#2d3748', fontFamily: 'monospace', overflowX: 'auto' }}>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {deployedAddress}
              </Typography>
            </Paper>
            <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#a0aec0' }}>
              You can now interact with your token, mint more tokens (if enabled), 
              and perform other operations based on your configuration.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSuccess}>Close</Button>
            <Button 
              onClick={() => {
                // Copy address to clipboard
                navigator.clipboard.writeText(deployedAddress);
                alert('Address copied to clipboard!');
              }}
              variant="contained"
            >
              Copy Address
            </Button>
          </DialogActions>
        </Dialog>

        {/* Documentation Links */}
        <Box sx={{ mt: 8, p: 4, backgroundColor: '#1a1a2e', borderRadius: '8px', textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            Learn More
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button 
              variant="outlined"
              href="/docs/ADVANCED_TOKEN_BUILDER.md"
              target="_blank"
            >
              Technical Documentation
            </Button>
            <Button 
              variant="outlined"
              href="/docs/ADVANCED_TOKEN_INTEGRATION.md"
              target="_blank"
            >
              Integration Guide
            </Button>
            <Button 
              variant="outlined"
              href="https://docs.openzeppelin.com/contracts/4.x/"
              target="_blank"
            >
              OpenZeppelin Docs
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
