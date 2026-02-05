import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { Box, Container } from "@mui/material";

// Dynamically import CreateTokenForm to prevent SSR issues with wallet hooks
const CreateTokenForm = dynamic(
  () => import("./CreateTokenForm").then(mod => ({ default: mod.CreateTokenForm })),
  { ssr: false }
);

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
