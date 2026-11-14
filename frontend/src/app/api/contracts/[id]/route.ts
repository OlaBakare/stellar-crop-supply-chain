import { NextRequest, NextResponse } from "next/server";
import {
  errorMessage,
  fetchContract,
  fetchContractOrders,
  isConfigured,
  placeOrder,
} from "@/lib/soroban";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const includeOrders =
      request.nextUrl.searchParams.get("orders") === "true";
    if (includeOrders) {
      const orders = await fetchContractOrders(params.id);
      return NextResponse.json(orders);
    }

    const contract = await fetchContract(params.id);
    if (!contract) {
      return NextResponse.json(
        { message: "Contract not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(contract);
  } catch (error) {
    return NextResponse.json(
      { message: errorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  try {
    const amountNum = Number(body.amount);
    if (!Number.isFinite(amountNum) || amountNum < 0.1) {
      return NextResponse.json(
        { message: "Order amount must be at least 0.1 XLM" },
        { status: 400 }
      );
    }

    if (!isConfigured()) {
      const simulatedOrderId = String(Date.now()).slice(-6);
      return NextResponse.json(
        {
          orderId: simulatedOrderId,
          contractId: params.id,
          buyer: body.buyer ?? "GA...",
          amount: amountNum,
        },
        { status: 201 }
      );
    }

    const orderId = await placeOrder(params.id, String(body.amount));
    return NextResponse.json(
      {
        orderId,
        contractId: params.id,
        buyer: body.buyer,
        amount: amountNum,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: errorMessage(error) },
      { status: 400 }
    );
  }
}
