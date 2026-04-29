# Guardian Cockpit

A monitoring and management dashboard for [OpenZeppelin Guardian](https://github.com/OpenZeppelin/guardian/) nodes.

Guardian is a key-management service for [Miden](https://miden.xyz) accounts — it holds Falcon-512 signing keys, validates state transitions, and cosigns transactions on behalf of accounts. Guardian Cockpit gives operators a real-time view of a running node: liveness, account inventory, per-account policy management, and logs.

---

## Pages

| Page | Status | Data source |
|---|---|---|
| **Overview** — heartbeat latency, account totals, operator identity | ✅ Live | Guardian API + env vars |
| **Logs** — color-coded log viewer with level filter | ✅ Live | Docker API or log file |
| **Accounts** — full account list with status, signers, pending candidates | ✅ Live | Guardian API (`listAccounts` / `getAccount`) |
| **Account detail** — per-account fields, signers, policy rule overrides, freeze/unfreeze | ✅ Live + mock overlay | Guardian API; freeze state in localStorage |
| **Account transactions** — per-account transaction history | 🔶 Mock | Needs Guardian `GET /delta/since` per account |
| **Transactions** — aggregate signed/rejected stats and volume chart | 🔶 Mock | Needs Guardian `GET /delta/since` across all accounts |
| **Compliance** — provider config, KYC/whitelist, policy rules | 🔶 Mock | Planned; not yet connected to any provider |

---

## Setup

### 1. Prerequisites

- Node.js 20+
- A running Guardian node (local or remote)
- The operator's **commitment** and **private key** (Falcon-512, hex-encoded) — used to authenticate with the Guardian server

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
# Required
GUARDIAN_URL=https://guardian.openzeppelin.com   # Guardian HTTP API endpoint
GUARDIAN_NETWORK=MidenTestnet                    # MidenLocal | MidenDevnet | MidenTestnet | MidenMainnet
GUARDIAN_OPERATOR_COMMITMENT=0x...               # operator commitment (public key hash)
GUARDIAN_OPERATOR_PRIVATE_KEY=...                # Falcon-512 private key, hex-encoded

# Optional — log streaming
DOCKER_CONTAINER_NAME=guardian-server-1          # enables Docker API log streaming
LOG_FILE_PATH=/var/log/guardian/guardian.log     # fallback if Docker is unavailable

# Optional — dashboard access control (see docs/access-control-options.md)
DASHBOARD_SECRET=                                # if unset, the dashboard is open to anyone
```

> **Security note:** If the dashboard is reachable from a public network, set `DASHBOARD_SECRET` to a strong random string. With it set, the login page requires that value as the password. See [`docs/access-control-options.md`](docs/access-control-options.md) for a discussion of more robust multi-user auth options.

### 3. Run

```bash
npm install
npm run dev        # → http://localhost:3000
```

---

## Running alongside Guardian

### Docker Compose (recommended)

Add Guardian Cockpit as a sidecar in your `docker-compose.yml`:

```yaml
services:
  guardian:
    image: ...

  cockpit:
    build: ./guardian-cockpit
    ports:
      - "3000:3000"
    environment:
      GUARDIAN_URL: http://guardian:3000
      GUARDIAN_NETWORK: MidenTestnet
      GUARDIAN_OPERATOR_COMMITMENT: "0x..."
      GUARDIAN_OPERATOR_PRIVATE_KEY: "..."
      DOCKER_CONTAINER_NAME: guardian   # must match the Guardian container name
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    depends_on:
      - guardian
```

The dashboard will stream logs directly from the Guardian container via the Docker API.

### Cargo / local process

```bash
# Start Guardian with its logs redirected to a file
cargo run 2>&1 | tee /var/log/guardian/guardian.log

# Start the dashboard
GUARDIAN_URL=http://localhost:3000 \
GUARDIAN_OPERATOR_COMMITMENT=0x... \
GUARDIAN_OPERATOR_PRIVATE_KEY=... \
LOG_FILE_PATH=/var/log/guardian/guardian.log \
npm run dev
```

---

## Authentication flow

The dashboard authenticates to the Guardian server using a **challenge-response protocol**:

1. Dashboard calls `GET /challenge` with the operator commitment
2. Guardian returns a signing digest
3. Dashboard signs the digest with the operator's Falcon-512 private key (via Miden WASM)
4. Dashboard calls `POST /verify` with the commitment and signature
5. Guardian returns a session cookie that is used for all subsequent API calls

The private key never leaves the server process — it is only used server-side to sign challenges.

---

## Pending Guardian API features

Some dashboard sections are mocked because the required Guardian API endpoints do not yet exist:

| Feature | Missing endpoint |
|---|---|
| Per-account transaction history | `GET /accounts/:id/delta/since` |
| Aggregate transaction stats | `GET /delta/since` across all accounts |
| Server info (version, uptime, network) | `GET /health` or `GET /info` |
| Real-time log streaming | Server-sent events or WebSocket log endpoint |

---

## Tech stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **SWR** — data fetching with polling
- **Recharts** — charts
- **Miden WASM** (`@miden-web/miden-wasm`) — Falcon-512 signing
- **`@openzeppelin/guardian-operator-client`** — typed Guardian API client
