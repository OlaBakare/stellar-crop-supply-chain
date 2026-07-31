# @stellar-crop-supply/sdk

TypeScript SDK for interacting with the Stellar Crop Supply Chain Soroban smart contract.

## Installation

```bash
npm install @stellar-crop-supply/sdk
```

## Quick Start

```typescript
import { CropSupplyClient, AmountUtils, ContractStatus } from '@stellar-crop-supply/sdk';

// Initialize the client
const client = new CropSupplyClient({
  rpcUrl: 'https://soroban-testnet.stellar.org:443',
  networkPassphrase: 'Test SDF Network; September 2015',
  contractId: 'CD...your-contract-id',
});

// Create a contract
const contractId = await client.createContract({
  farmer: 'G...farmer-address',
  title: 'Organic Wheat Harvest',
  description: 'Direct supply of organic wheat from a local cooperative',
  targetAmount: AmountUtils.toStroops(500), // 500 XLM
  deadline: String(Math.floor(Date.now() / 1000) + 86400 * 30), // 30 days
});

// Place an order
const orderId = await client.placeOrder(
  'G...buyer-address',
  contractId,
  AmountUtils.toStroops(50) // 50 XLM
);

// Track order status
const order = await client.getOrder(orderId);
console.log(`Order status: ${order.status}`);

// Mark as delivered
await client.markDelivered('G...farmer-address', orderId);
```

## API Reference

### `CropSupplyClient`

#### Constructor

```typescript
new CropSupplyClient(config: CropSupplyClientConfig)
```

**Config:**
- `rpcUrl: string` — Soroban RPC endpoint URL
- `networkPassphrase: string` — Network passphrase (`Networks.TESTNET` or `Networks.PUBLIC`)
- `contractId: string` — Deployed contract ID
- `feeSource?: Account` — Optional fee-paying account

#### Methods

##### Initialization

| Method | Returns | Description |
|---|---|---|
| `getAdmin()` | `Promise<string>` | Get the contract admin address |
| `getVersion()` | `Promise<number>` | Get contract version |
| `getMetadata()` | `Promise<Record<string, string>>` | Get contract metadata |

##### Contract Management

| Method | Returns | Description |
|---|---|---|
| `createContract(options)` | `Promise<string>` | Create a new crop supply contract |
| `getContract(contractId)` | `Promise<CropContract>` | Get contract by ID |
| `getFarmerContracts(farmer)` | `Promise<string[]>` | List contracts by farmer |
| `updateContractStatus(farmer, contractId, status)` | `Promise<void>` | Update contract status |

##### Orders

| Method | Returns | Description |
|---|---|---|
| `placeOrder(buyer, contractId, amount)` | `Promise<string>` | Place a crop order |
| `getOrder(orderId)` | `Promise<Order>` | Get order by ID |
| `getContractOrders(contractId)` | `Promise<string[]>` | List orders for a contract |
| `getBuyerOrders(buyer)` | `Promise<string[]>` | List orders by buyer |

##### Order Status

| Method | Returns | Description |
|---|---|---|
| `markShipped(farmer, orderId)` | `Promise<void>` | Mark order as shipped |
| `markDelivered(farmer, orderId)` | `Promise<void>` | Mark order as delivered |
| `requestRefund(buyer, orderId)` | `Promise<void>` | Request refund for undelivered order |

### `AmountUtils`

| Method | Description |
|---|---|
| `AmountUtils.toStroops(xlm)` | Convert XLM to stroops |
| `AmountUtils.fromStroops(stroops)` | Convert stroops to XLM |

## Error Handling

```typescript
import { ContractError, ContractErrorCode } from '@stellar-crop-supply/sdk';

try {
  await client.createContract(options);
} catch (error) {
  if (error instanceof ContractError) {
    console.error(`Error code ${error.code}: ${error.message}`);
    if (error.code === ContractErrorCode.ContractNotFound) {
      // Handle contract not found
    }
  }
}
```

## License

MIT
