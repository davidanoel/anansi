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
        setCustodianCaps(await getCustodianCaps(user.address));
      } catch (err) {
        console.error("Failed to load admin state:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminState();
  }, [user]);

  if (!user)
    return (
      <>
        <AppNav />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <p className="text-anansi-gray">Please sign in to access the admin dashboard.</p>
        </div>
      </>
    );

  if (loading)
    return (
      <>
        <AppNav />
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-anansi-red border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );

  if (custodianCaps.length === 0) {
    return (
      <>
        <AppNav />
        <div className="max-w-lg mx-auto px-6 py-20 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-anansi-light flex items-center justify-center mx-auto">
            <svg
              className="w-7 h-7 text-anansi-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mt-4">No custodian access</h2>
          <p className="text-anansi-gray text-sm mt-2 max-w-sm mx-auto">
            Your account does not have custodian capabilities. A platform admin must assign you as
            custodian.
          </p>
          <div className="mt-6 card p-3 inline-block">
            <p className="text-xs font-mono text-anansi-muted">{user.address}</p>
          </div>
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
      <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in">
        <div className="mb-8">
          <p className="section-title">GCNA Dashboard</p>
          <h1 className="text-display-sm font-display">Custodian Admin</h1>
          <p className="text-anansi-gray mt-1">
            Managing {custodianCaps.length} asset type{custodianCaps.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-1 mb-6 bg-anansi-light rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${tab === t.id ? "bg-white text-anansi-black shadow-card" : "text-anansi-muted hover:text-anansi-black"}`}
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

function RecordDeliveryForm({ custodianCaps }) {
  const [form, setForm] = useState({ lotId: "", farmerAddress: "", units: "", grade: "A" });
  const [selectedCap, setSelectedCap] = useState(custodianCaps[0]?.id || "");
  const [receiptFile, setReceiptFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      let receiptHash = "";
      if (receiptFile) {
        receiptHash = (await uploadToIPFS(receiptFile)).hash;
      }

      // FIX 1: Grab the actual symbol for the currently selected Cap
      const currentCap = custodianCaps.find((c) => c.id === selectedCap) || custodianCaps[0];

      // FIX 2: Pass currentCap.assetTypeSymbol as the 7th argument!
      const txResult = await recordDelivery(
        selectedCap,
        form.lotId,
        form.farmerAddress,
        parseInt(form.units),
        form.grade,
        receiptHash,
        currentCap.assetTypeSymbol,
      );

      setResult({
        success: true,
        digest: txResult.digest,
        tokens: form.units,
        symbol: currentCap.assetTypeSymbol,
      });
      setForm((p) => ({ ...p, farmerAddress: "", units: "" }));
      setReceiptFile(null);
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="font-semibold text-lg mb-1">Record Delivery</h2>
      <p className="text-sm text-anansi-muted mb-5">
        Record a physical delivery and mint tokens to the farmer.
      </p>
      {custodianCaps.length > 1 && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-anansi-muted uppercase tracking-wider mb-1.5">
            Asset Type
          </label>
          <select
            value={selectedCap}
            onChange={(e) => setSelectedCap(e.target.value)}
            className="input-field"
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
            <label className="block text-xs font-medium text-anansi-muted uppercase tracking-wider mb-1.5">
              Grade
            </label>
            <select
              value={form.grade}
              onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))}
              className="input-field"
            >
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-anansi-muted uppercase tracking-wider mb-1.5">
            Warehouse Receipt
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setReceiptFile(e.target.files[0])}
            className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-anansi-border file:text-sm file:font-medium file:bg-anansi-light file:text-anansi-black hover:file:bg-anansi-border file:transition-colors file:cursor-pointer"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !form.lotId || !form.farmerAddress || !form.units}
          className="btn-primary w-full"
        >
          {submitting ? "Recording..." : "Record Delivery & Mint Tokens"}
        </button>
      </form>
      {result && (
        <div
          className={`mt-4 p-4 rounded-lg text-sm ${result.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}
        >
          {result.success ? (
            <>
              <span className="font-medium">Recorded.</span> {result.tokens} {result.symbol} minted.{" "}
              <span className="font-mono text-xs">Tx: {result.digest?.slice(0, 20)}…</span>
            </>
          ) : (
            `Error: ${result.error}`
          )}
        </div>
      )}
    </div>
  );
}

