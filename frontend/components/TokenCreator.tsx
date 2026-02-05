import React, { useEffect, useState } from "react";
import { CreateTokenForm } from "./CreateTokenForm";
import { Box, Container } from "@mui/material";

const TokenCreator: React.FC = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <section className="w-full py-12 px-4">
      <Container maxWidth="sm">
        <Box sx={{ animation: 'fadeIn 0.5s ease-in' }}>
          <CreateTokenForm />
        </Box>
      </Container>
    </section>
  );
};

export default TokenCreator;
