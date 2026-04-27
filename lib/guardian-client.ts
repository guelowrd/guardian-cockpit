import {
  GuardianOperatorHttpClient,
  GuardianOperatorHttpError,
} from "@openzeppelin/guardian-operator-client";
import { signDigest } from "./falcon";

const GUARDIAN_URL = process.env.GUARDIAN_URL ?? "http://localhost:3000";
const COMMITMENT = process.env.GUARDIAN_OPERATOR_COMMITMENT;
const PRIVATE_KEY = process.env.GUARDIAN_OPERATOR_PRIVATE_KEY;

let sessionCookie: string | null = null;

function buildFetch() {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers);
    if (sessionCookie) headers.set("Cookie", sessionCookie);
    const res = await fetch(input, { ...init, headers });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) sessionCookie = setCookie.split(";")[0];
    return res;
  };
}

const client = new GuardianOperatorHttpClient({
  baseUrl: GUARDIAN_URL,
  fetch: buildFetch(),
});

async function ensureAuthenticated(): Promise<void> {
  if (sessionCookie) return;
  if (!COMMITMENT || !PRIVATE_KEY) {
    throw new Error(
      "GUARDIAN_OPERATOR_COMMITMENT and GUARDIAN_OPERATOR_PRIVATE_KEY must be set"
    );
  }
  const { challenge } = await client.challenge(COMMITMENT);
  const signature = await signDigest(PRIVATE_KEY, challenge.signingDigest);
  await client.verify({ commitment: COMMITMENT, signature });
}

async function withReauth<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof GuardianOperatorHttpError && err.status === 401) {
      sessionCookie = null;
      await ensureAuthenticated();
      return fn();
    }
    throw err;
  }
}

export async function checkHealth() {
  const start = Date.now();
  try {
    const res = await fetch(`${GUARDIAN_URL}/pubkey`, { signal: AbortSignal.timeout(2000) });
    return { status: res.ok ? "up" : "down" as const, latencyMs: Date.now() - start, checkedAt: new Date().toISOString() };
  } catch {
    return { status: "down" as const, latencyMs: Date.now() - start, checkedAt: new Date().toISOString() };
  }
}

export async function listAccounts() {
  await ensureAuthenticated();
  return withReauth(() => client.listAccounts());
}

export async function getAccount(accountId: string) {
  await ensureAuthenticated();
  return withReauth(() => client.getAccount(accountId));
}
