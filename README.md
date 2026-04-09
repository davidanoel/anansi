# Anansi Final Architecture Update

## Architecture: Standard Coin<NUTMEG> + DEX Integration

This update converts SpiceToken (custom object) to Coin<NUTMEG> (standard Sui coin).
NUTMEG trades on any DEX natively. Adding new commodities = copy one 20-line template file.

## WHAT CHANGED

### Contracts (FULL REDEPLOY REQUIRED)

1. `asset_pool.move` — record_delivery now takes coin_amount parameter for decimal tracking.
   No longer creates SpiceToken. Commodity modules handle minting.

2. `nutmeg.move` — NEW. Template coin module. Creates Coin<NUTMEG> with 6 decimals.
   MintVault (shared) holds TreasuryCap. record_delivery mints coins to farmer.

3. `yield_engine.move` — deposit_surplus now takes total_commodity_supply parameter.
   Correct pro-rata math with fungible coins across multiple lots.

4. `marketplace.move` — DELETED. Using DEX (Cetus) instead.

5. `compliance.move`, `platform.move`, `carib_coin.move` — UNCHANGED (keep your existing files)

### JS Files

- `lib/constants.js` — Added NUTMEG_TYPE, NUTMEG_DECIMALS, NUTMEG_MINT_VAULT_ID
- `lib/transactions.js` — Calls nutmeg::record_delivery, two-type-arg claim_surplus, DEX swap stubs
- `lib/data.js` — getNutmegBalance() replaces getTokenPortfolio(), getAllSurplusDeposits()
- `lib/admin-signer.js` — Reads MintVault total supply before surplus deposit
- `pages/farmer/page.js` — Coin balance display, Sell Early UI, surplus claims
- `pages/buyer/page.js` — Buy NUTMEG with USDC UI

## DEPLOYMENT STEPS

### Step 1: Update Contract Sources

Copy these files to your `contracts/sources/` directory:

- `contracts/sources/asset_pool.move` → REPLACE existing
- `contracts/sources/nutmeg.move` → NEW FILE
- `contracts/sources/yield_engine.move` → REPLACE existing
- DELETE `contracts/sources/marketplace.move` if it exists

Keep these UNCHANGED:

- `contracts/sources/compliance.move`
- `contracts/sources/platform.move`
- `contracts/sources/carib_coin.move`

### Step 2: Build and Deploy

```bash
cd contracts
rm move.lock
sui move build
sui client publish --gas-budget 100000000
```

### Step 3: Extract Object IDs from Deploy Output

From the publish output, find these objects:

```
PACKAGE_ID           = PackageID from "Published Objects"
REGISTRY_ID          = asset_pool::Registry (Shared)
YIELD_ENGINE_ID      = yield_engine::YieldEngine (Shared)
COMPLIANCE_ID        = compliance::ComplianceRegistry (Shared)
PLATFORM_ID          = platform::Platform (Shared)
CARIB_TREASURY_ID    = carib_coin::Treasury (Account-owned)
NUTMEG_MINT_VAULT_ID = nutmeg::MintVault (Shared)  ← NEW
UPGRADE_CAP          = package::UpgradeCap (Account-owned)
```

### Step 4: Update .env.local

```
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=/api/sui-rpc
SUI_RPC_URL=https://fullnode.testnet.sui.io/

NEXT_PUBLIC_PACKAGE_ID=<new package id>
NEXT_PUBLIC_ORIGINAL_PACKAGE_ID=<same as PACKAGE_ID after fresh deploy>
NEXT_PUBLIC_REGISTRY_ID=<from deploy>
NEXT_PUBLIC_YIELD_ENGINE_ID=<from deploy>
NEXT_PUBLIC_COMPLIANCE_ID=<from deploy>
NEXT_PUBLIC_PLATFORM_ID=<from deploy>
NEXT_PUBLIC_CARIB_TREASURY_ID=<from deploy>
NEXT_PUBLIC_NUTMEG_MINT_VAULT_ID=<from deploy - NEW>

NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your google client id>
NEXT_PUBLIC_REDIRECT_URL=http://localhost:3001/auth/callback

SHINAMI_GAS_STATION_KEY=<your key>
SHINAMI_ZKLOGIN_KEY=<your key>

ADMIN_PRIVATE_KEY=<base64 from sui keytool export>
PLATFORM_ADMIN_KEY=<any password>
```

