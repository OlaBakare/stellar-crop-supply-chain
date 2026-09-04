import { NextRequest, NextResponse } from "next/server";
import { errorMessage, fetchContract, placeOrder } from "@/lib/soroban";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    const orderId = await placeOrder(params.id, body.amount);
    return NextResponse.json(
      { orderId, contractId: params.id },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: errorMessage(error) },
      { status: 400 }
    );
  }
}
