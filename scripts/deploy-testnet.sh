#!/usr/bin/env bash
set -euo pipefail

# Deploy contracts to Stellar testnet
# Requires: stellar CLI installed and a funded testnet account

NETWORK="${STELLAR_NETWORK:-testnet}"
CONTRACT_NAME="${CONTRACT_NAME:-crop-supply-chain}"

echo "Deploying to $NETWORK..."

# Build first
bash "$(dirname "$0")/build-contracts.sh"

# Deploy
stellar contract deploy \
  --network "$NETWORK" \
  --wasm "$(dirname "$0")/../contracts/target/wasm32v1-none/release/crop_supply_chain.wasm" \
  --contract "$CONTRACT_NAME"

echo "Deployment complete."
