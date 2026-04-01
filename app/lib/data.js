// ============================================================
// Data Layer — Queries Sui RPC directly for all platform data.
// No external indexer needed for MVP. The blockchain IS the database.
//
// For scale (500+ farmers, 10+ islands), add Vercel KV caching
// via the /api/indexer/poll cron job. But this works out of the box.
// ============================================================

import { getSuiClient, getOwnedObjects, queryEvents } from "./sui";
import { PACKAGE_ID, ORIGINAL_PACKAGE_ID, REGISTRY_ID, LOT_STATUS } from "./constants";

// ============ Lots ============

// Get all lots by querying LotCreated events, then fetching each lot object
export async function getAllLots() {
  const events = await queryEvents(`${PACKAGE_ID}::asset_pool::LotCreated`);
  const client = getSuiClient();

  const lots = await Promise.all(
    events.data.map(async (event) => {
      const lotId = event.parsedJson?.lot_id;
      if (!lotId) return null;

      try {
        const obj = await client.getObject({
          id: lotId,
          options: { showContent: true },
        });
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

// Get active lots only
export async function getActiveLots() {
  const lots = await getAllLots();
  return lots.filter((l) => l.status < 3);
}

// Get a single lot by ID
export async function getLot(lotId) {
  const client = getSuiClient();
  const obj = await client.getObject({
    id: lotId,
    options: { showContent: true },
  });
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
    custodian: fields.custodian || "",
    createdAt: Number(fields.created_at || 0),
    deliveryCount: Number(fields.delivery_count || 0),
    receiptHash: fields.receipt_hash || "",
    totalSurplusDeposited: Number(fields.total_surplus_deposited || 0),
  };
}

// ============ Deliveries ============

// Get recent deliveries across all lots
export async function getRecentDeliveries(limit = 20) {
  const events = await queryEvents(`${PACKAGE_ID}::asset_pool::DeliveryRecorded`, null, limit);

  return events.data.map((event) => ({
    lotId: event.parsedJson?.lot_id,
    farmer: event.parsedJson?.farmer,
    units: Number(event.parsedJson?.units || 0),
    tokensMinted: Number(event.parsedJson?.tokens_minted || 0),
    grade: event.parsedJson?.grade || "",
    txDigest: event.id?.txDigest,
    timestamp: Number(event.timestampMs || 0),
  }));
}

// Get deliveries for a specific farmer
export async function getFarmerDeliveries(farmerAddress) {
  // Query all delivery events and filter client-side
  // (Sui doesn't support filtering events by field values directly)
  const events = await queryEvents(`${PACKAGE_ID}::asset_pool::DeliveryRecorded`, null, 100);

  return events.data
    .filter((e) => e.parsedJson?.farmer === farmerAddress)
    .map((event) => ({
      lotId: event.parsedJson?.lot_id,
      units: Number(event.parsedJson?.units || 0),
      tokensMinted: Number(event.parsedJson?.tokens_minted || 0),
      grade: event.parsedJson?.grade || "",
      txDigest: event.id?.txDigest,
      timestamp: Number(event.timestampMs || 0),
    }));
}

// Get deliveries for a specific lot
export async function getLotDeliveries(lotId) {
  const events = await queryEvents(`${PACKAGE_ID}::asset_pool::DeliveryRecorded`, null, 100);

  return events.data
    .filter((e) => e.parsedJson?.lot_id === lotId)
    .map((event) => ({
      farmer: event.parsedJson?.farmer,
      units: Number(event.parsedJson?.units || 0),
      tokensMinted: Number(event.parsedJson?.tokens_minted || 0),
      grade: event.parsedJson?.grade || "",
      txDigest: event.id?.txDigest,
      timestamp: Number(event.timestampMs || 0),
    }));
}

// ============ Tokens ============

// Get all SpiceTokens for an address with parsed fields
export async function getTokenPortfolio(address) {
  const client = getSuiClient();
  const type = `${ORIGINAL_PACKAGE_ID}::asset_pool::SpiceToken`;

  const result = await client.getOwnedObjects({
    owner: address,
    filter: { StructType: type },
    options: { showContent: true },
  });

  return result.data.map((obj) => {
    const fields = obj.data?.content?.fields || {};
    return {
      id: obj.data?.objectId,
      lotId: fields.lot_id,
      assetTypeSymbol: fields.asset_type_symbol || "",
      lotNumber: Number(fields.lot_number || 0),
      balance: Number(fields.balance || 0),
    };
  });
}

// ============ Admin Objects ============

// Get RegistryAdmin caps owned by an address
export async function getRegistryAdmin(address) {
  const type = `${ORIGINAL_PACKAGE_ID}::asset_pool::RegistryAdmin`;
  const result = await getOwnedObjects(address, type);
  return result.length > 0 ? result[0].data?.objectId : null;
}

// Get CustodianCaps owned by an address
export async function getCustodianCaps(address) {
  const type = `${ORIGINAL_PACKAGE_ID}::asset_pool::CustodianCap`;
  const result = await getOwnedObjects(address, type);
  return result.map((obj) => ({
    id: obj.data?.objectId,
    assetTypeSymbol: obj.data?.content?.fields?.asset_type_symbol || "",
  }));
}

// Get AssetType objects (query from creation events)
export async function getAssetTypes() {
  const events = await queryEvents(`${PACKAGE_ID}::asset_pool::AssetTypeCreated`, null, 50);

  return events.data.map((event) => ({
    symbol: event.parsedJson?.symbol,
    name: event.parsedJson?.name,
    region: event.parsedJson?.region,
    custodian: event.parsedJson?.custodian,
    timestamp: Number(event.timestampMs || 0),
  }));
}

// ============ CaribCoin ============

// Get CARIB burn history
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
    totalSurplusDistributed: lots.reduce((sum, l) => sum + l.totalSurplusDeposited, 0),
    totalCaribBurned: burns[0]?.totalBurned || 0,
    uniqueFarmers,
    assetTypes: new Set(lots.map((l) => l.assetTypeSymbol)).size,
  };
}

// Get AssetType object by symbol
export async function getAssetTypeBySymbol(symbol) {
  const client = getSuiClient();
  const ORIG = process.env.NEXT_PUBLIC_ORIGINAL_PACKAGE_ID || PACKAGE_ID;

  const [eventsNew, eventsOld] = await Promise.all([
    queryEvents(`${PACKAGE_ID}::asset_pool::AssetTypeCreated`, null, 50),
    queryEvents(`${ORIG}::asset_pool::AssetTypeCreated`, null, 50),
  ]);

  const allEvents = [...eventsNew.data, ...eventsOld.data];
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
