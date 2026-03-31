// Indexer configuration — update after deploying contracts

export const config = {
  // Sui network
  suiRpcUrl: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io',
  suiWsUrl: process.env.SUI_WS_URL || 'wss://fullnode.testnet.sui.io',

  // Contract package ID (set after deployment)
  packageId: process.env.PACKAGE_ID || '0x0',

  // Database
  dbPath: process.env.DB_PATH || './spice.db',

  // API server
  port: parseInt(process.env.PORT || '4000'),

  // Polling interval in ms (fallback if WebSocket unavailable)
  pollInterval: parseInt(process.env.POLL_INTERVAL || '5000'),
}

// Event types to index (all derived from package ID)
export function getEventTypes(packageId) {
  return {
    // Asset Pool events
    ASSET_TYPE_CREATED: `${packageId}::asset_pool::AssetTypeCreated`,
    LOT_CREATED: `${packageId}::asset_pool::LotCreated`,
    DELIVERY_RECORDED: `${packageId}::asset_pool::DeliveryRecorded`,
    LOT_STATUS_CHANGED: `${packageId}::asset_pool::LotStatusChanged`,
    TOKENS_TRANSFERRED: `${packageId}::asset_pool::TokensTransferred`,
    VALUATION_UPDATED: `${packageId}::asset_pool::ValuationUpdated`,

    // Yield Engine events
    SURPLUS_RECEIVED: `${packageId}::yield_engine::SurplusReceived`,
    SURPLUS_CLAIMED: `${packageId}::yield_engine::SurplusClaimed`,
    FEES_COLLECTED: `${packageId}::yield_engine::FeesCollected`,

    // CaribCoin events
    TOKENS_BURNED: `${packageId}::carib_coin::TokensBurned`,
    TOKENS_MINTED: `${packageId}::carib_coin::TokensMinted`,
  }
}
