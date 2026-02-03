import Head from "next/head";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TokenCreator from "@/components/TokenCreator";
import Dashboard from "@/components/Dashboard";

type Page = "home" | "create" | "dashboard";

const Home = () => {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  return (
    <>
      <Head>
        <title>FORGE - Multi-Chain Token Minting Platform</title>
        <meta name="description" content="Create custom crypto tokens on Solana and Cronos" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />

      <main className="flex-1 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-6xl">
          {currentPage === "home" && (
            <HeroSection onCreateClick={() => setCurrentPage("create")} />
          )}
          {currentPage === "create" && <TokenCreator />}
          {currentPage === "dashboard" && <Dashboard />}
        </div>
      </main>
    </>
  );
};

export default Home;
