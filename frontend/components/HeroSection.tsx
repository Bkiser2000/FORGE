import React from "react";
import { Container, Typography, Box, Button, Grid, Card, CardContent } from "@mui/material";

interface HeroSectionProps {
  onCreateClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onCreateClick }) => {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
      }}
    >
      <Container maxWidth="lg" sx={{ textAlign: "center" }}>
        {/* Main Heading */}
        <Typography
          variant="h2"
          sx={{
            fontWeight: "bold",
            mb: 3,
            background: "linear-gradient(135deg, #60a5fa 0%, #00d4ff 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: { xs: "2rem", sm: "3rem", md: "4rem" },
          }}
        >
          Forge Your Token
        </Typography>

        {/* Subheading */}
        <Typography
          variant="h6"
          sx={{
            color: "#d1d5db",
            mb: 6,
            maxWidth: "600px",
            mx: "auto",
            fontSize: { xs: "1rem", md: "1.25rem" },
          }}
        >
          Create custom crypto tokens on Solana and Cronos networks. Simple, secure, and ready to use.
        </Typography>

        {/* Feature Grid */}
        <Grid container spacing={3} sx={{ mb: 8, mt: 4 }}>
          <Grid item xs={12}>
            <Card
              sx={{
                background: "rgba(30, 41, 59, 0.4)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(96, 165, 250, 0.2)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 4,
                "&:hover": {
                  background: "rgba(30, 41, 59, 0.6)",
                  borderColor: "rgba(96, 165, 250, 0.4)",
                },
                transition: "all 0.3s ease",
              }}
            >
              <CardContent sx={{ textAlign: "center", width: "100%" }}>
                <Box sx={{ fontSize: "3rem", mb: 2 }}>⚡</Box>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                  Lightning Fast
                </Typography>
                <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                  Create tokens in seconds with instant confirmation
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card
              sx={{
                background: "rgba(30, 41, 59, 0.4)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(96, 165, 250, 0.2)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 4,
                "&:hover": {
                  background: "rgba(30, 41, 59, 0.6)",
                  borderColor: "rgba(96, 165, 250, 0.4)",
                },
                transition: "all 0.3s ease",
              }}
            >
              <CardContent sx={{ textAlign: "center", width: "100%" }}>
                <Box sx={{ fontSize: "3rem", mb: 2 }}>🔐</Box>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                  Secure
                </Typography>
                <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                  Audited smart contracts and secure wallet integration
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card
              sx={{
                background: "rgba(30, 41, 59, 0.4)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(96, 165, 250, 0.2)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 4,
                "&:hover": {
                  background: "rgba(30, 41, 59, 0.6)",
                  borderColor: "rgba(96, 165, 250, 0.4)",
                },
                transition: "all 0.3s ease",
              }}
            >
              <CardContent sx={{ textAlign: "center", width: "100%" }}>
                <Box sx={{ fontSize: "3rem", mb: 2 }}>🌐</Box>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                  Multi-Chain
                </Typography>
                <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                  Deploy on Solana and Cronos from a single interface
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* CTA Buttons */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 10, flexWrap: "wrap" }}>
          <Button
            onClick={onCreateClick}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              color: "white",
              px: 4,
              py: 1.5,
              fontSize: "1rem",
              fontWeight: "bold",
              textTransform: "none",
              "&:hover": {
                background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
              },
            }}
          >
            Start Creating
          </Button>
          <Button
            variant="outlined"
            sx={{
              color: "#60a5fa",
              borderColor: "#60a5fa",
              px: 4,
              py: 1.5,
              fontSize: "1rem",
              fontWeight: "bold",
              textTransform: "none",
              "&:hover": {
                borderColor: "#93c5fd",
                color: "#93c5fd",
              },
            }}
          >
            Learn More
          </Button>
        </Box>

        {/* Stats Section */}
        <Box sx={{ borderTop: "1px solid rgba(96, 165, 250, 0.2)", pt: 6 }}>
          <Typography
            variant="body2"
            sx={{
              color: "#9ca3af",
              mb: 4,
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Trusted by
          </Typography>

          <Grid container spacing={4} sx={{ justifyContent: "center" }}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography
                sx={{
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  background: "linear-gradient(135deg, #60a5fa 0%, #00d4ff 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                1000+
              </Typography>
              <Typography sx={{ color: "#9ca3af", mt: 1 }}>
                Tokens Created
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography
                sx={{
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  background: "linear-gradient(135deg, #60a5fa 0%, #00d4ff 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                50k+
              </Typography>
              <Typography sx={{ color: "#9ca3af", mt: 1 }}>
                Active Users
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography
                sx={{
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  background: "linear-gradient(135deg, #60a5fa 0%, #00d4ff 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                $500M+
              </Typography>
              <Typography sx={{ color: "#9ca3af", mt: 1 }}>
                Total Value Minted
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default HeroSection;
