"use client";
import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface OperatorInfo {
  url: string;
  network: string;
  commitment: string | null;
}

const networkColor: Record<string, string> = {
  MidenLocal: "bg-zinc-500",
  MidenDevnet: "bg-blue-500",
  MidenTestnet: "bg-amber-500",
  MidenMainnet: "bg-emerald-500",
};

function truncate(hex: string): string {
  return hex.length > 12 ? `${hex.slice(0, 8)}…${hex.slice(-6)}` : hex;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function CopyableHash({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button onClick={copy} title={value} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
      {copied ? "copied!" : truncate(value)}
    </button>
  );
}

export function OperatorCard() {
  const { data } = useSWR<OperatorInfo>("/api/operator-info", fetcher);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Operator</CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {!data ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="my-2 h-5 w-full" />)
        ) : (
          <>
            <Row label="Endpoint" value={<span className="text-xs">{data.url.replace(/^https?:\/\//, "")}</span>} />
            <Row
              label="Network"
              value={
                <Badge className={`${networkColor[data.network] ?? "bg-zinc-500"} text-white`}>
                  {data.network}
                </Badge>
              }
            />
            <Row
              label="Commitment"
              value={data.commitment ? <CopyableHash value={data.commitment} /> : <span className="text-xs text-muted-foreground">not set</span>}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
