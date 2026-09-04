# @stellar-crop-supply/sdk

TypeScript SDK for interacting with the Stellar Crop Supply Chain Soroban smart contract.

## Installation

```bash
npm install @stellar-crop-supply/sdk
```

## Quick Start

```typescript
import {
  CropSupplyClient,
  AmountUtils,
  ContractStatus,
  Keypair,
} from '@stellar-crop-supply/sdk';

// Initialize the client. The signer's secret key authorizes mutating calls
// (create contract, place order, mark delivered, etc.), so it must control the
// address passed as `farmer`/`buyer` to those methods.
const client = new CropSupplyClient({
  rpcUrl: 'https://soroban-testnet.stellar.org:443',
  networkPassphrase: 'Test SDF Network; September 2015',
  contractId: 'CD...your-contract-id',
  signer: Keypair.fromSecret('S...your-secret-key'),
});

// Create a contract on behalf of the signer's own address.
const farmer = client.address();
const contractId = await client.createContract({
  farmer,
  title: 'Organic Wheat Harvest',
  description: 'Direct supply of organic wheat from a local cooperative',
  targetAmount: AmountUtils.toStroops(500), // 500 XLM
  deadline: String(Math.floor(Date.now() / 1000) + 86400 * 30), // 30 days
});

// Place an order on behalf of the signer's own address.
const buyer = client.address();
const orderId = await client.placeOrder(
  buyer,
  contractId,
  AmountUtils.toStroops(50) // 50 XLM
);

// Track order status
const order = await client.getOrder(orderId);
console.log(`Order status: ${order.status}`);

// Mark as delivered
await client.markDelivered(farmer, orderId);
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
- `signer: Keypair` — Keypair controlling the authorized addresses for mutating calls
- `fee?: string` — Optional transaction fee (defaults to `BASE_FEE`)
- `pollTimeoutMs?: number` — Optional maximum time to wait for a transaction to confirm (defaults to `30000`)

#### Methods

##### Initialization

| Method | Returns | Description |
|---|---|---|
| `initialize(admin, token)` | `Promise<void>` | Initialize the contract (deployer only, once) |
| `getAdmin()` | `Promise<string>` | Get the contract admin address |
| `getToken()` | `Promise<string>` | Get the settlement token address |
| `getVersion()` | `Promise<number>` | Get contract version |
| `getMetadata()` | `Promise<Record<string, string>>` | Get contract metadata |

##### Contract Management

| Method | Returns | Description |
|---|---|---|
| `createContract(options)` | `Promise<string>` | Create a new crop supply contract |
| `getContract(contractId)` | `Promise<CropContract>` | Get contract by ID |
| `getFarmerContracts(farmer)` | `Promise<string[]>` | List contracts by farmer |
| `getFarmerContractsPaginated(farmer, page, pageSize)` | `Promise<U64Page>` | List contracts by farmer (paginated) |
| `searchContracts(query)` | `Promise<string[]>` | Case-insensitive search by title |
| `updateContractStatus(farmer, contractId, status)` | `Promise<void>` | Update contract status |
| `setAdmin(caller, newAdmin)` | `Promise<void>` | Transfer admin rights |

##### Orders

| Method | Returns | Description |
|---|---|---|
| `placeOrder(buyer, contractId, amount)` | `Promise<string>` | Place a crop order |
| `getOrder(orderId)` | `Promise<Order>` | Get order by ID |
| `getContractOrders(contractId)` | `Promise<string[]>` | List orders for a contract |
| `getContractOrdersPaginated(contractId, page, pageSize)` | `Promise<U64Page>` | List orders for a contract (paginated) |
| `getBuyerOrders(buyer)` | `Promise<string[]>` | List orders by buyer |

##### Order Status

| Method | Returns | Description |
|---|---|---|
| `markShipped(farmer, orderId)` | `Promise<void>` | Mark order as shipped |
| `markDelivered(farmer, orderId)` | `Promise<void>` | Mark order as delivered |
| `requestRefund(buyer, orderId)` | `Promise<void>` | Request refund for undelivered order |
| `processExpiredContractRefunds(contractId)` | `Promise<void>` | Refund outstanding orders of an expired contract (permissionless) |

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
