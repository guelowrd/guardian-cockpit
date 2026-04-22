"use client";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AccountsData {
  totalAccounts: number;
  avgTxPerAccount: number;
  totalTvl: number;
  avgTvl: number;
  mocked: boolean;
}

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function KpiCard({ label, value, mocked }: { label: string; value: string; mocked: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-1 flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {mocked && (
          <Badge variant="outline" className="border-amber-500 text-amber-500 text-xs">
            Needs Guardian API
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export function AccountsPanel() {
  const { data } = useSWR<AccountsData>("/api/accounts", fetcher, { refreshInterval: 30_000 });

  if (!data) {
    return <div className="grid grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {data.mocked && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
          <strong>Mock data</strong> — These stats require Guardian to expose a{" "}
          <code className="rounded bg-amber-500/20 px-1">GET /accounts</code> endpoint. Raise this with the Guardian team.
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <KpiCard label="Total Accounts" value={data.totalAccounts.toString()} mocked={data.mocked} />
        <KpiCard label="Avg Tx / Account" value={data.avgTxPerAccount.toFixed(1)} mocked={data.mocked} />
        <KpiCard label="Total TVL" value={formatUsd(data.totalTvl)} mocked={data.mocked} />
        <KpiCard label="Avg TVL / Account" value={formatUsd(data.avgTvl)} mocked={data.mocked} />
      </div>
    </div>
  );
}
