import {
  Account,
  Address,
  Contract,
  Transaction,
  TransactionBuilder,
  Keypair,
  nativeToScVal,
  scValToNative,
  xdr,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import { Server, Api } from '@stellar/stellar-sdk/rpc';

import {
  CropContract,
  ContractStatus,
  CreateContractOptions,
  Order,
  OrderStatus,
  ContractError,
  ContractErrorCode,
  U64Page,
} from './types';

export type { CropContract, CreateContractOptions, Order, U64Page } from './types';

export {
  ContractStatus,
  OrderStatus,
  ContractError,
  ContractErrorCode,
  AmountUtils,
} from './types';

/**
 * Configuration for the CropSupplyClient.
 */
export interface CropSupplyClientConfig {
  /** The Soroban RPC endpoint URL. */
  rpcUrl: string;
  /**
   * The network passphrase (e.g., `Networks.TESTNET`).
   * This keeps the request/response natural and explicit.
   */
  networkPassphrase: string;
  /** The contract ID (deployed contract address). */
  contractId: string;
  /**
   * The keypair used to sign and pay for transactions and to satisfy the
   * Soroban authorization required by mutating contract calls. Its public
   * key must be the address that the contract `require_auth`s for the call.
   */
  signer: Keypair;
  /** Optional explicit fee in stroops (defaults to `BASE_FEE`). */
  fee?: string;
  /** How long to wait (ms) for a submitted transaction to confirm. */
  pollTimeoutMs?: number;
}

interface InvokeOptions {
  method: string;
  params: xdr.ScVal[];
}

const DEFAULT_POLL_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 500;
const DEFAULT_WATCH_INTERVAL_MS = 5_000;

/**
 * Client for interacting with the Stellar Crop Supply Chain Soroban contract.
 *
 * This wraps the Soroban RPC flow (`simulate` -> `assemble` -> `sign` ->
 * `submit` -> `poll`) and provides a type-safe surface for crop contract and
 * order management. Mutating calls require the configured `signer` to control
 * the address the contract authorizes.
 */
export class CropSupplyClient {
  private readonly rpcUrl: string;
  private readonly networkPassphrase: string;
  private readonly contractId: string;
  private readonly signer: Keypair;
  private readonly fee: string;
  private readonly pollTimeoutMs: number;

  constructor(config: CropSupplyClientConfig) {
    this.rpcUrl = config.rpcUrl;
    this.networkPassphrase = config.networkPassphrase;
    this.contractId = config.contractId;
    this.signer = config.signer;
    this.fee = config.fee ?? BASE_FEE;
    this.pollTimeoutMs = config.pollTimeoutMs ?? DEFAULT_POLL_TIMEOUT_MS;
  }

  /**
   * The public key address of the configured signer, i.e. the address that
   * this client authenticates as for mutating contract calls.
   */
  public address(): string {
    return this.signer.publicKey();
  }

  private getServer(): Server {
    return new Server(this.rpcUrl, { allowHttp: true });
  }

  private getContractHandle(): Contract {
    return new Contract(this.contractId);
  }

  // ── Initialization ────────────────────────────────────────────────────────

  /**
   * Get the contract admin.
   */
  async getAdmin(): Promise<string> {
    const scv = await this.invokeRead({ method: 'get_admin', params: [] });
    return decodeAddress(scv);
  }

  /**
   * Get the settlement token address used for escrow.
   */
  async getToken(): Promise<string> {
    const scv = await this.invokeRead({ method: 'get_token', params: [] });
    return decodeAddress(scv);
  }

  /**
   * Get the contract version.
   */
  async getVersion(): Promise<number> {
    const scv = await this.invokeRead({ method: 'version', params: [] });
    return Number(scValToNative(scv));
  }

  /**
   * Get contract metadata as key/value pairs.
   */
  async getMetadata(): Promise<Record<string, string>> {
    const scv = await this.invokeRead({ method: 'get_metadata', params: [] });
    const map = scValToNative(scv) as Record<string, string>;
    return map ?? {};
  }

  // ── Contract Management ───────────────────────────────────────────────────

  /**
   * Initialize the contract. Can only be called once by the deployer.
   */
  async initialize(admin: string, token: string): Promise<void> {
    await this.invokeWrite({
      method: 'initialize',
      params: [encodeAddress(admin), encodeAddress(token)],
      authAddress: admin,
    });
  }

  /**
   * Create a new crop supply contract.
   */
  async createContract(options: CreateContractOptions): Promise<string> {
    const scv = await this.invokeWrite({
      method: 'create_contract',
      params: [
        encodeAddress(options.farmer),
        encodeString(options.title),
        encodeString(options.description),
        encodeI128(options.targetAmount),
        encodeU64(options.deadline),
      ],
      authAddress: options.farmer,
    });
    return decodeU64(scv);
  }

  /**
   * Get crop contract details by ID.
   */
  async getContract(contractId: string | bigint): Promise<CropContract> {
    const scv = await this.invokeRead({
      method: 'get_contract',
      params: [encodeU64(contractId)],
    });
    return this.deserializeContract(scValToNative(scv));
  }

  /**
   * Get all contract IDs owned by a farmer.
   */
  async getFarmerContracts(farmer: string): Promise<string[]> {
    const scv = await this.invokeRead({
      method: 'get_farmer_contracts',
      params: [encodeAddress(farmer)],
    });
    return decodeVecU64(scv).map(String);
  }

  /**
   * Get farmer contracts with pagination.
   */
  async getFarmerContractsPaginated(
    farmer: string,
    page: number,
    pageSize: number
  ): Promise<U64Page> {
    const scv = await this.invokeRead({
      method: 'get_farmer_contracts_paginated',
      params: [encodeAddress(farmer), encodeU32(page), encodeU32(pageSize)],
    });
    return this.deserializePage(scValToNative(scv));
  }

  /**
   * Search contracts by title query (case-insensitive).
   */
  async searchContracts(query: string): Promise<string[]> {
    const scv = await this.invokeRead({
      method: 'search_contracts',
      params: [encodeString(query)],
    });
    return decodeVecU64(scv).map(String);
  }

  /**
   * Update contract status.
   */
  async updateContractStatus(
    farmer: string,
    contractId: string | bigint,
    status: ContractStatus
  ): Promise<void> {
    await this.invokeWrite({
      method: 'update_contract_status',
      params: [encodeAddress(farmer), encodeU64(contractId), encodeStatus(status)],
      authAddress: farmer,
    });
  }

  /**
   * Change the contract admin (must be called by the current admin).
   */
  async setAdmin(caller: string, newAdmin: string): Promise<void> {
    await this.invokeWrite({
      method: 'set_admin',
      params: [encodeAddress(caller), encodeAddress(newAdmin)],
      authAddress: caller,
    });
  }

  // ── Orders ────────────────────────────────────────────────────────────────

  /**
   * Place a crop order against a contract (escrows tokens from the buyer).
   */
  async placeOrder(
    buyer: string,
    contractId: string | bigint,
    amount: string | bigint
  ): Promise<string> {
    const scv = await this.invokeWrite({
      method: 'place_order',
      params: [encodeAddress(buyer), encodeU64(contractId), encodeI128(amount)],
      authAddress: buyer,
    });
    return decodeU64(scv);
  }

  /**
   * Get order details by ID.
   */
  async getOrder(orderId: string | bigint): Promise<Order> {
    const scv = await this.invokeRead({
      method: 'get_order',
      params: [encodeU64(orderId)],
    });
    return this.deserializeOrder(scValToNative(scv));
  }

  /**
   * Get all order IDs for a contract.
   */
  async getContractOrders(contractId: string | bigint): Promise<string[]> {
    const scv = await this.invokeRead({
      method: 'get_contract_orders',
      params: [encodeU64(contractId)],
    });
    return decodeVecU64(scv).map(String);
  }

  /**
   * Get contract orders with pagination.
   */
  async getContractOrdersPaginated(
    contractId: string | bigint,
    page: number,
    pageSize: number
  ): Promise<U64Page> {
    const scv = await this.invokeRead({
      method: 'get_contract_orders_paginated',
      params: [encodeU64(contractId), encodeU32(page), encodeU32(pageSize)],
    });
    return this.deserializePage(scValToNative(scv));
  }

  /**
   * Get all order IDs from a buyer.
   */
  async getBuyerOrders(buyer: string): Promise<string[]> {
    const scv = await this.invokeRead({
      method: 'get_buyer_orders',
      params: [encodeAddress(buyer)],
    });
    return decodeVecU64(scv).map(String);
  }

  /**
   * Request a refund for a pending order past its contract deadline.
   */
  async requestRefund(buyer: string, orderId: string | bigint): Promise<void> {
    await this.invokeWrite({
      method: 'request_refund',
      params: [encodeAddress(buyer), encodeU64(orderId)],
      authAddress: buyer,
    });
  }

  // ── Order Status Management ───────────────────────────────────────────────

  /**
   * Mark an order as shipped.
   */
  async markShipped(farmer: string, orderId: string | bigint): Promise<void> {
    await this.invokeWrite({
      method: 'mark_shipped',
      params: [encodeAddress(farmer), encodeU64(orderId)],
      authAddress: farmer,
    });
  }

  /**
   * Mark an order as delivered and release escrow to the farmer.
   */
  async markDelivered(farmer: string, orderId: string | bigint): Promise<void> {
    await this.invokeWrite({
      method: 'mark_delivered',
      params: [encodeAddress(farmer), encodeU64(orderId)],
      authAddress: farmer,
    });
  }

  /**
   * Refund all outstanding orders for an expired contract (permissionless).
   */
  async processExpiredContractRefunds(contractId: string | bigint): Promise<void> {
    await this.invokeWrite({
      method: 'process_expired_contract_refunds',
      params: [encodeU64(contractId)],
    });
  }

  /**
   * Poll an order using `get_order` and invoke `callback` whenever its status changes.
   *
   * @param orderId - The order ID to watch.
   * @param callback - Invoked with the new `OrderStatus` whenever a status transition is detected.
   * @param intervalMs - Polling interval in milliseconds (defaults to 5000ms).
   * @returns A cleanup function that stops polling when called.
   */
  watchOrderStatus(
    orderId: string | bigint,
    callback: (status: OrderStatus) => void,
    intervalMs: number = DEFAULT_WATCH_INTERVAL_MS
  ): () => void {
    let stopped = false;
    let lastStatus: OrderStatus | undefined;
    let inFlight = false;

    const checkStatus = async (): Promise<void> => {
      if (stopped || inFlight) {
        return;
      }
      inFlight = true;
      try {
        const order = await this.getOrder(orderId);
        if (stopped) {
          return;
        }
        if (lastStatus === undefined) {
          lastStatus = order.status;
        } else if (order.status !== lastStatus) {
          lastStatus = order.status;
          callback(order.status);
        }
      } catch {
        // Ignore transient polling errors so the watcher continues on subsequent ticks.
      } finally {
        inFlight = false;
      }
    };

    void checkStatus();
    const timer = setInterval(() => {
      void checkStatus();
    }, intervalMs);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private async invokeRead(options: InvokeOptions): Promise<xdr.ScVal> {
    return this.invoke(options);
  }

  private async invokeWrite(options: {
    method: string;
    params: xdr.ScVal[];
    authAddress?: string;
  }): Promise<xdr.ScVal> {
    if (options.authAddress && options.authAddress !== this.signer.publicKey()) {
      throw new ContractError(
        ContractErrorCode.Unauthorized,
        'Signer does not control the authorized address',
        `authorized address ${options.authAddress} but signer is ${this.signer.publicKey()}`
      );
    }
    return this.invoke(options);
  }

  private async invoke(options: InvokeOptions): Promise<xdr.ScVal> {
    const server = this.getServer();
    const contract = this.getContractHandle();

    let source: Account;
    try {
      source = await server.getAccount(this.signer.publicKey());
    } catch (error) {
      throw new ContractError(
        ContractErrorCode.Unauthorized,
        'Failed to load signing account; is it funded on this network?',
        error instanceof Error ? error.message : String(error)
      );
    }

    const tx = new TransactionBuilder(source, {
      fee: this.fee,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(contract.call(options.method, ...options.params))
      .setTimeout(30)
      .build();

    let prepared: Transaction;
    try {
      prepared = await server.prepareTransaction(tx);
    } catch (error) {
      throw this.mapError(error);
    }

    prepared.sign(this.signer);

    let sendResponse: Api.SendTransactionResponse;
    try {
      sendResponse = await server.sendTransaction(prepared);
    } catch (error) {
      throw this.mapError(error);
    }

    if (sendResponse.status === 'ERROR') {
      const detail = sendResponse.errorResult
        ? sendResponse.errorResult.toXDR('base64')
        : undefined;
      throw new ContractError(
        ContractErrorCode.Unauthorized,
        'Transaction rejected',
        detail
      );
    }

    // Poll until the transaction result is finalized.
    const deadline = Date.now() + this.pollTimeoutMs;
    const txHash = sendResponse.hash;

    let result:
      | Api.GetSuccessfulTransactionResponse
      | Api.GetMissingTransactionResponse
      | Api.GetFailedTransactionResponse;

    do {
      if (Date.now() > deadline) {
        throw new ContractError(
          ContractErrorCode.Unauthorized,
          'Timed out waiting for transaction to confirm'
        );
      }
      await sleep(POLL_INTERVAL_MS);
      result = await server.getTransaction(txHash);
    } while (result.status === Api.GetTransactionStatus.NOT_FOUND);

    if (result.status !== Api.GetTransactionStatus.SUCCESS) {
      const failed = result as Api.GetFailedTransactionResponse;
      const detail = failed.resultXdr
        ? failed.resultXdr.result().toString()
        : undefined;
      throw new ContractError(
        ContractErrorCode.Unauthorized,
        'Soroban call reverted',
        detail
      );
    }

    const success = result as Api.GetSuccessfulTransactionResponse;
    return success.returnValue ?? xdr.ScVal.scvVoid();
  }

  private mapError(error: unknown): ContractError {
    if (error instanceof ContractError) {
      return error;
    }
    const message = error instanceof Error ? error.message : String(error);
    const code =
      message.includes('Contract, #') || message.includes('Status(ContractError')
        ? ContractErrorCode.ContractCallFailed
        : ContractErrorCode.Unauthorized;
    return new ContractError(code, `Failed to invoke contract: ${message}`);
  }

  private deserializeContract(d: Record<string, unknown>): CropContract {
    return {
      id: decodeField(d['id'], decodeU64Raw),
      farmer: String(d['farmer']),
      title: String(d['title']),
      description: String(d['description']),
      targetAmount: decodeField(d['target_amount'], i128ToString),
      fundedAmount: decodeField(d['funded_amount'], i128ToString),
      deadline: decodeField(d['deadline'], decodeU64Raw),
      createdAt: decodeField(d['created_at'], decodeU64Raw),
      status: decodeStatus(String(d['status'])),
      orderCount: Number(d['order_count'] ?? 0),
    };
  }

  private deserializeOrder(d: Record<string, unknown>): Order {
    return {
      id: decodeField(d['id'], decodeU64Raw),
      contractId: decodeField(d['contract_id'], decodeU64Raw),
      buyer: String(d['buyer']),
      amount: decodeField(d['amount'], i128ToString),
      orderedAt: decodeField(d['ordered_at'], decodeU64Raw),
      status: decodeOrderStatus(String(d['status'])),
      deliveredAt: d['delivered_at']
        ? decodeField(d['delivered_at'], decodeU64Raw)
        : null,
      refundedAt: d['refunded_at']
        ? decodeField(d['refunded_at'], decodeU64Raw)
        : null,
    };
  }

  private deserializePage(d: Record<string, unknown>): U64Page {
    const data = (d['data'] as unknown[]) ?? [];
    return {
      data: data.map((v) => decodeU64Raw(v)),
      page: Number(d['page'] ?? 0),
      pageSize: Number(d['page_size'] ?? 0),
      hasMore: Boolean(d['has_more'] ?? false),
    };
  }
}

// ── ScVal encoding ──────────────────────────────────────────────────────────

export function encodeAddress(address: string): xdr.ScVal {
  return new Address(address).toScVal();
}

export function encodeString(value: string): xdr.ScVal {
  return nativeToScVal(value);
}

export function encodeU64(value: string | bigint | number): xdr.ScVal {
  return nativeToScVal(String(value), { type: 'u64' });
}

export function encodeI128(value: string | bigint | number): xdr.ScVal {
  return nativeToScVal(String(value), { type: 'i128' });
}

export function encodeU32(value: number): xdr.ScVal {
  return nativeToScVal(value, { type: 'u32' });
}

export function encodeStatus(status: ContractStatus): xdr.ScVal {
  return xdr.ScVal.scvSymbol(status);
}

// ── ScVal decoding ──────────────────────────────────────────────────────────

function decodeU64Raw(value: unknown): string {
  return typeof value === 'bigint' ? value.toString() : String(value);
}

function i128ToString(value: unknown): string {
  return typeof value === 'bigint' ? value.toString() : String(value);
}

function decodeField(value: unknown, convert: (v: unknown) => string): string {
  return convert(value);
}

function decodeAddress(scv: xdr.ScVal): string {
  return String(scValToNative(scv));
}

function decodeU64(scv: xdr.ScVal): string {
  return String(BigInt(scValToNative(scv)));
}

export function decodeAddrValue(scv: xdr.ScVal): string {
  return String(scValToNative(scv));
}

export function decodeU64Value(scv: xdr.ScVal): string {
  return String(BigInt(scValToNative(scv)));
}

export function decodeVecU64(scv: xdr.ScVal): bigint[] {
  const v = scValToNative(scv);
  if (!Array.isArray(v)) {
    return [];
  }
  return v.map((n) => BigInt(n));
}

function decodeStatus(value: string): ContractStatus {
  switch (value) {
    case 'Completed':
      return ContractStatus.Completed;
    case 'Cancelled':
      return ContractStatus.Cancelled;
    default:
      return ContractStatus.Active;
  }
}

function decodeOrderStatus(value: string): OrderStatus {
  switch (value) {
    case 'Shipped':
      return OrderStatus.Shipped;
    case 'Delivered':
      return OrderStatus.Delivered;
    case 'Refunded':
      return OrderStatus.Refunded;
    default:
      return OrderStatus.Pending;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
