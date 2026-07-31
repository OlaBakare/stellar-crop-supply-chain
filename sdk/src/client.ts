import { Account, TransactionBuilder, Contract } from 'soroban-client';
import SorobanClient from 'soroban-client';

import {
  CropContract,
  ContractStatus,
  CreateContractOptions,
  Order,
  OrderStatus,
  ContractError,
  ContractErrorCode,
} from './types';

export type { CropContract, CreateContractOptions, Order } from './types';

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
  /** The network passphrase (e.g., Networks.TESTNET or Networks.PUBLIC). */
  networkPassphrase: string;
  /** The contract ID (deployed contract address). */
  contractId: string;
  /** Optional: the account that pays fees (defaults to the source account). */
  feeSource?: Account;
}

/**
 * Client for interacting with the Stellar Crop Supply Chain Soroban contract.
 *
 * This client wraps the low-level Soroban RPC calls and provides
 * a type-safe, ergonomic interface for crop contract and order management.
 */
export class CropSupplyClient {
  private readonly rpcUrl: string;
  private readonly networkPassphrase: string;
  private readonly contractId: string;
  private readonly feeSource?: Account;
  private readonly horizon: any;

  constructor(config: CropSupplyClientConfig) {
    this.rpcUrl = config.rpcUrl;
    this.networkPassphrase = config.networkPassphrase;
    this.contractId = config.contractId;
    this.feeSource = config.feeSource;
    this.horizon = new SorobanClient.Horizon.Server(config.rpcUrl.replace('/rpc', ''));
  }

  /**
   * Get the Soroban RPC client.
   */
  private getRpc(): any {
    return new SorobanClient.rpc.Server(this.rpcUrl, {
      horizon: this.horizon,
    });
  }

  /**
   * Get the contract handle.
   */
  private getContractHandle(): Contract {
    return new Contract(this.contractId);
  }

  // ── Initialization ──────────────────────────────────────────────────────────

  /**
   * Get the contract admin.
   * @returns The admin address.
   */
  async getAdmin(): Promise<string> {
    const result = await this.invoke({
      method: 'get_admin',
    });
    return result as string;
  }

  /**
   * Get the contract version.
   * @returns The version number.
   */
  async getVersion(): Promise<number> {
    const result = await this.invoke({
      method: 'version',
    });
    return Number(result);
  }

  /**
   * Get contract metadata.
   * @returns A map of metadata key-value pairs.
   */
  async getMetadata(): Promise<Record<string, string>> {
    const result = await this.invoke({
      method: 'get_metadata',
    });
    return result as Record<string, string>;
  }

  // ── Contract Management ─────────────────────────────────────────────────────

  /**
   * Create a new crop supply contract.
   *
   * @param options - Contract creation options.
   * @returns The created contract ID.
   */
  async createContract(options: CreateContractOptions): Promise<string> {
    const result = await this.invoke({
      method: 'create_contract',
      params: {
        farmer: options.farmer,
        title: options.title,
        description: options.description,
        target_amount: options.targetAmount,
        deadline: options.deadline,
      },
    });
    return result as string;
  }

  /**
   * Get crop contract details by ID.
   *
   * @param contractId - The contract ID.
   * @returns The contract details.
   */
  async getContract(contractId: string): Promise<CropContract> {
    const result = await this.invoke({
      method: 'get_contract',
      params: { contract_id: contractId },
    });
    return this.deserializeContract(result);
  }

  /**
   * Get all contract IDs owned by a farmer.
   *
   * @param farmer - The farmer address.
   * @returns Array of contract IDs.
   */
  async getFarmerContracts(farmer: string): Promise<string[]> {
    const result = await this.invoke({
      method: 'get_farmer_contracts',
      params: { farmer },
    });
    return result as string[];
  }

  /**
   * Update contract status.
   *
   * @param farmer - The contract farmer's address.
   * @param contractId - The contract ID.
   * @param status - The new contract status.
   */
  async updateContractStatus(
    farmer: string,
    contractId: string,
    status: ContractStatus
  ): Promise<void> {
    await this.invoke({
      method: 'update_contract_status',
      params: {
        farmer,
        contract_id: contractId,
        status,
      },
      auth: [farmer],
    });
  }

  // ── Orders ──────────────────────────────────────────────────────────────────

  /**
   * Place a crop order against a contract.
   *
   * @param buyer - The buyer's address.
   * @param contractId - The contract ID.
   * @param amount - The order amount in stroops.
   * @returns The order ID.
   */
  async placeOrder(buyer: string, contractId: string, amount: string): Promise<string> {
    const result = await this.invoke({
      method: 'place_order',
      params: {
        buyer,
        contract_id: contractId,
        amount,
      },
      auth: [buyer],
    });
    return result as string;
  }

