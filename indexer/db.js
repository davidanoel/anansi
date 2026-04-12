import Database from "better-sqlite3";
import { config } from "./config.js";

let db = null;

export function getDb() {
  if (!db) {
    db = new Database(config.dbPath);
    db.pragma("journal_mode = WAL");
  }
  return db;
}

// ============ Lots ============

export function upsertLot(lot) {
  const db = getDb();
  db.prepare(
    `
    INSERT INTO lots (id, lot_number, asset_type_symbol, status, custodian, created_at)
    VALUES (?, ?, ?, 0, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = COALESCE(excluded.status, status),
      updated_at = strftime('%s','now') * 1000
  `,
  ).run(lot.id, lot.lot_number, lot.asset_type_symbol, lot.custodian, lot.created_at);
}

export function updateLotStatus(lotId, status) {
  getDb()
    .prepare("UPDATE lots SET status = ?, updated_at = strftime('%s','now') * 1000 WHERE id = ?")
    .run(status, lotId);
}

export function updateLotDelivery(lotId, units, tokensMinted) {
  getDb()
    .prepare(
      `
    UPDATE lots SET
      total_units = total_units + ?,
      total_tokens_minted = total_tokens_minted + ?,
      delivery_count = delivery_count + 1,
      updated_at = strftime('%s','now') * 1000
    WHERE id = ?
  `,
    )
    .run(units, tokensMinted, lotId);
}

export function updateLotValuation(lotId, valueUsdc) {
  getDb()
    .prepare(
      "UPDATE lots SET estimated_value_usdc = ?, updated_at = strftime('%s','now') * 1000 WHERE id = ?",
    )
    .run(valueUsdc, lotId);
}

export function getLot(lotId) {
  return getDb().prepare("SELECT * FROM lots WHERE id = ?").get(lotId);
}

export function getActiveLots() {
  return getDb().prepare("SELECT * FROM lots WHERE status < 3 ORDER BY created_at DESC").all();
}

export function getAllLots() {
  return getDb().prepare("SELECT * FROM lots ORDER BY created_at DESC").all();
}

// ============ Deliveries ============

export function insertDelivery(delivery) {
  getDb()
    .prepare(
      `
    INSERT INTO deliveries (lot_id, farmer, units, tokens_minted, grade, tx_digest, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
    )
    .run(
      delivery.lot_id,
      delivery.farmer,
      delivery.units,
      delivery.tokens_minted,
      delivery.grade,
      delivery.tx_digest,
      delivery.timestamp,
    );
}

export function getDeliveriesByLot(lotId) {
  return getDb()
    .prepare("SELECT * FROM deliveries WHERE lot_id = ? ORDER BY timestamp DESC")
    .all(lotId);
}

export function getDeliveriesByFarmer(farmer) {
  return getDb()
    .prepare("SELECT * FROM deliveries WHERE farmer = ? ORDER BY timestamp DESC")
    .all(farmer);
}

// ============ Token Balances ============

export function getParticipantsByLot(lotId) {
  return getDb()
    .prepare(
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
      WHERE d.lot_id = ?
      GROUP BY d.farmer
      ORDER BY tokens_minted DESC, delivered_units DESC
    `,
    )
    .all(lotId);
}

