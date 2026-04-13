import pgp from "pg-promise";
import { config } from "./config.js";

const pgpInstance = pgp();
let db = null;

export function getDb() {
  if (!db) {
    db = pgpInstance(config.dbUrl);
  }
  return db;
}

// ============ Lots ============

export async function upsertLot(lot) {
  const db = getDb();
  await db.query(
    `
    INSERT INTO lots (id, lot_number, asset_type_symbol, status, custodian, created_at)
    VALUES ($1, $2, $3, 0, $4, $5)
    ON CONFLICT(id) DO UPDATE SET
      status = COALESCE(excluded.status, lots.status),
      updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
  `,
    [lot.id, lot.lot_number, lot.asset_type_symbol, lot.custodian, lot.created_at],
  );
}

export async function updateLotStatus(lotId, status) {
  const db = getDb();
  await db.query(
    "UPDATE lots SET status = $1, updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT WHERE id = $2",
    [status, lotId],
  );
}

export async function updateLotDelivery(lotId, units, tokensMinted) {
  const db = getDb();
  await db.query(
    `
    UPDATE lots SET
      total_units = total_units + $1,
      total_tokens_minted = total_tokens_minted + $2,
      delivery_count = delivery_count + 1,
      updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
    WHERE id = $3
  `,
    [units, tokensMinted, lotId],
  );
}

export async function updateLotValuation(lotId, valueUsdc) {
  const db = getDb();
  await db.query(
    "UPDATE lots SET estimated_value_usdc = $1, updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT WHERE id = $2",
    [valueUsdc, lotId],
  );
}

export async function getLot(lotId) {
  const db = getDb();
  return await db.oneOrNone("SELECT * FROM lots WHERE id = $1", [lotId]);
}

export async function getActiveLots() {
  const db = getDb();
  return await db.query("SELECT * FROM lots WHERE status < 3 ORDER BY created_at DESC");
}

export async function getAllLots() {
  const db = getDb();
  return await db.query("SELECT * FROM lots ORDER BY created_at DESC");
}

// ============ Deliveries ============

export async function insertDelivery(delivery) {
  const db = getDb();
  await db.query(
    `
    INSERT INTO deliveries (lot_id, farmer, units, tokens_minted, grade, tx_digest, timestamp)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `,
    [
      delivery.lot_id,
      delivery.farmer,
      delivery.units,
      delivery.tokens_minted,
      delivery.grade,
      delivery.tx_digest,
      delivery.timestamp,
    ],
  );
}

export async function getDeliveriesByLot(lotId) {
  const db = getDb();
  return await db.query("SELECT * FROM deliveries WHERE lot_id = $1 ORDER BY timestamp DESC", [
    lotId,
  ]);
}

export async function getDeliveriesByFarmer(farmer) {
  const db = getDb();
  return await db.query("SELECT * FROM deliveries WHERE farmer = $1 ORDER BY timestamp DESC", [
    farmer,
  ]);
}

// ============ Token Balances ============

export async function getParticipantsByLot(lotId) {
  const db = getDb();
  return await db.query(
    `
      SELECT
        d.farmer as address,
        SUM(d.units) as delivered_units,
        SUM(d.tokens_minted) as tokens_minted,
        COUNT(*) as delivery_count,
        COALESCE((
          SELECT SUM(sc.amount_received)
          FROM surplus_claims sc
          WHERE sc.lot_id = d.lot_id AND sc.claimant = d.farmer
        ), 0) as total_claimed,
        MAX(d.timestamp) as last_delivery_at
      FROM deliveries d
      WHERE d.lot_id = $1
      GROUP BY d.farmer
      ORDER BY tokens_minted DESC, delivered_units DESC
    `,
    [lotId],
  );
}

export async function getParticipationByAddress(address) {
  const db = getDb();
  return await db.query(
    `
      SELECT
        d.lot_id,
        l.asset_type_symbol,
        SUM(d.units) as delivered_units,
        SUM(d.tokens_minted) as tokens_minted,
        COUNT(*) as delivery_count,
        COALESCE((
          SELECT SUM(sc.amount_received)
          FROM surplus_claims sc
          WHERE sc.lot_id = d.lot_id AND sc.claimant = d.farmer
        ), 0) as total_claimed,
        MAX(d.timestamp) as last_delivery_at
      FROM deliveries d
      LEFT JOIN lots l ON l.id = d.lot_id
      WHERE d.farmer = $1
      GROUP BY d.lot_id, l.asset_type_symbol
      ORDER BY last_delivery_at DESC
    `,
    [address],
  );
}

// ============ Surplus ============

export async function insertSurplusDeposit(deposit) {
  const db = getDb();

  const inserted = await db.result(
    `
    INSERT INTO surplus_deposits (
      deposit_id, lot_id, gross_amount, fee_amount, net_amount, tokens_snapshot, tx_digest, timestamp
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT(tx_digest) DO NOTHING
  `,
    [
      deposit.deposit_id,
      deposit.lot_id,
      deposit.gross_amount,
      deposit.fee_amount,
      deposit.net_amount,
      deposit.tokens_snapshot,
      deposit.tx_digest,
      deposit.timestamp,
    ],
  );

  if (inserted.rowCount > 0) {
    await db.query(
      `
      UPDATE lots
      SET total_surplus_deposited = total_surplus_deposited + $1
      WHERE id = $2
    `,
      [deposit.gross_amount, deposit.lot_id],
    );
  }
}

