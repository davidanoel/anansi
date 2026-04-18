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
        event_key TEXT UNIQUE,
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
        event_key TEXT UNIQUE,
        lot_id TEXT,
        source TEXT,
        total_fee BIGINT,
        burned BIGINT,
        to_treasury BIGINT,
        cumulative_burned BIGINT,
        processor TEXT,
        tx_digest TEXT,
        timestamp BIGINT
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS fee_converter_updates (
        id SERIAL PRIMARY KEY,
        event_key TEXT UNIQUE,
        update_type TEXT,
        old_bps BIGINT,
        new_bps BIGINT,
        old_address TEXT,
        new_address TEXT,
        tx_digest TEXT,
        timestamp BIGINT
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS staking_events (
        id SERIAL PRIMARY KEY,
        event_key TEXT UNIQUE,
        event_type TEXT,
        staker TEXT,
        position_id TEXT,
        amount BIGINT,
        new_total BIGINT,
        restored_amount BIGINT,
        cooldown_ends_at BIGINT,
        tx_digest TEXT,
        timestamp BIGINT
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS staking_config_updates (
        id SERIAL PRIMARY KEY,
        event_key TEXT UNIQUE,
        update_type TEXT,
        old_value BIGINT,
        new_value BIGINT,
        governance BIGINT,
        premium BIGINT,
        fee_reduction BIGINT,
        priority_access BIGINT,
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

    await db.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        address TEXT PRIMARY KEY,
        email TEXT,
        name TEXT,
        picture TEXT,
        created_at BIGINT,
        updated_at BIGINT
      )
    `);

    await db.query(`
      ALTER TABLE fee_collections
      ADD COLUMN IF NOT EXISTS event_key TEXT,
      ADD COLUMN IF NOT EXISTS source TEXT,
      ADD COLUMN IF NOT EXISTS cumulative_burned BIGINT,
      ADD COLUMN IF NOT EXISTS processor TEXT
    `);

    await db.query(`
      ALTER TABLE carib_burns
      ADD COLUMN IF NOT EXISTS event_key TEXT
    `);

    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_fee_collections_event_key
      ON fee_collections(event_key)
      WHERE event_key IS NOT NULL
    `);
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_carib_burns_event_key
      ON carib_burns(event_key)
      WHERE event_key IS NOT NULL
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_deliveries_farmer ON deliveries(farmer)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_deliveries_lot ON deliveries(lot_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_lots_status ON lots(status)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_lots_symbol ON lots(asset_type_symbol)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON user_profiles(updated_at)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_fee_collections_timestamp ON fee_collections(timestamp DESC)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_staking_events_timestamp ON staking_events(timestamp DESC)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_staking_config_updates_timestamp ON staking_config_updates(timestamp DESC)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_fee_converter_updates_timestamp ON fee_converter_updates(timestamp DESC)`);

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
