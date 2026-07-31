# Crop Supply Chain Smart Contract

A Soroban smart contract for transparent crop supply contract management on Stellar.

## Overview

This contract enables farmers and farming cooperatives to create crop supply contracts, and buyers to place crop orders against them. All contracts, orders, status changes, and refunds are recorded on-chain, providing full transparency and auditability.

## Contract Functions

### Initialization

| Function | Description |
|---|---|
| `initialize(admin)` | Initialize the contract with an admin address |

### Contract Management

| Function | Auth | Description |
|---|---|---|
| `create_contract(farmer, title, description, target_amount, deadline)` | farmer | Create a new crop supply contract |
| `get_contract(contract_id)` | — | Get contract details |
| `get_farmer_contracts(farmer)` | — | List all contracts owned by a farmer |
| `update_contract_status(farmer, contract_id, status)` | farmer | Update contract status (Active/Completed/Cancelled) |

### Orders

| Function | Auth | Description |
|---|---|---|
| `place_order(buyer, contract_id, amount)` | buyer | Place a crop order against a contract |
| `get_order(order_id)` | — | Get order details |
| `get_contract_orders(contract_id)` | — | List all orders for a contract |
| `get_buyer_orders(buyer)` | — | List all orders placed by a buyer |

### Order Status Management

| Function | Auth | Description |
|---|---|---|
| `mark_shipped(farmer, order_id)` | farmer | Mark order as shipped |
| `mark_delivered(farmer, order_id)` | farmer | Mark order as delivered |
| `request_refund(buyer, order_id)` | buyer | Request refund for an undelivered order |

### Admin

| Function | Description |
|---|---|
| `get_admin()` | Get the contract admin |
| `version()` | Get contract version |
| `get_metadata()` | Get contract metadata |

## Building

```bash
# Build for testing
cargo build

# Build optimized WASM for deployment
cargo build --target wasm32v1-none --release

# Run tests
cargo test

# Run clippy
cargo clippy

# Format code
cargo fmt
```

## Data Structures

### CropContract

```rust
pub struct CropContract {
    pub id: u64,
    pub farmer: Address,
    pub title: String,           // max 200 chars
    pub description: String,     // max 1000 chars
    pub target_amount: i128,     // in stroops
    pub funded_amount: i128,     // in stroops
    pub deadline: u64,           // Unix timestamp
    pub created_at: u64,         // Unix timestamp
    pub status: ContractStatus,  // Active | Completed | Cancelled
    pub order_count: u32,
}
```

### Order

```rust
pub struct Order {
    pub id: u64,
    pub contract_id: u64,
    pub buyer: Address,
    pub amount: i128,            // in stroops
    pub ordered_at: u64,         // Unix timestamp
    pub status: OrderStatus,     // Pending | Shipped | Delivered | Refunded
    pub delivered_at: Option<u64>,
    pub refunded_at: Option<u64>,
}
```

## Status Flows

### Contract Status Flow

```
Active ──► Completed
   │
   └──► Cancelled ──► Active (reactivation)
```

### Order Status Flow

```
Pending ──► Shipped ──► Delivered
   │            │
   │            └──► Refunded (if contract expired/cancelled)
   └──► Refunded (if contract expired/cancelled before shipping)
```

## Error Codes

| Code | Error | Description |
|---|---|---|
| 1 | `AlreadyInitialized` | Contract already initialized |
| 2 | `Unauthorized` | Caller not authorized |
| 3 | `ContractNotFound` | Contract ID not found |
| 4 | `OrderNotFound` | Order ID not found |
| 5 | `ContractNotActive` | Contract not accepting orders |
| 6 | `ContractExpired` | Contract deadline passed |
| 7 | `InvalidAmount` | Amount is zero, negative, or exceeds limits |
| 8 | `InvalidDeadline` | Deadline is in the past |
| 9 | `TitleTooLong` | Title exceeds 200 chars |
| 10 | `DescriptionTooLong` | Description exceeds 1000 chars |
| 11 | `InvalidTransition` | Status transition not allowed |
| 12 | `InvalidRefundState` | Order not eligible for refund |
| 13 | `NotInitialized` | Contract not initialized |

## License

MIT
