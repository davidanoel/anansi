import dotenv from "dotenv";
dotenv.config({ path: new URL("./.env", import.meta.url).pathname });

import express from "express";
import cors from "cors";
import { SuiClient } from "@mysten/sui/client";
import { config, getEventTypes, getPackageIds } from "./config.js";
import * as db from "./db.js";

// ============================================================
// Spice Indexer
// Listens to Sui events from Anansi contracts and stores them
// in PostgreSQL. Exposes a REST API for the Spice frontend.
// ============================================================

const client = new SuiClient({ url: config.suiRpcUrl });
const packageIds = getPackageIds();
const eventTypesByPackage = packageIds.map((pkg) => getEventTypes(pkg));
const allEventTypes = Object.assign({}, ...eventTypesByPackage);

// ============ Event Processing ============

async function processEvent(event, txDigest, timestamp) {
  const type = event.type;
  const data = event.parsedJson;

  try {
    if (type === allEventTypes.LOT_CREATED) {
      await db.upsertLot({
        id: data.lot_id,
        lot_number: Number(data.lot_number),
        asset_type_symbol: data.asset_type_symbol,
        custodian: data.custodian,
        created_at: timestamp,
      });
      console.log(`[LOT] Created: #${data.lot_number} (${data.asset_type_symbol})`);
    } else if (type === allEventTypes.DELIVERY_RECORDED) {
      await db.insertDelivery({
        lot_id: data.lot_id,
        farmer: data.farmer,
        units: Number(data.units),
        tokens_minted: Number(data.tokens_minted),
        grade: data.grade,
        tx_digest: txDigest,
        timestamp,
      });
      await db.updateLotDelivery(data.lot_id, Number(data.units), Number(data.tokens_minted));
      console.log(`[DELIVERY] ${data.units} units to ${data.farmer.slice(0, 8)}...`);
    } else if (type === allEventTypes.LOT_STATUS_CHANGED) {
      await db.updateLotStatus(data.lot_id, Number(data.new_status));
      console.log(`[LOT STATUS] ${data.lot_id.slice(0, 8)}... → ${data.new_status}`);
    } else if (type === allEventTypes.VALUATION_UPDATED) {
      await db.updateLotValuation(data.lot_id, Number(data.new_value));
      console.log(`[VALUATION] ${data.lot_id.slice(0, 8)}... → $${Number(data.new_value) / 1e6}`);
    } else if (type === allEventTypes.SURPLUS_RECEIVED) {
      await db.insertSurplusDeposit({
        deposit_id: data.deposit_id || null,
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
    } else if (type === allEventTypes.SURPLUS_CLAIMED) {
      await db.insertSurplusClaim({
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
    } else if (type === allEventTypes.TOKENS_BURNED) {
      await db.insertBurn({
        amount: Number(data.amount),
        burner: data.burner,
        total_burned: Number(data.total_burned),
        tx_digest: txDigest,
        timestamp,
      });
      console.log(`[BURN] ${Number(data.amount) / 1e9} CARIB burned`);
    } else if (type === allEventTypes.FEES_COLLECTED) {
      await db.insertFeeCollection({
        lot_id: data.lot_id,
        total_fee: Number(data.total_fee),
        burned: Number(data.burned),
        to_treasury: Number(data.to_treasury),
        tx_digest: txDigest,
        timestamp,
      });
    } else if (type === allEventTypes.ASSET_TYPE_CREATED) {
      await db.upsertAssetType({
        symbol: data.symbol,
        object_id: data.asset_type_id || null,
        name: data.name,
        unit: data.unit || null,
        region: data.region,
        custodian: data.custodian,
        active: 1,
        created_at: timestamp,
      });
      console.log(`[ASSET TYPE] Registered: ${data.symbol} (${data.region})`);
    } else if (type === allEventTypes.ASSET_TYPE_DEACTIVATED) {
      await db.setAssetTypeActive(data.symbol, false);
      console.log(`[ASSET TYPE] Deactivated: ${data.symbol}`);
    } else if (type === allEventTypes.ASSET_TYPE_REACTIVATED) {
      await db.setAssetTypeActive(data.symbol, true);
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
    const savedCursor = await db.getCursor(cursorKey);

    try {
      const result = await client.queryEvents({
        query: { MoveEventType: eventType },
        cursor: savedCursor ? JSON.parse(savedCursor) : undefined,
        limit: 50,
        order: "ascending",
      });

      for (const event of result.data) {
        await processEvent(
          { type: event.type, parsedJson: event.parsedJson },
          event.id.txDigest,
          Number(event.timestampMs || Date.now()),
        );
      }

      if (result.nextCursor) {
        await db.setCursor(cursorKey, JSON.stringify(result.nextCursor));
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
app.get("/api/stats", async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// All lots
app.get("/api/lots", async (req, res) => {
  try {
    const status = req.query.status;
    if (status === "active") {
      const lots = await db.getActiveLots();
      res.json(lots);
    } else {
      const lots = await db.getAllLots();
      res.json(lots);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Single lot
app.get("/api/lots/:id", async (req, res) => {
  try {
    const lot = await db.getLot(req.params.id);
    if (!lot) return res.status(404).json({ error: "Lot not found" });
    res.json(lot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deliveries for a lot
app.get("/api/lots/:id/deliveries", async (req, res) => {
  try {
    const deliveries = await db.getDeliveriesByLot(req.params.id);
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Token holders for a lot
app.get("/api/lots/:id/holders", async (req, res) => {
  try {
    const holders = await db.getParticipantsByLot(req.params.id);
    res.json(holders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Farmer directory (email/name/address lookup for custodians)
app.get("/api/farmers/directory", async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 25;
    const farmers = await db.getFarmerDirectory({
      assetTypeSymbol: req.query.assetTypeSymbol || null,
      search: req.query.search || "",
      limit,
    });
    res.json(farmers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/farmers/directory", async (req, res) => {
  try {
    const address = typeof req.body?.address === "string" ? req.body.address.trim() : "";
    if (!address) {
      return res.status(400).json({ error: "address is required" });
    }

    await db.upsertUserProfile({
      address,
      email: req.body?.email || null,
      name: req.body?.name || null,
      picture: req.body?.picture || null,
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Farmer portfolio (all balances + deliveries)
app.get("/api/farmers/:address", async (req, res) => {
  try {
    const address = req.params.address;
    const participation = await db.getParticipationByAddress(address);
    const deliveries = await db.getDeliveriesByFarmer(address);
    res.json({
      participation,
      deliveries,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Asset types
app.get("/api/asset-types", async (req, res) => {
  try {
    const assetTypes = await db.getAssetTypes();
    res.json(assetTypes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ Analytics API ============

app.get("/api/analytics/overview", async (req, res) => {
  try {
    const overview = await db.getAnalyticsOverview();
    res.json({ ...overview, poll_interval_ms: config.pollInterval });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics/deliveries-over-time", async (req, res) => {
  try {
    const requestedDays = Number.parseInt(req.query.days, 10);
    const days = Number.isFinite(requestedDays) ? Math.min(Math.max(requestedDays, 1), 90) : 14;
    const deliveries = await db.getDeliveriesOverTime(days);
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics/by-asset-type", async (req, res) => {
  try {
    const rows = await db.getAnalyticsByAssetType();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics/farmers", async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 10;
    const farmers = await db.getAnalyticsFarmers(limit);
    res.json(farmers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics/lots/:id/summary", async (req, res) => {
  try {
    const summary = await db.getLotAnalyticsSummary(req.params.id);
    if (!summary) return res.status(404).json({ error: "Lot not found" });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/analytics/recent-activity", async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 25;
    const activity = await db.getRecentActivity(limit);
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CaribCoin burn history
app.get("/api/carib/burns", async (req, res) => {
  try {
    const dbInstance = db.getDb();
    const burns = await dbInstance.query(
      "SELECT * FROM carib_burns ORDER BY timestamp DESC LIMIT 100",
    );
    const totalBurned = await db.getTotalBurned();
    res.json({ burns, totalBurned });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fee collection history
app.get("/api/carib/fees", async (req, res) => {
  try {
    const dbInstance = db.getDb();
    const fees = await dbInstance.query(
      "SELECT * FROM fee_collections ORDER BY timestamp DESC LIMIT 100",
    );
    res.json(fees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ Start ============

async function start() {
  console.log("=".repeat(50));
  console.log("Spice Indexer");
  console.log(`Network: ${config.suiRpcUrl}`);
  console.log(`Packages: ${packageIds.join(", ")}`);
  console.log(`Database: PostgreSQL (${config.dbUrl.split("@")[1] || "localhost"})`);
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
