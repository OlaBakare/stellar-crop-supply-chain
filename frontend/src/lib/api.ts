import { CropContract, CreateContractRequest } from "@/lib/types";

export async function fetchContracts(): Promise<CropContract[]> {
  const res = await fetch("/api/contracts");
  if (!res.ok) {
    throw new Error("Failed to fetch contracts");
  }
  return res.json();
}

export async function fetchContract(id: string): Promise<CropContract> {
  const res = await fetch(`/api/contracts/${id}`);
  if (!res.ok) {
    throw new Error("Failed to fetch contract");
  }
  return res.json();
}

export async function createContract(
  data: CreateContractRequest
): Promise<CropContract> {
  const res = await fetch("/api/contracts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to create contract");
  }
  return res.json();
}

export async function placeOrder(
  contractId: string,
  amount: string
): Promise<{ orderId: string }> {
  const res = await fetch(`/api/contracts/${contractId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to place order");
  }
  return res.json();
}
