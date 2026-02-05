const anchor = require("@coral-xyz/anchor");
const { Connection, PublicKey } = require("@solana/web3.js");

const PROGRAM_ID = new PublicKey("BJ81sbW7WqtvujCHJ2RbNM3NDBBbH13sEFDJ8soUzBJF");
const DEVNET_RPC = "https://api.devnet.solana.com";

async function testConnection() {
  try {
    console.log("🔗 Testing connection to Solana Devnet...");
    const connection = new Connection(DEVNET_RPC, "confirmed");
    
    console.log("Checking if Program exists on-chain...");
    const accountInfo = await connection.getAccountInfo(PROGRAM_ID);
    
    if (accountInfo) {
      console.log("✅ Program found on-chain!");
      console.log("   Program ID:", PROGRAM_ID.toString());
      console.log("   Owner:", accountInfo.owner.toString());
      console.log("   Data size:", accountInfo.data.length, "bytes");
      console.log("   Is executable:", accountInfo.executable);
    } else {
      console.log("❌ Program not found at this address on devnet");
    }
  } catch (error) {
    console.error("Connection error:", error.message);
  }
}

testConnection();