### Step 5: Update JS Files

Copy from this package to your app/ directory:

| Package path                  | Copy to                                |
| ----------------------------- | -------------------------------------- |
| lib/constants.js              | app/lib/constants.js (REPLACE)         |
| lib/transactions.js           | app/lib/transactions.js (REPLACE)      |
| lib/data.js                   | app/lib/data.js (REPLACE)              |
| lib/admin-signer.js           | app/lib/admin-signer.js (REPLACE)      |
| api/sui-rpc/route.js          | app/app/api/sui-rpc/route.js (REPLACE) |
| api/platform/deposit/route.js | app/app/api/platform/deposit/route.js  |
| pages/farmer/page.js          | app/app/farmer/page.js (REPLACE)       |
| pages/buyer/page.js           | app/app/buyer/page.js (REPLACE)        |

DO NOT OVERWRITE:

- app/lib/auth.js
- app/app/auth/callback/page.js
- app/app/api/salt/route.js
- app/app/api/zkproof/route.js
- app/app/api/sponsor/route.js
- app/app/platform/page.js (add Deposits tab manually)

### Step 6: Restart and Test

```bash
cd app
rm -rf .next
npm run dev
```

## E2E TEST SEQUENCE

1. Platform admin: /platform → Create NUTMEG → assign custodian
2. Custodian: Create lot → Record delivery (100kg to farmer)
3. Farmer: Sign in → see NUTMEG balance (100.000000 NUTMEG)
4. Custodian: Mark lot as Selling → Start Distribution
5. Platform admin: /platform → Surplus Deposits → deposit 10 USDC for lot
6. Farmer: See "Available Surplus" → click Claim → receive USDC
7. Farmer: "Sell Early" → (will show DEX not configured until Cetus pool created)

## ADDING NEW COMMODITIES

To add cocoa:

1. Copy `nutmeg.move` → `cocoa.move`
2. Find-replace: NUTMEG → COCOA, "Grenada Nutmeg" → "Grenada Cocoa", etc.
3. `sui client upgrade --upgrade-capability UPGRADE_CAP --gas-budget 100000000`
4. Add NEXT_PUBLIC_COCOA_MINT_VAULT_ID to .env.local
5. Create COCOA asset type from /platform
6. Create Cetus COCOA/USDC pool

Total time: ~30 minutes.

## DEX INTEGRATION (NEXT STEP)

After deploying Coin<NUTMEG>:

1. Create NUTMEG/USDC pool on Cetus testnet
2. Seed initial liquidity (admin sends NUTMEG + USDC to pool)
3. Install Cetus SDK: `npm install @cetus-clmm/sui-clmm-sdk`
4. Wire sellNutmeg() and buyNutmeg() in transactions.js to Cetus router
5. "Sell Early" and "Buy" buttons work via DEX swap

## COMPLIANCE ENFORCEMENT

1. Deploy contracts, update env vars
2. Platform admin: Create NUTMEG asset type, assign custodian
3. Platform admin: Compliance tab → Verify the farmer address (jurisdiction: GD, role: Farmer)
4. Platform admin: Compliance tab → Enable Enforcement
5. Custodian: Create lot, record delivery to the verified farmer → should SUCCEED
6. Try recording delivery to an UNVERIFIED address → should FAIL with compliance error
7. Platform admin: Freeze the farmer
8. Farmer: Try "Sell Early" → should FAIL (swap route rejects)
9. Farmer: Try "Claim Surplus" → should FAIL (on-chain compliance check)
10. Platform admin: Unfreeze the farmer
11. Farmer: Try again → should SUCCEED