export function getParticipationByAddress(address) {
  return getDb()
    .prepare(
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
      WHERE d.farmer = ?
      GROUP BY d.lot_id, l.asset_type_symbol
      ORDER BY last_delivery_at DESC
    `,
    )
    .all(address);
}

// ============ Surplus ============

export function insertSurplusDeposit(deposit) {
  getDb()
    .prepare(
      `
    INSERT OR IGNORE INTO surplus_deposits (
      deposit_id, lot_id, gross_amount, fee_amount, net_amount, tokens_snapshot, tx_digest, timestamp
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    )
    .run(
      deposit.deposit_id,
      deposit.lot_id,
      deposit.gross_amount,
      deposit.fee_amount,
      deposit.net_amount,
      deposit.tokens_snapshot,
      deposit.tx_digest,
      deposit.timestamp,
    );

  getDb()
    .prepare(
      `
    UPDATE lots
    SET total_surplus_deposited = total_surplus_deposited + ?
    WHERE id = ?
  `,
    )
    .run(deposit.gross_amount, deposit.lot_id);
}

export function insertSurplusClaim(claim) {
  getDb()
    .prepare(
      `
    INSERT INTO surplus_claims (
      deposit_id, lot_id, claimant, tokens_held, amount_received, tx_digest, timestamp
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
    )
    .run(
      claim.deposit_id,
      claim.lot_id,
      claim.claimant,
      claim.tokens_held,
      claim.amount_received,
      claim.tx_digest,
      claim.timestamp,
    );

  getDb()
    .prepare(
      `
    UPDATE lots
    SET total_surplus_distributed = total_surplus_distributed + ?
    WHERE id = ?
  `,
    )
    .run(claim.amount_received, claim.lot_id);
}

// ============ CaribCoin ============

export function insertBurn(burn) {
  getDb()
    .prepare(
      `
    INSERT INTO carib_burns (amount, burner, total_burned, tx_digest, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `,
    )
    .run(burn.amount, burn.burner, burn.total_burned, burn.tx_digest, burn.timestamp);
}

export function insertFeeCollection(fee) {
  getDb()
    .prepare(
      `
    INSERT INTO fee_collections (lot_id, total_fee, burned, to_treasury, tx_digest, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    )
    .run(fee.lot_id, fee.total_fee, fee.burned, fee.to_treasury, fee.tx_digest, fee.timestamp);
}

export function getTotalBurned() {
  const row = getDb()
    .prepare("SELECT COALESCE(MAX(total_burned), 0) as total FROM carib_burns")
    .get();
  return row.total;
}

// ============ Asset Types ============

export function setAssetTypeActive(symbol, active) {
  getDb()
    .prepare(
      `
    UPDATE asset_types
    SET active = ?
    WHERE symbol = ?
  `,
    )
    .run(active ? 1 : 0, symbol);
}

export function upsertAssetType(assetType) {
  getDb()
    .prepare(
      `
    INSERT INTO asset_types (symbol, object_id, name, unit, region, custodian, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(symbol) DO UPDATE SET
      object_id = COALESCE(excluded.object_id, asset_types.object_id),
      name = COALESCE(excluded.name, asset_types.name),
      unit = COALESCE(excluded.unit, asset_types.unit),
      region = COALESCE(excluded.region, asset_types.region),
      custodian = COALESCE(excluded.custodian, asset_types.custodian),
      active = COALESCE(excluded.active, asset_types.active)
  `,
    )
    .run(
      assetType.symbol,
      assetType.object_id || null,
      assetType.name,
      assetType.unit || null,
      assetType.region,
      assetType.custodian,
      assetType.active ?? 1,
      assetType.created_at,
    );
}

export function getAssetTypes() {
  return getDb().prepare("SELECT * FROM asset_types").all();
}

// ============ Indexer State ============

export function getCursor(key) {
  const row = getDb().prepare("SELECT value FROM indexer_state WHERE key = ?").get(key);
  return row?.value || null;
}

export function setCursor(key, value) {
  getDb()
    .prepare(
      "INSERT INTO indexer_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    )
    .run(key, value);
}

// ============ Stats ============

export function getStats() {
  const db = getDb();
  return {
    totalLots: db.prepare("SELECT COUNT(*) as count FROM lots").get().count,
    activeLots: db.prepare("SELECT COUNT(*) as count FROM lots WHERE status < 3").get().count,
    totalDeliveries: db.prepare("SELECT COUNT(*) as count FROM deliveries").get().count,
    totalUnitsTokenized: db.prepare("SELECT COALESCE(SUM(total_units), 0) as total FROM lots").get()
      .total,
    totalSurplusDeposited: db
      .prepare("SELECT COALESCE(SUM(total_surplus_deposited), 0) as total FROM lots")
      .get().total,
    totalSurplusDistributed: db
      .prepare("SELECT COALESCE(SUM(total_surplus_distributed), 0) as total FROM lots")
      .get().total,
    totalCaribBurned: getTotalBurned(),
    uniqueFarmers: db.prepare("SELECT COUNT(DISTINCT farmer) as count FROM deliveries").get().count,
    assetTypes: db.prepare("SELECT COUNT(*) as count FROM asset_types").get().count,
  };
}
