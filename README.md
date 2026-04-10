# Anansi — Spice Platform

**Real-world asset tokenization for the Caribbean and beyond.**

Spice turns physical commodities, property, and revenue streams into tradeable digital tokens on the Sui blockchain. A farmer in Grenada delivers nutmeg, receives tokens, and can sell them for USDC — all through a Google sign-in, no wallet needed.

**Live:** [anansi-navy.vercel.app](https://anansi-navy.vercel.app)
**By:** Anansi Technology Corporation · Miami, FL

---

## Architecture

```
contracts/
├── core/                          ← Core platform (deploy once, upgradeable)
│   └── sources/
│       ├── asset_pool.move        ← Lots, deliveries, custodians (generic)
│       ├── yield_engine.move      ← Surplus distribution (any Coin<T>)
│       ├── compliance.move        ← KYC registry, freeze, enforcement
│       ├── platform.move          ← Emergency controls
│       ├── carib_coin.move        ← Protocol token (10B fixed supply)
│       └── commodity_registry.move ← Tracks registered commodity packages
│
└── commodities/                   ← One package per asset (independent)
    ├── nutmeg/                    ← Coin<NUTMEG> — Grenada nutmeg
    ├── coffee/                    ← Coin<COFFEE> — Jamaica Blue Mountain
    └── (add more via script)

app/                               ← Next.js application
├── app/
│   ├── page.js                    ← Landing + role selection
│   ├── farmer/page.js             ← Farmer dashboard (multi-token portfolio)
│   ├── buyer/page.js              ← Marketplace (buy any token, live prices)
│   ├── admin/page.js              ← Custodian dashboard (GCNA, CIB, etc.)
│   ├── admin/cetus/page.js        ← DEX pool creation
│   ├── platform/page.js           ← Platform admin (assets, compliance, surplus)
│   └── api/
│       ├── cetus/swap/            ← DEX swap via Cetus SDK
│       ├── cetus/price/           ← Live pool prices (15s cache)
│       └── platform/              ← Admin API routes
├── lib/
│   ├── constants.js               ← Token registry (dynamic from env vars)
│   ├── transactions.js            ← All blockchain transactions
│   ├── data.js                    ← RPC queries
│   ├── auth.js                    ← zkLogin (Google → Sui address)
│   └── admin-signer.js            ← Server-side admin transactions
└── scripts/
    ├── generate-commodity.sh      ← Generate new commodity package
    ├── deploy-core.sh             ← Publish core platform
    └── deploy-commodity.sh        ← Publish + register commodity
```

---

## How It Works

1. **Farmer delivers nutmeg** to GCNA receiving station → gets EC$ advance (unchanged)
2. **GCNA records delivery** in Spice → farmer receives `Coin<NUTMEG>` tokens automatically
3. **Farmer holds tokens** until lot sells → claims surplus USDC pro-rata
4. **Or sells early** on the DEX → swaps NUTMEG for USDC instantly
5. **Investors buy tokens** on the marketplace → get exposure to Caribbean commodities
6. **When GCNA sells the lot** → surplus USDC deposited → all holders claim their share

Zero wallet, zero gas fees (Shinami sponsorship), zero crypto knowledge required.

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

- `PackageID` → `NEXT_PUBLIC_PACKAGE_ID` and `NEXT_PUBLIC_ORIGINAL_PACKAGE_ID`
- `asset_pool::Registry` (Shared) → `NEXT_PUBLIC_REGISTRY_ID`
- `yield_engine::YieldEngine` (Shared) → `NEXT_PUBLIC_YIELD_ENGINE_ID`
- `compliance::ComplianceRegistry` (Shared) → `NEXT_PUBLIC_COMPLIANCE_ID`
- `platform::Platform` (Shared) → `NEXT_PUBLIC_PLATFORM_ID`
- `carib_coin::Treasury` (Owned) → `NEXT_PUBLIC_CARIB_TREASURY_ID`
- `commodity_registry::CommodityRegistry` (Shared) → `NEXT_PUBLIC_COMMODITY_REGISTRY_ID`
- `commodity_registry::CommodityRegistryAdmin` (Owned) → save privately
- `package::UpgradeCap` (Owned) → save privately for future core upgrades

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
2. Create asset type: symbol=NUTMEG, name=Grenada Nutmeg, unit=kg, region=Grenada, custodian=GCNA
3. Sign in as custodian at `/admin` → Create lot → Record delivery
4. Create Cetus pool from `/admin/cetus`
5. Update `NEXT_PUBLIC_TOKEN_CONFIG` with the pool ID
6. Deploy to Vercel: `vercel --prod`

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

From `/platform` dashboard: symbol=COFFEE, name=Jamaica Blue Mountain Coffee, unit=kg, region=Jamaica, custodian=CIB.

### Step 5: Create Cetus pool (enables DEX trading)

Record a test delivery to get some COFFEE tokens, then create a COFFEE/USDC pool from `/admin/cetus`. Update `NEXT_PUBLIC_TOKEN_CONFIG` with the pool ID.

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
NEXT_PUBLIC_CARIB_TREASURY_ID=0x...
NEXT_PUBLIC_COMMODITY_REGISTRY_ID=0x...

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

1. `/platform` → Compliance → Verify a farmer address
2. Compliance → Enable Enforcement
3. Record delivery to verified farmer → succeeds
4. Record delivery to unverified address → fails
5. Freeze the farmer → farmer can't sell or claim
6. Unfreeze → farmer can transact again

---

## Surplus Distribution

Surplus uses a snapshot-based pro-rata model:

1. Admin deposits USDC surplus for a lot, selecting the correct token
2. Contract records total supply of that `Coin<T>` at that moment
3. Any holder can claim: `(my_balance / total_supply) × surplus_pool`
4. Claim is recorded on-chain — each address claims once per deposit
5. If you sold tokens before surplus was deposited, the buyer gets your share

---

## Live Pricing

All token prices come from the Cetus DEX pools in real-time. The `/api/cetus/price` endpoint queries each pool with a 1-token preSwap to get the current exchange rate. Results are cached server-side for 15 seconds. Farmer and buyer pages poll every 30 seconds.

No hardcoded prices anywhere in the app.

---

## Roles

| Role | Access | Auth | Path |
|------|--------|------|------|
| Platform Admin | Create assets, manage compliance, deposit surplus | Password | `/platform` |
| Custodian | Create lots, record deliveries, manage lifecycle | zkLogin (Google) | `/admin` |
| Farmer | View tokens, sell early, claim surplus | zkLogin (Google) | `/farmer` |
| Buyer / Investor | Buy tokens, view portfolio | zkLogin (Google) | `/buyer` |

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

## Key Technical Decisions

- **Separate package per commodity** — Sui's OTW requires `init` for each `Coin<T>`, which doesn't run during upgrades. Each commodity is an independent package.
- **`record_delivery` is `public`** — Safe because `CustodianCap` already authorizes. Enables commodity packages to call core functions across package boundaries.
- **Standard `Coin<T>`** — Trades on any Sui DEX natively.
- **Cetus CLMM SDK** — `createSwapPayload` builds transactions server-side, client signs with zkLogin.
- **npm overrides** `{"@mysten/sui": "2.15.0"}` — Forces single version, prevents SDK type conflicts between our code and Cetus SDK.
- **JSON env var for tokens** — Next.js strips dynamic `process.env` access client-side. Single JSON string is inlined correctly at build time.
- **zkLogin + Shinami** — Zero-wallet, zero-gas UX. Farmers sign in with Google, never see blockchain.
- **CommodityRegistry** — On-chain record of all registered commodity packages for governance and discovery.

---

## License

Proprietary — Anansi Technology Corporation
