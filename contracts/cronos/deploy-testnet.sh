#!/bin/bash
# Cronos token deployment script

set -e

echo "=== Deploying TokenFactory to Cronos Testnet ==="

# Source environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

# Check required variables
if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
  echo "Error: DEPLOYER_PRIVATE_KEY not set in .env"
  exit 1
fi

echo "Network: Cronos Testnet"
echo "Factory deployment starting..."

# Deploy using hardhat
npx hardhat run scripts/deploy.js --network cronos_testnet

echo "=== Deployment complete ==="
