import { NextResponse } from "next/server";
import { getAccount } from "@/lib/guardian-client";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    const data = await getAccount(accountId);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, available: false }, { status: 503 });
  }
}
