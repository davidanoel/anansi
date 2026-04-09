// ============================================================
// Spice App Constants
// ============================================================

export const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";
export const SUI_RPC_URL = process.env.NEXT_PUBLIC_SUI_RPC_URL || "https://fullnode.testnet.sui.io";

// Contract package IDs
export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || "0x0";
export const ORIGINAL_PACKAGE_ID = process.env.NEXT_PUBLIC_ORIGINAL_PACKAGE_ID || PACKAGE_ID;

// Shared object IDs
export const REGISTRY_ID = process.env.NEXT_PUBLIC_REGISTRY_ID || "0x0";
export const YIELD_ENGINE_ID = process.env.NEXT_PUBLIC_YIELD_ENGINE_ID || "0x0";
export const COMPLIANCE_ID = process.env.NEXT_PUBLIC_COMPLIANCE_ID || "0x0";
export const PLATFORM_ID = process.env.NEXT_PUBLIC_PLATFORM_ID || "0x0";
export const CARIB_TREASURY_ID = process.env.NEXT_PUBLIC_CARIB_TREASURY_ID || "0x0";

// Module names
export const MODULES = {
  CARIB_COIN: "carib_coin",
  ASSET_POOL: "asset_pool",
  YIELD_ENGINE: "yield_engine",
  COMPLIANCE: "compliance",
  PLATFORM: "platform",
};

// USDC on Sui
export const USDC_TYPE_TESTNET =
  "0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC";
export const USDC_TYPE_MAINNET =
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";
export const USDC_TYPE = SUI_NETWORK === "mainnet" ? USDC_TYPE_MAINNET : USDC_TYPE_TESTNET;
export const USDC_DECIMALS = 6;

// ============================================================
// Token Registry — Dynamic multi-asset discovery
//
// Adding a new commodity:
// 1. Deploy the Move module (e.g., cocoa.move)
// 2. Add to NEXT_PUBLIC_REGISTERED_TOKENS: "NUTMEG,COCOA"
// 3. Add env vars:
//    NEXT_PUBLIC_TOKEN_COCOA_MINT_VAULT=0x...
//    NEXT_PUBLIC_TOKEN_COCOA_POOL=0x...  (after creating Cetus pool)
// 4. Create asset type from /platform dashboard
// 5. Done — app discovers it automatically
// ============================================================

// Convention: symbol NUTMEG → module "nutmeg" → type "PACKAGE::nutmeg::NUTMEG"
function buildTokenRegistry() {
  const registered = (process.env.NEXT_PUBLIC_REGISTERED_TOKENS || "NUTMEG")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const registry = {};

  for (const symbol of registered) {
    const moduleName = symbol.toLowerCase();
    registry[symbol] = {
      symbol,
      moduleName,
      type: `${ORIGINAL_PACKAGE_ID}::${moduleName}::${symbol}`,
      decimals: 6,
      mintVaultId: process.env[`NEXT_PUBLIC_TOKEN_${symbol}_MINT_VAULT`] || "0x0",
      poolId: process.env[`NEXT_PUBLIC_TOKEN_${symbol}_POOL`] || "",
      hasPool: !!process.env[`NEXT_PUBLIC_TOKEN_${symbol}_POOL`],
    };
  }

  return registry;
}

export const TOKEN_REGISTRY = buildTokenRegistry();

// Helper: get token config by symbol
export function getToken(symbol) {
  return TOKEN_REGISTRY[symbol] || null;
}

// Helper: get all registered tokens
export function getAllTokens() {
  return Object.values(TOKEN_REGISTRY);
}

// Helper: get all tokens with DEX pools
export function getTradableTokens() {
  return Object.values(TOKEN_REGISTRY).filter((t) => t.hasPool);
}

// Convenience exports (derived from registry)
export const NUTMEG_TYPE = TOKEN_REGISTRY.NUTMEG?.type || "";
export const NUTMEG_DECIMALS = 6;

// Asset categories for the platform admin
export const ASSET_CATEGORIES = {
  agriculture: { label: "Agriculture", icon: "🌿", examples: "Nutmeg, Cocoa, Coffee, Mace" },
  real_estate: { label: "Real Estate", icon: "🏠", examples: "Villas, Land, Hotels" },
  revenue: { label: "Revenue Stream", icon: "📊", examples: "Rum distillery, Tourism revenue" },
  natural_resource: { label: "Natural Resource", icon: "⛏️", examples: "Minerals, Timber" },
};

// zkLogin
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
export const REDIRECT_URL =
  process.env.NEXT_PUBLIC_REDIRECT_URL || "http://localhost:3001/auth/callback";

// IPFS
export const IPFS_GATEWAY =
  process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs";

// Lot status labels
export const LOT_STATUS = {
  0: "Open",
  1: "Selling",
  2: "Distributing",
  3: "Closed",
};
