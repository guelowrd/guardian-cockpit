import { NextResponse } from "next/server";
import { listAccounts } from "@/lib/guardian-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await listAccounts();
    const accounts = data.accounts ?? [];

    let available = 0, unavailable = 0, falcon = 0, ecdsa = 0, pendingCandidates = 0;
    for (const a of accounts) {
      if (a.stateStatus === "available") available++; else unavailable++;
      if (a.authScheme === "falcon") falcon++; else ecdsa++;
      if (a.hasPendingCandidate) pendingCandidates++;
    }

    return NextResponse.json({ totalAccounts: data.totalCount, available, unavailable, falcon, ecdsa, pendingCandidates });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, available: false }, { status: 503 });
  }
}
