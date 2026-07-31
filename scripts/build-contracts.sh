#!/usr/bin/env bash
set -euo pipefail

# Build all Soroban contracts for release (WASM)
echo "Building contracts for WASM release..."

cd "$(dirname "$0")/.."

# Ensure WASM target is installed
rustup target add wasm32v1-none 2>/dev/null || true

# Build the contract
cd contracts
cargo build --target wasm32v1-none --release

echo "Build complete. WASM artifact at:"
echo "  contracts/target/wasm32v1-none/release/crop_supply_chain.wasm"
