// Mock data shapes mirror the real API contract the Guardian team should implement.
// See /api/accounts and /api/transactions routes.

export const mockAccounts = {
  totalAccounts: 47,
  avgTxPerAccount: 12.3,
  totalTvl: 1_420_000,
  avgTvl: 30_212,
  accounts: Array.from({ length: 47 }, (_, i) => ({
    id: `0x${(i + 1).toString(16).padStart(16, "0")}`,
    txCount: Math.floor(Math.random() * 50) + 1,
    lastActivity: new Date(Date.now() - Math.random() * 7 * 86400_000).toISOString(),
    tvl: Math.floor(Math.random() * 100_000),
  })),
};

export const mockTransactions = {
  total: 578,
  signed: 541,
  rejected: 23,
  pending: 14,
  avgSizeBytes: 1_240,
  history: Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - (13 - i) * 86400_000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    signed: Math.floor(Math.random() * 60) + 20,
    rejected: Math.floor(Math.random() * 8),
  })),
};
