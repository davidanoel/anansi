// ============================================================
// Spice App Constants
// Update these after deploying contracts to testnet/mainnet
// ============================================================

export const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";
export const SUI_RPC_URL = process.env.NEXT_PUBLIC_SUI_RPC_URL || "https://fullnode.testnet.sui.io";

// Contract package ID (set after `sui client publish`)
export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || "0x0";

// Shared object IDs (set after contract deployment — find in publish output)
export const ORIGINAL_PACKAGE_ID = process.env.NEXT_PUBLIC_ORIGINAL_PACKAGE_ID || "0x0";
export const REGISTRY_ID = process.env.NEXT_PUBLIC_REGISTRY_ID || "0x0";
export const YIELD_ENGINE_ID = process.env.NEXT_PUBLIC_YIELD_ENGINE_ID || "0x0";
export const COMPLIANCE_ID = process.env.NEXT_PUBLIC_COMPLIANCE_ID || "0x0";
export const PLATFORM_ID = process.env.NEXT_PUBLIC_PLATFORM_ID || "0x0";
export const CARIB_TREASURY_ID = process.env.NEXT_PUBLIC_CARIB_TREASURY_ID || "0x0";

// Module names (match Move module names)
export const MODULES = {
  CARIB_COIN: "carib_coin",
  ASSET_POOL: "asset_pool",
  YIELD_ENGINE: "yield_engine",
  COMPLIANCE: "compliance",
  PLATFORM: "platform",
};

// zkLogin
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
export const REDIRECT_URL =
  process.env.NEXT_PUBLIC_REDIRECT_URL || "http://localhost:3001/auth/callback";
export const PROVER_URL = "https://api.shinami.com/zklogin/prover/v1";

// IPFS
export const IPFS_GATEWAY =
  process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs";

// Indexer
export const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL || "http://localhost:4000";

// Lot status labels
export const LOT_STATUS = {
  0: "Open",
  1: "Selling",
  2: "Distributing",
  3: "Closed",
};

// User roles
export const USER_ROLES = {
  BUYER: 0,
  FARMER: 1,
  CUSTODIAN: 2,
  ADMIN: 3,
};

// USDC on Sui
export const USDC_TYPE_TESTNET = '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC'
export const USDC_TYPE_MAINNET = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC'
export const USDC_TYPE = SUI_NETWORK === 'mainnet' ? USDC_TYPE_MAINNET : USDC_TYPE_TESTNET
export const USDC_DECIMALS = 6 // 1 USDC = 1,000,000 units
