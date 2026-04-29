"use client";
import useSWR from "swr";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useFreeze } from "@/hooks/useFreeze";
import { useAccountPolicyRules, type PolicyRules } from "@/hooks/usePolicyRules";
import { ArrowLeft, RotateCcw } from "lucide-react";
import type { DashboardAccountDetail } from "@openzeppelin/guardian-operator-client";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Props {
  accountId: string;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right break-all">{value}</span>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-violet-600" : "bg-zinc-700"}`}
    >
      <span
        className={`absolute top-[2px] h-4 w-4 rounded-full bg-white shadow transition-all duration-150 ${checked ? "left-[18px]" : "left-[2px]"}`}
      />
    </button>
  );
}

interface PolicyRowProps {
  label: string;
  ruleKey: keyof PolicyRules;
  valueKey?: keyof PolicyRules;
  unit?: string;
  overrides: Partial<PolicyRules>;
  effective: PolicyRules;
  global: PolicyRules;
  setOverride: <K extends keyof PolicyRules>(key: K, value: PolicyRules[K] | undefined) => void;
}

function PolicyRow({ label, ruleKey, valueKey, unit, overrides, effective, global, setOverride }: PolicyRowProps) {
  const isOverridden = ruleKey in overrides || (valueKey && valueKey in overrides);
  const globalEnabled = global[ruleKey] as boolean;
  const effectiveEnabled = effective[ruleKey] as boolean;

  return (
    <div className="flex items-center justify-between py-2.5 gap-4 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className={isOverridden ? "text-violet-400" : ""}>{label}</span>
        {isOverridden && (
          <Badge variant="outline" className="border-violet-500 text-violet-400 text-xs shrink-0">
            overridden
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {effectiveEnabled && valueKey && (
          <input
            type="number"
            value={effective[valueKey] as number}
            onChange={(e) =>
              setOverride(valueKey, Number(e.target.value) as PolicyRules[typeof valueKey])
            }
            className="w-20 rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        )}
        {effectiveEnabled && unit && (
          <span className="text-xs text-muted-foreground">{unit}</span>
        )}
        <Toggle
          checked={effectiveEnabled}
          onChange={(v) => setOverride(ruleKey, v as PolicyRules[typeof ruleKey])}
        />
        {isOverridden && (
          <button
            onClick={() => {
              setOverride(ruleKey, undefined);
              if (valueKey) setOverride(valueKey, undefined);
            }}
            title="Reset to global default"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
        {!isOverridden && (
          <span className="w-[18px]" />
        )}
      </div>
    </div>
  );
}

export function AccountDetail({ accountId }: Props) {
  const { data } = useSWR<{ account: DashboardAccountDetail; error?: string }>(
    `/api/accounts/${encodeURIComponent(accountId)}`,
    fetcher
  );
  const router = useRouter();
  const { frozen, freeze, unfreeze } = useFreeze();
  const { effective, overrides, global, setOverride } = useAccountPolicyRules(accountId);
  const [showConfirm, setShowConfirm] = useState(false);

  const isFrozen = frozen.has(accountId);

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
          <ArrowLeft className="h-4 w-4" /> Back to accounts
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/accounts/${accountId}/transactions`)}
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-700 text-muted-foreground hover:text-foreground transition-colors"
          >
            View Transactions
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
      </div>

      {!data ? (
        <Card><CardContent className="pt-6 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</CardContent></Card>
      ) : data.error ? (
        <div className="text-sm text-muted-foreground">{data.error}</div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-mono truncate">
              {data.account.accountId}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <Row
              label="Status"
              value={
                isFrozen ? (
                  <Badge className="bg-orange-500 text-white">frozen</Badge>
                ) : (
                  <Badge className={data.account.stateStatus === "available" ? "bg-emerald-500 text-white" : "bg-zinc-500 text-white"}>
                    {data.account.stateStatus}
                  </Badge>
                )
              }
            />
            <Row label="Auth scheme" value={data.account.authScheme} />
            <Row
              label="Pending candidate"
              value={data.account.hasPendingCandidate ? <Badge variant="outline" className="border-amber-500 text-amber-500">yes</Badge> : "no"}
            />
            <Row
              label="Commitment"
              value={<span className="font-mono text-xs">{data.account.currentCommitment ?? "—"}</span>}
            />
            <Row label="Created" value={new Date(data.account.createdAt).toLocaleString()} />
            <Row label="Updated" value={new Date(data.account.updatedAt).toLocaleString()} />
            {data.account.stateCreatedAt && (
              <Row label="State created" value={new Date(data.account.stateCreatedAt).toLocaleString()} />
            )}
            {data.account.stateUpdatedAt && (
              <Row label="State updated" value={new Date(data.account.stateUpdatedAt).toLocaleString()} />
            )}
            <div className="py-2">
              <p className="text-sm text-muted-foreground mb-2">
                Authorized signers ({data.account.authorizedSignerIds.length})
              </p>
              <div className="flex flex-col gap-1">
                {data.account.authorizedSignerIds.map((id) => (
                  <span key={id} className="font-mono text-xs bg-muted rounded px-2 py-1 break-all">
                    {id}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policy Rules */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Policy Rules
            <span className="ml-2 text-xs font-normal text-zinc-600">account-level overrides — violet = differs from global</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <PolicyRow
            label="Require KYC before first transaction"
            ruleKey="req_kyc"
            overrides={overrides}
            effective={effective}
            global={global}
            setOverride={setOverride}
          />
          <PolicyRow
            label="Max single transaction value"
            ruleKey="max_tx"
            valueKey="max_tx_val"
            unit="MIDEN"
            overrides={overrides}
            effective={effective}
            global={global}
            setOverride={setOverride}
          />
          <PolicyRow
            label="Multi-signer approval threshold"
            ruleKey="multi_signer"
            valueKey="multi_signer_val"
            unit="MIDEN"
            overrides={overrides}
            effective={effective}
            global={global}
            setOverride={setOverride}
          />
          <PolicyRow
            label="Freeze after consecutive rejections"
            ruleKey="freeze_rejected"
            valueKey="freeze_rejected_val"
            unit="rejections"
            overrides={overrides}
            effective={effective}
            global={global}
            setOverride={setOverride}
          />
        </CardContent>
      </Card>
    </div>
  );
}
