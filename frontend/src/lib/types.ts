export type CropContractStatus = "active" | "completed" | "cancelled";
export type OrderStatus = "pending" | "shipped" | "delivered" | "refunded";

export interface CropContract {
  id: string;
  title: string;
  description: string;
  farmer: string;
  targetAmount: number;
  fundedAmount: number;
  orderCount: number;
  deadline: number;
  createdAt: number;
  status: CropContractStatus;
}

export interface Order {
  id: string;
  contractId: string;
  buyer: string;
  amount: number;
  orderedAt: number;
  status: OrderStatus;
  deliveredAt?: number | null;
  refundedAt?: number | null;
}

export interface CreateContractRequest {
  farmer: string;
  title: string;
  description: string;
  targetAmount: string;
  deadline: string;
}

export interface PlaceOrderRequest {
  amount: string;
}
