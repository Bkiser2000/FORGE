import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <AppBar position="static" sx={{ background: "rgba(34, 34, 34, 0.95)" }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          CannaCoin Dapp
        </Typography>
        <Box>
          <Button color="inherit" component={Link} to="/">Home</Button>
          <Button color="inherit" component={Link} to="/staking">Staking</Button>
          <Button color="inherit" component={Link} to="/governance">Governance</Button>
          <Button color="inherit" component={Link} to="/airdrop">Airdrop</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
