import { NextResponse } from "next/server";
import { mockAccounts } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

// TODO: Replace with real data once Guardian exposes:
//   GET /accounts          → list account IDs
//   GET /accounts/stats    → aggregate tx counts
//   GET /accounts/:id/balance → balance per account
export async function GET() {
  return NextResponse.json({ ...mockAccounts, mocked: true });
}
