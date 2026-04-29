import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    url: process.env.GUARDIAN_URL ?? "http://localhost:3000",
    network: process.env.GUARDIAN_NETWORK ?? "Unknown",
    commitment: process.env.GUARDIAN_OPERATOR_COMMITMENT ?? null,
  });
}
