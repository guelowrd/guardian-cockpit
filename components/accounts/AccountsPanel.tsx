"use client";
import useSWR from "swr";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useFreeze } from "@/hooks/useFreeze";
import type { DashboardAccountSummary } from "@openzeppelin/guardian-operator-client";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AccountsData {
  totalCount: number;
  accounts: DashboardAccountSummary[];
  error?: string;
  available?: false;
}

type PendingAction = { id: string; freeze: boolean } | null;

function statusBadge(status: string) {
  if (status === "available") return <Badge className="bg-emerald-500 text-white">available</Badge>;
  if (status === "frozen") return <Badge className="bg-orange-500 text-white">frozen</Badge>;
  return <Badge className="bg-zinc-500 text-white">{status}</Badge>;
}

export function AccountsPanel() {
  const { data } = useSWR<AccountsData>("/api/accounts", fetcher, { refreshInterval: 30_000 });
  const router = useRouter();
  const { frozen, freeze, unfreeze } = useFreeze();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

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

  return (
    <div className="flex flex-col gap-4">
      {pendingAction && (
        <ConfirmModal
          title={pendingAction.freeze ? "Freeze account?" : "Unfreeze account?"}
          message={`Are you sure you want to ${pendingAction.freeze ? "freeze" : "unfreeze"} account ${pendingAction.id}?`}
          confirmLabel={pendingAction.freeze ? "Freeze" : "Unfreeze"}
          confirmClass={
            pendingAction.freeze
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-emerald-500 hover:bg-emerald-600 text-white"
          }
          onConfirm={() => {
            pendingAction.freeze ? freeze(pendingAction.id) : unfreeze(pendingAction.id);
            setPendingAction(null);
          }}
          onCancel={() => setPendingAction(null)}
        />
      )}
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
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.accounts.map((a) => {
                const isFrozen = frozen.has(a.accountId);
                const status = isFrozen ? "frozen" : a.stateStatus;
                return (
                  <tr
                    key={a.accountId}
                    className="border-b last:border-0 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => router.push(`/accounts/${a.accountId}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{a.accountId}</td>
                    <td className="px-4 py-3">{statusBadge(status)}</td>
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
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {isFrozen ? (
                        <button
                          onClick={() => setPendingAction({ id: a.accountId, freeze: false })}
                          className="px-2 py-0.5 text-xs rounded border border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                        >
                          Unfreeze
                        </button>
                      ) : (
                        <button
                          onClick={() => setPendingAction({ id: a.accountId, freeze: true })}
                          className="px-2 py-0.5 text-xs rounded border border-amber-500 text-amber-500 hover:bg-amber-500/10 transition-colors"
                        >
                          Freeze
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
