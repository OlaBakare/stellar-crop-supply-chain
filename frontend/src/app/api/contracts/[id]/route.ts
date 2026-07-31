import { NextRequest, NextResponse } from "next/server";
import { CropContract } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({
    id: params.id,
    title: "Sample Crop Contract",
    description: "This is a sample crop supply contract.",
    farmer: "GA...",
    targetAmount: 1000,
    fundedAmount: 450,
    orderCount: 24,
    deadline: Date.now() + 86400 * 7 * 1000,
    createdAt: Date.now() - 86400 * 3 * 1000,
    status: "active",
  } as CropContract);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  return NextResponse.json({
    orderId: String(Date.now()),
    contractId: params.id,
    amount: body.amount,
    status: "pending",
  });
}
