/**
 * Crop contract status enumeration.
 */
export enum ContractStatus {
  Active = 'Active',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

/**
 * Crop order status enumeration.
 */
export enum OrderStatus {
  Pending = 'Pending',
  Shipped = 'Shipped',
  Delivered = 'Delivered',
  Refunded = 'Refunded',
}

/**
 * A crop supply contract.
 */
export interface CropContract {
  id: string;
  farmer: string;
  title: string;
  description: string;
  targetAmount: string;
  fundedAmount: string;
  deadline: string;
  createdAt: string;
  status: ContractStatus;
  orderCount: number;
}

/**
 * A paginated slice of numeric IDs returned by paginated contract reads.
 */
export interface U64Page {
  /** The returned slice of IDs on this page. */
  data: string[];
  /** The current page index (0-based). */
  page: number;
  /** The requested page size. */
  pageSize: number;
  /** Whether more pages exist after this one. */
  hasMore: boolean;
}

/**
 * A single crop order placed against a contract.
 */
export interface Order {
  id: string;
  contractId: string;
  buyer: string;
  amount: string;
  orderedAt: string;
  status: OrderStatus;
  deliveredAt?: string | null;
  refundedAt?: string | null;
}

/**
 * Event emitted when a crop contract is created.
 */
export interface ContractCreatedEvent {
  contractId: string;
  farmer: string;
  targetAmount: string;
  deadline: string;
  createdAt: string;
}

/**
 * Event emitted when a crop contract status changes.
 */
export interface ContractStatusChangeEvent {
  contractId: string;
  oldStatus: ContractStatus;
  newStatus: ContractStatus;
  changedBy: string;
  timestamp: string;
}

/**
 * Event emitted when a crop order is placed.
 */
export interface OrderCreatedEvent {
  orderId: string;
  contractId: string;
  buyer: string;
  amount: string;
  orderedAt: string;
}

/**
 * Event emitted when a crop order status changes.
 */
export interface OrderStatusChangeEvent {
  orderId: string;
  oldStatus: OrderStatus;
  newStatus: OrderStatus;
  changedBy: string;
  timestamp: string;
}

/**
 * Event emitted when a crop order is refunded.
 */
export interface OrderRefundedEvent {
  orderId: string;
  buyer: string;
  amount: string;
  oldStatus: OrderStatus;
  refundedAt: string;
}

/**
 * Options for creating a crop contract.
 */
export interface CreateContractOptions {
  farmer: string;
  title: string;
  description: string;
  targetAmount: string;
  deadline: string;
}

/**
 * Contract error codes.
 */
export enum ContractErrorCode {
  AlreadyInitialized = 1,
  Unauthorized = 2,
  ContractNotFound = 3,
  OrderNotFound = 4,
  ContractNotActive = 5,
  ContractExpired = 6,
  InvalidAmount = 7,
  InvalidDeadline = 8,
  TitleTooLong = 9,
  DescriptionTooLong = 10,
  InvalidTransition = 11,
  InvalidRefundState = 12,
  NotInitialized = 13,
  OrderBelowMinimum = 14,
  OrderExceedsMaximum = 15,
  OrderExceedsTarget = 16,
  InvalidPageSize = 17,
  PageOutOfRange = 18,
  WithdrawalNotAllowed = 19,
  ContractNotExpired = 20,
  NoSignersConfigured = 21,
  NotApprover = 22,
  ContractCallFailed = 99,
}

/**
 * Error thrown when a contract call fails.
 */
export class ContractError extends Error {
  public readonly code: ContractErrorCode;
  public readonly detail?: string;

  constructor(code: ContractErrorCode, message: string, detail?: string) {
    super(message);
    this.name = 'ContractError';
    this.code = code;
    this.detail = detail;
  }

    getMessage(): string {
        switch (this.code) {
            case ContractErrorCode.AlreadyInitialized:
                return "already initialized";
            case ContractErrorCode.Unauthorized:
                return "unauthorized";
            case ContractErrorCode.ContractNotFound:
                return "contract not found";
            case ContractErrorCode.OrderNotFound:
                return "order not found";
            case ContractErrorCode.ContractNotActive:
                return "contract not active";
            case ContractErrorCode.ContractExpired:
                return "contract expired";
            case ContractErrorCode.InvalidAmount:
                return "invalid amount";
            case ContractErrorCode.InvalidDeadline:
                return "invalid deadline";
            case ContractErrorCode.TitleTooLong:
                return "title too long";
            case ContractErrorCode.DescriptionTooLong:
                return "description too long";
            case ContractErrorCode.InvalidTransition:
                return "invalid transition";
            case ContractErrorCode.InvalidRefundState:
                return "invalid refund state";
            case ContractErrorCode.NotInitialized:
                return "not initialized";
            default:
                return `Contract error code ${this.code}`;
        }
    }
}

/**
 * Utility functions for amount conversion.
 */
export class AmountUtils {
  /** Stroops per XLM (1 XLM = 10^7 stroops). */
  static readonly STROOPS_PER_XLM = 10_000_000;

  /**
   * Convert XLM to stroops.
   * @param xlm - Amount in XLM (can be decimal).
   * @returns Amount in stroops as a string (to preserve precision).
   */
  static toStroops(xlm: number | string): string {
    const value = typeof xlm === 'number' ? xlm.toString() : xlm;
    const [whole, fraction = '0'] = value.split('.');
    const fractionPadded = (fraction + '0000000').slice(0, 7);
    const wholeStroops = BigInt(whole) * BigInt(this.STROOPS_PER_XLM);
    const fractionStroops = BigInt(fractionPadded);
    return (wholeStroops + fractionStroops).toString();
  }

  /**
   * Convert stroops to XLM.
   * @param stroops - Amount in stroops.
   * @returns Amount in XLM as a decimal string.
   */
  static fromStroops(stroops: string | number | bigint): string {
    const s = BigInt(stroops);
    const whole = s / BigInt(this.STROOPS_PER_XLM);
    const fraction = s % BigInt(this.STROOPS_PER_XLM);
    const fractionStr = fraction.toString().padStart(7, '0').replace(/0+$/, '');
    return fractionStr ? `${whole}.${fractionStr}` : whole.toString();
  }
}
