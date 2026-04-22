import { NextResponse } from "next/server";
import { getContainerMeta } from "@/lib/docker";

export const dynamic = "force-dynamic";

export async function GET() {
  const container = await getContainerMeta();

  return NextResponse.json({
    name: process.env.GUARDIAN_NODE_NAME ?? "Guardian Node",
    network: process.env.GUARDIAN_NETWORK ?? "Unknown",
    httpPort: process.env.GUARDIAN_HTTP_PORT ?? "3000",
    grpcPort: process.env.GUARDIAN_GRPC_PORT ?? "50051",
    containerId: container?.id ?? null,
    startedAt: container?.startedAt ?? null,
  });
}
