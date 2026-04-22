const GUARDIAN_URL = process.env.GUARDIAN_URL ?? "http://localhost:3000";

export async function guardianFetch(path: string, options?: RequestInit) {
  const url = `${GUARDIAN_URL}${path}`;
  return fetch(url, { ...options, signal: AbortSignal.timeout(2000) });
}

export async function checkHealth(): Promise<{ status: "up" | "down"; latencyMs: number; checkedAt: string }> {
  const start = Date.now();
  try {
    const res = await guardianFetch("/pubkey");
    const latencyMs = Date.now() - start;
    return { status: res.ok ? "up" : "down", latencyMs, checkedAt: new Date().toISOString() };
  } catch {
    return { status: "down", latencyMs: Date.now() - start, checkedAt: new Date().toISOString() };
  }
}
