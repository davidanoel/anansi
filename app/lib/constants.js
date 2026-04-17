// ============================================================
// Spice App Constants
// ============================================================

export const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";
export const SUI_RPC_URL = process.env.NEXT_PUBLIC_SUI_RPC_URL || "https://fullnode.testnet.sui.io";

// Core platform package ID (asset_pool, yield_engine, compliance, etc.)
export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || "0x0";
export const ORIGINAL_PACKAGE_ID = process.env.NEXT_PUBLIC_ORIGINAL_PACKAGE_ID || PACKAGE_ID;

// Shared object IDs (from core package)
export const REGISTRY_ID = process.env.NEXT_PUBLIC_REGISTRY_ID || "0x0";
export const YIELD_ENGINE_ID = process.env.NEXT_PUBLIC_YIELD_ENGINE_ID || "0x0";
export const COMPLIANCE_ID = process.env.NEXT_PUBLIC_COMPLIANCE_ID || "0x0";
export const PLATFORM_ID = process.env.NEXT_PUBLIC_PLATFORM_ID || "0x0";
export const CARIB_TREASURY_ID = process.env.NEXT_PUBLIC_CARIB_TREASURY_ID || "0x0";
export const COMMODITY_REGISTRY_ID = process.env.NEXT_PUBLIC_COMMODITY_REGISTRY_ID || "0x0";

// Module names (core package)
export const MODULES = {
  CARIB_COIN: "carib_coin",
  ASSET_POOL: "asset_pool",
  YIELD_ENGINE: "yield_engine",
  COMPLIANCE: "compliance",
  PLATFORM: "platform",
  COMMODITY_REGISTRY: "commodity_registry",
  FEE_CONVERTER: "fee_converter",
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
// Each commodity is a SEPARATE Sui package with its own package ID.
// Token config includes packageId so the app knows where to call
// record_delivery and what coin type to reference.
//
// Env var format:
//   NEXT_PUBLIC_REGISTERED_TOKENS=NUTMEG,COFFEE
//   NEXT_PUBLIC_TOKEN_CONFIG={
//     "NUTMEG": {
//       "packageId": "0xNUTMEG_PKG_ID",
//       "mintVault": "0xMINT_VAULT_ID",
//       "pool": "0xCETUS_POOL_ID"
//     },
//     "COFFEE": {
//       "packageId": "0xCOFFEE_PKG_ID",
//       "mintVault": "0x...",
//       "pool": ""
//     }
//   }
//
// Convention:
//   Symbol NUTMEG → package "anansi_nutmeg" → module "nutmeg" → type "PKG::nutmeg::NUTMEG"
// ============================================================

function buildTokenRegistry() {
  const registered = (process.env.NEXT_PUBLIC_REGISTERED_TOKENS || "NUTMEG")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let tokenConfig = {};
  try {
    tokenConfig = JSON.parse(process.env.NEXT_PUBLIC_TOKEN_CONFIG || "{}");
  } catch (e) {
    console.warn("Failed to parse NEXT_PUBLIC_TOKEN_CONFIG:", e);
  }

  const registry = {};

  for (const symbol of registered) {
    const moduleName = symbol.toLowerCase();
    const config = tokenConfig[symbol] || {};
    const packageId = config.packageId || ORIGINAL_PACKAGE_ID;

    registry[symbol] = {
      symbol,
      moduleName,
      packageId,
      // Coin type uses the commodity's package ID (not core)
      type: `${packageId}::${moduleName}::${symbol}`,
      decimals: 6,
      mintVaultId: config.mintVault || "0x0",
      poolId: config.pool || "",
      hasPool: !!config.pool,
    };
  }

  // Special handling for CARIB: if env vars are set, register it as a core token
  const caribType = process.env.NEXT_PUBLIC_CARIB_TYPE || "";
  const caribPoolId = process.env.NEXT_PUBLIC_CARIB_POOL_ID || "";

  if (caribType) {
    registry.CARIB = {
      symbol: "CARIB",
      moduleName: MODULES.CARIB_COIN,
      packageId: caribType.split("::")[0] || PACKAGE_ID,
      type: caribType,
      decimals: 6,
      mintVaultId: "",
      poolId: caribPoolId,
      hasPool: !!caribPoolId,
      isCoreToken: true,
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
