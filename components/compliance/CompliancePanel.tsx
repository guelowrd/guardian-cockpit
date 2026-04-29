"use client";
import { useState } from "react";
import { usePolicyRules } from "@/hooks/usePolicyRules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PROVIDERS = ["None (not configured)", "Chainalysis", "TRM", "Elliptic", "Predicate"] as const;

interface KycRow {
  address: string;
  kyc: string;
  whitelist: string;
  added: string;
}

const INITIAL_KYC_ROWS: KycRow[] = [
  { address: "0x1a2b3c4d5e6f7a8b", kyc: "Verified",   whitelist: "Approved", added: "2026-01-15" },
  { address: "0x9f8e7d6c5b4a3210", kyc: "Pending",    whitelist: "Pending",  added: "2026-02-03" },
  { address: "0xdeadbeef0000cafe", kyc: "Verified",   whitelist: "Approved", added: "2026-02-18" },
  { address: "0x0011223344556677", kyc: "Not Started", whitelist: "Blocked",  added: "2026-03-01" },
  { address: "0xaabbccddeeff0099", kyc: "Verified",   whitelist: "Pending",  added: "2026-03-22" },
  { address: "0x1234567890abcdef", kyc: "Pending",    whitelist: "Approved", added: "2026-04-10" },
];

function kycBadge(status: string) {
  if (status === "Verified") return <Badge className="bg-emerald-500 text-white text-xs">Verified</Badge>;
  if (status === "Pending") return <Badge className="bg-amber-500 text-white text-xs">Pending</Badge>;
  return <Badge className="bg-zinc-500 text-white text-xs">Not Started</Badge>;
}

function whitelistBadge(status: string) {
  if (status === "Approved") return <Badge className="bg-emerald-500 text-white text-xs">Approved</Badge>;
  if (status === "Pending") return <Badge className="bg-amber-500 text-white text-xs">Pending</Badge>;
  return <Badge className="bg-red-500 text-white text-xs">Blocked</Badge>;
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

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-24 rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
    />
  );
}

export function CompliancePanel() {
  const [provider, setProvider] = useState("None (not configured)");
  const [kycRows, setKycRows] = useState<KycRow[]>(INITIAL_KYC_ROWS);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newKyc, setNewKyc] = useState("Not Started");
  const [newWhitelist, setNewWhitelist] = useState("Pending");

  const { rules, setRule } = usePolicyRules();

  const isConnected = provider !== "None (not configured)";

  function handleAddAddress() {
    if (!newAddress.trim()) return;
    setKycRows((rows) => [
      ...rows,
      { address: newAddress.trim(), kyc: newKyc, whitelist: newWhitelist, added: new Date().toISOString().slice(0, 10) },
    ]);
    setNewAddress("");
    setNewKyc("Not Started");
    setNewWhitelist("Pending");
    setShowAddAddress(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Add Address Modal */}
      {showAddAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h2 className="text-sm font-semibold mb-4">Add Address</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">KYC Status</label>
                <select
                  value={newKyc}
                  onChange={(e) => setNewKyc(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  <option>Not Started</option>
                  <option>Pending</option>
                  <option>Verified</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Whitelist Status</label>
                <select
                  value={newWhitelist}
                  onChange={(e) => setNewWhitelist(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>Blocked</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddAddress(false)}
                className="px-4 py-1.5 text-sm rounded-lg border border-zinc-700 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAddress}
                className="px-4 py-1.5 text-sm rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
        <strong>Mock data</strong> — Compliance module — planned. These features are not yet connected to any provider.
      </div>

      {/* Card A — Provider Configuration */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Provider</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 w-full max-w-xs"
          >
            {PROVIDERS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <div className="flex items-center justify-between py-1.5 text-sm max-w-xs">
            <span className="text-muted-foreground">Status</span>
            {isConnected ? (
              <Badge className="bg-emerald-500 text-white">Connected</Badge>
            ) : (
              <Badge className="bg-zinc-600 text-white">Not connected</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card B — KYC & Whitelist */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">KYC &amp; Whitelist</CardTitle>
          <button
            onClick={() => setShowAddAddress(true)}
            className="px-3 py-1 text-xs rounded-lg border border-zinc-700 text-muted-foreground hover:text-foreground transition-colors"
          >
            Add Address
          </button>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Address</th>
                <th className="px-4 py-3 text-left font-medium">KYC Status</th>
                <th className="px-4 py-3 text-left font-medium">Whitelist</th>
                <th className="px-4 py-3 text-left font-medium">Added</th>
              </tr>
            </thead>
            <tbody>
              {kycRows.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.address}</td>
                  <td className="px-4 py-3">{kycBadge(row.kyc)}</td>
                  <td className="px-4 py-3">{whitelistBadge(row.whitelist)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.added}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Card C — Policy Rules */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Policy Rules</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <div className="flex items-center justify-between py-3 gap-4">
            <span className="text-sm">Require KYC verification before first transaction</span>
            <Toggle checked={rules.req_kyc} onChange={(v) => setRule("req_kyc", v)} />
          </div>
          <div className="flex items-center justify-between py-3 gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-sm">Maximum single transaction value</span>
              {rules.max_tx && (
                <div className="flex items-center gap-1.5">
                  <NumberInput value={rules.max_tx_val} onChange={(v) => setRule("max_tx_val", v)} />
                  <span className="text-xs text-muted-foreground">MIDEN</span>
                </div>
              )}
            </div>
            <Toggle checked={rules.max_tx} onChange={(v) => setRule("max_tx", v)} />
          </div>
          <div className="flex items-center justify-between py-3 gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-sm">Require multi-signer approval for transactions above threshold</span>
              {rules.multi_signer && (
                <div className="flex items-center gap-1.5">
                  <NumberInput value={rules.multi_signer_val} onChange={(v) => setRule("multi_signer_val", v)} />
                  <span className="text-xs text-muted-foreground">MIDEN</span>
                </div>
              )}
            </div>
            <Toggle checked={rules.multi_signer} onChange={(v) => setRule("multi_signer", v)} />
          </div>
          <div className="flex items-center justify-between py-3 gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-sm">Freeze account after consecutive rejected transactions</span>
              {rules.freeze_rejected && (
                <div className="flex items-center gap-1.5">
                  <NumberInput value={rules.freeze_rejected_val} onChange={(v) => setRule("freeze_rejected_val", v)} />
                  <span className="text-xs text-muted-foreground">rejections</span>
                </div>
              )}
            </div>
            <Toggle checked={rules.freeze_rejected} onChange={(v) => setRule("freeze_rejected", v)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
