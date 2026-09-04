import { NextRequest, NextResponse } from "next/server";
import { createContract, errorMessage, fetchContracts } from "@/lib/soroban";

export async function GET() {
  try {
    const contracts = await fetchContracts();
    return NextResponse.json(contracts);
  } catch (error) {
    return NextResponse.json(
      { message: errorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    const contract = await createContract(body);
    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: errorMessage(error) },
      { status: 400 }
    );
  }
}
