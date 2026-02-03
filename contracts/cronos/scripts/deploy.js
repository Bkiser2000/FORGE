const hre = require("hardhat");

async function main() {
  console.log("Deploying FORGE Token Factory...");

  // Deploy TokenFactory
  const TokenFactory = await hre.ethers.getContractFactory("TokenFactory");
  const tokenFactory = await TokenFactory.deploy();

  await tokenFactory.deployed();
  console.log("TokenFactory deployed to:", tokenFactory.address);

  // Save deployment info
  const deploymentInfo = {
    TokenFactory: tokenFactory.address,
    network: hre.network.name,
    timestamp: new Date().toISOString(),
  };

  console.log("\nDeployment successful!");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
