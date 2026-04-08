"use client";

import { useState, useEffect, useCallback } from "react";

export default function PlatformPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [platformKey, setPlatformKey] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setPlatformKey(password);
    setAuthenticated(true);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-anansi-cream">
        <div className="max-w-sm w-full animate-fade-in">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-anansi-red to-anansi-black mx-auto shadow-elevated" />
          <h1 className="font-display text-display-sm text-center mt-6">Platform Admin</h1>
          <p className="text-anansi-muted text-sm text-center mt-2 mb-8">Anansi Technology Corporation</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Platform admin key" className="input-field font-mono text-center" autoFocus />
            <button type="submit" disabled={!password} className="btn-primary w-full">Sign in</button>
          </form>
        </div>
        <p className="text-[11px] text-anansi-muted mt-12">Miami, FL · Anansi Technology Corporation</p>
      </div>
    );
  }

  return <PlatformDashboard platformKey={platformKey} onLogout={() => { setAuthenticated(false); setPlatformKey(""); }} />;
}

function PlatformDashboard({ platformKey, onLogout }) {
  const [tab, setTab] = useState("assets");
  const [stats, setStats] = useState(null);

  const api = useCallback(async (path, options = {}) => {
    const res = await fetch(`/api/platform/${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", "x-platform-key": platformKey, ...options.headers },
    });
    if (res.status === 401) { onLogout(); throw new Error("Unauthorized"); }
    return res.json();
  }, [platformKey, onLogout]);

  useEffect(() => { api("stats").then(setStats).catch(console.error); }, [api]);

  const tabs = [
    { id: "assets", label: "Asset Types" },
    { id: "custodians", label: "Custodians" },
    { id: "deposits", label: "Surplus Deposits" },
    { id: "overview", label: "Overview" },
  ];

  return (
    <div className="min-h-screen bg-anansi-cream">
      <header className="sticky top-0 z-50 bg-anansi-black/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-anansi-red to-anansi-accent" />
            <span className="font-display text-white text-lg tracking-tight">Anansi</span>
            <span className="badge bg-anansi-red/20 text-anansi-red ring-0 text-[10px]">Platform</span>
          </div>
          <div className="flex items-center gap-4">
            {stats && <span className="text-[11px] text-gray-500 font-mono hidden sm:block">{stats.adminAddress?.slice(0, 8)}···{stats.adminAddress?.slice(-4)}</span>}
            <button onClick={onLogout} className="text-xs text-gray-500 hover:text-white transition-colors">Sign out</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-in">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card p-4"><p className="stat-label">Admin</p><p className="stat-value font-mono text-xs">{stats.adminAddress?.slice(0, 12)}…</p></div>
            <div className="card p-4"><p className="stat-label">Asset Types</p><p className="stat-value text-lg">{stats.assetTypes}</p></div>
            <div className="card p-4"><p className="stat-label">Total Lots</p><p className="stat-value text-lg">{stats.totalLots}</p></div>
            <div className="card p-4"><p className="stat-label">Network</p><p className="stat-value">{process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet"}</p></div>
          </div>
        )}

        <div className="flex gap-1 mb-6 bg-anansi-light rounded-lg p-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${tab === t.id ? "bg-white text-anansi-black shadow-card" : "text-anansi-muted hover:text-anansi-black"}`}>{t.label}</button>
          ))}
        </div>

        {tab === "assets" && <AssetTypesPanel api={api} />}
        {tab === "custodians" && <CustodiansPanel api={api} />}
        {tab === "deposits" && <DepositsPanel api={api} />}
        {tab === "overview" && <OverviewPanel stats={stats} />}
      </div>
    </div>
  );
}

