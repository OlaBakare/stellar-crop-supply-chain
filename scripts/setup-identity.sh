#!/usr/bin/env bash
set -euo pipefail

# Set up a Stellar testnet identity for development
IDENTITY="${IDENTITY:-dev}"

echo "Setting up identity '$IDENTITY'..."

stellar keys generate "$IDENTITY" --network testnet

echo "Identity '$IDENTITY' created."
echo "Funding from friendbot..."

stellar keys fund "$IDENTITY" --network testnet --amount 10000

echo "Identity is ready. Address:"
stellar keys address "$IDENTITY" --network testnet