  /**
   * Get order details by ID.
   *
   * @param orderId - The order ID.
   * @returns The order details.
   */
  async getOrder(orderId: string): Promise<Order> {
    const result = await this.invoke({
      method: 'get_order',
      params: { order_id: orderId },
    });
    return this.deserializeOrder(result);
  }

  /**
   * Get all order IDs for a contract.
   *
   * @param contractId - The contract ID.
   * @returns Array of order IDs.
   */
  async getContractOrders(contractId: string): Promise<string[]> {
    const result = await this.invoke({
      method: 'get_contract_orders',
      params: { contract_id: contractId },
    });
    return result as string[];
  }

  /**
   * Get all order IDs from a buyer.
   *
   * @param buyer - The buyer address.
   * @returns Array of order IDs.
   */
  async getBuyerOrders(buyer: string): Promise<string[]> {
    const result = await this.invoke({
      method: 'get_buyer_orders',
      params: { buyer },
    });
    return result as string[];
  }

  // ── Order Status Management ─────────────────────────────────────────────────

  /**
   * Mark an order as shipped.
   *
   * @param farmer - The contract farmer's address.
   * @param orderId - The order ID.
   */
  async markShipped(farmer: string, orderId: string): Promise<void> {
    await this.invoke({
      method: 'mark_shipped',
      params: { farmer, order_id: orderId },
      auth: [farmer],
    });
  }

  /**
   * Mark an order as delivered.
   *
   * @param farmer - The contract farmer's address.
   * @param orderId - The order ID.
   */
  async markDelivered(farmer: string, orderId: string): Promise<void> {
    await this.invoke({
      method: 'mark_delivered',
      params: { farmer, order_id: orderId },
      auth: [farmer],
    });
  }

  /**
   * Request a refund for an order.
   *
   * @param buyer - The buyer's address.
   * @param orderId - The order ID.
   */
  async requestRefund(buyer: string, orderId: string): Promise<void> {
    await this.invoke({
      method: 'request_refund',
      params: { buyer, order_id: orderId },
      auth: [buyer],
    });
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  private async invoke(options: {
    method: string;
    params?: Record<string, unknown>;
    auth?: string[];
  }): Promise<unknown> {
    const rpc = this.getRpc();
    const contract = this.getContractHandle();

    try {
      const builder = new TransactionBuilder(
        this.feeSource ?? (await this.getAccount()),
        {
          fee: '100',
          networkPassphrase: this.networkPassphrase,
        }
      );

      const tx = builder.addOperation(
        contract.call(options.method, ...(this.serializeParams(options.params ?? {}) as any[]))
      );

      const builtTx = tx.setTimeout(30).build();
      const result = await rpc.sendTransaction(builtTx);

      if (result.status === 'FAILED') {
        throw new ContractError(
          ContractErrorCode.Unauthorized,
          'Transaction failed',
          result.errorResult?.toString()
        );
      }

      const res = await rpc.getTransaction(result.hash);
      return res.returnValue;
    } catch (error) {
      if (error instanceof ContractError) {
        throw error;
      }
      throw new ContractError(
        ContractErrorCode.Unauthorized,
        'Failed to invoke contract',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private async getAccount(): Promise<Account> {
    const key = this.feeSource?. accountId ?? '';
    if (!key) {
      throw new Error('No fee source account configured');
    }
    return this.horizon.accounts().accountId(key);
  }

  private serializeParams(params: Record<string, unknown>): unknown[] {
    return Object.values(params);
  }

  private deserializeContract(data: unknown): CropContract {
    const d = data as Record<string, unknown>;
    return {
      id: String(d.id),
      farmer: String(d.farmer),
      title: String(d.title),
      description: String(d.description),
      targetAmount: String(d.target_amount ?? d.targetAmount),
      fundedAmount: String(d.funded_amount ?? d.fundedAmount),
      deadline: String(d.deadline),
      createdAt: String(d.created_at ?? d.createdAt),
      status: d.status as ContractStatus,
      orderCount: Number(d.order_count ?? d.orderCount),
    };
  }

  private deserializeOrder(data: unknown): Order {
    const d = data as Record<string, unknown>;
    return {
      id: String(d.id),
      contractId: String(d.contract_id ?? d.contractId),
      buyer: String(d.buyer),
      amount: String(d.amount),
      orderedAt: String(d.ordered_at ?? d.orderedAt),
      status: d.status as OrderStatus,
      deliveredAt: d.delivered_at ? String(d.delivered_at) : null,
      refundedAt: d.refunded_at ? String(d.refunded_at) : null,
    };
  }
}
