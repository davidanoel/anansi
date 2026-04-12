import express from "express";
import cors from "cors";
import { SuiClient } from "@mysten/sui/client";
import { config, getEventTypes, getPackageIds } from "./config.js";
import * as db from "./db.js";

// ============================================================
// Spice Indexer
// Listens to Sui events from Anansi contracts and stores them
// in SQLite. Exposes a REST API for the Spice frontend.
// ============================================================

const client = new SuiClient({ url: config.suiRpcUrl });
const packageIds = getPackageIds();
const eventTypesByPackage = packageIds.map((pkg) => getEventTypes(pkg));

// ============ Event Processing ============

function processEvent(event, txDigest, timestamp) {
  const type = event.type;
  const data = event.parsedJson;

  try {
    if (type === eventTypes.LOT_CREATED) {
      db.upsertLot({
        id: data.lot_id,
        lot_number: Number(data.lot_number),
        asset_type_symbol: data.asset_type_symbol,
        custodian: data.custodian,
        created_at: timestamp,
      });
      console.log(`[LOT] Created: #${data.lot_number} (${data.asset_type_symbol})`);
    } else if (type === eventTypes.DELIVERY_RECORDED) {
      db.insertDelivery({
        lot_id: data.lot_id,
        farmer: data.farmer,
        units: Number(data.units),
        tokens_minted: Number(data.tokens_minted),
        grade: data.grade,
        tx_digest: txDigest,
        timestamp,
      });
      db.updateLotDelivery(data.lot_id, Number(data.units), Number(data.tokens_minted));
      console.log(`[DELIVERY] ${data.units} units to ${data.farmer.slice(0, 8)}...`);
    } else if (type === eventTypes.LOT_STATUS_CHANGED) {
      db.updateLotStatus(data.lot_id, Number(data.new_status));
      console.log(`[LOT STATUS] ${data.lot_id.slice(0, 8)}... → ${data.new_status}`);
    } else if (type === eventTypes.VALUATION_UPDATED) {
      db.updateLotValuation(data.lot_id, Number(data.new_value));
      console.log(`[VALUATION] ${data.lot_id.slice(0, 8)}... → $${Number(data.new_value) / 1e6}`);
    } else if (type === eventTypes.SURPLUS_RECEIVED) {
      db.insertSurplusDeposit({
        deposit_id: null,
        lot_id: data.lot_id,
        gross_amount: Number(data.gross_amount),
        fee_amount: Number(data.fee_amount),
        net_amount: Number(data.net_amount),
        tokens_snapshot: Number(data.tokens_snapshot),
        tx_digest: txDigest,
        timestamp,
      });
      console.log(
        `[SURPLUS] $${Number(data.net_amount) / 1e6} for lot ${data.lot_id.slice(0, 8)}...`,
      );
    } else if (type === eventTypes.SURPLUS_CLAIMED) {
      db.insertSurplusClaim({
        deposit_id: data.deposit_id,
        lot_id: data.lot_id,
        claimant: data.claimant,
        tokens_held: Number(data.tokens_held),
        amount_received: Number(data.amount_received),
        tx_digest: txDigest,
        timestamp,
      });
      console.log(
        `[CLAIM] ${data.claimant.slice(0, 8)}... claimed $${Number(data.amount_received) / 1e6}`,
      );
    } else if (type === eventTypes.TOKENS_BURNED) {
      db.insertBurn({
        amount: Number(data.amount),
        burner: data.burner,
        total_burned: Number(data.total_burned),
        tx_digest: txDigest,
        timestamp,
      });
      console.log(`[BURN] ${Number(data.amount) / 1e9} CARIB burned`);
    } else if (type === eventTypes.FEES_COLLECTED) {
      db.insertFeeCollection({
        lot_id: data.lot_id,
        total_fee: Number(data.total_fee),
        burned: Number(data.burned),
        to_treasury: Number(data.to_treasury),
        tx_digest: txDigest,
        timestamp,
      });
    } else if (type === eventTypes.ASSET_TYPE_CREATED) {
      db.upsertAssetType({
        symbol: data.symbol,
        name: data.name,
        unit: null,
        region: data.region,
        custodian: data.custodian,
        active: 1,
        created_at: timestamp,
      });
      console.log(`[ASSET TYPE] Registered: ${data.symbol} (${data.region})`);
    } else if (type === eventTypes.ASSET_TYPE_DEACTIVATED) {
      db.setAssetTypeActive(data.symbol, false);
      console.log(`[ASSET TYPE] Deactivated: ${data.symbol}`);
    } else if (type === eventTypes.ASSET_TYPE_REACTIVATED) {
      db.setAssetTypeActive(data.symbol, true);
      console.log(`[ASSET TYPE] Reactivated: ${data.symbol}`);
    }
  } catch (err) {
    console.error(`Error processing event ${type}:`, err);
  }
}

