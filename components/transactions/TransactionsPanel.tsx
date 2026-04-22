"use client";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TxData {
  total: number;
  signed: number;
  rejected: number;
  pending: number;
  avgSizeBytes: number;
  history: { date: string; signed: number; rejected: number }[];
  mocked: boolean;
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

export function TransactionsPanel() {
  const { data } = useSWR<TxData>("/api/transactions", fetcher, { refreshInterval: 30_000 });

  if (!data) {
    return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {data.mocked && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
          <strong>Mock data</strong> — These stats require Guardian to expose account listing and{" "}
          <code className="rounded bg-amber-500/20 px-1">GET /delta/since</code> across all accounts. Raise this with the Guardian team.
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Tx" value={data.total.toLocaleString()} mocked={data.mocked} />
        <KpiCard label="Signed" value={data.signed.toLocaleString()} mocked={data.mocked} />
        <KpiCard label="Rejected" value={data.rejected.toLocaleString()} mocked={data.mocked} />
        <KpiCard label="Avg Size" value={`${data.avgSizeBytes.toLocaleString()} B`} mocked={data.mocked} />
      </div>

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tx Volume (last 14 days)</CardTitle>
          {data.mocked && (
            <Badge variant="outline" className="border-amber-500 text-amber-500 text-xs">
              Needs Guardian API
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.history}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="signed" fill="#8b5cf6" name="Signed" radius={[2, 2, 0, 0]} />
                <Bar dataKey="rejected" fill="#ef4444" name="Rejected" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
