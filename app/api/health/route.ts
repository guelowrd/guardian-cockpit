import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/guardian";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await checkHealth();
  return NextResponse.json(result);
}
