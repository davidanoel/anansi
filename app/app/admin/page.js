"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthProvider";
import AppNav from "../../components/AppNav";
import { recordDelivery, createLot, startSelling, updateValuation } from "../../lib/transactions";
import { getCustodianCaps, getRecentDeliveries, getActiveLots } from "../../lib/data";
import { uploadToIPFS } from "../../lib/ipfs";

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("deliveries");
  const [custodianCaps, setCustodianCaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminState() {
      if (!user?.address) return;
      try {
        const caps = await getCustodianCaps(user.address);
        setCustodianCaps(caps);
      } catch (err) {
        console.error("Failed to load admin state:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminState();
  }, [user]);

  if (!user) {
    return <p className="p-6">Please sign in to access the admin dashboard.</p>;
  }

  if (loading) {
    return (
      <>
        <AppNav />
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-anansi-red border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (custodianCaps.length === 0) {
    return (
      <>
        <AppNav />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <p className="text-4xl mb-4">🔒</p>
          <h2 className="text-xl font-bold">No custodian access</h2>
          <p className="text-anansi-gray text-sm mt-2">
            Your account does not have custodian capabilities for any asset type. A platform admin
            must assign you as custodian before you can record deliveries.
          </p>
          <p className="text-xs text-anansi-gray font-mono mt-4">Your address: {user.address}</p>
        </div>
      </>
    );
  }

  const tabs = [
    { id: "deliveries", label: "Record Delivery" },
    { id: "lots", label: "Manage Lots" },
    { id: "history", label: "Recent Activity" },
  ];

  return (
    <>
      <AppNav />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">GCNA Admin Dashboard</h1>
            <p className="text-anansi-gray text-sm mt-1">
              Custodian · {custodianCaps.length} asset type{custodianCaps.length !== 1 ? "s" : ""}{" "}
              managed
            </p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-anansi-light rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-white text-anansi-black shadow-sm"
                  : "text-anansi-gray hover:text-anansi-black"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "deliveries" && <RecordDeliveryForm custodianCaps={custodianCaps} />}
        {tab === "lots" && <LotManager custodianCaps={custodianCaps} />}
        {tab === "history" && <RecentActivity />}
      </div>
    </>
  );
}

// ============================================================
// Record Delivery Form
// ============================================================

function RecordDeliveryForm({ custodianCaps }) {
  const [form, setForm] = useState({ lotId: "", farmerAddress: "", units: "", grade: "A" });
  const [selectedCap, setSelectedCap] = useState(custodianCaps[0]?.id || "");
  const [receiptFile, setReceiptFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (custodianCaps.length > 0 && !selectedCap) setSelectedCap(custodianCaps[0].id);
  }, [custodianCaps, selectedCap]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      let receiptHash = "";
      if (receiptFile) {
        const uploaded = await uploadToIPFS(receiptFile);
        receiptHash = uploaded.hash;
      }
      const txResult = await recordDelivery(
        selectedCap,
        form.lotId,
        form.farmerAddress,
        parseInt(form.units),
        form.grade,
        receiptHash,
      );
      setResult({ success: true, digest: txResult.digest, tokens: form.units });
      setForm((prev) => ({ ...prev, farmerAddress: "", units: "" }));
      setReceiptFile(null);
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (custodianCaps.length === 0) {
    return (
      <div className="text-center py-12 border border-anansi-border rounded-xl bg-white">
        <p className="text-3xl mb-2">🔒</p>
        <p className="text-anansi-gray text-sm">No custodian capabilities found.</p>
        <p className="text-anansi-gray text-xs mt-1">
          Register an asset type first (Asset Types tab), then you can record deliveries.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 border border-anansi-border rounded-xl bg-white">
      <h2 className="font-bold text-lg mb-4">Record Delivery</h2>
      {custodianCaps.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Asset Type</label>
          <select
            value={selectedCap}
            onChange={(e) => setSelectedCap(e.target.value)}
            className="w-full px-3 py-2 border border-anansi-border rounded-lg text-sm"
          >
            {custodianCaps.map((cap) => (
              <option key={cap.id} value={cap.id}>
                {cap.assetTypeSymbol}
              </option>
            ))}
          </select>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Lot ID"
          value={form.lotId}
          onChange={(v) => setForm((p) => ({ ...p, lotId: v }))}
          placeholder="0x..."
          mono
        />
        <Field
          label="Farmer Address"
          value={form.farmerAddress}
          onChange={(v) => setForm((p) => ({ ...p, farmerAddress: v }))}
          placeholder="0x..."
          mono
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Weight (kg)"
            value={form.units}
            onChange={(v) => setForm((p) => ({ ...p, units: v }))}
            placeholder="564"
            type="number"
          />
          <div>
            <label className="block text-sm font-medium mb-1">Grade</label>
            <select
              value={form.grade}
              onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))}
              className="w-full px-3 py-2 border border-anansi-border rounded-lg text-sm"
            >
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Warehouse Receipt</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setReceiptFile(e.target.files[0])}
            className="w-full text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !form.lotId || !form.farmerAddress || !form.units}
          className="w-full py-2.5 bg-anansi-black text-white rounded-lg font-medium text-sm disabled:opacity-50 hover:bg-anansi-red transition-colors"
        >
          {submitting ? "Recording..." : "Record Delivery & Mint Tokens"}
        </button>
      </form>
      {result && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
        >
          {result.success
            ? `Recorded. ${result.tokens} tokens minted. Tx: ${result.digest?.slice(0, 16)}...`
            : `Error: ${result.error}`}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Lot Manager
// ============================================================

function LotManager({ custodianCaps }) {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadLots();
  }, []);

  async function loadLots() {
    try {
      setLots(await getActiveLots());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateLot = async () => {
    setCreating(true);
    setResult(null);
    try {
      const cap = custodianCaps[0];
      // Find the AssetType object ID for this cap's symbol
      const { getAssetTypeBySymbol } = await import("../../lib/data");
      const assetTypeId = await getAssetTypeBySymbol(cap.assetTypeSymbol);
      if (!assetTypeId) throw new Error("AssetType not found for " + cap.assetTypeSymbol);

      const txResult = await createLot(cap.id, assetTypeId, "");
      setResult({ success: true, digest: txResult.digest });
      setTimeout(loadLots, 3000);
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setCreating(false);
    }
  };

  const handleLotAction = async (lotId, action) => {
    try {
      const cap = custodianCaps[0];
      let txResult;
      if (action === "selling") {
        txResult = await startSelling(cap.id, lotId);
      } else if (action === "distributing") {
        const { startDistributing } = await import("../../lib/transactions");
        txResult = await startDistributing(cap.id, lotId);
      } else if (action === "close") {
        const { closeLot } = await import("../../lib/transactions");
        txResult = await closeLot(cap.id, lotId);
      }
      setTimeout(loadLots, 3000);
    } catch (err) {
      alert("Failed: " + err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Active Lots</h2>
        <button
          onClick={handleCreateLot}
          disabled={creating}
          className="px-4 py-2 bg-anansi-black text-white rounded-lg text-sm hover:bg-anansi-red transition-colors disabled:opacity-50"
        >
          {creating ? "Creating..." : "+ New Lot"}
        </button>
      </div>

      {result && (
        <div
          className={`p-3 rounded-lg text-sm ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
        >
          {result.success
            ? `Lot created. Tx: ${result.digest?.slice(0, 16)}...`
            : `Error: ${result.error}`}
        </div>
      )}

      {loading ? (
        <p className="text-anansi-gray text-sm py-4">Loading...</p>
      ) : lots.length === 0 ? (
        <div className="text-center py-12 border border-anansi-border rounded-xl bg-white">
          <p className="text-3xl mb-2">📦</p>
          <p className="text-anansi-gray text-sm">
            No active lots. Click "+ New Lot" to start receiving deliveries.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {lots.map((lot) => (
            <div key={lot.id} className="p-4 border border-anansi-border rounded-xl bg-white">
              <div className="flex items-center justify-between">
                <span className="font-bold">
                  {lot.assetTypeSymbol} — Lot #{lot.lotNumber}
                </span>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                    lot.status === 0
                      ? "bg-green-50 text-green-700"
                      : lot.status === 1
                        ? "bg-yellow-50 text-yellow-700"
                        : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {lot.statusLabel}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                <MiniStat label="Units" value={lot.totalUnits.toLocaleString()} />
                <MiniStat label="Tokens" value={lot.totalTokensMinted.toLocaleString()} />
                <MiniStat label="Deliveries" value={lot.deliveryCount} />
                <MiniStat
                  label="Value"
                  value={
                    lot.estimatedValueUsdc > 0
                      ? `$${(lot.estimatedValueUsdc / 1e6).toFixed(2)}`
                      : "—"
                  }
                />
              </div>
              <div className="mt-3 pt-3 border-t border-anansi-border">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-anansi-gray font-mono truncate flex-1">ID: {lot.id}</p>
                  {lot.status === 0 && (
                    <button
                      onClick={() => handleLotAction(lot.id, "selling")}
                      className="ml-2 text-xs px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100"
                    >
                      Mark as Selling
                    </button>
                  )}
                  {lot.status === 1 && (
                    <button
                      onClick={() => handleLotAction(lot.id, "distributing")}
                      className="ml-2 text-xs px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100"
                    >
                      Start Distribution
                    </button>
                  )}
                  {lot.status === 2 && (
                    <>
                      <button
                        onClick={() => handleLotAction(lot.id, "close")}
                        className="ml-2 text-xs px-3 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100"
                      >
                        Close Lot
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Recent Activity — queries Sui RPC directly, no indexer needed
// ============================================================

function RecentActivity() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setDeliveries(await getRecentDeliveries(20));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <h2 className="font-bold text-lg mb-4">Recent Deliveries</h2>
      <div className="border border-anansi-border rounded-xl bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-anansi-border bg-anansi-light">
              <th className="text-left px-4 py-3 font-medium">Time</th>
              <th className="text-left px-4 py-3 font-medium">Farmer</th>
              <th className="text-left px-4 py-3 font-medium">Weight</th>
              <th className="text-left px-4 py-3 font-medium">Grade</th>
              <th className="text-left px-4 py-3 font-medium">Tokens</th>
              <th className="text-left px-4 py-3 font-medium">Tx</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-anansi-gray">
                  Loading...
                </td>
              </tr>
            ) : deliveries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-anansi-gray">
                  No deliveries recorded yet.
                </td>
              </tr>
            ) : (
              deliveries.map((d, i) => (
                <tr key={i} className="border-b border-anansi-border last:border-0">
                  <td className="px-4 py-3 text-xs text-anansi-gray">
                    {d.timestamp ? new Date(d.timestamp).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {d.farmer?.slice(0, 6)}...{d.farmer?.slice(-4)}
                  </td>
                  <td className="px-4 py-3">{d.units} kg</td>
                  <td className="px-4 py-3">{d.grade}</td>
                  <td className="px-4 py-3 font-semibold">{d.tokensMinted}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://suiscan.xyz/testnet/tx/${d.txDigest}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-anansi-red hover:underline font-mono"
                    >
                      {d.txDigest?.slice(0, 8)}...
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Shared
// ============================================================

function Field({ label, value, onChange, placeholder, type = "text", mono, help }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-anansi-border rounded-lg text-sm ${mono ? "font-mono text-xs" : ""}`}
      />
      {help && <p className="text-xs text-anansi-gray mt-1">{help}</p>}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-anansi-gray">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