export async function insertSurplusClaim(claim) {
  const db = getDb();

  const inserted = await db.result(
    `
    INSERT INTO surplus_claims (
      deposit_id, lot_id, claimant, tokens_held, amount_received, tx_digest, timestamp
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT(tx_digest) DO NOTHING
  `,
    [
      claim.deposit_id,
      claim.lot_id,
      claim.claimant,
      claim.tokens_held,
      claim.amount_received,
      claim.tx_digest,
      claim.timestamp,
    ],
  );

  if (inserted.rowCount > 0) {
    await db.query(
      `
      UPDATE lots
      SET total_surplus_distributed = total_surplus_distributed + $1
      WHERE id = $2
    `,
      [claim.amount_received, claim.lot_id],
    );
  }
}

// ============ CaribCoin ============

export async function insertBurn(burn) {
  const db = getDb();
  await db.query(
    `
    INSERT INTO carib_burns (amount, burner, total_burned, tx_digest, timestamp)
    VALUES ($1, $2, $3, $4, $5)
  `,
    [burn.amount, burn.burner, burn.total_burned, burn.tx_digest, burn.timestamp],
  );
}

export async function insertFeeCollection(fee) {
  const db = getDb();
  await db.query(
    `
    INSERT INTO fee_collections (lot_id, total_fee, burned, to_treasury, tx_digest, timestamp)
    VALUES ($1, $2, $3, $4, $5, $6)
  `,
    [fee.lot_id, fee.total_fee, fee.burned, fee.to_treasury, fee.tx_digest, fee.timestamp],
  );
}

export async function getTotalBurned() {
  const db = getDb();
  const row = await db.oneOrNone("SELECT COALESCE(MAX(total_burned), 0) as total FROM carib_burns");
  return row?.total || 0;
}

// ============ Asset Types ============

export async function setAssetTypeActive(symbol, active) {
  const db = getDb();
  await db.query(
    `
    UPDATE asset_types
    SET active = $1
    WHERE symbol = $2
  `,
    [active ? 1 : 0, symbol],
  );
}

export async function upsertAssetType(assetType) {
  const db = getDb();
  await db.query(
    `
    INSERT INTO asset_types (symbol, object_id, name, unit, region, custodian, active, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT(symbol) DO UPDATE SET
      object_id = COALESCE(excluded.object_id, asset_types.object_id),
      name = COALESCE(excluded.name, asset_types.name),
      unit = COALESCE(excluded.unit, asset_types.unit),
      region = COALESCE(excluded.region, asset_types.region),
      custodian = COALESCE(excluded.custodian, asset_types.custodian),
      active = COALESCE(excluded.active, asset_types.active)
  `,
    [
      assetType.symbol,
      assetType.object_id || null,
      assetType.name,
      assetType.unit || null,
      assetType.region,
      assetType.custodian,
      assetType.active ?? 1,
      assetType.created_at,
    ],
  );
}

export async function getAssetTypes() {
  const db = getDb();
  return await db.query("SELECT * FROM asset_types");
}

// ============ Indexer State ============

export async function getCursor(key) {
  const db = getDb();
  const row = await db.oneOrNone("SELECT value FROM indexer_state WHERE key = $1", [key]);
  return row?.value || null;
}

export async function setCursor(key, value) {
  const db = getDb();
  await db.query(
    "INSERT INTO indexer_state (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value],
  );
}

// ============ Stats ============

export async function getStats() {
  const db = getDb();
  const totalLots = await db.one("SELECT COUNT(*) as count FROM lots");
  const activeLots = await db.one("SELECT COUNT(*) as count FROM lots WHERE status < 3");
  const totalDeliveries = await db.one("SELECT COUNT(*) as count FROM deliveries");
  const totalUnitsTokenized = await db.one(
    "SELECT COALESCE(SUM(total_units), 0) as total FROM lots",
  );
  const totalSurplusDeposited = await db.one(
    "SELECT COALESCE(SUM(total_surplus_deposited), 0) as total FROM lots",
  );
  const totalSurplusDistributed = await db.one(
    "SELECT COALESCE(SUM(total_surplus_distributed), 0) as total FROM lots",
  );
  const totalCaribBurned = await getTotalBurned();
  const uniqueFarmers = await db.one("SELECT COUNT(DISTINCT farmer) as count FROM deliveries");
  const assetTypes = await db.one("SELECT COUNT(*) as count FROM asset_types");

  return {
    totalLots: totalLots.count,
    activeLots: activeLots.count,
    totalDeliveries: totalDeliveries.count,
    totalUnitsTokenized: totalUnitsTokenized.total,
    totalSurplusDeposited: totalSurplusDeposited.total,
    totalSurplusDistributed: totalSurplusDistributed.total,
    totalCaribBurned,
    uniqueFarmers: uniqueFarmers.count,
    assetTypes: assetTypes.count,
  };
}
