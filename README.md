# Stellar Crop Supply Chain

[![CI](https://github.com/OlaBakare/stellar-crop-supply-chain/actions/workflows/ci.yml/badge.svg)](https://github.com/OlaBakare/stellar-crop-supply-chain/actions/workflows/ci.yml)

A transparent, on-chain crop supply contract system for agriculture built on **Stellar Soroban**.

## Overview

Stellar Crop Supply Chain enables farmers and agribusinesses to create crop supply contracts and buyers to place crop orders with full on-chain transparency. Every contract, order, status change, and refund is recorded immutably on the Stellar blockchain, giving buyers real-time visibility into their orders.

## Key Features

- **Contract Management** — Create crop supply contracts with targets, deadlines, and metadata
- **Transparent Orders** — All crop orders are tracked on-chain with immutable records
- **Status Tracking** — Orders progress through Pending → Shipped → Delivered states
- **Refund Protection** — Buyers can request refunds for undelivered orders
- **Event Logging** — Every action emits on-chain events for audit and indexing
- **Access Control** — Farmers manage their contracts; buyers manage their orders

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│   Buyer Wallet  │ ──▶ │  Soroban     │ ──▶ │   Farmer     │
│  (Stellar acct) │     │  Contract    │     │  (contract)  │
└─────────────────┘     └──────────────┘     └──────────────┘
                              │
                              ▼
                      ┌──────────────┐
                      │   Events     │
                      │  (auditable) │
                      └──────────────┘
```

## Quick Start

### Prerequisites

- Rust (stable) with `wasm32v1-none` target
- Stellar CLI (`stellar`)
- Node.js >= 18.x

### Build & Test Contracts

```bash
cd contracts
cargo test
cargo build --target wasm32v1-none --release
```

### SDK

```bash
cd sdk
npm install
npm run build
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Documentation

- [Contract API](./contracts/README.md)
- [SDK Reference](./sdk/README.md)
- [Frontend Guide](./frontend/README.md)
- [Contributing](./CONTRIBUTING.md)

## License

MIT