function LotManager({ custodianCaps }) {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null);

  // FIX 3: Track which asset type the user wants to create a lot for
  const [selectedCap, setSelectedCap] = useState(custodianCaps[0]?.id || "");

  useEffect(() => {
    loadLots();
  }, []);
  async function loadLots() {
    try {
      setLots(await getActiveLots());
    } catch {
    } finally {
      setLoading(false);
    }
  }

  const handleCreateLot = async () => {
    setCreating(true);
    setResult(null);
    try {
      // FIX 4: Use the specifically selected cap, not hardcoded [0]
      const cap = custodianCaps.find((c) => c.id === selectedCap) || custodianCaps[0];
      const { getAssetTypeBySymbol } = await import("../../lib/data");
      const assetTypeId = await getAssetTypeBySymbol(cap.assetTypeSymbol);

      if (!assetTypeId) throw new Error("Asset type not found");
      const txResult = await createLot(cap.id, assetTypeId, "new-lot");
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
      // FIX 5: Find the correct custodian cap based on the lot's actual asset type
      const lot = lots.find((l) => l.id === lotId);
      const cap = custodianCaps.find((c) => c.assetTypeSymbol === lot.assetTypeSymbol);
      if (!cap) throw new Error("You do not have the custodian cap for this asset type.");

      if (action === "selling") await startSelling(cap.id, lotId);
      else if (action === "distributing") {
        const { startDistributing } = await import("../../lib/transactions");
        await startDistributing(cap.id, lotId);
      } else if (action === "close") {
        const { closeLot } = await import("../../lib/transactions");
        await closeLot(cap.id, lotId);
      }
      setTimeout(loadLots, 3000);
    } catch (err) {
      alert("Failed: " + err.message);
    }
  };

  const sBadge = (s) =>
    s === 0
      ? "badge-open"
      : s === 1
        ? "badge-selling"
        : s === 2
          ? "badge-distributing"
          : "badge-closed";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Active Lots</h2>
        <div className="flex gap-3">
          {custodianCaps.length > 1 && (
            <select
              value={selectedCap}
              onChange={(e) => setSelectedCap(e.target.value)}
              className="input-field py-1 h-auto text-sm"
            >
              {custodianCaps.map((cap) => (
                <option key={cap.id} value={cap.id}>
                  {cap.assetTypeSymbol}
                </option>
              ))}
            </select>
          )}
          <button onClick={handleCreateLot} disabled={creating} className="btn-primary py-2 px-4">
            {creating ? "Creating..." : "+ New Lot"}
          </button>
        </div>
      </div>

      {result && (
        <div
          className={`p-3 rounded-lg text-sm ${result.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}
        >
          {result.success
            ? `Lot created. Tx: ${result.digest?.slice(0, 20)}…`
            : `Error: ${result.error}`}
        </div>
      )}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="card p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : lots.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-sm font-medium mt-3">No active lots</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lots.map((lot) => (
            <div key={lot.id} className="card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">
                    {lot.assetTypeSymbol} — Lot #{lot.lotNumber}
                  </span>
                  <span className={`badge ${sBadge(lot.status)}`}>{lot.statusLabel}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-4 pt-3 border-t border-anansi-border">
                <div>
                  <p className="stat-label">Units</p>
                  <p className="stat-value">{lot.totalUnits.toLocaleString()}</p>
                </div>
                <div>
                  <p className="stat-label">Tokens</p>
                  <p className="stat-value">{lot.totalTokensMinted.toLocaleString()}</p>
                </div>
                <div>
                  <p className="stat-label">Deliveries</p>
                  <p className="stat-value">{lot.deliveryCount}</p>
                </div>
                <div>
                  <p className="stat-label">Value</p>
                  <p className="stat-value">
                    {lot.estimatedValueUsdc > 0
                      ? `$${(lot.estimatedValueUsdc / 1e6).toFixed(2)}`
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-anansi-border flex items-center justify-between">
                <p className="text-[10px] text-anansi-muted font-mono truncate flex-1">{lot.id}</p>
                {lot.status === 0 && (
                  <button
                    onClick={() => handleLotAction(lot.id, "selling")}
                    className="ml-2 badge badge-selling cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    Mark as Selling →
                  </button>
                )}
                {lot.status === 1 && (
                  <button
                    onClick={() => handleLotAction(lot.id, "distributing")}
                    className="ml-2 badge badge-distributing cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    Start Distribution →
                  </button>
                )}
                {lot.status === 2 && (
                  <button
                    onClick={() => handleLotAction(lot.id, "close")}
                    className="ml-2 badge badge-closed cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    Close Lot
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentActivity() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getRecentDeliveries(20)
      .then(setDeliveries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  return (
    <div>
      <h2 className="font-semibold text-lg mb-4">Recent Deliveries</h2>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-anansi-border bg-anansi-light/50">
              {["Time", "Farmer", "Weight", "Grade", "Tokens", "Tx"].map((h) => (
                <th key={h} className="text-left px-5 py-3 stat-label font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-anansi-muted">
                  Loading...
                </td>
              </tr>
            ) : deliveries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-anansi-muted">
                  No deliveries recorded yet.
                </td>
              </tr>
            ) : (
              deliveries.map((d, i) => (
                <tr
                  key={i}
                  className="border-b border-anansi-border last:border-0 hover:bg-anansi-light/30 transition-colors"
                >
                  <td className="px-5 py-3 text-xs text-anansi-muted">
                    {d.timestamp ? new Date(d.timestamp).toLocaleString() : "—"}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">
                    {d.farmer?.slice(0, 6)}···{d.farmer?.slice(-4)}
                  </td>
                  <td className="px-5 py-3">{d.units} kg</td>
                  <td className="px-5 py-3">
                    <span className="badge badge-open">Grade {d.grade}</span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-emerald-700">+{d.tokensMinted}</td>
                  <td className="px-5 py-3">
                    <a
                      href={`https://suiscan.xyz/testnet/tx/${d.txDigest}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-anansi-red hover:underline font-mono"
                    >
                      {d.txDigest?.slice(0, 10)}…
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

function Field({ label, value, onChange, placeholder, type = "text", mono, help }) {
  return (
    <div>
      <label className="block text-xs font-medium text-anansi-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`input-field ${mono ? "font-mono text-xs" : ""}`}
      />
      {help && <p className="text-xs text-anansi-muted mt-1">{help}</p>}
    </div>
  );
}
