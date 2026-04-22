"use client";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SystemSnapshot {
  cpu: { load: number };
  memory: { used: number; total: number; percent: number };
  network: { rxSec: number; txSec: number };
  uptime: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function BarMetric({ label, value, max, display }: { label: string; value: number; max: number; display: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct > 85 ? "bg-red-500" : pct > 65 ? "bg-amber-500" : "bg-violet-500";
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{display}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function SystemMetrics() {
  const { data } = useSWR<SystemSnapshot>("/api/system", fetcher, { refreshInterval: 5000 });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">System Metrics</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!data ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
        ) : (
          <>
            <BarMetric label="CPU" value={data.cpu.load} max={100} display={`${data.cpu.load}%`} />
            <BarMetric
              label="Memory"
              value={data.memory.used}
              max={data.memory.total}
              display={`${formatBytes(data.memory.used)} / ${formatBytes(data.memory.total)} (${data.memory.percent}%)`}
            />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network In</span>
              <span className="font-medium">{formatBytes(data.network.rxSec)}/s</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network Out</span>
              <span className="font-medium">{formatBytes(data.network.txSec)}/s</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
