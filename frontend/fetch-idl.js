const anchor = require("@coral-xyz/anchor");
const { PublicKey, Connection } = require("@solana/web3.js");

const PROGRAM_ID = new PublicKey("DkkU1jrPLiK2uEnJTBicEijdyyttr2rXHQWCijtRRgUz");
const DEVNET_RPC = "https://api.devnet.solana.com";

async function fetchIDL() {
  try {
    const connection = new Connection(DEVNET_RPC, "confirmed");
    console.log("Fetching IDL from on-chain...");
    const idl = await anchor.Program.fetchIdl(PROGRAM_ID, { connection });
    if (idl) {
      console.log("✓ IDL fetched successfully!");
      console.log(JSON.stringify(idl, null, 2));
    } else {
      console.log("❌ IDL returned null - Contract may not be deployed or doesn't have stored IDL");
    }
  } catch (error) {
    console.error("Error fetching IDL:", error.message);
  }
}

fetchIDL();
