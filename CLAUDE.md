# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

Anansi is a commodity tokenization platform for Caribbean RWA products (starting with Grenada nutmeg), built on the Sui blockchain. It mints standard Sui coins (e.g., `Coin<NUTMEG>`) backed by recorded physical deliveries. Farmers receive tokens when deliveries are logged; when a lot sells, pro-rata USDC surplus is claimable. Token holders can also sell early via the Cetus DEX.

The repo has four sub-projects:
- `contracts/` — Sui Move smart contracts
- `app/` — "Spice" farmer/buyer/admin app (Next.js, port 3001)
- `web/` — Public landing site (Next.js, port 3000)
- `indexer/` — Event indexer + REST API (Node.js/Express + SQLite)

## Commands

### Smart Contracts (Sui Move)
```bash
cd contracts
sui move build
sui client publish --gas-budget 100000000          # deploy
sui client upgrade --upgrade-capability <CAP_ID>   # upgrade
```

### Spice App
```bash
cd app
npm run dev     # port 3001
npm run build
```

### Landing Site
```bash
cd web
npm run dev     # port 3000
npm run build
```

### Indexer
```bash
cd indexer
node migrate.js   # run once to create schema
npm run dev       # watch mode
npm start         # production
```

No tests or linters are currently configured.

## Architecture

### Smart Contracts (`contracts/sources/`)

- **`nutmeg.move`** — Defines `Coin<NUTMEG>` (6 decimals). Contains `record_delivery` which mints tokens to farmers. This file is a **template**: to add a new commodity (e.g., cocoa), copy and replace the symbol. No changes to core modules needed.
- **`asset_pool.move`** — Manages lot lifecycle (Created → Verified → Selling → Settled). Delegates minting to commodity modules.
- **`yield_engine.move`** — Pro-rata surplus distribution. Two-type-arg design: admin deposits USDC; farmers prove `Coin<NUTMEG>` holdings to claim. Charges 1% fee, burns 50%, sends 50% to treasury.
- **`compliance.move`** — On-chain KYC/AML whitelist and freeze capability. Checked at delivery and claims.
- **`platform.move`** — Emergency pause and version control.
- **`carib_coin.move`** — Protocol token (10B fixed supply, 9 decimals), tracks burns.

### Spice App (`app/`)

**Auth:** zkLogin only — Google OAuth generates an ephemeral keypair → derives a Sui address. Session state lives in browser storage. See `lib/auth.js`.

**Transactions:** `lib/transactions.js` builds and executes all Sui transactions. Gas is sponsored via Shinami Gas Station (see `app/api/sponsor/`). The only exception is DEX swaps, which require the user to hold USDC.

**Data layer:** `lib/data.js` queries the Sui RPC directly for on-chain state (lots, deliveries, balances, surplus deposits). The indexer is an optional caching layer.

**Contract IDs and type strings** are centralized in `lib/constants.js`. Always update this file after a contract redeploy.

**Role-based pages:**
- `/admin` — Custodians record deliveries, create lots
- `/farmer` — View NUTMEG/USDC balance, claim surplus, sell early
- `/buyer` — Buy NUTMEG with USDC via Cetus
- `/platform` — Create asset types, manage compliance, deposit surplus

**Backend API routes** (`app/api/`):
- `/sponsor`, `/salt`, `/zkproof` — Shinami integrations
- `/cetus/swap` — Quotes and builds swap transactions via Cetus CLMM SDK
- `/ipfs/upload` — Pinata IPFS upload
- `/farmers`, `/lots`, `/asset-types`, `/platform` — Query indexer or RPC

### Indexer (`indexer/`)

Polls Sui RPC for contract events (LotCreated, DeliveryRecorded, SurplusReceived, etc.) and caches them in SQLite (WAL mode). The app can function without the indexer but is slower. `db.js` has all SQLite operations; `migrate.js` defines the schema.

### Key Data Flow

1. Custodian records delivery → contract mints `Coin<NUTMEG>` to farmer
2. Indexer catches `DeliveryRecorded` event → stores in SQLite
3. Farmer views NUTMEG balance (Sui RPC coin query)
4. Lot reaches Selling state → admin deposits USDC into YieldEngine
5. Farmer claims pro-rata share (presents `Coin<NUTMEG>`, receives USDC)
6. Farmer can sell NUTMEG early via Cetus swap

## Environment Variables

Copy `app/.env.example` → `app/.env.local` and `indexer/.env.example` → `indexer/.env`.

Key variables:
- `NEXT_PUBLIC_PACKAGE_ID` and associated object IDs (updated after each deploy)
- `NEXT_PUBLIC_NUTMEG_MINT_VAULT_ID` — shared object for minting
- `SHINAMI_GAS_STATION_KEY`, `SHINAMI_ZKLOGIN_KEY` — Shinami API keys
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — OAuth client ID
- `ADMIN_PRIVATE_KEY` — base64-encoded keypair for backend admin operations
- `PINATA_API_KEY` — for IPFS uploads

Object IDs after a new deployment are recorded in `suitestnet.txt` and must be synced to `.env.local` and `lib/constants.js`.