// ============ Event Polling ============

async function pollEvents() {
  const allTypes = eventTypesByPackage.flatMap((eventTypes) => Object.values(eventTypes));

  for (const eventType of allTypes) {
    const cursorKey = `cursor:${eventType}`;
    const savedCursor = db.getCursor(cursorKey);

    try {
      const result = await client.queryEvents({
        query: { MoveEventType: eventType },
        cursor: savedCursor ? JSON.parse(savedCursor) : undefined,
        limit: 50,
        order: "ascending",
      });

      for (const event of result.data) {
        processEvent(
          { type: event.type, parsedJson: event.parsedJson },
          event.id.txDigest,
          Number(event.timestampMs || Date.now()),
        );
      }

      if (result.nextCursor) {
        db.setCursor(cursorKey, JSON.stringify(result.nextCursor));
      }
    } catch (err) {
      if (!err.message?.includes("not found")) {
        console.error(`Poll error for ${eventType.split("::").pop()}:`, err.message);
      }
    }
  }
}

// ============ REST API ============

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", network: config.suiRpcUrl, packageId: config.packageId });
});

// Platform stats
app.get("/api/stats", (req, res) => {
  res.json(db.getStats());
});

// All lots
app.get("/api/lots", (req, res) => {
  const status = req.query.status;
  if (status === "active") {
    res.json(db.getActiveLots());
  } else {
    res.json(db.getAllLots());
  }
});

// Single lot
app.get("/api/lots/:id", (req, res) => {
  const lot = db.getLot(req.params.id);
  if (!lot) return res.status(404).json({ error: "Lot not found" });
  res.json(lot);
});

// Deliveries for a lot
app.get("/api/lots/:id/deliveries", (req, res) => {
  res.json(db.getDeliveriesByLot(req.params.id));
});

// Token holders for a lot
app.get("/api/lots/:id/holders", (req, res) => {
  res.json(db.getParticipantsByLot(req.params.id));
});

// Farmer portfolio (all balances + deliveries)
app.get("/api/farmers/:address", (req, res) => {
  const address = req.params.address;
  res.json({
    participation: db.getParticipationByAddress(address),
    deliveries: db.getDeliveriesByFarmer(address),
  });
});

// Asset types
app.get("/api/asset-types", (req, res) => {
  res.json(db.getAssetTypes());
});

// CaribCoin burn history
app.get("/api/carib/burns", (req, res) => {
  const burns = db
    .getDb()
    .prepare("SELECT * FROM carib_burns ORDER BY timestamp DESC LIMIT 100")
    .all();
  res.json({ burns, totalBurned: db.getTotalBurned() });
});

// Fee collection history
app.get("/api/carib/fees", (req, res) => {
  const fees = db
    .getDb()
    .prepare("SELECT * FROM fee_collections ORDER BY timestamp DESC LIMIT 100")
    .all();
  res.json(fees);
});

// ============ Start ============

async function start() {
  console.log("=".repeat(50));
  console.log("Spice Indexer");
  console.log(`Network: ${config.suiRpcUrl}`);
  console.log(`Packages: ${packageIds.join(", ")}`);
  console.log(`Database: ${config.dbPath}`);
  console.log("=".repeat(50));

  // Start API server
  app.listen(config.port, () => {
    console.log(`API server running on http://localhost:${config.port}`);
  });

  // Start event polling loop
  console.log(`Polling events every ${config.pollInterval}ms...`);
  setInterval(pollEvents, config.pollInterval);

  // Initial poll
  await pollEvents();
}

start().catch((err) => {
  console.error("Indexer failed to start:", err);
  process.exit(1);
});
