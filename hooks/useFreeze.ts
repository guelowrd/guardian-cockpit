"use client";
import { useState, useEffect } from "react";

const KEY = "frozen_accounts";

export function useFreeze() {
  const [frozen, setFrozen] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      setFrozen(new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]")));
    } catch {
      setFrozen(new Set());
    }
  }, []);

  const toggle = (id: string, shouldFreeze: boolean) => {
    setFrozen((prev) => {
      const next = new Set(prev);
      shouldFreeze ? next.add(id) : next.delete(id);
      localStorage.setItem(KEY, JSON.stringify([...next]));
      return next;
    });
  };

  return {
    frozen,
    freeze: (id: string) => toggle(id, true),
    unfreeze: (id: string) => toggle(id, false),
  };
}
