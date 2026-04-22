# Guardian Cockpit

A monitoring dashboard for [OpenZeppelin Guardian](https://github.com/OpenZeppelin/guardian/) nodes.

Guardian is a key-management service for [Miden](https://miden.xyz) accounts — it holds signing keys, validates state transitions, and cosigns deltas on behalf of accounts. Guardian Cockpit gives operators a real-time view of a running node: liveness, system resource usage, and live logs, with stubs for account/transaction stats that are blocked on upstream API additions (see [Limitations](#limitations)).

---

## What it shows

| Section | Status | Source |
|---|---|---|
| Heartbeat (latency, up/down) | ✅ Live | Polls `GET /pubkey` every 5 s |
| Node name, network, ports | ✅ Live | Environment variables |
| CPU / Memory / Network I/O | ✅ Live | OS metrics via `systeminformation` |
| Container ID & uptime | ✅ Live (optional) | Docker socket |
| Log viewer with level filter | ✅ Live | Docker API or log file |
| Account stats (TVL, tx count) | 🔶 Mocked | Needs Guardian `GET /accounts` |
| Transaction stats (signed/rejected) | 🔶 Mocked | Needs Guardian `GET /accounts` + delta history |

---

## Setup

### Environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
GUARDIAN_URL=http://localhost:3000     # Guardian HTTP API
GUARDIAN_NODE_NAME=My Guardian Node
GUARDIAN_NETWORK=MidenTestnet          # MidenLocal | MidenDevnet | MidenTestnet
GUARDIAN_HTTP_PORT=3000
GUARDIAN_GRPC_PORT=50051
DOCKER_CONTAINER_NAME=                 # optional — enables Docker log streaming + container metadata
LOG_FILE_PATH=                         # optional fallback if Docker socket unavailable
```

---

### Running alongside Guardian via Docker Compose

Add Guardian Cockpit as a sidecar service in your existing `docker-compose.yml`:

```yaml
services:
  server:                              # your existing Guardian service
    image: ...

  cockpit:
    build: ./guardian-cockpit          # or use the published image
    ports:
      - "3001:3001"
    environment:
      GUARDIAN_URL: http://server:3000
      GUARDIAN_NODE_NAME: My Node
      GUARDIAN_NETWORK: MidenTestnet
      DOCKER_CONTAINER_NAME: guardian-server-1   # match `docker ps --format '{{.Names}}'`
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro  # for log streaming + container metadata
    depends_on:
      - server
```

The dashboard will stream logs directly from the Guardian container via the Docker API — no log file mount needed.

---

### Running alongside Guardian started with Cargo

If you're running Guardian directly with `cargo run`, start the dashboard as a plain Node.js process on the same machine:

```bash
npm install
cp .env.example .env.local
# Set GUARDIAN_URL to wherever Guardian is listening (default http://localhost:3000)
# Leave DOCKER_CONTAINER_NAME empty
# Optionally redirect Guardian's stdout to a file and set LOG_FILE_PATH
npm run dev        # → http://localhost:3001
```

System metrics (CPU, memory, network) work in both modes. Docker-specific features (container ID, log streaming via Docker API) are only available when the Docker socket is accessible.

---

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Built with Next.js 14 (App Router), Tailwind CSS, shadcn/ui, SWR, Recharts, and `systeminformation`.

---

## Limitations

The Guardian API currently has no endpoint to enumerate accounts registered with a node. Until the upstream adds these, the Accounts and Transactions tabs show mock data:

- `GET /accounts` — list all account IDs on this node
- `GET /accounts/stats` — aggregate signed/rejected/pending counts
- `GET /health` — liveness probe with version, network, uptime