# Multi-Asset Update

Makes the Spice platform fully multi-asset. Adding a new commodity (cocoa,
coffee, villas, rum, etc.) requires zero code changes to the app.

## How it works

The app discovers tokens from environment variables:

```env
NEXT_PUBLIC_REGISTERED_TOKENS=NUTMEG,COCOA,COFFEE
NEXT_PUBLIC_TOKEN_NUTMEG_MINT_VAULT=0x...
NEXT_PUBLIC_TOKEN_NUTMEG_POOL=0x...
NEXT_PUBLIC_TOKEN_COCOA_MINT_VAULT=0x...
NEXT_PUBLIC_TOKEN_COCOA_POOL=0x...
NEXT_PUBLIC_TOKEN_COFFEE_MINT_VAULT=0x...
NEXT_PUBLIC_TOKEN_COFFEE_POOL=0x...
```

Convention: Symbol `COCOA` → Move module `cocoa` → coin type `PACKAGE::cocoa::COCOA`

## Adding a new commodity (end-to-end)

### Step 1: Generate the Move module

```bash
chmod +x scripts/generate-commodity.sh
./scripts/generate-commodity.sh COCOA "Grenada Cocoa"
cp cocoa.move contracts/sources/
```

### Step 2: Deploy

```bash
cd contracts && rm Move.lock && sui move build
sui client upgrade --upgrade-capability 0xYOUR_UPGRADE_CAP --gas-budget 100000000
```

### Step 3: Add env vars

```env
NEXT_PUBLIC_REGISTERED_TOKENS=NUTMEG,COCOA    # Add to list
NEXT_PUBLIC_TOKEN_COCOA_MINT_VAULT=0x...      # MintVault from deploy
NEXT_PUBLIC_TOKEN_COCOA_POOL=                  # Empty until pool created
```

### Step 4: Create asset type (from /platform dashboard)

- Symbol: COCOA
- Name: Grenada Cocoa
- Unit: kg
- Region: Grenada
- Custodian: GCA
- Custodian Address: 0x... (their zkLogin address)

### Step 5: Create Cetus pool (from /admin/cetus)

After recording a delivery (to get some COCOA tokens), create and seed
the COCOA/USDC pool. Update the env var:

```env
NEXT_PUBLIC_TOKEN_COCOA_POOL=0x...
```

### Step 6: Done

- Farmers see COCOA tokens in their portfolio
- Buyers can buy COCOA on the marketplace
- Sellers can sell COCOA for USDC
- All surplus claims work automatically

## Env var migration

Your existing NUTMEG env vars still work. Just add:

```env
NEXT_PUBLIC_REGISTERED_TOKENS=NUTMEG
NEXT_PUBLIC_TOKEN_NUTMEG_MINT_VAULT=<your existing NUTMEG_MINT_VAULT_ID>
NEXT_PUBLIC_TOKEN_NUTMEG_POOL=<your existing CETUS_NUTMEG_POOL_ID>
```

The old `NEXT_PUBLIC_NUTMEG_MINT_VAULT_ID` and `NEXT_PUBLIC_CETUS_NUTMEG_POOL_ID`
are still read as fallbacks for backward compatibility.

## Example commodities

```bash
# Agriculture
./scripts/generate-commodity.sh NUTMEG "Grenada Nutmeg"
./scripts/generate-commodity.sh COCOA "Grenada Cocoa"
./scripts/generate-commodity.sh MACE "Grenada Mace"
./scripts/generate-commodity.sh COFFEE "Jamaica Blue Mountain Coffee"
./scripts/generate-commodity.sh IDNUT "Indonesian Nutmeg"

# Real Estate
./scripts/generate-commodity.sh VILLA "Antigua Villa Share" "Fractional ownership of Antiguan luxury villas."

# Revenue Streams
./scripts/generate-commodity.sh RUM "Barbados Rum Revenue" "Tokenized revenue from Barbados rum distillery."
```
