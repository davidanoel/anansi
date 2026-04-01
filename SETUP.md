# Anansi — Setup Guide

**Getting the project running locally in Cursor**

This guide assumes: macOS or Linux, Node.js >= 18, Cursor IDE.

---

## Step 1: Install Sui CLI

```bash
# Install Rust (required for Sui CLI)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Sui CLI - recommended manager
curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/MystenLabs/suiup/main/install.sh | sh
source ~/.bashrc   # or ~/.zshrc
suiup install sui

# Verify
sui --version

# Create a new address
sui client new-address ed25519

# Switch to testnet
sui client switch --env testnet

# Get testnet SUI from faucet
sui client faucet
OR
https://faucet.sui.io/?network=testnet&address=<YOUR_SUI_TEST_ADDRESS>
```

---

## Step 2: Deploy Smart Contracts

```bash
cd contracts

# Build
sui move build

# If build succeeds, deploy to testnet
sui client publish --gas-budget 100000000
```

After publishing, the terminal will output object IDs. You need:

- **Package ID** — the published package address
- **Registry** — the shared Registry object ID
- **YieldEngine** — the shared YieldEngine object ID
- **ComplianceRegistry** — the shared ComplianceRegistry object ID
- **Platform** — the shared Platform object ID
- **Treasury** — the Treasury object ID (for CaribCoin)

Save all of these — you'll put them in `.env` files.

---

## Step 3: Set Up External Services

### Google Cloud (for zkLogin)

1. Go to https://console.cloud.google.com
2. Create a new project (e.g., "Spice App")
3. Enable "Google Identity" / OAuth
4. Create OAuth 2.0 credentials (Web application)
5. Set authorized redirect URI: `http://localhost:3001/auth/callback`
6. Copy the **Client ID**

### Shinami (for Gas Station — sponsored transactions)

1. Go to https://www.shinami.com
2. Sign up and create an app for Sui testnet
3. Enable Gas Station and zkLogin services
4. Copy your API keys

### Pinata (for IPFS)

1. Go to https://www.pinata.cloud
2. Sign up (free tier works for MVP)
3. Create an API key
4. Copy the API key and secret

---

## Step 4: Landing Site

```bash
cd web
npm install

# Run locally
npm run dev
# Open http://localhost:3000

# Deploy to Vercel
npx vercel --prod
```

---

## Step 5: Spice Application

```bash
cd app
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your values:
# - NEXT_PUBLIC_PACKAGE_ID (from Step 2)
# - NEXT_PUBLIC_REGISTRY_ID (from Step 2)
# - NEXT_PUBLIC_YIELD_ENGINE_ID (from Step 2)
# - NEXT_PUBLIC_COMPLIANCE_ID (from Step 2)
# - NEXT_PUBLIC_PLATFORM_ID (from Step 2)
# - NEXT_PUBLIC_CARIB_TREASURY_ID (from Step 2)
# - NEXT_PUBLIC_GOOGLE_CLIENT_ID (from Step 3)
# - SHINAMI_GAS_STATION_KEY (from Step 3)
# - PINATA_API_KEY (from Step 3)

# Run locally
npm run dev
# Open http://localhost:3001
```

---

## Step 6: Indexer

```bash
cd indexer
npm install

# Create environment file
cp .env.example .env

# Edit .env with your PACKAGE_ID from Step 2

# Run database migration
node migrate.js

# Start the indexer
npm run dev
# API running on http://localhost:4000
```

