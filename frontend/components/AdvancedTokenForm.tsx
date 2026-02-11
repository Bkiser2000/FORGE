'use client';

import React, { useState, useContext } from 'react';
import {
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  Stack,
  Paper,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { WalletContext } from '@/pages/_app';
import { BrowserProvider } from 'ethers';

interface TokenConfig {
  name: string;
  symbol: string;
  initialSupply: number;
  decimals: number;
  // Features
  mintingEnabled: boolean;
  burningEnabled: boolean;
  pausableEnabled: boolean;
  transferTaxEnabled: boolean;
  transferTaxPercentage: number;
  cappedSupplyEnabled: boolean;
  maxSupply: number;
}

interface AdvancedTokenFormProps {
  onSuccess?: (contractAddress: string) => void;
}

const AdvancedTokenForm: React.FC<AdvancedTokenFormProps> = ({ onSuccess }) => {
  const walletContext = useContext(WalletContext);
  const { connectedWallet } = walletContext || {};

  const [config, setConfig] = useState<TokenConfig>({
    name: '',
    symbol: '',
    initialSupply: 1000,
    decimals: 18,
    mintingEnabled: true,
    burningEnabled: true,
    pausableEnabled: false,
    transferTaxEnabled: false,
    transferTaxPercentage: 0,
    cappedSupplyEnabled: false,
    maxSupply: 0,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleToggle = (field: keyof TokenConfig) => {
    setConfig(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateConfig = (): string | null => {
    if (!config.name.trim()) return 'Token name is required';
    if (!config.symbol.trim()) return 'Token symbol is required';
    if (config.symbol.length > 10) return 'Symbol must be 10 characters or less';
    if (config.initialSupply < 1) return 'Initial supply must be at least 1';
    if (config.decimals < 0 || config.decimals > 18) return 'Decimals must be between 0 and 18';
    if (config.transferTaxEnabled && config.transferTaxPercentage < 0) return 'Tax percentage cannot be negative';
    if (config.transferTaxEnabled && config.transferTaxPercentage > 100) return 'Tax percentage cannot exceed 100%';
    if (config.cappedSupplyEnabled && config.maxSupply <= 0) return 'Max supply must be greater than 0';
    if (config.cappedSupplyEnabled && config.initialSupply > config.maxSupply) return 'Initial supply cannot exceed max supply';
    return null;
  };

  const handleCreateToken = async () => {
    if (!connectedWallet) {
      setMessage({ type: 'error', text: 'Please connect your wallet first' });
      return;
    }

    const validationError = validateConfig();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // TODO: Implement contract compilation and deployment
      // For now, show a preview and next steps
      setMessage({ 
        type: 'success', 
        text: 'Advanced token configuration ready for deployment. Implementation coming soon!' 
      });
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err?.message || 'Failed to create token' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getConfigSummary = () => {
    const features = [];
    if (config.mintingEnabled) features.push('✓ Minting');
    if (config.burningEnabled) features.push('✓ Burning');
    if (config.pausableEnabled) features.push('✓ Pausable');
    if (config.transferTaxEnabled) features.push(`✓ ${config.transferTaxPercentage}% Transfer Tax`);
    if (config.cappedSupplyEnabled) features.push(`✓ Capped at ${config.maxSupply}`);
    return features.length > 0 ? features : ['Standard ERC-20'];
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '800px', mx: 'auto', py: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
            🛠️ Advanced Token Builder
          </Typography>

          {message && (
            <Alert severity={message.type} sx={{ mb: 2 }}>
              {message.text}
            </Alert>
          )}

          <Stack spacing={3}>
            {/* Basic Information */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                Basic Information
                <Tooltip title="Core token properties">
                  <InfoIcon sx={{ fontSize: '20px', opacity: 0.7 }} />
                </Tooltip>
              </Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Token Name"
                  name="name"
                  value={config.name}
                  onChange={handleInputChange}
                  placeholder="e.g., My Custom Token"
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Token Symbol"
                  name="symbol"
                  value={config.symbol}
                  onChange={handleInputChange}
                  placeholder="e.g., MCT"
                  inputProps={{ maxLength: 10 }}
                  size="small"
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    sx={{ flex: 1 }}
                    label="Initial Supply"
                    name="initialSupply"
                    type="number"
                    value={config.initialSupply}
                    onChange={handleInputChange}
                    size="small"
                  />
                  <TextField
                    sx={{ flex: 1 }}
                    label="Decimals"
                    name="decimals"
                    type="number"
                    value={config.decimals}
                    onChange={handleInputChange}
                    inputProps={{ min: 0, max: 18 }}
                    size="small"
                  />
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Features */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                Features
                <Tooltip title="Optional token capabilities">
                  <InfoIcon sx={{ fontSize: '20px', opacity: 0.7 }} />
                </Tooltip>
              </Typography>

              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.mintingEnabled}
                      onChange={() => handleToggle('mintingEnabled')}
                    />
                  }
                  label="Allow Minting"
                  labelPlacement="end"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={config.burningEnabled}
                      onChange={() => handleToggle('burningEnabled')}
                    />
                  }
                  label="Allow Burning"
                  labelPlacement="end"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={config.pausableEnabled}
                      onChange={() => handleToggle('pausableEnabled')}
                    />
                  }
                  label="Pausable Transfers"
                  labelPlacement="end"
                />

                <Box sx={{ pl: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.transferTaxEnabled}
                        onChange={() => handleToggle('transferTaxEnabled')}
                      />
                    }
                    label="Transfer Tax"
                    labelPlacement="end"
                  />
                  {config.transferTaxEnabled && (
                    <TextField
                      fullWidth
                      label="Tax Percentage"
                      name="transferTaxPercentage"
                      type="number"
                      value={config.transferTaxPercentage}
                      onChange={handleInputChange}
                      inputProps={{ min: 0, max: 100, step: 0.1 }}
                      size="small"
                      sx={{ mt: 1 }}
                      helperText="Percentage of each transfer that goes to tax collector"
                    />
                  )}
                </Box>

                <Box sx={{ pl: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.cappedSupplyEnabled}
                        onChange={() => handleToggle('cappedSupplyEnabled')}
                      />
                    }
                    label="Capped Supply"
                    labelPlacement="end"
                  />
                  {config.cappedSupplyEnabled && (
                    <TextField
                      fullWidth
                      label="Maximum Supply"
                      name="maxSupply"
                      type="number"
                      value={config.maxSupply}
                      onChange={handleInputChange}
                      size="small"
                      sx={{ mt: 1 }}
                      helperText="Maximum tokens that can ever exist"
                    />
                  )}
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Summary */}
            <Paper sx={{ p: 2, backgroundColor: 'rgba(37, 99, 235, 0.1)', borderLeft: '4px solid #2563eb' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                Configuration Summary
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  📋 Name: <strong>{config.name || '(not set)'}</strong> ({config.symbol || '?'})
                </Typography>
                <Typography variant="body2">
                  💰 Supply: <strong>{config.initialSupply.toLocaleString()} × 10^{config.decimals}</strong>
                </Typography>
                <Typography variant="body2">
                  ✨ Features: <strong>{getConfigSummary().join(', ')}</strong>
                </Typography>
              </Stack>
            </Paper>

            {/* Actions */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => setShowPreview(true)}
                disabled={loading}
              >
                Preview Contract
              </Button>
              <Button
                variant="contained"
                onClick={handleCreateToken}
                disabled={loading || !connectedWallet}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Deploy Contract'}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Contract Configuration Preview</DialogTitle>
        <DialogContent>
          <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '12px', mt: 2 }}>
            {`Constructor Parameters:
- name: "${config.name}"
- symbol: "${config.symbol}"
- initialSupply: ${config.initialSupply}
- decimals: ${config.decimals}
- mintingEnabled: ${config.mintingEnabled}
- burningEnabled: ${config.burningEnabled}
- pausableEnabled: ${config.pausableEnabled}
- transferTaxEnabled: ${config.transferTaxEnabled}
- transferTaxPercentage: ${config.transferTaxPercentage}
- cappedSupplyEnabled: ${config.cappedSupplyEnabled}
- maxSupply: ${config.maxSupply}

The contract will be deployed with these exact settings.`}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedTokenForm;
