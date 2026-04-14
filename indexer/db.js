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


// ============ User Profiles ============

export async function upsertUserProfile(profile) {
  const db = getDb();
  const now = Date.now();
  const email = typeof profile.email === "string" ? profile.email.trim().toLowerCase() : null;
  const name = typeof profile.name === "string" ? profile.name.trim() : null;
  const picture = typeof profile.picture === "string" ? profile.picture.trim() : null;

  await db.query(
    `
      INSERT INTO user_profiles (address, email, name, picture, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT(address) DO UPDATE SET
        email = COALESCE(excluded.email, user_profiles.email),
        name = COALESCE(excluded.name, user_profiles.name),
        picture = COALESCE(excluded.picture, user_profiles.picture),
        updated_at = excluded.updated_at
    `,
    [profile.address, email, name, picture, now, now],
  );
}

export async function getFarmerDirectory(options = {}) {
  const db = getDb();
  const assetTypeSymbol = options.assetTypeSymbol || null;
  const search = options.search ? `%${options.search.trim().toLowerCase()}%` : null;
  const limit = Number.isFinite(options.limit) ? options.limit : 25;

  return await db.query(
    `
      WITH delivery_rollup AS (
        SELECT
          d.farmer AS address,
          COUNT(*) AS prior_deliveries,
          COUNT(DISTINCT d.lot_id) AS lots_participated,
          MAX(d.timestamp) AS last_delivery_at,
          STRING_AGG(DISTINCT COALESCE(l.asset_type_symbol, ''), ', ') FILTER (WHERE l.asset_type_symbol IS NOT NULL) AS asset_types
        FROM deliveries d
        LEFT JOIN lots l ON l.id = d.lot_id
        WHERE ($1::TEXT IS NULL OR l.asset_type_symbol = $1)
        GROUP BY d.farmer
      )
      SELECT
        COALESCE(u.address, d.address) AS address,
        u.email,
        u.name,
        u.picture,
        COALESCE(d.prior_deliveries, 0) AS prior_deliveries,
        COALESCE(d.lots_participated, 0) AS lots_participated,
        d.last_delivery_at,
        COALESCE(d.asset_types, '') AS asset_types,
        u.updated_at
      FROM user_profiles u
      FULL OUTER JOIN delivery_rollup d ON d.address = u.address
      WHERE ($2::TEXT IS NULL
        OR LOWER(COALESCE(u.email, '')) LIKE $2
        OR LOWER(COALESCE(u.name, '')) LIKE $2
        OR LOWER(COALESCE(COALESCE(u.address, d.address), '')) LIKE $2)
      ORDER BY
        CASE WHEN u.email IS NOT NULL OR u.name IS NOT NULL THEN 0 ELSE 1 END,
        GREATEST(COALESCE(u.updated_at, 0), COALESCE(d.last_delivery_at, 0)) DESC,
        COALESCE(u.email, COALESCE(u.address, d.address)) ASC
      LIMIT $3
    `,
    [assetTypeSymbol, search, limit],
  );
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


export async function getAnalyticsOverview() {
  const db = getDb();
  return await db.one(`
    WITH latest_activity AS (
      SELECT MAX(ts) AS latest_indexed_event_at
      FROM (
        SELECT MAX(created_at) AS ts FROM lots
        UNION ALL
        SELECT MAX(timestamp) AS ts FROM deliveries
        UNION ALL
        SELECT MAX(timestamp) AS ts FROM surplus_deposits
        UNION ALL
        SELECT MAX(timestamp) AS ts FROM surplus_claims
        UNION ALL
        SELECT MAX(timestamp) AS ts FROM carib_burns
        UNION ALL
        SELECT MAX(timestamp) AS ts FROM fee_collections
      ) events
    )
    SELECT
      (SELECT COUNT(*) FROM asset_types) AS total_asset_types,
      (SELECT COUNT(*) FROM lots) AS total_lots,
      (SELECT COUNT(*) FROM lots WHERE status < 3) AS active_lots,
      (SELECT COUNT(*) FROM lots WHERE status = 3) AS closed_lots,
      (SELECT COUNT(*) FROM deliveries) AS total_deliveries,
      (SELECT COUNT(DISTINCT farmer) FROM deliveries) AS unique_farmers,
      (SELECT COALESCE(SUM(total_units), 0) FROM lots) AS total_units_tokenized,
      (SELECT COALESCE(SUM(total_tokens_minted), 0) FROM lots) AS total_tokens_minted,
      (SELECT COUNT(*) FROM surplus_deposits) AS surplus_deposit_count,
      (SELECT COUNT(*) FROM surplus_claims) AS surplus_claim_count,
      (SELECT COALESCE(SUM(total_surplus_deposited), 0) FROM lots) AS total_surplus_deposited,
      (SELECT COALESCE(SUM(total_surplus_distributed), 0) FROM lots) AS total_surplus_distributed,
      (SELECT COALESCE(SUM(total_fee), 0) FROM fee_collections) AS total_fees_collected,
      (SELECT COALESCE(MAX(total_burned), 0) FROM carib_burns) AS total_carib_burned,
      (
        SELECT COALESCE(SUM(total_surplus_distributed), 0)::FLOAT
          / NULLIF(COALESCE(SUM(total_surplus_deposited), 0), 0)
        FROM lots
      ) AS claim_rate,
      (SELECT latest_indexed_event_at FROM latest_activity) AS latest_indexed_event_at,
      (SELECT COUNT(*) FROM indexer_state) AS cursor_count
  `);
}

export async function getDeliveriesOverTime(days = 14) {
  const db = getDb();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return await db.query(
    `
      SELECT
        TO_CHAR(TO_TIMESTAMP(timestamp / 1000), 'YYYY-MM-DD') AS date,
        COUNT(*) AS deliveries_count,
        COALESCE(SUM(units), 0) AS total_units,
        COALESCE(SUM(tokens_minted), 0) AS total_tokens_minted
      FROM deliveries
      WHERE timestamp >= $1
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    [cutoff],
  );
}

export async function getAnalyticsByAssetType() {
  const db = getDb();
  return await db.query(`
    WITH lot_rollup AS (
      SELECT
        asset_type_symbol,
        COUNT(*) AS lot_count,
        COUNT(*) FILTER (WHERE status < 3) AS active_lot_count,
        COUNT(*) FILTER (WHERE status = 3) AS closed_lot_count,
        COALESCE(SUM(total_units), 0) AS total_units,
        COALESCE(SUM(total_tokens_minted), 0) AS total_tokens_minted,
        COALESCE(SUM(total_surplus_deposited), 0) AS total_surplus_deposited,
        COALESCE(SUM(total_surplus_distributed), 0) AS total_surplus_distributed
      FROM lots
      GROUP BY asset_type_symbol
    ),
    delivery_rollup AS (
      SELECT
        l.asset_type_symbol,
        COUNT(*) AS deliveries_count
      FROM deliveries d
      JOIN lots l ON l.id = d.lot_id
      GROUP BY l.asset_type_symbol
    )
    SELECT
      a.symbol,
      a.name,
      a.unit,
      a.region,
      a.active,
      COALESCE(lr.lot_count, 0) AS lot_count,
      COALESCE(lr.active_lot_count, 0) AS active_lot_count,
      COALESCE(lr.closed_lot_count, 0) AS closed_lot_count,
      COALESCE(dr.deliveries_count, 0) AS deliveries_count,
      COALESCE(lr.total_units, 0) AS total_units,
      COALESCE(lr.total_tokens_minted, 0) AS total_tokens_minted,
      COALESCE(lr.total_surplus_deposited, 0) AS total_surplus_deposited,
      COALESCE(lr.total_surplus_distributed, 0) AS total_surplus_distributed
    FROM asset_types a
    LEFT JOIN lot_rollup lr ON lr.asset_type_symbol = a.symbol
    LEFT JOIN delivery_rollup dr ON dr.asset_type_symbol = a.symbol
    ORDER BY COALESCE(lr.total_units, 0) DESC, a.symbol ASC
  `);
}

export async function getAnalyticsFarmers(limit = 10) {
  const db = getDb();
  return await db.query(
    `
      WITH delivery_rollup AS (
        SELECT
          farmer AS address,
          COUNT(*) AS delivery_count,
          COUNT(DISTINCT lot_id) AS lots_participated,
          COALESCE(SUM(units), 0) AS total_units_delivered,
          COALESCE(SUM(tokens_minted), 0) AS total_tokens_minted,
          MAX(timestamp) AS last_delivery_at
        FROM deliveries
        GROUP BY farmer
      ),
      claim_rollup AS (
        SELECT
          claimant AS address,
          COUNT(*) AS claim_count,
          COALESCE(SUM(amount_received), 0) AS total_surplus_claimed,
          MAX(timestamp) AS last_claim_at
        FROM surplus_claims
        GROUP BY claimant
      )
      SELECT
        d.address,
        d.delivery_count,
        d.lots_participated,
        d.total_units_delivered,
        d.total_tokens_minted,
        COALESCE(c.claim_count, 0) AS claim_count,
        COALESCE(c.total_surplus_claimed, 0) AS total_surplus_claimed,
        GREATEST(d.last_delivery_at, COALESCE(c.last_claim_at, 0)) AS last_activity_at,
        CASE WHEN d.delivery_count > 1 OR d.lots_participated > 1 THEN TRUE ELSE FALSE END AS repeat_farmer
      FROM delivery_rollup d
      LEFT JOIN claim_rollup c ON c.address = d.address
      ORDER BY d.total_units_delivered DESC, d.total_tokens_minted DESC
      LIMIT $1
    `,
    [limit],
  );
}

export async function getRecentActivity(limit = 25) {
  const db = getDb();
  return await db.query(
    `
      SELECT *
      FROM (
        SELECT
          l.created_at AS timestamp,
          'lot_created' AS kind,
          l.id AS reference_id,
          l.id AS lot_id,
          l.asset_type_symbol,
          l.custodian AS actor,
          NULL::TEXT AS tx_digest,
          l.lot_number::TEXT AS label,
          NULL::BIGINT AS amount,
          NULL::BIGINT AS secondary_amount
        FROM lots l

        UNION ALL

        SELECT
          d.timestamp,
          'delivery_recorded' AS kind,
          d.tx_digest AS reference_id,
          d.lot_id,
          l.asset_type_symbol,
          d.farmer AS actor,
          d.tx_digest,
          d.grade AS label,
          d.units AS amount,
          d.tokens_minted AS secondary_amount
        FROM deliveries d
        LEFT JOIN lots l ON l.id = d.lot_id

        UNION ALL

        SELECT
          sd.timestamp,
          'surplus_received' AS kind,
          COALESCE(sd.deposit_id, sd.tx_digest) AS reference_id,
          sd.lot_id,
          l.asset_type_symbol,
          l.custodian AS actor,
          sd.tx_digest,
          NULL::TEXT AS label,
          sd.net_amount AS amount,
          sd.gross_amount AS secondary_amount
        FROM surplus_deposits sd
        LEFT JOIN lots l ON l.id = sd.lot_id

        UNION ALL

        SELECT
          sc.timestamp,
          'surplus_claimed' AS kind,
          COALESCE(sc.deposit_id, sc.tx_digest) AS reference_id,
          sc.lot_id,
          l.asset_type_symbol,
          sc.claimant AS actor,
          sc.tx_digest,
          NULL::TEXT AS label,
          sc.amount_received AS amount,
          sc.tokens_held AS secondary_amount
        FROM surplus_claims sc
        LEFT JOIN lots l ON l.id = sc.lot_id

        UNION ALL

        SELECT
          cb.timestamp,
          'carib_burned' AS kind,
          cb.tx_digest AS reference_id,
          NULL::TEXT AS lot_id,
          NULL::TEXT AS asset_type_symbol,
          cb.burner AS actor,
          cb.tx_digest,
          NULL::TEXT AS label,
          cb.amount AS amount,
          cb.total_burned AS secondary_amount
        FROM carib_burns cb
      ) activity
      ORDER BY timestamp DESC
      LIMIT $1
    `,
    [limit],
  );
}

export async function getLotAnalyticsSummary(lotId) {
  const db = getDb();
  const [lot, deliveries, participants, depositSummary, recentClaims] = await Promise.all([
    getLot(lotId),
    getDeliveriesByLot(lotId),
    getParticipantsByLot(lotId),
    db.one(
      `
        SELECT
          COUNT(*) AS deposit_count,
          COALESCE(SUM(gross_amount), 0) AS total_gross_deposited,
          COALESCE(SUM(net_amount), 0) AS total_net_deposited,
          COALESCE(SUM(fee_amount), 0) AS total_fees,
          (
            SELECT COUNT(*) FROM surplus_claims WHERE lot_id = $1
          ) AS claim_count,
          (
            SELECT COALESCE(SUM(amount_received), 0) FROM surplus_claims WHERE lot_id = $1
          ) AS total_claimed
        FROM surplus_deposits
        WHERE lot_id = $1
      `,
      [lotId],
    ),
    db.query(
      `
        SELECT deposit_id, claimant, tokens_held, amount_received, tx_digest, timestamp
        FROM surplus_claims
        WHERE lot_id = $1
        ORDER BY timestamp DESC
        LIMIT 25
      `,
      [lotId],
    ),
  ]);

  if (!lot) return null;

  return {
    lot,
    deliveries,
    participants,
    surplus: {
      ...depositSummary,
      remaining_unclaimed:
        Number(depositSummary.total_net_deposited || 0) - Number(depositSummary.total_claimed || 0),
    },
    recentClaims,
  };
}
