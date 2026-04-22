import { NextResponse } from "next/server";
import { getSystemSnapshot } from "@/lib/system";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getSystemSnapshot();
  return NextResponse.json(snapshot);
}
