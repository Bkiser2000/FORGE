import { useCallback, useState } from "react";
import { ethers } from "ethers";

/**
 * Hook to manage wallet connection
 */
export const useWallet = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const connectWallet = useCallback(async () => {
    setLoading(true);
    try {
      if (!(window as any).ethereum) {
        throw new Error("MetaMask not installed");
      }

      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setProvider(provider);
      setSigner(signer);
      setAddress(address);
      setIsConnected(true);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
  }, []);

  return {
    address,
    provider,
    signer,
    isConnected,
    loading,
    connectWallet,
    disconnectWallet,
  };
};

/**
 * Hook to create token
 */
export const useCreateToken = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createToken = useCallback(
    async (
      factoryAddress: string,
      tokenConfig: {
        name: string;
        symbol: string;
        initialSupply: string;
        maxSupply: string;
      },
      signer: ethers.Signer
    ) => {
      setLoading(true);
      setError(null);

      try {
        // Implementation would go here
        console.log("Creating token:", tokenConfig);
        return { success: true, hash: "0x..." };
      } catch (err: any) {
        setError(err.message || "Error creating token");
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createToken, loading, error };
};
