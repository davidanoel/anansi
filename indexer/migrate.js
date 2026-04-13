import dotenv from "dotenv";
dotenv.config({ path: new URL("./.env", import.meta.url).pathname });

import pgp from "pg-promise";
import { config } from "./config.js";

const db = pgp()(config.dbUrl);

async function migrate() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS lots (
        id TEXT PRIMARY KEY,
        lot_number INTEGER,
        asset_type_symbol TEXT,
        status INTEGER DEFAULT 0,
        total_units BIGINT DEFAULT 0,
        total_tokens_minted BIGINT DEFAULT 0,
        estimated_value_usdc BIGINT DEFAULT 0,
        custodian TEXT,
        created_at BIGINT,
        closed_at BIGINT,
        total_surplus_deposited BIGINT DEFAULT 0,
        total_surplus_distributed BIGINT DEFAULT 0,
        delivery_count INTEGER DEFAULT 0,
        updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS deliveries (
        id SERIAL PRIMARY KEY,
        lot_id TEXT,
        farmer TEXT,
        units BIGINT,
        tokens_minted BIGINT,
        grade TEXT,
        tx_digest TEXT,
        timestamp BIGINT,
        FOREIGN KEY (lot_id) REFERENCES lots(id)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS surplus_deposits (
        id SERIAL PRIMARY KEY,
        deposit_id TEXT UNIQUE,
        lot_id TEXT,
        gross_amount BIGINT,
        fee_amount BIGINT,
        net_amount BIGINT,
        tokens_snapshot BIGINT,
        tx_digest TEXT UNIQUE,
        timestamp BIGINT,
        FOREIGN KEY (lot_id) REFERENCES lots(id)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS surplus_claims (
        id SERIAL PRIMARY KEY,
        deposit_id TEXT,
        lot_id TEXT,
        claimant TEXT,
        tokens_held BIGINT,
        amount_received BIGINT,
        tx_digest TEXT UNIQUE,
        timestamp BIGINT
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS carib_burns (
        id SERIAL PRIMARY KEY,
        amount BIGINT,
        burner TEXT,
        total_burned BIGINT,
        tx_digest TEXT,
        timestamp BIGINT
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS fee_collections (
        id SERIAL PRIMARY KEY,
        lot_id TEXT,
        total_fee BIGINT,
        burned BIGINT,
        to_treasury BIGINT,
        tx_digest TEXT,
        timestamp BIGINT
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS indexer_state (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS asset_types (
        symbol TEXT PRIMARY KEY,
        object_id TEXT,
        name TEXT,
        unit TEXT,
        region TEXT,
        custodian TEXT,
        active INTEGER DEFAULT 1,
        created_at BIGINT
      )
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_deliveries_farmer ON deliveries(farmer)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_deliveries_lot ON deliveries(lot_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_lots_status ON lots(status)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_lots_symbol ON lots(asset_type_symbol)`);

    console.log("Database migrated successfully");
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  } finally {
    await db.$pool.end();
  }
}

migrate().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
