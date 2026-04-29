"use client";
import { useState, useEffect } from "react";

const GLOBAL_KEY = "policy_rules";
const OVERRIDES_KEY = "policy_rules_overrides";

export interface PolicyRules {
  req_kyc: boolean;
  max_tx: boolean;
  max_tx_val: number;
  multi_signer: boolean;
  multi_signer_val: number;
  freeze_rejected: boolean;
  freeze_rejected_val: number;
}

export const DEFAULT_RULES: PolicyRules = {
  req_kyc: false,
  max_tx: false,
  max_tx_val: 10000,
  multi_signer: false,
  multi_signer_val: 50000,
  freeze_rejected: false,
  freeze_rejected_val: 3,
};

function readGlobal(): PolicyRules {
  if (typeof window === "undefined") return DEFAULT_RULES;
  try {
    return { ...DEFAULT_RULES, ...JSON.parse(localStorage.getItem(GLOBAL_KEY) ?? "{}") };
  } catch {
    return DEFAULT_RULES;
  }
}

function readOverrides(): Record<string, Partial<PolicyRules>> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function usePolicyRules() {
  const [rules, setRules] = useState<PolicyRules>(DEFAULT_RULES);

  useEffect(() => {
    setRules(readGlobal());
  }, []);

  const setRule = <K extends keyof PolicyRules>(key: K, value: PolicyRules[K]) => {
    setRules((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(GLOBAL_KEY, JSON.stringify(next));
      return next;
    });
  };

  return { rules, setRule };
}

export function useAccountPolicyRules(accountId: string) {
  const { rules: global } = usePolicyRules();
  const [overrides, setOverrides] = useState<Partial<PolicyRules>>({});

  useEffect(() => {
    const all = readOverrides();
    setOverrides(all[accountId] ?? {});
  }, [accountId]);

  const effective: PolicyRules = { ...global, ...overrides };

  const setOverride = <K extends keyof PolicyRules>(key: K, value: PolicyRules[K] | undefined) => {
    setOverrides((prev) => {
      const next = { ...prev };
      if (value === undefined) {
        delete next[key];
      } else {
        (next as Record<string, unknown>)[key] = value;
      }
      const all = readOverrides();
      all[accountId] = next;
      localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all));
      return next;
    });
  };

  return { effective, overrides, global, setOverride };
}
