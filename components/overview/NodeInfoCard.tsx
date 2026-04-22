"use client";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface NodeInfo {
  name: string;
  network: string;
  httpPort: string;
  grpcPort: string;
  containerId: string | null;
  startedAt: string | null;
}

const networkColor: Record<string, string> = {
  MidenLocal: "bg-zinc-500",
  MidenDevnet: "bg-blue-500",
  MidenTestnet: "bg-amber-500",
  MidenMainnet: "bg-emerald-500",
};

function uptime(startedAt: string | null): string {
  if (!startedAt) return "—";
  const ms = Date.now() - new Date(startedAt).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function NodeInfoCard() {
  const { data } = useSWR<NodeInfo>("/api/node-info", fetcher, { refreshInterval: 30_000 });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Node Info</CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {!data ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="my-2 h-5 w-full" />)
        ) : (
          <>
            <Row label="Name" value={data.name} />
            <Row
              label="Network"
              value={
                <Badge className={`${networkColor[data.network] ?? "bg-zinc-500"} text-white`}>
                  {data.network}
                </Badge>
              }
            />
            <Row label="HTTP Port" value={data.httpPort} />
            <Row label="gRPC Port" value={data.grpcPort} />
            <Row label="Container ID" value={data.containerId ?? <span className="text-muted-foreground text-xs">not available</span>} />
            <Row label="Uptime" value={uptime(data.startedAt)} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
