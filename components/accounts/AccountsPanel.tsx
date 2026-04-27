"use client";
import useSWR from "swr";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountDetail } from "./AccountDetail";
import type { DashboardAccountSummary } from "@openzeppelin/guardian-operator-client";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AccountsData {
  totalCount: number;
  accounts: DashboardAccountSummary[];
  error?: string;
  available?: false;
}

export function AccountsPanel() {
  const { data } = useSWR<AccountsData>("/api/accounts", fetcher, { refreshInterval: 30_000 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!data) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  if (data.available === false) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        {data.error ?? "Guardian node unavailable"}
      </div>
    );
  }

  if (selectedId) {
    return <AccountDetail accountId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-muted-foreground">
        {data.totalCount} account{data.totalCount !== 1 ? "s" : ""} registered
      </div>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Account ID</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Auth</th>
                <th className="px-4 py-3 text-left font-medium">Signers</th>
                <th className="px-4 py-3 text-left font-medium">Pending</th>
                <th className="px-4 py-3 text-left font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.accounts.map((a) => (
                <tr
                  key={a.accountId}
                  className="border-b last:border-0 cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => setSelectedId(a.accountId)}
                >
                  <td className="px-4 py-3 font-mono text-xs">{a.accountId}</td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        a.stateStatus === "available"
                          ? "bg-emerald-500 text-white"
                          : "bg-zinc-500 text-white"
                      }
                    >
                      {a.stateStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.authScheme}</td>
                  <td className="px-4 py-3">{a.authorizedSignerCount}</td>
                  <td className="px-4 py-3">
                    {a.hasPendingCandidate ? (
                      <Badge variant="outline" className="border-amber-500 text-amber-500 text-xs">
                        pending
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(a.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
