'use client';

import React from "react";
import { CreateTokenForm } from "./CreateTokenForm";
import { Box, Container } from "@mui/material";

const TokenCreator: React.FC = () => {
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
