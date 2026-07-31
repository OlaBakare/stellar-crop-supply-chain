import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.address) {
    return NextResponse.json(
      { message: "Wallet address required" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    message: "Wallet connected successfully",
    address: body.address,
  });
}
