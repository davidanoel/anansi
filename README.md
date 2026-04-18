# Anansi — Spice Platform

**Real-world asset tokenization for the Caribbean and beyond.**

Spice turns physical commodities, property, and revenue streams into tradeable digital tokens on the Sui blockchain. A farmer in Grenada delivers nutmeg, receives tokens, and can sell them for USDC — all through a Google sign-in, no wallet needed.

CaribCoin (CARIB) is the protocol token that powers fees, staking, and governance across all Anansi products. Every surplus distribution generates a small fee that is auto-converted to CARIB — half burned, half routed to the Foundation treasury.

**Live:** [anansi-navy.vercel.app](https://anansi-navy.vercel.app)
**By:** Anansi Technology Corporation · Miami, FL

---

## Architecture

```
contracts/
├── core/                           ← Core platform (deploy once, upgradeable)
│   └── sources/
│       ├── asset_pool.move         ← Lots, deliveries, custodians (generic)
│       ├── yield_engine.move       ← Surplus distribution (any Coin<T>)
│       ├── compliance.move         ← KYC registry, freeze, enforcement
│       ├── platform.move           ← Emergency controls
│       ├── carib_coin.move         ← Protocol token (10B fixed supply)
│       ├── commodity_registry.move ← Tracks registered commodity packages
│       ├── fee_converter.move      ← Burn/treasury split for all fee routing
│       └── staking.move            ← No-lockup staking, 24h cooldown, 4 tiers
│
└── commodities/                    ← One package per asset (independent)
    ├── nutmeg/                     ← Coin<NUTMEG> — Grenada nutmeg
    ├── coffee/                     ← Coin<COFFEE> — Jamaica Blue Mountain
    ├── cocoa/                      ← Coin<COCOA> — Grenada cocoa
    └── (add more via script)

app/                                ← Next.js application
├── app/
│   ├── page.js                     ← Landing + role selection
│   ├── farmer/page.js              ← Farmer dashboard (multi-token portfolio)
│   ├── buyer/page.js               ← Marketplace (buy any token, live prices)
│   ├── admin/page.js               ← Custodian dashboard (GCNA, CIB, etc.)
│   ├── platform/page.js            ← Platform admin (tabbed UI — see below)
│   ├── stake/page.js               ← CARIB staking (stake / unstake / cooldown)
│   └── api/
│       ├── cetus/
│       │   ├── create/             ← Create a Cetus CLMM pool
│       │   ├── add/                ← Add liquidity
│       │   ├── remove/             ← Remove liquidity
│       │   ├── swap/               ← DEX swap via Cetus SDK
│       │   └── price/              ← Live pool prices (15s cache)
│       └── platform/
│           ├── asset-types/        ← Create/deactivate/reactivate asset types
│           ├── custodians/         ← Issue/revoke custodian caps
│           ├── compliance/         ← Verify/freeze/unfreeze users, toggle enforcement
│           ├── deposit/            ← Deposit surplus (triggers fee conversion)
│           ├── treasury/           ← CaribCoin treasury controls (burn rate, receiver)
│           ├── staking/            ← Staking config (cooldown, tier thresholds)
│           ├── analytics/          ← Platform analytics (proxies indexer)
│           └── stats/              ← Protocol aggregate stats
│
├── lib/
│   ├── constants.js                ← Token registry + coin types (dynamic from env)
│   ├── transactions.js             ← Client-side transactions (zkLogin + sponsored)
│   ├── staking-transactions.js     ← Stake / unstake / withdraw flows
│   ├── staking-data.js             ← Stake position reads, tier computation
│   ├── data.js                     ← RPC queries (lots, portfolios, balances)
│   ├── admin-signer.js             ← Server-side admin transactions
│   ├── auth.js                     ← zkLogin (Google → Sui address)
│   ├── platform-auth.js            ← Platform admin password check
│   ├── indexer-api.js              ← Indexer client (analytics, event queries)
│   ├── ipfs.js                     ← Pinata helper (warehouse receipts)
│   └── sui.js                      ← Sui client + config
│
├── components/
│   ├── AppNav.js                   ← Top nav (shared across zkLogin pages)
│   ├── AuthProvider.js             ← zkLogin state + callbacks
│   └── PlatformAnalyticsPanel.js   ← Analytics tab contents
│
└── scripts/
    ├── generate-commodity.sh       ← Generate new commodity package
    ├── deploy-core.sh              ← Publish core platform
    └── deploy-commodity.sh         ← Publish + register commodity

indexer/                            ← Postgres-backed event indexer (optional)
├── index.js                        ← Sui event listener → DB writer
├── config.js                       ← Indexer config
├── db.js                           ← Postgres connection
├── migrate.js                      ← Schema migrations
└── docker-compose.yml              ← Local Postgres setup
```

---

## How It Works

1. **Farmer delivers nutmeg** to GCNA receiving station → gets EC$ advance (unchanged)
2. **GCNA records delivery** in Spice → farmer receives `Coin<NUTMEG>` tokens automatically
3. **Farmer holds tokens** until lot sells → claims surplus USDC pro-rata
4. **Or sells early** on the DEX → swaps NUTMEG for USDC instantly
5. **Investors buy tokens** on the marketplace → get exposure to Caribbean commodities
6. **When GCNA sells the lot** → surplus USDC deposited → all holders claim their share
7. **Every surplus deposit generates a 1% fee** → auto-converted to CARIB → half burned, half to Foundation treasury

Zero wallet, zero gas fees (Shinami sponsorship), zero crypto knowledge required.

---

## CaribCoin (CARIB)

CARIB is the protocol token. Fixed supply of 10 billion, 9 decimals, no inflation. It powers fees, staking, governance, and access across all Anansi products.

### Fee conversion flow

Every Anansi product that generates fees routes them through `fee_converter`. The current flow for Spice surplus:

1. **TX1 — `yield_engine::deposit_surplus`** — farmer-claimable surplus is deposited; the fee (default 1%) is extracted and returned to the admin wallet as `Coin<USDC>`
2. **TX2 — Cetus swap + `fee_converter::process_fee`** — the fee USDC is swapped to CARIB via Cetus CLMM, then split by `burn_bps` (default 50/50). The burn portion is permanently destroyed; the remainder goes to the Foundation treasury address.

The two-tx flow exists because the Cetus CLMM SDK (testnet path) builds complete standalone transactions rather than chainable PTBs. On mainnet, the Aggregator SDK can compose the full flow into a single atomic PTB. The `fee_converter` module is identical in both paths.

**Idempotency:** TX2 operates on specific coin object IDs captured from TX1's result (not a wallet-wide scan). If TX2 fails, the fee coin sits at a known object ID in the admin wallet and can be recovered via `adminConvertSpecificUsdcCoin(coinId)`. No user funds are ever at risk between the two transactions — both are signed by the same admin wallet.

See `docs/caribcoin_economic_design_v2.md` for the full economic model.

### Staking

Participation-based, not yield-based:

- Stake any amount of CARIB, any time, with no lock period
- Benefits activate immediately
- Unstaking requires a 24-hour cooldown before withdrawal (governable, bounded 12–72h)
- Cooldown exists solely to prevent flash-loan attacks on governance and priority access
- **The protocol pays zero yield.** Any returns in the ecosystem come from external market activity (DEX LP fees, Foundation-funded liquidity incentives, third-party staking services)
- No slashing, no penalties — users retain full control of their tokens

Four benefit tiers (thresholds governable):

| Tier | Stake | Benefit |
|---|---|---|
| 1 | 1,000+ CARIB | Governance voting (1 CARIB = 1 vote) |
| 2 | 5,000+ CARIB | Premium features (analytics, API) |
| 3 | 10,000+ CARIB | Up to 50% platform fee reduction |
| 4 | 50,000+ CARIB | 24h priority access to new asset pools |

Tiers are read by product contracts via `staking::has_fee_reduction(position, config)` etc. Fee reductions are not yet enforced in `yield_engine` — this is a Phase 2 enhancement.

---

## Why Separate Packages

Sui's One-Time Witness (OTW) pattern requires `init` to create each `Coin<T>`. But `init` for new modules doesn't execute during package upgrades. This means you can't add new coin types by upgrading an existing package.

The solution: each commodity is its own package. Core platform logic lives in one upgradeable package. Commodity packages depend on core and are published independently.

- Core package is upgradeable — fix bugs, add features without breaking anything
- Commodity packages are immutable after publish — the coin type is permanent
- `asset_pool::record_delivery` is `public` (not `public(package)`) so commodity packages can call it
- `CustodianCap` provides authorization — only custodians can record deliveries, regardless of which package calls the function

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Sui (Move) |
| Auth | zkLogin (Google OAuth → Sui address) |
| Gas | Shinami Gas Station (sponsored transactions) |
| DEX | Cetus Protocol CLMM |
| Frontend | Next.js 14 + Tailwind |
| Indexer | Node.js + Postgres (optional, for analytics) |
| Hosting | Vercel |
| IPFS | Pinata (warehouse receipts) |

---

## Initial Deployment

### Step 1: Deploy Core

```bash
cd scripts
chmod +x deploy-core.sh deploy-commodity.sh generate-commodity.sh
./deploy-core.sh
```

Save all object IDs from the output:

**Shared objects (referenced in Move calls):**
- `PackageID` → `NEXT_PUBLIC_PACKAGE_ID` and `NEXT_PUBLIC_ORIGINAL_PACKAGE_ID`
- `asset_pool::Registry` → `NEXT_PUBLIC_REGISTRY_ID`
- `yield_engine::YieldEngine` → `NEXT_PUBLIC_YIELD_ENGINE_ID`
- `compliance::ComplianceRegistry` → `NEXT_PUBLIC_COMPLIANCE_ID`
- `platform::Platform` → `NEXT_PUBLIC_PLATFORM_ID`
- `commodity_registry::CommodityRegistry` → `NEXT_PUBLIC_COMMODITY_REGISTRY_ID`
- `fee_converter::FeeConverter` → `NEXT_PUBLIC_FEE_CONVERTER_ID`
- `staking::StakingConfig` → `NEXT_PUBLIC_STAKING_CONFIG_ID`

**Admin-owned capabilities (queried dynamically; save privately):**
- `asset_pool::RegistryAdmin`
- `compliance::ComplianceAdmin`
- `yield_engine::YieldAdmin`
- `fee_converter::FeeConverterAdmin`
- `staking::StakingAdmin`
- `commodity_registry::CommodityRegistryAdmin`
- `carib_coin::AdminCap`
- `carib_coin::Treasury` → `NEXT_PUBLIC_CARIB_TREASURY_ID`
- `platform::SuperAdmin`
- `package::UpgradeCap` → save privately for future core upgrades

**Coin type:**
- `NEXT_PUBLIC_CARIB_TYPE` = `<PACKAGE_ID>::carib_coin::CARIB_COIN`

> **Note:** Each republish of the core package (not upgrade) creates new shared object IDs. All env vars must be re-synced from the new deploy transaction. Use `sui client tx-block <PUBLISH_DIGEST> --json` to extract object IDs from the publish tx.

### Step 2: Deploy Nutmeg

```bash
export CORE_PACKAGE_ID=0x_FROM_STEP_1
export COMMODITY_REGISTRY_ID=0x_FROM_STEP_1
export COMMODITY_REGISTRY_ADMIN_ID=0x_FROM_STEP_1

./deploy-commodity.sh nutmeg
```

The script publishes the nutmeg package, extracts the MintVault ID, and registers it in the CommodityRegistry.

### Step 3: Configure Environment

```bash
cd app
cp .env.example .env.local
```

Fill in all values. See **Environment Variables** section below.

### Step 4: Run the App

```bash
npm install
npm run dev
```

### Step 5: Initial Setup (from the running app)

1. Go to `/platform` → sign in with your admin password
2. **Assets tab** → Create asset type: symbol=NUTMEG, name=Grenada Nutmeg, unit=kg, region=Grenada, custodian=GCNA
3. Sign in as custodian at `/admin` → Create lot → Record delivery
4. **DEX tab** → Create Cetus pool for NUTMEG/USDC (and optionally CARIB/USDC)
5. Update `NEXT_PUBLIC_TOKEN_CONFIG` with the pool IDs
6. **Treasury tab** → Set treasury receiver address (e.g., Foundation multi-sig)
7. **Staking tab** → Verify cooldown and tier thresholds (defaults are sensible)
8. Deploy to Vercel: `vercel --prod`

---

## Platform Admin Dashboard

`/platform` is a password-protected tabbed interface for protocol operations:

| Tab | Purpose |
|---|---|
| **Assets** | Create / deactivate / reactivate asset types |
| **Custodians** | Issue and revoke custodian capabilities |
| **Compliance** | KYC registry, user freeze/unfreeze, enforcement toggle |
| **Deposits** | Deposit surplus for lots (auto-triggers fee conversion flow) |
| **DEX** | Create Cetus pools, manage liquidity |
| **Treasury** | CaribCoin burn rate (bps), treasury receiver address, cumulative burn stats |
| **Staking** | Cooldown duration, tier thresholds, aggregate staking stats |
| **Analytics** | Usage dashboards (powered by the indexer) |
| **Overview** | High-level protocol stats |

---

## Adding a New Commodity

Adding a new real-world asset requires **zero code changes** to the app.

### Step 1: Generate the package

```bash
cd scripts
./generate-commodity.sh COFFEE "Jamaica Blue Mountain Coffee"
```

Creates `contracts/commodities/coffee/` with `Move.toml` and `sources/coffee.move`.

### Step 2: Deploy

```bash
./deploy-commodity.sh coffee
```

Publishes the package and registers it in the CommodityRegistry.

### Step 3: Update env vars

Add COFFEE to `NEXT_PUBLIC_REGISTERED_TOKENS` and `NEXT_PUBLIC_TOKEN_CONFIG`:

```env
NEXT_PUBLIC_REGISTERED_TOKENS=NUTMEG,COFFEE
NEXT_PUBLIC_TOKEN_CONFIG={"NUTMEG":{"packageId":"0x...","mintVault":"0x...","pool":"0x..."},"COFFEE":{"packageId":"0x...","mintVault":"0x...","pool":""}}
```

### Step 4: Create asset type

From `/platform` → Assets tab: symbol=COFFEE, name=Jamaica Blue Mountain Coffee, unit=kg, region=Jamaica, custodian=CIB.

### Step 5: Create Cetus pool (enables DEX trading)

Record a test delivery to get some COFFEE tokens, then create a COFFEE/USDC pool from `/platform` → DEX tab. Update `NEXT_PUBLIC_TOKEN_CONFIG` with the pool ID.

### Step 6: Done

Farmers see COFFEE in their portfolio. Buyers can buy COFFEE on the marketplace. Surplus claims work automatically. **Total time: ~30 minutes per commodity.**

### Example commodities

```bash
# Agriculture
./generate-commodity.sh NUTMEG "Grenada Nutmeg"
./generate-commodity.sh COCOA "Grenada Cocoa"
./generate-commodity.sh MACE "Grenada Mace"
./generate-commodity.sh COFFEE "Jamaica Blue Mountain Coffee"
./generate-commodity.sh IDNUT "Indonesian Nutmeg"

# Real Estate
./generate-commodity.sh VILLA "Antigua Villa Share" "Fractional ownership of Antiguan luxury villas."

# Revenue Streams
./generate-commodity.sh RUM "Barbados Rum Revenue" "Tokenized revenue from Barbados rum distillery."
```

The platform doesn't care what the asset is. The same lot/delivery/surplus contracts handle agricultural commodities, real estate shares, and revenue streams. Only the token symbol and custodian differ.

---

## Token Configuration

Tokens are configured via two environment variables:

```env
NEXT_PUBLIC_REGISTERED_TOKENS=NUTMEG,COFFEE
NEXT_PUBLIC_TOKEN_CONFIG={"NUTMEG":{"packageId":"0x...","mintVault":"0x...","pool":"0x..."},"COFFEE":{"packageId":"0x...","mintVault":"0x...","pool":""}}
```

### Token config format

```json
{
  "SYMBOL": {
    "packageId": "0x...",
    "mintVault": "0x...",
    "pool": "0x..."
  }
}
```

- `packageId` — the commodity's own package ID (not core)
- `mintVault` — MintVault shared object ID (from commodity deploy)
- `pool` — Cetus DEX pool ID (optional — omit until pool exists)

If `pool` is empty or omitted, the token won't appear in the marketplace but can still be minted via deliveries and held by farmers.

**⚠️ Important:** Token config MUST be a single JSON env var. Next.js does not support dynamic `process.env` access on the client side — expressions like `` process.env[`NEXT_PUBLIC_TOKEN_${symbol}_POOL`] `` get stripped at build time. The single JSON string is inlined correctly.

---

## Environment Variables

### .env.local (full reference)

```env
# Sui Network
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=/api/sui-rpc
SUI_RPC_URL=https://fullnode.testnet.sui.io/

# Core contract IDs (from deploy-core.sh)
NEXT_PUBLIC_PACKAGE_ID=0x...
NEXT_PUBLIC_ORIGINAL_PACKAGE_ID=0x...
NEXT_PUBLIC_REGISTRY_ID=0x...
NEXT_PUBLIC_YIELD_ENGINE_ID=0x...
NEXT_PUBLIC_COMPLIANCE_ID=0x...
NEXT_PUBLIC_PLATFORM_ID=0x...
NEXT_PUBLIC_COMMODITY_REGISTRY_ID=0x...

# CaribCoin
NEXT_PUBLIC_CARIB_TYPE=0x<pkg>::carib_coin::CARIB_COIN
NEXT_PUBLIC_CARIB_TREASURY_ID=0x...
NEXT_PUBLIC_CARIB_POOL_ID=0x...        # CARIB/USDC Cetus pool (set after pool creation)
NEXT_PUBLIC_FEE_CONVERTER_ID=0x...
NEXT_PUBLIC_STAKING_CONFIG_ID=0x...

# Token Registry (multi-asset — each commodity has its own packageId)
NEXT_PUBLIC_REGISTERED_TOKENS=NUTMEG
NEXT_PUBLIC_TOKEN_CONFIG={"NUTMEG":{"packageId":"0x...","mintVault":"0x...","pool":"0x..."}}

# Google OAuth (zkLogin)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
NEXT_PUBLIC_REDIRECT_URL=http://localhost:3001/auth/callback

# Shinami (server-side only)
SHINAMI_GAS_STATION_KEY=your_key
SHINAMI_ZKLOGIN_KEY=your_key

# Platform Admin (server-side only)
ADMIN_PRIVATE_KEY=base64_private_key
PLATFORM_ADMIN_KEY=your_admin_password

# Indexer (optional — enables analytics tab)
INDEXER_URL=http://localhost:4000
INDEXER_API_KEY=your_key

# IPFS / Pinata (optional)
PINATA_JWT=your_jwt
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
```

---

## Compliance

The compliance module provides on-chain KYC enforcement.

### On-chain enforcement

`record_delivery` and `claim_surplus` both take `&ComplianceRegistry` and call `assert_can_participate`. When enforcement is enabled, only verified non-frozen addresses can receive tokens or claim surplus.

### Server-side enforcement

The `/api/cetus/swap` route queries the compliance registry and rejects frozen/unverified users. This covers DEX swaps which go through Cetus contracts (not ours).

### Testing

1. `/platform` → Compliance tab → Verify a farmer address
2. Compliance → Enable Enforcement
3. Record delivery to verified farmer → succeeds
4. Record delivery to unverified address → fails
5. Freeze the farmer → farmer can't sell or claim
6. Unfreeze → farmer can transact again

---

## Surplus Distribution

Surplus uses a snapshot-based pro-rata model:

1. Admin deposits USDC surplus for a lot, selecting the correct token (from `/platform` → Deposits)
2. Contract records total supply of that `Coin<T>` at that moment
3. Any holder can claim: `(my_balance / total_supply) × surplus_pool`
4. Claim is recorded on-chain — each address claims once per deposit
5. If you sold tokens before surplus was deposited, the buyer gets your share

**A 1% fee is automatically extracted** during the deposit, swapped to CARIB, and split 50/50 between burn and treasury. See the **CaribCoin** section for the full fee flow.

---

## Live Pricing

All token prices come from the Cetus DEX pools in real-time. The `/api/cetus/price` endpoint queries each pool with a 1-token preSwap to get the current exchange rate. Results are cached server-side for 15 seconds. Farmer and buyer pages poll every 30 seconds.

No hardcoded prices anywhere in the app.

---

## Roles

| Role | Access | Auth | Path |
|------|--------|------|------|
| Platform Admin | Assets, compliance, surplus, treasury, staking config | Password | `/platform` |
| Custodian | Create lots, record deliveries, manage lifecycle | zkLogin (Google) | `/admin` |
| Farmer | View tokens, sell early, claim surplus | zkLogin (Google) | `/farmer` |
| Buyer / Investor | Buy tokens, view portfolio | zkLogin (Google) | `/buyer` |
| Any user | Stake CARIB, view tiers, unstake with cooldown | zkLogin (Google) | `/stake` |

---

## Asset Types

The same contracts handle every asset type. Only the business process differs.

| Asset Type | Lot = | Delivery = | Surplus = |
|---|---|---|---|
| Nutmeg, Cocoa, Coffee | Physical batch | Farmer delivers commodity | Sale proceeds minus advance |
| Villa, Hotel | The property | Initial token minting | Rental income |
| Rum revenue, Tourism | Revenue period (quarterly) | Token issuance per period | Revenue share |
| Foreign commodity | Physical batch | Same as local | Same |

---

## Indexer (optional)

The `indexer/` directory contains a Node.js service that listens to Sui events and writes them to Postgres. It powers the Analytics tab in the platform dashboard and provides fast querying for dashboards/reports that would be slow via direct RPC.

```bash
cd indexer
docker-compose up -d    # starts Postgres
npm install
npm run migrate         # create schema
npm start               # start the listener
```

The app's `/api/platform/analytics/*` routes proxy to this indexer. The indexer is optional — skip it and the Analytics tab will be empty, but everything else continues to work.

---

## Key Technical Decisions

- **Separate package per commodity** — Sui's OTW requires `init` for each `Coin<T>`, which doesn't run during upgrades. Each commodity is an independent package.
- **`record_delivery` is `public`** — Safe because `CustodianCap` already authorizes. Enables commodity packages to call core functions across package boundaries.
- **Standard `Coin<T>`** — Trades on any Sui DEX natively.
- **Cetus CLMM SDK** — `createSwapPayload` builds transactions server-side, client signs with zkLogin.
- **Two-tx fee conversion on testnet** — Cetus Aggregator SDK is mainnet-only for reliable multi-provider routing. The two-tx path is safe (admin-only signing), idempotent (tracks specific coin IDs), and will be replaced with a single-PTB atomic flow on mainnet. The `fee_converter` module is identical in both paths.
- **u128 intermediate math in `fee_converter`** — Prevents u64 overflow when multiplying large CARIB amounts by `burn_bps`. Without this, fees above ~1.8M CARIB would abort with `MovePrimitiveRuntimeError`.
- **Admin wallet hygiene** — Fee-conversion TX2 operates on specific coin IDs captured from TX1, never a wallet-wide scan. The admin wallet can hold unrelated USDC safely.
- **npm overrides** `{"@mysten/sui": "2.15.0"}` — Forces single version, prevents SDK type conflicts between our code and Cetus SDK.
- **JSON env var for tokens** — Next.js strips dynamic `process.env` access client-side. Single JSON string is inlined correctly at build time.
- **zkLogin + Shinami** — Zero-wallet, zero-gas UX. Farmers sign in with Google, never see blockchain.
- **CommodityRegistry** — On-chain record of all registered commodity packages for governance and discovery.
- **Staking is non-custodial and non-yielding** — Positions are owned objects, not held in a pool. No slashing, no penalties. The 24h cooldown exists solely to prevent flash-loan attacks on governance and priority access.

---

## License

Proprietary — Anansi Technology Corporation
