import { NextRequest, NextResponse } from "next/server";
import { CropContract } from "@/lib/types";

const mockContracts: CropContract[] = [
  {
    id: "1",
    title: "Organic Wheat Contract",
    description: "Purchase agreement for 500 kg of organic wheat.",
    farmer: "GA...",
    targetAmount: 1000,
    fundedAmount: 450,
    orderCount: 24,
    deadline: Date.now() + 86400 * 7 * 1000,
    createdAt: Date.now() - 86400 * 3 * 1000,
    status: "active",
  },
  {
    id: "2",
    title: "Maize Harvest Contract",
    description: "Buying contract for the upcoming maize harvest season.",
    farmer: "GA...",
    targetAmount: 500,
    fundedAmount: 500,
    orderCount: 12,
    deadline: Date.now() + 86400 * 2 * 1000,
    createdAt: Date.now() - 86400 * 10 * 1000,
    status: "completed",
  },
  {
    id: "3",
    title: "Cocoa Supply Agreement",
    description: "Fair-trade cocoa purchase from smallholder farms.",
    farmer: "GA...",
    targetAmount: 2500,
    fundedAmount: 1200,
    orderCount: 48,
    deadline: Date.now() + 86400 * 14 * 1000,
    createdAt: Date.now() - 86400 * 5 * 1000,
    status: "active",
  },
];

export async function GET() {
  return NextResponse.json(mockContracts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newContract: CropContract = {
    id: String(Date.now()),
    title: body.title,
    description: body.description,
    farmer: body.farmer,
    targetAmount: Number(body.targetAmount),
    fundedAmount: 0,
    orderCount: 0,
    deadline: Number(body.deadline) * 1000,
    createdAt: Date.now(),
    status: "active",
  };
  return NextResponse.json(newContract, { status: 201 });
}
