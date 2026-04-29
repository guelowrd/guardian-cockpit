"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useFreeze } from "@/hooks/useFreeze";
import { ArrowLeft } from "lucide-react";

interface Props {
  accountId: string;
}

const TX_TYPES = ["Transfer", "Add Signer", "Remove Signer", "Consume", "Mint"] as const;
type TxType = (typeof TX_TYPES)[number];

const REJECTION_REASONS: Record<TxType, string[]> = {
  Transfer: [
    "Transfer above authorized threshold",
    "Unauthorized recipient address",
    "Insufficient account balance",
  ],
  "Add Signer": [
    "Signer limit exceeded",
    "Unauthorized signer public key",
    "Duplicate signer detected",
  ],
  "Remove Signer": [
    "Insufficient signer count after removal",
    "Unauthorized removal request",
  ],
  Consume: [
    "Transaction expired",
    "Invalid note commitment",
    "Note already consumed",
  ],
  Mint: [
    "Mint above authorized limit",
    "Unauthorized minter",
    "Mint target account frozen",
  ],
};

function lcg(seed: { v: number }): number {
  seed.v = (Math.imul(seed.v, 1664525) + 1013904223) | 0;
  return (seed.v >>> 0) / 4294967296;
}

function makeMockTxns(accountId: string) {
  const seed = {
    v: accountId.split("").reduce((acc, c) => (Math.imul(acc, 31) + c.charCodeAt(0)) | 0, 0),
  };
  const now = Date.now();

  return Array.from({ length: 13 }, () => {
    const type = TX_TYPES[Math.floor(lcg(seed) * TX_TYPES.length)];
    const signed = lcg(seed) < 0.9;
    const ts = now - Math.floor(lcg(seed) * 30) * 86400000 - Math.floor(lcg(seed) * 86400000);
    const h1 = Math.floor(lcg(seed) * 0xffffffff).toString(16).padStart(8, "0");
    const h2 = Math.floor(lcg(seed) * 0xffff).toString(16).padStart(4, "0");
    const hasAmount = type === "Transfer" || type === "Mint";
    const amount = hasAmount
      ? `${(lcg(seed) * 100).toFixed(2)} ${lcg(seed) > 0.5 ? "MIDEN" : "ETH"}`
      : null;
    const reasons = REJECTION_REASONS[type];
    const reason = !signed ? reasons[Math.floor(lcg(seed) * reasons.length)] : null;
    return { hash: `0x${h1}…${h2}`, type, amount, signed, reason, ts };
  })
    .sort((a, b) => b.ts - a.ts)
    .map((tx) => ({ ...tx, timestamp: new Date(tx.ts).toLocaleString() }));
}

export function AccountTransactions({ accountId }: Props) {
  const router = useRouter();
  const { frozen, freeze, unfreeze } = useFreeze();
  const [showConfirm, setShowConfirm] = useState(false);

  const isFrozen = frozen.has(accountId);
  const txns = makeMockTxns(accountId);

  return (
    <div className="flex flex-col gap-4">
      {showConfirm && (
        <ConfirmModal
          title={isFrozen ? "Unfreeze account?" : "Freeze account?"}
          message={`Are you sure you want to ${isFrozen ? "unfreeze" : "freeze"} account ${accountId}?`}
          confirmLabel={isFrozen ? "Unfreeze" : "Freeze"}
          confirmClass={
            isFrozen
              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
              : "bg-amber-500 hover:bg-amber-600 text-white"
          }
          onConfirm={() => {
            isFrozen ? unfreeze(accountId) : freeze(accountId);
            setShowConfirm(false);
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Back to account
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          className={
            isFrozen
              ? "px-3 py-1.5 text-xs rounded-lg border border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 transition-colors"
              : "px-3 py-1.5 text-xs rounded-lg border border-amber-500 text-amber-500 hover:bg-amber-500/10 transition-colors"
          }
        >
          {isFrozen ? "Unfreeze Account" : "Freeze Account"}
        </button>
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
        <strong>Mock data</strong> — Per-account transaction history requires Guardian API endpoints not yet available.
      </div>

      <p className="text-xs text-muted-foreground font-mono truncate">{accountId}</p>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Tx Hash</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((tx, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.hash}</td>
                  <td className="px-4 py-3">{tx.type}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{tx.amount ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Badge className={tx.signed ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}>
                        {tx.signed ? "signed" : "rejected"}
                      </Badge>
                      {tx.reason && (
                        <span className="text-xs text-red-400">{tx.reason}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{tx.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
