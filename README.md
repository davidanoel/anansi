# Anansi Technology Corporation — Monorepo

**Weaving threads of intelligence**

This repository contains the full technical stack for Anansi Technology Corporation:

- **`/contracts`** — Sui Move smart contracts (CaribCoin, Asset Pools, Yield Engine, Compliance)
- **`/web`** — Next.js landing site (anansi.tech, Spice product page, CaribCoin page)
- **`/app`** — Next.js Spice application (GCNA admin, farmer, buyer views)
- **`/indexer`** — Sui event indexer + REST API
- **`/docs`** — Planning documents (blueprint, product spec, economic design)

---

## Prerequisites

- **Node.js** >= 18
- **Sui CLI** — [Install guide](https://docs.sui.io/guides/developer/getting-started/sui-install)
- **Cursor IDE** (recommended)

---

## Quick Start

### 1. Install dependencies

```bash
# From repo root
cd web && npm install && cd ..
cd app && npm install && cd ..
```

### 2. Smart Contracts (Sui Move)

```bash
cd contracts

# Build
sui move build

# Test
sui move test

# Deploy to testnet
sui client switch --env testnet
sui client publish --gas-budget 100000000
```

After publishing, copy the Package ID and update `app/.env.local` (see `.env.example`).

### 3. Landing Site

```bash
cd web
npm run dev
# Open http://localhost:3000
```

### 4. Spice Application

```bash
cd app
cp .env.example .env.local
# Fill in your keys (Google OAuth, Sui RPC, Package ID, Shinami)
npm run dev
# Open http://localhost:3001
```

### 5. Optional: Standalone Indexer (Phase 2)

The app queries the Sui blockchain directly — no indexer needed for MVP.
When you scale to 500+ farmers, deploy the standalone indexer:

```bash
cd indexer
npm install
cp .env.example .env
node migrate.js
npm run dev
# API on http://localhost:4000
```

---

## Environment Setup Checklist

- [ ] Install Sui CLI and create a keypair (`sui client new-address ed25519`)
- [ ] Get testnet SUI from faucet (`sui client faucet`)
- [ ] Create Google Cloud project for zkLogin OAuth
- [ ] Sign up for Shinami (gas station + zkLogin prover)
- [ ] Sign up for Pinata (IPFS pinning)
- [ ] Set up Vercel project for web deployment

---

## Architecture

```
                    ┌──────────────┐
                    │   web/       │  Landing pages (Vercel)
                    │   Next.js    │  anansi.tech
                    └──────────────┘

                    ┌──────────────┐
  Users ──────────► │   app/       │  Spice application (Vercel)
  (zkLogin)         │   Next.js    │  Admin / Farmer / Buyer views
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌──────────────┐ ┌────────┐ ┌──────────────┐
     │  contracts/  │ │ IPFS   │ │ Sui RPC      │
     │  Sui Move    │ │(Pinata)│ │ (data layer) │
     │  on-chain    │ │        │ │              │
     └──────────────┘ └────────┘ └──────────────┘
```

The app queries the Sui blockchain directly via RPC — no separate indexer or database
needed for MVP. The `indexer/` directory contains a standalone event indexer for
Phase 2 scaling (500+ farmers, 10+ islands) when RPC queries become slow.

---

*Anansi Technology Corporation — Caribbean intelligence, global reach.*
