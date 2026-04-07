// ============================================================
// Spice App Constants
// ============================================================

export const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet'
export const SUI_RPC_URL = process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io'

// Contract package IDs
export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || '0x0'
export const ORIGINAL_PACKAGE_ID = process.env.NEXT_PUBLIC_ORIGINAL_PACKAGE_ID || PACKAGE_ID

// Shared object IDs
export const REGISTRY_ID = process.env.NEXT_PUBLIC_REGISTRY_ID || '0x0'
export const YIELD_ENGINE_ID = process.env.NEXT_PUBLIC_YIELD_ENGINE_ID || '0x0'
export const COMPLIANCE_ID = process.env.NEXT_PUBLIC_COMPLIANCE_ID || '0x0'
export const PLATFORM_ID = process.env.NEXT_PUBLIC_PLATFORM_ID || '0x0'
export const CARIB_TREASURY_ID = process.env.NEXT_PUBLIC_CARIB_TREASURY_ID || '0x0'
export const MINT_VAULT_ID = process.env.NEXT_PUBLIC_MINT_VAULT_ID || '0x0'

// Module names
export const MODULES = {
  CARIB_COIN: 'carib_coin',
  ASSET_POOL: 'asset_pool',
  YIELD_ENGINE: 'yield_engine',
  COMPLIANCE: 'compliance',
  PLATFORM: 'platform',
  NUTMEG: 'nutmeg',
}

// USDC on Sui
export const USDC_TYPE_TESTNET = '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC'
export const USDC_TYPE_MAINNET = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC'
export const USDC_TYPE = SUI_NETWORK === 'mainnet' ? USDC_TYPE_MAINNET : USDC_TYPE_TESTNET
export const USDC_DECIMALS = 6

// Commodity coins — type uses ORIGINAL_PACKAGE_ID since coins keep creation-time type
export const NUTMEG_TYPE = `${ORIGINAL_PACKAGE_ID}::nutmeg::NUTMEG`
export const NUTMEG_DECIMALS = 6

// Shared object: MintVault for NUTMEG (set after deployment)
export const NUTMEG_MINT_VAULT_ID = process.env.NEXT_PUBLIC_NUTMEG_MINT_VAULT_ID || '0x0'

// zkLogin
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
export const REDIRECT_URL = process.env.NEXT_PUBLIC_REDIRECT_URL || 'http://localhost:3001/auth/callback'

// IPFS
export const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs'

// Lot status labels
export const LOT_STATUS = {
  0: 'Open',
  1: 'Selling',
  2: 'Distributing',
  3: 'Closed',
}
