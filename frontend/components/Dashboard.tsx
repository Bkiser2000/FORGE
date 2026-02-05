import React, { useState } from "react";
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  Typography,
} from "@mui/material";

// Only import hooks after checking window exists
let useTokens: any;

if (typeof window !== 'undefined') {
  useTokens = require("../hooks/useTokens").useTokens;
}

const DashboardContent: React.FC = () => {
  const { tokens, isMounted } = useTokens();
  const [activeTab, setActiveTab] = useState<"tokens" | "activity">("tokens");

  // Don't render until client-side hydration is complete
  if (!isMounted) {
    return (
      <section className="w-full py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
            Loading...
          </Typography>
        </div>
      </section>
    );
  }

  const formatAddress = (address: string) => {
    if (address === "pending") return "Pending...";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <section className="w-full py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          Your Tokens
        </Typography>
        <Typography variant="body2" sx={{ mb: 4, color: 'rgba(255,255,255,0.7)' }}>
          Manage and monitor all your created tokens on Solana devnet
        </Typography>

        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
          <Card sx={{ background: 'rgba(102, 126, 234, 0.1)', border: '1px solid rgba(102, 126, 234, 0.3)' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Tokens</Typography>
              <Typography variant="h5" sx={{ color: '#667eea' }}>{tokens.length}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.3)' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Supply</Typography>
              <Typography variant="h5" sx={{ color: '#a78bfa' }}>{tokens.reduce((sum, t) => sum + t.totalSupply, 0).toLocaleString()}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Network</Typography>
              <Typography variant="h5" sx={{ color: '#3b82f6' }}>Solana Devnet</Typography>
            </CardContent>
          </Card>
          <Card sx={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Status</Typography>
              <Typography variant="h5" sx={{ color: '#10b981' }}>Active</Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Tokens Table */}
        {tokens.length > 0 ? (
          <TableContainer component={Paper} sx={{ background: 'rgba(26, 31, 46, 0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'rgba(102, 126, 234, 0.1)' }}>
                  <TableCell sx={{ color: '#667eea', fontWeight: 'bold' }}>Token Name</TableCell>
                  <TableCell sx={{ color: '#667eea', fontWeight: 'bold' }}>Symbol</TableCell>
                  <TableCell sx={{ color: '#667eea', fontWeight: 'bold' }}>Supply</TableCell>
                  <TableCell sx={{ color: '#667eea', fontWeight: 'bold' }}>Decimals</TableCell>
                  <TableCell sx={{ color: '#667eea', fontWeight: 'bold' }}>Created</TableCell>
                  <TableCell sx={{ color: '#667eea', fontWeight: 'bold' }}>Transaction</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id} sx={{ '&:hover': { background: 'rgba(102, 126, 234, 0.05)' } }}>
                    <TableCell sx={{ color: 'white' }}>{token.name}</TableCell>
                    <TableCell sx={{ color: '#667eea', fontWeight: 'bold' }}>{token.symbol}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>{token.totalSupply.toLocaleString()}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>{token.decimals}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>{formatDate(token.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        href={`https://explorer.solana.com/tx/${token.transactionHash}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: '#3b82f6', textTransform: 'none' }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Card sx={{ background: 'rgba(26, 31, 46, 0.8)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', py: 6 }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                No tokens created yet
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Create your first token to get started
              </Typography>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
};

// Wrapper component that only renders on client
const Dashboard: React.FC = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return <DashboardContent />;
};

export default Dashboard;