function AssetTypesPanel({ api }) {
  const [assetTypes, setAssetTypes] = useState([]); const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); const [submitting, setSubmitting] = useState(false); const [result, setResult] = useState(null);
  const [form, setForm] = useState({ symbol: "", name: "", unit: "kg", region: "", custodianName: "", custodianAddress: "" });

  const loadAssetTypes = useCallback(async () => {
    try { setAssetTypes(Array.isArray(await api("asset-types")) ? await api("asset-types") : []); } catch {} finally { setLoading(false); }
  }, [api]);
  useEffect(() => { loadAssetTypes(); }, [loadAssetTypes]);

  const handleCreate = async (e) => {
    e.preventDefault(); setSubmitting(true); setResult(null);
    try {
      const data = await api("asset-types", { method: "POST", body: JSON.stringify(form) });
      if (data.error) throw new Error(data.error);
      setResult({ success: true, data }); setForm({ symbol: "", name: "", unit: "kg", region: "", custodianName: "", custodianAddress: "" }); setShowForm(false);
      setTimeout(loadAssetTypes, 3000);
    } catch (err) { setResult({ success: false, error: err.message }); }
    finally { setSubmitting(false); }
  };

  const handleToggle = async (assetTypeId, currentlyActive) => {
    try { await api("asset-types", { method: "PATCH", body: JSON.stringify({ assetTypeId, action: currentlyActive ? "deactivate" : "reactivate" }) }); setTimeout(loadAssetTypes, 2000); }
    catch (err) { alert("Failed: " + err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="font-semibold text-lg">Asset Types</h2><p className="text-sm text-anansi-muted">Register and manage tokenizable Caribbean assets.</p></div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">{showForm ? "Cancel" : "+ New Asset Type"}</button>
      </div>

      {showForm && (
        <div className="card p-6 border-anansi-red/20 animate-scale-in">
          <h3 className="font-semibold mb-1">Register New Asset Type</h3>
          <p className="text-sm text-anansi-muted mb-5">Creates an on-chain asset type and issues a CustodianCap to the specified address.</p>
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
            <Field label="Symbol" value={form.symbol} onChange={(v) => setForm((p) => ({ ...p, symbol: v }))} placeholder="NUTMG" help="Short ticker" />
            <Field label="Full Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="Grenada Nutmeg" />
            <Field label="Unit" value={form.unit} onChange={(v) => setForm((p) => ({ ...p, unit: v }))} placeholder="kg" help="kg, sqft, barrel" />
            <Field label="Region" value={form.region} onChange={(v) => setForm((p) => ({ ...p, region: v }))} placeholder="Grenada" />
            <Field label="Custodian Name" value={form.custodianName} onChange={(v) => setForm((p) => ({ ...p, custodianName: v }))} placeholder="GCNA" help="Organization with physical custody" />
            <Field label="Custodian Address" value={form.custodianAddress} onChange={(v) => setForm((p) => ({ ...p, custodianAddress: v }))} placeholder="0x..." help="Sui address (zkLogin)" mono />
            <div className="md:col-span-2">
              <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-anansi-red text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-anansi-red-light transition-colors active:scale-[0.98]">
                {submitting ? "Creating on-chain..." : "Create Asset Type"}
              </button>
            </div>
          </form>
          {result && <ResultBanner result={result} successMsg={<><span className="font-medium">Asset type created.</span> <span className="font-mono text-xs">Tx: {result.data?.digest}</span></>} />}
        </div>
      )}

      {loading ? <div className="space-y-3">{[1,2].map(i => <div key={i} className="card p-5 h-24 animate-pulse" />)}</div>
      : assetTypes.length === 0 ? <EmptyState icon="package" title="No asset types registered" subtitle="Click "+ New Asset Type" to register your first Caribbean asset." />
      : (
        <div className="space-y-3">
          {assetTypes.map((at) => (
            <div key={at.id} className="card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">{at.symbol}</span>
                  <span className={`badge ${at.active ? "badge-open" : "bg-red-50 text-red-700 ring-1 ring-red-600/10"}`}>{at.active ? "Active" : "Inactive"}</span>
                </div>
                <button onClick={() => handleToggle(at.id, at.active)} className={`text-xs px-3 py-1 rounded-lg border transition-colors ${at.active ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}>
                  {at.active ? "Deactivate" : "Reactivate"}
                </button>
              </div>
              <p className="text-sm text-anansi-gray mt-2">{at.name}</p>
              <div className="flex gap-6 mt-3 text-xs text-anansi-muted">
                <span>Region: <strong className="text-anansi-black">{at.region}</strong></span>
                <span>Unit: <strong className="text-anansi-black">{at.unit}</strong></span>
                <span>Custodian: <strong className="text-anansi-black">{at.custodian}</strong></span>
              </div>
              <p className="text-[10px] font-mono text-anansi-muted mt-2">{at.id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CustodiansPanel({ api }) {
  const [custodians, setCustodians] = useState([]); const [assetTypes, setAssetTypes] = useState([]); const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); const [form, setForm] = useState({ assetTypeId: "", custodianAddress: "" });
  const [submitting, setSubmitting] = useState(false); const [result, setResult] = useState(null);

  useEffect(() => {
    Promise.all([api("custodians"), api("asset-types")]).then(([c, a]) => { setCustodians(Array.isArray(c) ? c : []); setAssetTypes(Array.isArray(a) ? a : []); })
    .catch(console.error).finally(() => setLoading(false));
  }, [api]);

  const handleIssue = async (e) => {
    e.preventDefault(); setSubmitting(true); setResult(null);
    try {
      const data = await api("custodians", { method: "POST", body: JSON.stringify(form) });
      if (data.error) throw new Error(data.error);
      setResult({ success: true, digest: data.digest }); setForm({ assetTypeId: "", custodianAddress: "" }); setShowForm(false);
      setCustodians(Array.isArray(await api("custodians")) ? await api("custodians") : []);
    } catch (err) { setResult({ success: false, error: err.message }); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="font-semibold text-lg">Custodians</h2><p className="text-sm text-anansi-muted">Manage who can create lots and record deliveries.</p></div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">{showForm ? "Cancel" : "+ Issue Cap"}</button>
      </div>

      {showForm && (
        <div className="card p-6 border-anansi-red/20 animate-scale-in">
          <h3 className="font-semibold mb-4">Issue New Custodian Capability</h3>
          <form onSubmit={handleIssue} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-anansi-muted uppercase tracking-wider mb-1.5">Asset Type</label>
              <select value={form.assetTypeId} onChange={(e) => setForm((p) => ({ ...p, assetTypeId: e.target.value }))} className="input-field" required>
                <option value="">Select asset type...</option>
                {assetTypes.map((at) => <option key={at.id} value={at.id}>{at.symbol} — {at.name}</option>)}
              </select>
            </div>
            <Field label="Custodian Address" value={form.custodianAddress} onChange={(v) => setForm((p) => ({ ...p, custodianAddress: v }))} placeholder="0x..." help="Sui address of the new custodian" mono />
            <button type="submit" disabled={submitting || !form.assetTypeId || !form.custodianAddress} className="px-6 py-2.5 bg-anansi-red text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-anansi-red-light transition-colors active:scale-[0.98]">
              {submitting ? "Issuing on-chain..." : "Issue Custodian Cap"}
            </button>
          </form>
          {result && <ResultBanner result={result} successMsg={`Custodian cap issued. Tx: ${result.digest}`} />}
        </div>
      )}

      {loading ? <div className="card p-5 h-24 animate-pulse" />
      : custodians.length === 0 ? <EmptyState icon="user" title="No custodians assigned" subtitle="Custodians are created automatically with asset types, or issue additional caps above." />
      : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-anansi-border bg-anansi-light/50">
              <th className="text-left px-5 py-3 stat-label font-medium">Asset Type</th>
              <th className="text-left px-5 py-3 stat-label font-medium">Custodian Address</th>
              <th className="text-left px-5 py-3 stat-label font-medium">Issued</th>
            </tr></thead>
            <tbody>
              {custodians.map((c, i) => (
                <tr key={i} className="border-b border-anansi-border last:border-0 hover:bg-anansi-light/30 transition-colors">
                  <td className="px-5 py-3 font-semibold">{c.assetTypeSymbol}</td>
                  <td className="px-5 py-3 font-mono text-xs">{c.custodianAddress}</td>
                  <td className="px-5 py-3 text-xs text-anansi-muted">{c.timestamp ? new Date(c.timestamp).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DepositsPanel({ api }) {
  const [lotId, setLotId] = useState(""); const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false); const [result, setResult] = useState(null);
  const handleDeposit = async (e) => {
    e.preventDefault(); setSubmitting(true); setResult(null);
    try {
      const data = await api("deposit", { method: "POST", body: JSON.stringify({ lotId, amount: parseFloat(amount) }) });
      if (data.error) throw new Error(data.error);
      setResult({ success: true, digest: data.digest }); setAmount("");
    } catch (err) { setResult({ success: false, error: err.message }); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div><h2 className="font-semibold text-lg">Surplus Deposits</h2><p className="text-sm text-anansi-muted">Deposit USDC surplus for a lot after commodity sale. 1% fee, remainder claimable by all NUTMEG holders pro-rata.</p></div>

      <div className="card p-6 border-emerald-200">
        <h3 className="font-semibold mb-4">Deposit USDC Surplus</h3>
        <form onSubmit={handleDeposit} className="space-y-4">
          <Field label="Lot ID" value={lotId} onChange={setLotId} placeholder="0x..." help="The lot that was sold. Find in GCNA admin → Manage Lots." mono />
          <Field label="USDC Amount" value={amount} onChange={setAmount} placeholder="50.00" type="number" help="Total surplus. 1% fee deducted. Remainder distributed to all NUTMEG holders based on balance at time of claim." />
          <button type="submit" disabled={submitting || !lotId || !amount} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-emerald-700 transition-colors active:scale-[0.98]">
            {submitting ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Depositing...</span> : "Deposit Surplus"}
          </button>
        </form>
        {result && <ResultBanner result={result} successMsg={`Surplus deposited. Farmers can now claim. Tx: ${result.digest?.slice(0, 24)}…`} />}
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-sm mb-3">How surplus distribution works</h3>
        <div className="space-y-3">
          {[
            "GCNA sells the nutmeg lot and receives payment.",
            "Surplus USDC is transferred to the platform admin wallet.",
            "You deposit it here — 1% fee collected, rest held for claims.",
            "Any NUTMEG holder can claim their pro-rata share.",
            "Share = (holder balance / total NUTMEG supply) × surplus pool.",
          ].map((text, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-xs font-mono text-anansi-muted font-medium mt-0.5">0{i + 1}</span>
              <p className="text-sm text-anansi-gray leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OverviewPanel({ stats }) {
  return (
    <div className="space-y-6">
      <h2 className="font-semibold text-lg">Platform Overview</h2>
      <div className="card p-6">
        <h3 className="font-semibold mb-5">Role architecture</h3>
        <div className="space-y-4">
          {[
            { role: "Platform Admin (You)", path: "/platform", desc: "Create asset types, assign custodians, deposit surplus. Server-side CLI keypair.", color: "bg-anansi-red" },
            { role: "Custodian (GCNA Staff)", path: "/admin", desc: "Create lots, record deliveries, manage lot lifecycle. zkLogin (Google).", color: "bg-anansi-black" },
            { role: "Farmer", path: "/farmer", desc: "View balances, sell early on DEX, claim surplus. zkLogin (Google).", color: "bg-emerald-600" },
            { role: "Buyer", path: "/buyer", desc: "Buy NUTMEG tokens, track portfolio. zkLogin (Google).", color: "bg-blue-600" },
          ].map((r, i) => (
            <div key={i} className="flex gap-3">
              <div className={`w-1.5 rounded-full ${r.color} shrink-0`} />
              <div>
                <p className="text-sm font-semibold">{r.role} <span className="font-mono text-xs text-anansi-muted">{r.path}</span></p>
                <p className="text-sm text-anansi-gray">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Environment</h3>
        <div className="space-y-2 text-sm">
          {[
            ["Admin", stats?.adminAddress],
            ["Asset Types", stats?.assetTypes],
            ["Lots", stats?.totalLots],
            ["Package", (process.env.NEXT_PUBLIC_PACKAGE_ID || "").slice(0, 20) + "…"],
            ["Network", process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet"],
          ].map(([label, value], i) => (
            <div key={i} className="flex justify-between py-1.5 border-b border-anansi-border last:border-0">
              <span className="text-anansi-muted">{label}</span>
              <span className="font-mono text-xs">{value ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Shared Components
// ============================================================

function Field({ label, value, onChange, placeholder, type = "text", mono, help }) {
  return (
    <div>
      <label className="block text-xs font-medium text-anansi-muted uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`input-field ${mono ? "font-mono text-xs" : ""}`} />
      {help && <p className="text-xs text-anansi-muted mt-1">{help}</p>}
    </div>
  );
}

function ResultBanner({ result, successMsg }) {
  return (
    <div className={`mt-4 p-4 rounded-lg text-sm ${result.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
      {result.success ? (typeof successMsg === 'string' ? successMsg : successMsg) : `Error: ${result.error}`}
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  const icons = {
    package: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
    user: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  };
  return (
    <div className="card text-center py-16">
      <div className="w-12 h-12 rounded-full bg-anansi-light flex items-center justify-center mx-auto">
        <svg className="w-6 h-6 text-anansi-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">{icons[icon]}</svg>
      </div>
      <p className="text-sm font-medium mt-3">{title}</p>
      <p className="text-xs text-anansi-muted mt-1">{subtitle}</p>
    </div>
  );
}
