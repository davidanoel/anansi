// ============================================================
// Data Layer — Queries Sui RPC directly for all platform data.
// ============================================================

import { getSuiClient, getOwnedObjects, queryEvents } from "./sui";
import {
  PACKAGE_ID,
  ORIGINAL_PACKAGE_ID,
  REGISTRY_ID,
  LOT_STATUS,
  NUTMEG_TYPE,
  NUTMEG_DECIMALS,
  USDC_DECIMALS,
  TOKEN_REGISTRY,
  getAllTokens,
} from "./constants";

// ============ Lots ============

export async function getAllLots() {
  const client = getSuiClient();

  const events = await queryEvents(`${PACKAGE_ID}::asset_pool::LotCreated`);
  let allEvents = [...events.data];
  if (ORIGINAL_PACKAGE_ID !== PACKAGE_ID) {
    const oldEvents = await queryEvents(`${ORIGINAL_PACKAGE_ID}::asset_pool::LotCreated`);
    allEvents = [...allEvents, ...oldEvents.data];
  }

  const seenIds = new Set();
  const lots = await Promise.all(
    allEvents.map(async (event) => {
      const lotId = event.parsedJson?.lot_id;
      if (!lotId || seenIds.has(lotId)) return null;
      seenIds.add(lotId);

      try {
        const obj = await client.getObject({ id: lotId, options: { showContent: true } });
        const fields = obj.data?.content?.fields || {};
        return {
          id: lotId,
          lotNumber: Number(fields.lot_number || 0),
          assetTypeSymbol: fields.asset_type_symbol || "",
          status: Number(fields.status || 0),
          statusLabel: LOT_STATUS[fields.status] || "Unknown",
          totalUnits: Number(fields.total_units || 0),
          totalTokensMinted: Number(fields.total_tokens_minted || 0),
          estimatedValueUsdc: Number(fields.estimated_value_usdc || 0),
          custodian: fields.custodian || "",
          createdAt: Number(fields.created_at || 0),
          closedAt: Number(fields.closed_at || 0),
          totalSurplusDeposited: Number(fields.total_surplus_deposited || 0),
          totalSurplusDistributed: Number(fields.total_surplus_distributed || 0),
          deliveryCount: Number(fields.delivery_count || 0),
          receiptHash: fields.receipt_hash || "",
        };
      } catch {
        return null;
      }
    }),
  );

  return lots.filter(Boolean).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getActiveLots() {
  return (await getAllLots()).filter((l) => l.status < 3);
}

export async function getLot(lotId) {
  const client = getSuiClient();
  const obj = await client.getObject({ id: lotId, options: { showContent: true } });
  const fields = obj.data?.content?.fields;
  if (!fields) return null;
  return {
    id: lotId,
    lotNumber: Number(fields.lot_number || 0),
    assetTypeSymbol: fields.asset_type_symbol || "",
    status: Number(fields.status || 0),
    statusLabel: LOT_STATUS[fields.status] || "Unknown",
    totalUnits: Number(fields.total_units || 0),
    totalTokensMinted: Number(fields.total_tokens_minted || 0),
    estimatedValueUsdc: Number(fields.estimated_value_usdc || 0),
    createdAt: Number(fields.created_at || 0),
    deliveryCount: Number(fields.delivery_count || 0),
    totalSurplusDeposited: Number(fields.total_surplus_deposited || 0),
    totalSurplusDistributed: Number(fields.total_surplus_distributed || 0),
  };
}

// ============ Deliveries ============

export async function getRecentDeliveries(limit = 20) {
  const events = await queryEvents(`${PACKAGE_ID}::asset_pool::DeliveryRecorded`, null, 100);
  let allEvents = [...events.data];

  if (ORIGINAL_PACKAGE_ID !== PACKAGE_ID) {
    const oldEvents = await queryEvents(
      `${ORIGINAL_PACKAGE_ID}::asset_pool::DeliveryRecorded`,
      null,
      100,
    );
    allEvents = [...allEvents, ...oldEvents.data];
  }

  return allEvents
    .sort((a, b) => Number(b.timestampMs || 0) - Number(a.timestampMs || 0))
    .slice(0, limit)
    .map((event) => ({
      lotId: event.parsedJson?.lot_id,
      farmer: event.parsedJson?.farmer,
      units: Number(event.parsedJson?.units || 0),
      tokensMinted: Number(event.parsedJson?.tokens_minted || 0),
      grade: event.parsedJson?.grade || "",
      txDigest: event.id?.txDigest,
      timestamp: Number(event.timestampMs || 0),
    }));
}

export async function getFarmerDeliveries(farmerAddress) {
  const events = await queryEvents(`${PACKAGE_ID}::asset_pool::DeliveryRecorded`, null, 100);
  let allEvents = [...events.data];
  if (ORIGINAL_PACKAGE_ID !== PACKAGE_ID) {
    const oldEvents = await queryEvents(
      `${ORIGINAL_PACKAGE_ID}::asset_pool::DeliveryRecorded`,
      null,
      100,
    );
    allEvents = [...allEvents, ...oldEvents.data];
  }

  const allLots = await getAllLots().catch(() => []);
  const lotMap = new Map(allLots.map((l) => [l.id, l.assetTypeSymbol]));

  return allEvents
    .filter((e) => e.parsedJson?.farmer === farmerAddress)
    .map((event) => {
      const lotId = event.parsedJson?.lot_id;
      return {
        lotId,
        assetTypeSymbol: lotMap.get(lotId) || "",
        units: Number(event.parsedJson?.units || 0),
        tokensMinted: Number(event.parsedJson?.tokens_minted || 0),
        grade: event.parsedJson?.grade || "",
        txDigest: event.id?.txDigest,
        timestamp: Number(event.timestampMs || 0),
      };
    });
}

// ============ Token Balance (Standard Coin<NUTMEG>) ============

// Get NUTMEG balance for an address
export async function getNutmegBalance(address) {
  const client = getSuiClient();
  const balance = await client.getBalance({
    owner: address,
    coinType: NUTMEG_TYPE,
  });
  return {
    totalBalance: Number(balance.totalBalance || 0),
    displayBalance: Number(balance.totalBalance || 0) / 10 ** NUTMEG_DECIMALS,
    coinObjectCount: balance.coinObjectCount || 0,
  };
}

// Get USDC balance for an address
export async function getUsdcBalance(address) {
  const client = getSuiClient();
  const { USDC_TYPE } = await import("./constants");
  const balance = await client.getBalance({
    owner: address,
    coinType: USDC_TYPE,
  });
  return {
    totalBalance: Number(balance.totalBalance || 0),
    displayBalance: Number(balance.totalBalance || 0) / 10 ** USDC_DECIMALS,
  };
}

// Get all NUTMEG coin objects (needed for surplus claims and DEX swaps)
export async function getNutmegCoins(address) {
  const client = getSuiClient();
  const { data } = await client.getCoins({
    owner: address,
    coinType: NUTMEG_TYPE,
  });
  return data;
}

// ============ Surplus Deposits ============

// Get all surplus deposits (fungible coins = all deposits are relevant to all holders)
export async function getAllSurplusDeposits() {
  const client = getSuiClient();

  // 1. Fetch all lots to build a reference map of lotId -> assetTypeSymbol
  const allLots = await getAllLots().catch(() => []);
  const lotMap = new Map(allLots.map((l) => [l.id, l.assetTypeSymbol]));

  const events = await queryEvents(`${PACKAGE_ID}::yield_engine::SurplusReceived`, null, 50);
  let allEvents = [...events.data];
  if (ORIGINAL_PACKAGE_ID !== PACKAGE_ID) {
    const oldEvents = await queryEvents(
      `${ORIGINAL_PACKAGE_ID}::yield_engine::SurplusReceived`,
      null,
      50,
    );
    allEvents = [...allEvents, ...oldEvents.data];
  }

  const deposits = [];
  for (const event of allEvents) {
    try {
      const tx = await client.getTransactionBlock({
        digest: event.id.txDigest,
        options: { showObjectChanges: true },
      });
      const created = tx.objectChanges?.find(
        (c) => c.type === "created" && c.objectType?.includes("::yield_engine::SurplusDeposit"),
      );
      if (created) {
        const depositObj = await client.getObject({
          id: created.objectId,
          options: { showContent: true },
        });
        const fields = depositObj.data?.content?.fields || {};
        const remaining = Number(fields.balance || 0);
        const lotId = event.parsedJson?.lot_id;

        deposits.push({
          id: created.objectId,
          lotId: lotId,
          // 2. Safely map the correct symbol to the deposit!
          assetTypeSymbol: lotMap.get(lotId) || "NUTMEG",
          grossAmount: Number(event.parsedJson?.gross_amount || 0),
          feeAmount: Number(event.parsedJson?.fee_amount || 0),
          netAmount: Number(event.parsedJson?.net_amount || 0),
          tokensSnapshot: Number(event.parsedJson?.tokens_snapshot || 0),
          timestamp: Number(event.timestampMs || 0),
          remaining,
        });
      }
    } catch (err) {
      console.error("Failed to fetch surplus deposit:", err);
    }
  }

  return deposits.sort((a, b) => b.timestamp - a.timestamp);
}

// ============ Asset Types ============

export async function getAssetTypeBySymbol(symbol) {
  const client = getSuiClient();
  const events = await queryEvents(`${PACKAGE_ID}::asset_pool::AssetTypeCreated`, null, 50);
  let allEvents = [...events.data];
  if (ORIGINAL_PACKAGE_ID !== PACKAGE_ID) {
    const oldEvents = await queryEvents(
      `${ORIGINAL_PACKAGE_ID}::asset_pool::AssetTypeCreated`,
      null,
      50,
    );
    allEvents = [...allEvents, ...oldEvents.data];
  }
  const match = allEvents.find((e) => e.parsedJson?.symbol === symbol);
  if (!match) return null;
  const tx = await client.getTransactionBlock({
    digest: match.id.txDigest,
    options: { showObjectChanges: true },
  });
  const created = tx.objectChanges?.find(
    (c) => c.type === "created" && c.objectType?.includes("::asset_pool::AssetType"),
  );
  return created?.objectId || null;
}

export async function getAssetTypes() {
  const client = getSuiClient();

  const events = await queryEvents(`${PACKAGE_ID}::asset_pool::AssetTypeCreated`, null, 50);
  let allEvents = [...events.data];

  if (ORIGINAL_PACKAGE_ID !== PACKAGE_ID) {
    const oldEvents = await queryEvents(
      `${ORIGINAL_PACKAGE_ID}::asset_pool::AssetTypeCreated`,
      null,
      50,
    );
    allEvents = [...allEvents, ...oldEvents.data];
  }

  const assetTypes = await Promise.all(
    allEvents.map(async (event) => {
      try {
        const tx = await client.getTransactionBlock({
          digest: event.id.txDigest,
          options: { showObjectChanges: true },
        });

        const created = tx.objectChanges?.find(
          (c) => c.type === "created" && c.objectType?.includes("::asset_pool::AssetType"),
        );

        if (!created?.objectId) return null;

        const obj = await client.getObject({
          id: created.objectId,
          options: { showContent: true },
        });

        const fields = obj.data?.content?.fields || {};

        return {
          id: created.objectId,
          symbol: fields.symbol || event.parsedJson?.symbol || "",
          name: fields.name || event.parsedJson?.name || "",
          unit: fields.unit || "",
          region: fields.region || event.parsedJson?.region || "",
          custodian: fields.custodian || event.parsedJson?.custodian || "",
          active: Boolean(fields.active),
          timestamp: Number(event.timestampMs || 0),
        };
      } catch {
        return null;
      }
    }),
  );

  return assetTypes.filter(Boolean).sort((a, b) => b.timestamp - a.timestamp);
}

// ============ Admin Objects ============

export async function getRegistryAdmin(address) {
  const type = `${ORIGINAL_PACKAGE_ID}::asset_pool::RegistryAdmin`;
  const result = await getOwnedObjects(address, type);
  return result.length > 0 ? result[0].data?.objectId : null;
}

export async function getCustodianCaps(address) {
  const type = `${ORIGINAL_PACKAGE_ID}::asset_pool::CustodianCap`;
  const result = await getOwnedObjects(address, type);
  return result.map((obj) => ({
    id: obj.data?.objectId,
    assetTypeSymbol: obj.data?.content?.fields?.asset_type_symbol || "",
  }));
}

// ============ CaribCoin ============

export async function getBurnHistory(limit = 50) {
  const events = await queryEvents(`${PACKAGE_ID}::carib_coin::TokensBurned`, null, limit);
  return events.data.map((event) => ({
    amount: Number(event.parsedJson?.amount || 0),
    burner: event.parsedJson?.burner,
    totalBurned: Number(event.parsedJson?.total_burned || 0),
    txDigest: event.id?.txDigest,
    timestamp: Number(event.timestampMs || 0),
  }));
}

// ============ Platform Stats ============

export async function getPlatformStats() {
  const [lots, deliveries, burns] = await Promise.all([
    getAllLots().catch(() => []),
    getRecentDeliveries(100).catch(() => []),
    getBurnHistory(1).catch(() => []),
  ]);
  const uniqueFarmers = new Set(deliveries.map((d) => d.farmer)).size;
  return {
    totalLots: lots.length,
    activeLots: lots.filter((l) => l.status < 3).length,
    totalDeliveries: deliveries.length,
    totalUnitsTokenized: lots.reduce((sum, l) => sum + l.totalUnits, 0),
    totalSurplusDistributed: lots.reduce((sum, l) => sum + (l.totalSurplusDistributed || 0), 0),
    totalCaribBurned: burns[0]?.totalBurned || 0,
    uniqueFarmers,
    assetTypes: new Set(lots.map((l) => l.assetTypeSymbol)).size,
  };
}

// Get specific deposit object IDs that this address has already claimed
export async function getClaimedDepositIds(address) {
  if (!address) return new Set();

  // 1. Query events from the current package
  const events = await queryEvents(`${PACKAGE_ID}::yield_engine::SurplusClaimed`, null, 100);
  let allEvents = [...events.data];

  // 2. Query events from the original package if we migrated
  if (ORIGINAL_PACKAGE_ID !== PACKAGE_ID) {
    const oldEvents = await queryEvents(
      `${ORIGINAL_PACKAGE_ID}::yield_engine::SurplusClaimed`,
      null,
      100,
    );
    allEvents = [...allEvents, ...oldEvents.data];
  }

  // 3. Build a Set of the unique deposit_ids this address has claimed
  const claimedDepositIds = new Set();

  for (const event of allEvents) {
    // Only track events where the claimant is the current user
    if (event.parsedJson?.claimant === address) {
      // We grab the deposit_id (the specific object ID)
      const depositId = event.parsedJson?.deposit_id;

      if (depositId) {
        claimedDepositIds.add(depositId);
      } else {
        // Fallback for legacy events that didn't have deposit_id yet
        // This ensures the transition period is smooth
        claimedDepositIds.add(event.parsedJson?.lot_id);
      }
    }
  }

  return claimedDepositIds;
}

// ============================================================
// Multi-token portfolio queries
// ============================================================

// Get balances for ALL registered tokens for an address
export async function getMultiTokenPortfolio(address) {
  const client = getSuiClient();
  const tokens = getAllTokens();

  const portfolio = await Promise.all(
    tokens.map(async (token) => {
      try {
        const balance = await client.getBalance({
          owner: address,
          coinType: token.type,
        });
        return {
          symbol: token.symbol,
          moduleName: token.moduleName,
          type: token.type,
          decimals: token.decimals,
          totalBalance: Number(balance.totalBalance || 0),
          displayBalance: Number(balance.totalBalance || 0) / 10 ** token.decimals,
          coinObjectCount: balance.coinObjectCount || 0,
          mintVaultId: token.mintVaultId,
          poolId: token.poolId,
          hasPool: token.hasPool,
        };
      } catch (err) {
        // Token type may not exist on-chain yet
        return {
          symbol: token.symbol,
          moduleName: token.moduleName,
          type: token.type,
          decimals: token.decimals,
          totalBalance: 0,
          displayBalance: 0,
          coinObjectCount: 0,
          mintVaultId: token.mintVaultId,
          poolId: token.poolId,
          hasPool: token.hasPool,
        };
      }
    }),
  );

  return portfolio.filter((t) => t.totalBalance > 0 || t.hasPool);
}

// Get coins for a specific token type (needed for swaps and claims)
export async function getTokenCoins(address, tokenSymbol) {
  const client = getSuiClient();
  const token = TOKEN_REGISTRY[tokenSymbol];
  if (!token) throw new Error(`Unknown token: ${tokenSymbol}`);

  const { data } = await client.getCoins({
    owner: address,
    coinType: token.type,
  });
  return data;
}