Test it:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/stats
```

---

## Step 7: Test the Full Flow

With all three services running (app on 3001, indexer on 4000):

1. Open http://localhost:3001
2. Click "Sign in with Google"
3. Authorize with your Google account
4. You'll land on the role selection screen
5. Click "GCNA Admin" to test the admin flow

### To create your first asset type (run manually via Sui CLI):

```bash
# Replace PACKAGE_ID and REGISTRY_ID with your values
sui client call \
  --package PACKAGE_ID \
  --module asset_pool \
  --function create_asset_type \
  --args \
    REGISTRY_ADMIN_CAP_ID \
    REGISTRY_ID \
    '"NUTMG"' \
    '"Grenada Nutmeg"' \
    '"kg"' \
    '"Grenada"' \
    '"GCNA"' \
    YOUR_ADDRESS \
  --gas-budget 10000000
```

This registers the NUTMG asset type and gives you a CustodianCap.

### To create a lot:

```bash
sui client call \
  --package PACKAGE_ID \
  --module asset_pool \
  --function create_lot \
  --args \
    CUSTODIAN_CAP_ID \
    REGISTRY_ID \
    ASSET_TYPE_ID \
    '"QmInitialReceiptHash"' \
    0x6 \
  --gas-budget 10000000
```

After creating a lot, you can use the Admin dashboard in the web app to record deliveries.

---

## Vercel Deployment

### Landing site (web/)

```bash
cd web
npx vercel --prod
# Set custom domain: anansi.tech
```

### Spice app (app/)

```bash
cd app
npx vercel --prod
# Set custom domain: app.spice.anansi.tech
# Add all NEXT_PUBLIC_* env vars in Vercel dashboard
# Add server-side env vars (SHINAMI_*, PINATA_*) in Vercel dashboard
```

### Indexer

The indexer is a long-running Node.js process. Deploy to:

- Railway (easiest — https://railway.app)
- Render
- A small VPS (DigitalOcean $6/mo droplet)
- Or run locally during MVP testing

---

## File Structure Reference

```
anansi/
├── README.md
├── .gitignore
├── contracts/           # Sui Move smart contracts
│   ├── Move.toml
│   └── sources/
│       ├── carib_coin.move      # CaribCoin token (10B supply, burn)
│       ├── asset_pool.move      # Asset factory (lots, deliveries, tokens)
│       ├── yield_engine.move    # Surplus distribution + fees
│       ├── compliance.move      # KYC whitelist + transfer checks
│       └── platform.move        # Admin controls + emergency pause
├── web/                 # Landing site (Next.js → Vercel)
│   ├── app/
│   │   ├── layout.js
│   │   ├── page.js              # Homepage
│   │   ├── spice/page.js        # Spice product page
│   │   └── caribcoin/page.js    # CaribCoin page
│   ├── components/
│   │   ├── Header.js
│   │   └── Footer.js
│   └── public/logo.png
├── app/                 # Spice application (Next.js → Vercel)
│   ├── app/
│   │   ├── layout.js
│   │   ├── page.js              # Login / role selection
│   │   ├── auth/callback/page.js # zkLogin OAuth callback
│   │   ├── admin/page.js        # GCNA admin dashboard
│   │   ├── farmer/page.js       # Farmer view (mobile-first)
│   │   ├── buyer/page.js        # Marketplace / buyer view
│   │   └── api/ipfs/upload/route.js  # IPFS upload API
│   ├── components/
│   │   ├── AuthProvider.js      # Auth context
│   │   └── AppNav.js            # App navigation bar
│   ├── lib/
│   │   ├── constants.js         # All contract IDs + config
│   │   ├── sui.js               # Sui client helpers
│   │   ├── auth.js              # zkLogin flow
│   │   ├── transactions.js      # Contract interaction builders
│   │   └── ipfs.js              # IPFS upload helper
│   └── .env.example
├── indexer/             # Event indexer + REST API
│   ├── index.js                 # Main: polling + Express API
│   ├── config.js                # Configuration
│   ├── db.js                    # SQLite database operations
│   ├── migrate.js               # Database schema setup
│   └── .env.example
└── docs/                # Planning documents
    ├── blueprint.md
    ├── spice_product_spec.md
    ├── caribcoin_economic_design.md
    └── gcna_partnership_proposal.md
```
