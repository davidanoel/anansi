import Database from 'better-sqlite3'
import { config } from './config.js'

const db = new Database(config.dbPath)

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL')

db.exec(`
  -- Lots (asset pool batches)
  CREATE TABLE IF NOT EXISTS lots (
    id TEXT PRIMARY KEY,
    lot_number INTEGER,
    asset_type_symbol TEXT,
    status INTEGER DEFAULT 0,
    total_units INTEGER DEFAULT 0,
    total_tokens_minted INTEGER DEFAULT 0,
    estimated_value_usdc INTEGER DEFAULT 0,
    custodian TEXT,
    created_at INTEGER,
    closed_at INTEGER,
    total_surplus_deposited INTEGER DEFAULT 0,
    total_surplus_distributed INTEGER DEFAULT 0,
    delivery_count INTEGER DEFAULT 0,
    updated_at INTEGER DEFAULT (strftime('%s','now') * 1000)
  );

  -- Deliveries
  CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lot_id TEXT,
    farmer TEXT,
    units INTEGER,
    tokens_minted INTEGER,
    grade TEXT,
    tx_digest TEXT,
    timestamp INTEGER,
    FOREIGN KEY (lot_id) REFERENCES lots(id)
  );

  -- Token balances (aggregated view — updated on each transfer/mint event)
  CREATE TABLE IF NOT EXISTS token_balances (
    address TEXT,
    lot_id TEXT,
    balance INTEGER DEFAULT 0,
    updated_at INTEGER,
    PRIMARY KEY (address, lot_id)
  );

  -- Surplus distributions
  CREATE TABLE IF NOT EXISTS surplus_deposits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lot_id TEXT,
    gross_amount INTEGER,
    fee_amount INTEGER,
    net_amount INTEGER,
    tokens_snapshot INTEGER,
    tx_digest TEXT,
    timestamp INTEGER,
    FOREIGN KEY (lot_id) REFERENCES lots(id)
  );

  -- Surplus claims
  CREATE TABLE IF NOT EXISTS surplus_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lot_id TEXT,
    claimant TEXT,
    tokens_redeemed INTEGER,
    usdc_received INTEGER,
    tx_digest TEXT,
    timestamp INTEGER
  );

  -- CaribCoin burns
  CREATE TABLE IF NOT EXISTS carib_burns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount INTEGER,
    burner TEXT,
    total_burned INTEGER,
    tx_digest TEXT,
    timestamp INTEGER
  );

  -- Fee collections
  CREATE TABLE IF NOT EXISTS fee_collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lot_id TEXT,
    total_fee INTEGER,
    burned INTEGER,
    to_treasury INTEGER,
    tx_digest TEXT,
    timestamp INTEGER
  );

  -- Indexer cursor (tracks where we left off)
  CREATE TABLE IF NOT EXISTS indexer_state (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  -- Asset types
  CREATE TABLE IF NOT EXISTS asset_types (
    symbol TEXT PRIMARY KEY,
    name TEXT,
    region TEXT,
    custodian TEXT,
    created_at INTEGER
  );

  -- Indexes for common queries
  CREATE INDEX IF NOT EXISTS idx_deliveries_farmer ON deliveries(farmer);
  CREATE INDEX IF NOT EXISTS idx_deliveries_lot ON deliveries(lot_id);
  CREATE INDEX IF NOT EXISTS idx_token_balances_address ON token_balances(address);
  CREATE INDEX IF NOT EXISTS idx_lots_status ON lots(status);
  CREATE INDEX IF NOT EXISTS idx_lots_symbol ON lots(asset_type_symbol);
`)

console.log('Database migrated successfully:', config.dbPath)
db.close()
