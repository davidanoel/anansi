import dotenv from "dotenv";

dotenv.config({ path: new URL("./.env", import.meta.url).pathname });

// Indexer configuration — update after deploying contracts

export const config = {
  // Sui network
  suiRpcUrl: process.env.SUI_RPC_URL || "https://fullnode.testnet.sui.io",
  suiWsUrl: process.env.SUI_WS_URL || "wss://fullnode.testnet.sui.io",

  // Contract package IDs
  packageId: process.env.PACKAGE_ID || "0x0",
  originalPackageId: process.env.ORIGINAL_PACKAGE_ID || process.env.PACKAGE_ID || "0x0",

  // Database (PostgreSQL)
  dbUrl: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/spice_indexer",

  // API server
  port: parseInt(process.env.PORT || "4000"),

  // Polling interval in ms
  pollInterval: parseInt(process.env.POLL_INTERVAL || "5000"),
};

export function getPackageIds() {
  return [...new Set([config.packageId, config.originalPackageId].filter(Boolean))];
}

// Event types to index
export function getEventTypes(packageId) {
  return {
    // Asset Pool events
    ASSET_TYPE_CREATED: `${packageId}::asset_pool::AssetTypeCreated`,
    ASSET_TYPE_DEACTIVATED: `${packageId}::asset_pool::AssetTypeDeactivated`,
    ASSET_TYPE_REACTIVATED: `${packageId}::asset_pool::AssetTypeReactivated`,
    CUSTODIAN_CAP_ISSUED: `${packageId}::asset_pool::CustodianCapIssued`,
    CUSTODIAN_CAP_REVOKED: `${packageId}::asset_pool::CustodianCapRevoked`,
    LOT_CREATED: `${packageId}::asset_pool::LotCreated`,
    DELIVERY_RECORDED: `${packageId}::asset_pool::DeliveryRecorded`,
    LOT_STATUS_CHANGED: `${packageId}::asset_pool::LotStatusChanged`,
    VALUATION_UPDATED: `${packageId}::asset_pool::ValuationUpdated`,

    // Yield Engine events
    SURPLUS_RECEIVED: `${packageId}::yield_engine::SurplusReceived`,
    SURPLUS_CLAIMED: `${packageId}::yield_engine::SurplusClaimed`,
    FEES_COLLECTED: `${packageId}::yield_engine::FeesCollected`,
    FEE_CONFIG_UPDATED: `${packageId}::yield_engine::FeeConfigUpdated`,

    // Fee Converter events
    FEE_PROCESSED: `${packageId}::fee_converter::FeeProcessed`,
    BURN_RATE_UPDATED: `${packageId}::fee_converter::BurnRateUpdated`,
    TREASURY_ADDRESS_UPDATED: `${packageId}::fee_converter::TreasuryAddressUpdated`,

    // Staking events
    STAKED: `${packageId}::staking::Staked`,
    UNSTAKE_REQUESTED: `${packageId}::staking::UnstakeRequested`,
    UNSTAKE_CANCELLED: `${packageId}::staking::UnstakeCancelled`,
    UNSTAKE_COMPLETED: `${packageId}::staking::UnstakeCompleted`,
    COOLDOWN_UPDATED: `${packageId}::staking::CooldownUpdated`,
    THRESHOLDS_UPDATED: `${packageId}::staking::ThresholdsUpdated`,

    // CaribCoin events
    TOKENS_BURNED: `${packageId}::carib_coin::TokensBurned`,
    TOKENS_MINTED: `${packageId}::carib_coin::TokensMinted`,
    TREASURY_TRANSFERRED: `${packageId}::carib_coin::TreasuryTransferred`,
  };
}
