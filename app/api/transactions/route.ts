import { NextResponse } from "next/server";
import { mockTransactions } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

// TODO: Replace with real data once Guardian exposes:
//   GET /accounts           → to enumerate accounts
//   GET /delta/since        → per account delta history (status: canonical/discarded/pending)
export async function GET() {
  return NextResponse.json({ ...mockTransactions, mocked: true });
}
