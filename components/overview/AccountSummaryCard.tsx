"use client";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface OverviewData {
  totalAccounts: number;
  available: number;
  unavailable: number;
  falcon: number;
  ecdsa: number;
  pendingCandidates: number;
  error?: string;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function AccountSummaryCard() {
  const { data } = useSWR<OverviewData>("/api/overview", fetcher, { refreshInterval: 30_000 });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Accounts</CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {!data ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="my-2 h-5 w-full" />)
        ) : data.error ? (
          <p className="py-4 text-xs text-muted-foreground">Guardian unreachable</p>
        ) : (
          <>
            <Row label="Total" value={data.totalAccounts} />
            <Row label="Available" value={<span className="text-emerald-400">{data.available}</span>} />
            <Row label="Unavailable" value={data.unavailable > 0 ? <span className="text-red-400">{data.unavailable}</span> : "0"} />
            <Row label="Falcon" value={data.falcon} />
            <Row label="ECDSA" value={data.ecdsa} />
            <Row label="Pending candidate" value={data.pendingCandidates > 0 ? <span className="text-amber-400">{data.pendingCandidates}</span> : "0"} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
