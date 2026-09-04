import {
  AmountUtils,
  ContractError,
  ContractStatus,
  CropSupplyClient,
  type CropSupplyClientConfig,
  type CropContract as SdkCropContract,
  type Order as SdkOrder,
  Keypair,
} from "@stellar-crop-supply/sdk";
import type {
  CropContract,
  CreateContractRequest,
  Order,
  OrderStatus,
} from "@/lib/types";

/**
 * Server-side accessor for the Stellar Crop Supply Chain Soroban contract.
 *
 * Reads connection details from environment variables:
 *   - STELLAR_RPC_URL              Soroban RPC endpoint (e.g. Futurenet)
 *   - STELLAR_NETWORK_PASSPHRASE   Network passphrase
 *   - STELLAR_CONTRACT_ID          Deployed contract address (C...)
 *   - STELLAR_SIGNER_SECRET        Secret key of the account that performs
 *                                  mutating calls (create contract, place order)
 *
 * When any of these are missing, `isConfigured()` returns false and route
 * handlers fall back to an empty result so the app still boots locally.
 */

const RPC_URL = process.env.STELLAR_RPC_URL;
const NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE;
const CONTRACT_ID = process.env.STELLAR_CONTRACT_ID;
const SIGNER_SECRET = process.env.STELLAR_SIGNER_SECRET;

let clientCache: CropSupplyClient | null = null;

export function isConfigured(): boolean {
  return Boolean(RPC_URL && NETWORK_PASSPHRASE && CONTRACT_ID && SIGNER_SECRET);
}

function getClient(): CropSupplyClient {
  if (!isConfigured()) {
    throw new Error(
      "Soroban not configured. Set STELLAR_RPC_URL, STELLAR_NETWORK_PASSPHRASE, STELLAR_CONTRACT_ID and STELLAR_SIGNER_SECRET."
    );
  }
  if (!clientCache) {
    const config: CropSupplyClientConfig = {
      rpcUrl: RPC_URL as string,
      networkPassphrase: NETWORK_PASSPHRASE as string,
      contractId: CONTRACT_ID as string,
      signer: Keypair.fromSecret(SIGNER_SECRET as string),
    };
    clientCache = new CropSupplyClient(config);
  }
  return clientCache;
}

function toMoney(stroops: string): number {
  return Number(AmountUtils.fromStroops(stroops));
}

function toFrontendStatus(status: ContractStatus): CropContract["status"] {
  switch (status) {
    case ContractStatus.Completed:
      return "completed";
    case ContractStatus.Cancelled:
      return "cancelled";
    default:
      return "active";
  }
}

function toOrderStatus(status: SdkOrder["status"]): OrderStatus {
  switch (status) {
    case "Shipped":
      return "shipped";
    case "Delivered":
      return "delivered";
    case "Refunded":
      return "refunded";
    default:
      return "pending";
  }
}

function toFrontendContract(c: SdkCropContract): CropContract {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    farmer: c.farmer,
    targetAmount: toMoney(c.targetAmount),
    fundedAmount: toMoney(c.fundedAmount),
    orderCount: c.orderCount,
    deadline: Number(c.deadline) * 1000,
    createdAt: Number(c.createdAt) * 1000,
    status: toFrontendStatus(c.status),
  };
}

function toFrontendOrder(o: SdkOrder): Order {
  return {
    id: o.id,
    contractId: o.contractId,
    buyer: o.buyer,
    amount: toMoney(o.amount),
    orderedAt: Number(o.orderedAt) * 1000,
    status: toOrderStatus(o.status),
    deliveredAt: o.deliveredAt ? Number(o.deliveredAt) * 1000 : null,
    refundedAt: o.refundedAt ? Number(o.refundedAt) * 1000 : null,
  };
}

export async function fetchContracts(): Promise<CropContract[]> {
  if (!isConfigured()) {
    return [];
  }
  const client = getClient();
  const farmer = client.address();
  const ids = await client.getFarmerContracts(farmer);
  const contracts: CropContract[] = [];
  for (const id of ids) {
    try {
      contracts.push(toFrontendContract(await client.getContract(id)));
    } catch {
      // Skip a contract if its detail read fails (e.g. removed or unreadable).
    }
  }
  return contracts;
}

export async function fetchContract(id: string): Promise<CropContract | null> {
  if (!isConfigured()) {
    return null;
  }
  return toFrontendContract(await getClient().getContract(id));
}

export async function createContract(
  data: CreateContractRequest
): Promise<CropContract> {
  const client = getClient();
  const farmer = client.address();
  const id = await client.createContract({
    farmer,
    title: data.title,
    description: data.description,
    targetAmount: AmountUtils.toStroops(Number(data.targetAmount)),
    deadline: data.deadline,
  });
  return toFrontendContract(await client.getContract(id));
}

export async function placeOrder(
  contractId: string,
  amount: string
): Promise<string> {
  const client = getClient();
  const buyer = client.address();
  return client.placeOrder(buyer, contractId, AmountUtils.toStroops(Number(amount)));
}

export async function fetchContractOrders(contractId: string): Promise<Order[]> {
  if (!isConfigured()) {
    return [];
  }
  const client = getClient();
  const ids = await client.getContractOrders(contractId);
  const orders: Order[] = [];
  for (const id of ids) {
    try {
      orders.push(toFrontendOrder(await client.getOrder(id)));
    } catch {
      // Skip unreadable orders.
    }
  }
  return orders;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ContractError) {
    return error.message + (error.detail ? `: ${error.detail}` : "");
  }
  return error instanceof Error ? error.message : String(error);
}
