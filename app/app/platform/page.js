"use client";

import { useState, useEffect, useCallback } from "react";
import PlatformAuthGate from "../../components/PlatformAuthGate";
import { TOKEN_REGISTRY } from "../../lib/constants";

export default function PlatformPage() {
  return (
    <PlatformAuthGate>
      {({ platformKey, onLogout }) => (
        <PlatformDashboard platformKey={platformKey} onLogout={onLogout} />
      )}
    </PlatformAuthGate>
  );
}

function PlatformDashboard({ platformKey, onLogout }) {
  const [tab, setTab] = useState("assets");
  const [stats, setStats] = useState(null);

  const api = useCallback(
    async (path, options = {}) => {
      const res = await fetch(`/api/platform/${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "x-platform-key": platformKey,
          ...options.headers,
        },
      });
      if (res.status === 401) {
        onLogout();
        throw new Error("Unauthorized");
      }
      return res.json();
    },
    [platformKey, onLogout],
  );

  useEffect(() => {
    api("stats").then(setStats).catch(console.error);
  }, [api]);

  const tabs = [
    { id: "assets", label: "Asset Types" },
    { id: "custodians", label: "Custodians" },
    { id: "compliance", label: "Compliance" },
    { id: "deposits", label: "Surplus Deposits" },
    { id: "dex", label: "DEX Pools" },
    { id: "treasury", label: "Treasury" },
    { id: "staking", label: "Staking" },
    { id: "overview", label: "Overview" },
  ];

  return (
    <div className="min-h-screen bg-anansi-cream">
      <header className="sticky top-0 z-50 bg-anansi-black/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-anansi-red to-anansi-accent" />
            <span className="font-display text-white text-lg tracking-tight">Anansi</span>
            <span className="badge bg-anansi-red/20 text-anansi-red ring-0 text-[10px]">
              Platform
            </span>
          </div>
          <div className="flex items-center gap-4">
            {stats && (
              <span className="text-[11px] text-gray-500 font-mono hidden sm:block">
                {stats.adminAddress?.slice(0, 8)}···{stats.adminAddress?.slice(-4)}
              </span>
            )}
            <button
              onClick={onLogout}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-in">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card p-4">
              <p className="stat-label">Admin</p>
              <p className="stat-value font-mono text-xs">{stats.adminAddress?.slice(0, 12)}…</p>
            </div>
            <div className="card p-4">
              <p className="stat-label">Asset Types</p>
              <p className="stat-value text-lg">{stats.assetTypes}</p>
            </div>
            <div className="card p-4">
              <p className="stat-label">Total Lots</p>
              <p className="stat-value text-lg">{stats.totalLots}</p>
            </div>
            <div className="card p-4">
              <p className="stat-label">Network</p>
              <p className="stat-value">{process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet"}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 mb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 bg-anansi-light rounded-lg p-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${tab === t.id ? "bg-white text-anansi-black shadow-card" : "text-anansi-muted hover:text-anansi-black"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <a
            href="/platform/analytics"
            className="btn-ghost text-sm inline-flex items-center justify-center"
          >
            Open Analytics
          </a>
        </div>

        {tab === "assets" && <AssetTypesPanel api={api} />}
        {tab === "custodians" && <CustodiansPanel api={api} />}
        {tab === "compliance" && <CompliancePanel api={api} />}
        {tab === "deposits" && <DepositsPanel api={api} />}
        {tab === "dex" && <DexPanel api={api} />}
        {tab === "treasury" && <TreasuryPanel api={api} />}
        {tab === "staking" && <StakingPanel api={api} />}
        {tab === "overview" && <OverviewPanel stats={stats} />}
      </div>
    </div>
  );
}

function AssetTypesPanel({ api }) {
  const [assetTypes, setAssetTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    symbol: "",
    name: "",
    unit: "kg",
    region: "",
    custodianName: "",
    custodianAddress: "",
  });

  const loadAssetTypes = useCallback(async () => {
    try {
      setAssetTypes(Array.isArray(await api("asset-types")) ? await api("asset-types") : []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [api]);
  useEffect(() => {
    loadAssetTypes();
  }, [loadAssetTypes]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const data = await api("asset-types", { method: "POST", body: JSON.stringify(form) });
      if (data.error) throw new Error(data.error);
      setResult({ success: true, data });
      setForm({
        symbol: "",
        name: "",
        unit: "kg",
        region: "",
        custodianName: "",
        custodianAddress: "",
      });
      setShowForm(false);
      setTimeout(loadAssetTypes, 3000);
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (assetTypeId, currentlyActive) => {
    try {
      await api("asset-types", {
        method: "PATCH",
        body: JSON.stringify({
          assetTypeId,
          action: currentlyActive ? "deactivate" : "reactivate",
        }),
      });
      setTimeout(loadAssetTypes, 2000);
    } catch (err) {
      alert("Failed: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">Asset Types</h2>
          <p className="text-sm text-anansi-muted">
            Register and manage tokenizable Caribbean assets.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancel" : "+ New Asset Type"}
        </button>
      </div>

      {showForm && (
        <div className="card p-6 border-anansi-red/20 animate-scale-in">
          <h3 className="font-semibold mb-1">Register New Asset Type</h3>
          <p className="text-sm text-anansi-muted mb-5">
            Creates an on-chain asset type and issues a CustodianCap to the specified address.
          </p>
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
            <Field
              label="Symbol"
              value={form.symbol}
              onChange={(v) => setForm((p) => ({ ...p, symbol: v }))}
              placeholder="NUTMG"
              help="Short ticker"
            />
            <Field
              label="Full Name"
              value={form.name}
              onChange={(v) => setForm((p) => ({ ...p, name: v }))}
              placeholder="Grenada Nutmeg"
            />
            <Field
              label="Unit"
              value={form.unit}
              onChange={(v) => setForm((p) => ({ ...p, unit: v }))}
              placeholder="kg"
              help="kg, sqft, barrel"
            />
            <Field
              label="Region"
              value={form.region}
              onChange={(v) => setForm((p) => ({ ...p, region: v }))}
              placeholder="Grenada"
            />
            <Field
              label="Custodian Name"
              value={form.custodianName}
              onChange={(v) => setForm((p) => ({ ...p, custodianName: v }))}
              placeholder="GCNA"
              help="Organization with physical custody"
            />
            <Field
              label="Custodian Address"
              value={form.custodianAddress}
              onChange={(v) => setForm((p) => ({ ...p, custodianAddress: v }))}
              placeholder="0x..."
              help="Sui address (zkLogin)"
              mono
            />
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-anansi-red text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-anansi-red-light transition-colors active:scale-[0.98]"
              >
                {submitting ? "Creating on-chain..." : "Create Asset Type"}
              </button>
            </div>
          </form>
          {result && (
            <ResultBanner
              result={result}
              successMsg={
                <>
                  <span className="font-medium">Asset type created.</span>{" "}
                  <span className="font-mono text-xs">Tx: {result.data?.digest}</span>
                </>
              }
            />
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="card p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : assetTypes.length === 0 ? (
        <EmptyState
          icon="package"
          title="No asset types registered"
          subtitle={`Click "+ New Asset Type" to register your first Caribbean asset.`}
        />
      ) : (
        <div className="space-y-3">
          {assetTypes.map((at) => (
            <div key={at.id} className="card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">{at.symbol}</span>
                  <span
                    className={`badge ${at.active ? "badge-open" : "bg-red-50 text-red-700 ring-1 ring-red-600/10"}`}
                  >
                    {at.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <button
                  onClick={() => handleToggle(at.id, at.active)}
                  className={`text-xs px-3 py-1 rounded-lg border transition-colors ${at.active ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}
                >
                  {at.active ? "Deactivate" : "Reactivate"}
                </button>
              </div>
              <p className="text-sm text-anansi-gray mt-2">{at.name}</p>
              <div className="flex gap-6 mt-3 text-xs text-anansi-muted">
                <span>
                  Region: <strong className="text-anansi-black">{at.region}</strong>
                </span>
                <span>
                  Unit: <strong className="text-anansi-black">{at.unit}</strong>
                </span>
                <span>
                  Custodian: <strong className="text-anansi-black">{at.custodian}</strong>
                </span>
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
  const [custodians, setCustodians] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ assetTypeId: "", custodianAddress: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    Promise.all([api("custodians"), api("asset-types")])
      .then(([c, a]) => {
        setCustodians(Array.isArray(c) ? c : []);
        setAssetTypes(Array.isArray(a) ? a : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api]);

  const handleIssue = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const data = await api("custodians", { method: "POST", body: JSON.stringify(form) });
      if (data.error) throw new Error(data.error);
      setResult({ success: true, digest: data.digest });
      setForm({ assetTypeId: "", custodianAddress: "" });
      setShowForm(false);
      setCustodians(Array.isArray(await api("custodians")) ? await api("custodians") : []);
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">Custodians</h2>
          <p className="text-sm text-anansi-muted">
            Manage who can create lots and record deliveries.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancel" : "+ Issue Cap"}
        </button>
      </div>

      {showForm && (
        <div className="card p-6 border-anansi-red/20 animate-scale-in">
          <h3 className="font-semibold mb-4">Issue New Custodian Capability</h3>
          <form onSubmit={handleIssue} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-anansi-muted uppercase tracking-wider mb-1.5">
                Asset Type
              </label>
              <select
                value={form.assetTypeId}
                onChange={(e) => setForm((p) => ({ ...p, assetTypeId: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">Select asset type...</option>
                {assetTypes.map((at) => (
                  <option key={at.id} value={at.id}>
                    {at.symbol} — {at.name}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Custodian Address"
              value={form.custodianAddress}
              onChange={(v) => setForm((p) => ({ ...p, custodianAddress: v }))}
              placeholder="0x..."
              help="Sui address of the new custodian"
              mono
            />
            <button
              type="submit"
              disabled={submitting || !form.assetTypeId || !form.custodianAddress}
              className="px-6 py-2.5 bg-anansi-red text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-anansi-red-light transition-colors active:scale-[0.98]"
            >
              {submitting ? "Issuing on-chain..." : "Issue Custodian Cap"}
            </button>
          </form>
          {result && (
            <ResultBanner
              result={result}
              successMsg={`Custodian cap issued. Tx: ${result.digest}`}
            />
          )}
        </div>
      )}

      {loading ? (
        <div className="card p-5 h-24 animate-pulse" />
      ) : custodians.length === 0 ? (
        <EmptyState
          icon="user"
          title="No custodians assigned"
          subtitle="Custodians are created automatically with asset types, or issue additional caps above."
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-anansi-border bg-anansi-light/50">
                <th className="text-left px-5 py-3 stat-label font-medium">Asset Type</th>
                <th className="text-left px-5 py-3 stat-label font-medium">Custodian Address</th>
                <th className="text-left px-5 py-3 stat-label font-medium">Issued</th>
              </tr>
            </thead>
            <tbody>
              {custodians.map((c, i) => (
                <tr
                  key={i}
                  className="border-b border-anansi-border last:border-0 hover:bg-anansi-light/30 transition-colors"
                >
                  <td className="px-5 py-3 font-semibold">{c.assetTypeSymbol}</td>
                  <td className="px-5 py-3 font-mono text-xs">{c.custodianAddress}</td>
                  <td className="px-5 py-3 text-xs text-anansi-muted">
                    {c.timestamp ? new Date(c.timestamp).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CompliancePanel({ api }) {
  const [users, setUsers] = useState([]);
  const [state, setState] = useState({ userCount: 0, enforcementEnabled: false });
  const [loading, setLoading] = useState(true);

  // Verify form
  const [showVerify, setShowVerify] = useState(false);
  const [verifyForm, setVerifyForm] = useState({
    userAddress: "",
    jurisdiction: "GD",
    providerRef: "",
    role: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Freeze form
  const [freezeAddress, setFreezeAddress] = useState("");
  const [freezeReason, setFreezeReason] = useState("");
  const [freezing, setFreezing] = useState(null);

  const loadCompliance = useCallback(async () => {
    try {
      const data = await api("compliance");
      setState({
        userCount: data.userCount || 0,
        enforcementEnabled: data.enforcementEnabled || false,
      });
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadCompliance();
  }, [loadCompliance]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const data = await api("compliance", {
        method: "POST",
        body: JSON.stringify({ action: "verify", ...verifyForm }),
      });
      if (data.error) throw new Error(data.error);
      setResult({ success: true, digest: data.digest });
      setVerifyForm({ userAddress: "", jurisdiction: "GD", providerRef: "", role: 0 });
      setShowVerify(false);
      setTimeout(loadCompliance, 3000);
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFreeze = async (address) => {
    const reason = prompt("Reason for freeze (regulatory hold, suspicious activity, etc.):");
    if (!reason) return;
    setFreezing(address);
    try {
      await api("compliance", {
        method: "POST",
        body: JSON.stringify({ action: "freeze", userAddress: address, reason }),
      });
      setTimeout(loadCompliance, 2000);
    } catch (err) {
      alert("Freeze failed: " + err.message);
    } finally {
      setFreezing(null);
    }
  };

  const handleUnfreeze = async (address) => {
    setFreezing(address);
    try {
      await api("compliance", {
        method: "POST",
        body: JSON.stringify({ action: "unfreeze", userAddress: address }),
      });
      setTimeout(loadCompliance, 2000);
    } catch (err) {
      alert("Unfreeze failed: " + err.message);
    } finally {
      setFreezing(null);
    }
  };

  const handleToggleEnforcement = async () => {
    try {
      await api("compliance", {
        method: "POST",
        body: JSON.stringify({ action: "set_enforcement", enabled: !state.enforcementEnabled }),
      });
      setTimeout(loadCompliance, 2000);
    } catch (err) {
      alert("Toggle failed: " + err.message);
    }
  };

  const roleLabels = { 0: "Buyer", 1: "Farmer", 2: "Custodian", 3: "Admin" };
  const jurisdictions = [
    { code: "GD", name: "Grenada" },
    { code: "TT", name: "Trinidad & Tobago" },
    { code: "BB", name: "Barbados" },
    { code: "JM", name: "Jamaica" },
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "EU", name: "European Union" },
    { code: "OTHER", name: "Other" },
  ];

  return (
    <div className="space-y-6">
      {/* Header + stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">Compliance</h2>
          <p className="text-sm text-anansi-muted">
            KYC verification, freeze controls, and enforcement settings.
          </p>
        </div>
        <button onClick={() => setShowVerify(!showVerify)} className="btn-primary">
          {showVerify ? "Cancel" : "+ Verify User"}
        </button>
      </div>

      {/* Enforcement toggle + stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="stat-label">Verified Users</p>
          <p className="stat-value text-lg">{state.userCount}</p>
        </div>
        <div className="card p-4">
          <p className="stat-label">Enforcement</p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`badge ${state.enforcementEnabled ? "badge-open" : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/10"}`}
            >
              {state.enforcementEnabled ? "Active" : "Disabled"}
            </span>
          </div>
        </div>
        <div className="card p-4 flex items-center justify-center">
          <button
            onClick={handleToggleEnforcement}
            className={`text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
              state.enforcementEnabled
                ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            {state.enforcementEnabled ? "Disable Enforcement" : "Enable Enforcement"}
          </button>
        </div>
      </div>

      {/* Verify form */}
      {showVerify && (
        <div className="card p-6 border-anansi-red/20 animate-scale-in">
          <h3 className="font-semibold mb-1">Verify New User</h3>
          <p className="text-sm text-anansi-muted mb-5">
            Register a user as KYC-verified. This is called after off-chain KYC completion.
          </p>
          <form onSubmit={handleVerify} className="grid md:grid-cols-2 gap-4">
            <Field
              label="User Address"
              value={verifyForm.userAddress}
              onChange={(v) => setVerifyForm((p) => ({ ...p, userAddress: v }))}
              placeholder="0x..."
              help="The user's Sui / zkLogin address"
              mono
            />
            <div>
              <label className="block text-xs font-medium text-anansi-muted uppercase tracking-wider mb-1.5">
                Jurisdiction
              </label>
              <select
                value={verifyForm.jurisdiction}
                onChange={(e) => setVerifyForm((p) => ({ ...p, jurisdiction: e.target.value }))}
                className="input-field"
              >
                {jurisdictions.map((j) => (
                  <option key={j.code} value={j.code}>
                    {j.code} — {j.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-anansi-muted uppercase tracking-wider mb-1.5">
                Role
              </label>
              <select
                value={verifyForm.role}
                onChange={(e) => setVerifyForm((p) => ({ ...p, role: parseInt(e.target.value) }))}
                className="input-field"
              >
                <option value={0}>Buyer</option>
                <option value={1}>Farmer</option>
                <option value={2}>Custodian</option>
                <option value={3}>Admin</option>
              </select>
            </div>
            <Field
              label="KYC Provider Ref"
              value={verifyForm.providerRef}
              onChange={(v) => setVerifyForm((p) => ({ ...p, providerRef: v }))}
              placeholder="KYC-12345"
              help="External reference from KYC provider (optional)"
            />
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting || !verifyForm.userAddress}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-emerald-700 transition-colors active:scale-[0.98]"
              >
                {submitting ? "Verifying on-chain..." : "Verify User"}
              </button>
            </div>
          </form>
          {result && (
            <div
              className={`mt-4 p-4 rounded-lg text-sm ${result.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}
            >
              {result.success
                ? `User verified on-chain. Tx: ${result.digest?.slice(0, 24)}…`
                : `Error: ${result.error}`}
            </div>
          )}
        </div>
      )}

      {/* User list */}
      {loading ? (
        <div className="card p-5 h-32 animate-pulse" />
      ) : users.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-12 h-12 rounded-full bg-anansi-light flex items-center justify-center mx-auto">
            <svg
              className="w-6 h-6 text-anansi-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium mt-3">No verified users</p>
          <p className="text-xs text-anansi-muted mt-1">
            Click "+ Verify User" to register the first KYC-verified user.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-anansi-border bg-anansi-light/50">
                <th className="text-left px-5 py-3 stat-label font-medium">Address</th>
                <th className="text-left px-5 py-3 stat-label font-medium">Jurisdiction</th>
                <th className="text-left px-5 py-3 stat-label font-medium">Role</th>
                <th className="text-left px-5 py-3 stat-label font-medium">Status</th>
                <th className="text-left px-5 py-3 stat-label font-medium">Verified</th>
                <th className="text-right px-5 py-3 stat-label font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={i}
                  className="border-b border-anansi-border last:border-0 hover:bg-anansi-light/30 transition-colors"
                >
                  <td className="px-5 py-3 font-mono text-xs">
                    {u.address?.slice(0, 8)}···{u.address?.slice(-6)}
                  </td>
                  <td className="px-5 py-3">
                    <span className="badge bg-blue-50 text-blue-700 ring-1 ring-blue-600/10">
                      {u.jurisdiction}
                    </span>
                  </td>
                  <td className="px-5 py-3">{u.roleLabel}</td>
                  <td className="px-5 py-3">
                    {u.frozen ? (
                      <span className="badge bg-red-50 text-red-700 ring-1 ring-red-600/10">
                        Frozen
                      </span>
                    ) : (
                      <span className="badge badge-open">Active</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-anansi-muted">
                    {u.verifiedAt ? new Date(u.verifiedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {u.frozen ? (
                      <button
                        onClick={() => handleUnfreeze(u.address)}
                        disabled={freezing === u.address}
                        className="text-xs px-3 py-1 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                      >
                        {freezing === u.address ? "..." : "Unfreeze"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFreeze(u.address)}
                        disabled={freezing === u.address}
                        className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {freezing === u.address ? "..." : "Freeze"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info */}
      <div className="card p-5">
        <h3 className="font-semibold text-sm mb-3">How compliance works</h3>
        <div className="space-y-3">
          {[
            "Users complete KYC through an external provider (Sumsub, Onfido, etc.).",
            "After verification, the platform admin registers them on-chain here.",
            "When enforcement is enabled, only verified + non-frozen addresses can transact.",
            "Frozen addresses cannot claim surplus, sell tokens, or make purchases.",
            "Enforcement can be disabled for testnet or early-stage development.",
          ].map((text, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-xs font-mono text-anansi-muted font-medium mt-0.5">
                0{i + 1}
              </span>
              <p className="text-sm text-anansi-gray leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DepositsPanel({ api }) {
  const [lotId, setLotId] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Read registered tokens from env (works server-rendered)
  const registeredTokens = (process.env.NEXT_PUBLIC_REGISTERED_TOKENS || "NUTMEG")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Default to first token
  useEffect(() => {
    if (!tokenSymbol && registeredTokens.length > 0) {
      setTokenSymbol(registeredTokens[0]);
    }
  }, []);

  const handleDeposit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const data = await api("deposit", {
        method: "POST",
        body: JSON.stringify({ lotId, amount: parseFloat(amount), tokenSymbol }),
      });
      if (data.error) throw new Error(data.error);
      setResult(data);
      setAmount("");
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-lg">Surplus Deposits</h2>
        <p className="text-sm text-anansi-muted">
          Deposit USDC surplus for a lot after commodity sale. 1% fee, remainder claimable by all
          token holders pro-rata.
        </p>
      </div>

      <div className="card p-6 border-emerald-200">
        <h3 className="font-semibold mb-4">Deposit USDC Surplus</h3>
        <form onSubmit={handleDeposit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-anansi-muted uppercase tracking-wider mb-1.5">
              Token
            </label>
            <select
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              className="input-field"
              required
            >
              {registeredTokens.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <p className="text-xs text-anansi-muted mt-1">
              Which commodity token this surplus is for. The total supply of this token is used for
              the pro-rata snapshot.
            </p>
          </div>
          <Field
            label="Lot ID"
            value={lotId}
            onChange={setLotId}
            placeholder="0x..."
            help="The lot that was sold. Find in Admin → Manage Lots."
            mono
          />
          <Field
            label="USDC Amount"
            value={amount}
            onChange={setAmount}
            placeholder="50.00"
            type="number"
            help="Total surplus in USDC. 1% fee deducted. Remainder distributed to all token holders."
          />
          <button
            type="submit"
            disabled={submitting || !lotId || !amount || !tokenSymbol}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-emerald-700 transition-colors active:scale-[0.98]"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Depositing...
              </span>
            ) : (
              `Deposit Surplus for ${tokenSymbol || "..."}`
            )}
          </button>
        </form>
        {result && (
          <>
            <ResultBanner
              result={result}
              successMsg={`Surplus deposited for ${tokenSymbol}. Farmers can now claim. Tx: ${(result.depositDigest || result.digest)?.slice(0, 24)}…`}
            />
            {!result.feeConverted && (result.reason || result.feeCoinId) && (
              <div className="mt-4 p-4 rounded-lg text-sm bg-amber-50 text-amber-900 border border-amber-200">
                <p className="font-medium">
                  {result.recoverable
                    ? "Fee conversion did not complete automatically."
                    : "Fee conversion was not completed in this deposit flow."}
                </p>
                {result.reason && <p className="mt-1">{result.reason}</p>}
                {result.feeCoinId && (
                  <p className="mt-2 font-mono text-[11px] break-all">
                    Fee coin ID: {result.feeCoinId}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-sm mb-3">How surplus distribution works</h3>
        <div className="space-y-3">
          {[
            "Custodian sells the commodity lot and receives payment.",
            "Surplus USDC is transferred to the platform admin wallet.",
            "You deposit it here — select the correct token, 1% fee collected, rest held for claims.",
            `Any ${tokenSymbol || "token"} holder can claim their pro-rata share.`,
            `Share = (holder balance / total ${tokenSymbol || "token"} supply) × surplus pool.`,
          ].map((text, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-xs font-mono text-anansi-muted font-medium mt-0.5">
                0{i + 1}
              </span>
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
            {
              role: "Platform Admin (You)",
              path: "/platform",
              desc: "Create asset types, assign custodians, deposit surplus. Server-side CLI keypair.",
              color: "bg-anansi-red",
            },
            {
              role: "Custodian (GCNA Staff)",
              path: "/admin",
              desc: "Create lots, record deliveries, manage lot lifecycle. zkLogin (Google).",
              color: "bg-anansi-black",
            },
            {
              role: "Farmer",
              path: "/farmer",
              desc: "View balances, sell early on DEX, claim surplus. zkLogin (Google).",
              color: "bg-emerald-600",
            },
            {
              role: "Buyer",
              path: "/buyer",
              desc: "Buy NUTMEG tokens, track portfolio. zkLogin (Google).",
              color: "bg-blue-600",
            },
          ].map((r, i) => (
            <div key={i} className="flex gap-3">
              <div className={`w-1.5 rounded-full ${r.color} shrink-0`} />
              <div>
                <p className="text-sm font-semibold">
                  {r.role} <span className="font-mono text-xs text-anansi-muted">{r.path}</span>
                </p>
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
            <div
              key={i}
              className="flex justify-between py-1.5 border-b border-anansi-border last:border-0"
            >
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  mono,
  help,
  readOnly = false,
  disabled = false,
}) {
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
        readOnly={readOnly}
        disabled={disabled}
        className={`input-field ${mono ? "font-mono text-xs" : ""}`}
      />
      {help && <p className="text-xs text-anansi-muted mt-1">{help}</p>}
    </div>
  );
}

function ResultBanner({ result, successMsg }) {
  return (
    <div
      className={`mt-4 p-4 rounded-lg text-sm ${result.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}
    >
      {result.success
        ? typeof successMsg === "string"
          ? successMsg
          : successMsg
        : `Error: ${result.error}`}
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  const icons = {
    package: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    ),
    user: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    ),
  };
  return (
    <div className="card text-center py-16">
      <div className="w-12 h-12 rounded-full bg-anansi-light flex items-center justify-center mx-auto">
        <svg
          className="w-6 h-6 text-anansi-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {icons[icon]}
        </svg>
      </div>
      <p className="text-sm font-medium mt-3">{title}</p>
      <p className="text-xs text-anansi-muted mt-1">{subtitle}</p>
    </div>
  );
}

// ============================================================
// Cetus Dex Panel
// ============================================================

function DexPanel({ api }) {
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [usdcAmount, setUsdcAmount] = useState("1");
  const [commodityAmount, setCommodityAmount] = useState("1");
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [result, setResult] = useState(null);
  const [prices, setPrices] = useState({});
  const [addQuote, setAddQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");

  // Read DEX tokens from the shared registry so CARIB can be included cleanly.
  const registeredTokens = Object.keys(TOKEN_REGISTRY);

  // EFFECT 1: Set initial token selection (Dependencies: stringified array to prevent loops)
  useEffect(() => {
    if (!tokenSymbol && registeredTokens.length > 0) {
      setTokenSymbol(registeredTokens[0]);
    }
  }, [tokenSymbol, registeredTokens.join(",")]);

  // EFFECT 2: Fetch live prices ONLY ONCE when the panel mounts
  useEffect(() => {
    fetch("/api/cetus/price")
      .then((res) => res.json())
      .then((data) => setPrices(data.prices || {}))
      .catch(console.error);
  }, []);

  const selectedPoolId = TOKEN_REGISTRY[tokenSymbol]?.poolId || "";
  const hasSelectedPool = selectedPoolId && selectedPoolId.trim() !== "";

  useEffect(() => {
    if (!hasSelectedPool) {
      setAddQuote(null);
      setQuoteError("");
      setQuoting(false);
      return;
    }

    const parsedUsdcAmount = parseFloat(usdcAmount);
    if (!tokenSymbol || !parsedUsdcAmount || parsedUsdcAmount <= 0) {
      setAddQuote(null);
      setQuoteError("");
      setQuoting(false);
      return;
    }

    let cancelled = false;
    setQuoting(true);
    setQuoteError("");

    fetch("/api/cetus/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: tokenSymbol,
        usdcAmount: parsedUsdcAmount,
        preview: true,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to quote liquidity");
        if (!cancelled) setAddQuote(data.quote || null);
      })
      .catch((err) => {
        if (!cancelled) {
          setAddQuote(null);
          setQuoteError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setQuoting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasSelectedPool, tokenSymbol, usdcAmount, selectedPoolId]);

  const handleCreatePool = async (e) => {
    e.preventDefault();
    setCreating(true);
    setResult(null);

    try {
      const res = await fetch("/api/cetus/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: tokenSymbol,
          usdcAmount: parseFloat(usdcAmount),
          commodityAmount: parseFloat(commodityAmount),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create pool");

      setResult({ success: true, mode: "create", poolId: data.poolId, digest: data.digest });
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setCreating(false);
    }
  };

  const handleAddLiquidity = async (e) => {
    e.preventDefault();
    setAdding(true);
    setResult(null);

    try {
      const res = await fetch("/api/cetus/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: tokenSymbol,
          usdcAmount: parseFloat(usdcAmount),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add liquidity");

      setResult({
        success: true,
        mode: "add",
        poolId: data.poolId,
        positionId: data.positionId,
        digest: data.digest,
        quote: data.quote,
      });
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveLiquidity = async (symbol) => {
    if (
      !confirm(
        `Are you sure you want to withdraw all liquidity for ${symbol}? This will halt trading for this token on the marketplace.`,
      )
    )
      return;

    setRemoving(symbol);
    try {
      const res = await fetch("/api/cetus/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove liquidity");

      alert(
        `Success! Liquidity withdrawn.\n\nTokens returned to admin wallet.\nTx: ${data.digest.slice(0, 15)}...`,
      );

      setResult(null);
    } catch (err) {
      alert("Error withdrawing liquidity: " + err.message);
    } finally {
      setRemoving(null);
    }
  };

  const initialPrice = parseFloat(usdcAmount) / parseFloat(commodityAmount) || 0;
  const referencePrice =
    prices[tokenSymbol]?.priceUsdc ||
    (addQuote
      ? parseFloat(addQuote.estimatedUsdcAmount) / parseFloat(addQuote.estimatedTokenAmount || "0")
      : 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-lg">DEX Liquidity Pools</h2>
        <p className="text-sm text-anansi-muted">
          Initialize Automated Market Maker (AMM) pools on Cetus to enable early token trading.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column: Create Pool Form */}
        <div className="card p-6 border-anansi-red/20">
          <h3 className="font-semibold mb-4">
            {hasSelectedPool ? "Add Liquidity to Existing Pool" : "Initialize New Pool"}
          </h3>
          <form
            onSubmit={hasSelectedPool ? handleAddLiquidity : handleCreatePool}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-anansi-muted uppercase tracking-wider mb-1.5">
                Commodity Token
              </label>
              <select
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                className="input-field"
                required
              >
                {registeredTokens.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="USDC Deposit"
                value={usdcAmount}
                onChange={setUsdcAmount}
                type="number"
                placeholder="10"
                help={
                  hasSelectedPool
                    ? "Fixed side. The matching token amount is quoted automatically."
                    : undefined
                }
              />
              <Field
                label={`${tokenSymbol || "Token"} ${hasSelectedPool ? "Required" : "Deposit"}`}
                value={hasSelectedPool ? (addQuote?.estimatedTokenAmount ?? "") : commodityAmount}
                onChange={setCommodityAmount}
                type="number"
                placeholder="10"
                readOnly={hasSelectedPool}
                disabled={hasSelectedPool}
                help={
                  hasSelectedPool
                    ? quoting
                      ? "Quoting required token amount..."
                      : quoteError
                        ? `Quote failed: ${quoteError}`
                        : addQuote
                          ? `Estimated from current pool price. Max spend with slippage buffer: ${addQuote.maxTokenAmount} ${tokenSymbol}.`
                          : "Enter a USDC amount to calculate the matching token deposit."
                    : undefined
                }
              />
            </div>

            <div className="p-3 bg-anansi-light rounded-lg text-xs flex justify-between items-center">
              <span className="text-anansi-muted">
                {hasSelectedPool ? "Reference Price:" : "Initial Price:"}
              </span>
              <span className="font-semibold text-anansi-black">
                ${(hasSelectedPool ? referencePrice : initialPrice).toFixed(6)} USDC
              </span>
            </div>

            {hasSelectedPool && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                <span className="text-emerald-800 font-medium block mb-1">
                  Active Pool Detected
                </span>
                <span className="font-mono text-[10px] text-emerald-700 break-all">
                  {selectedPoolId}
                </span>
                {addQuote && (
                  <div className="mt-2 text-emerald-800 space-y-1">
                    <div>
                      You will deposit approximately {addQuote.estimatedUsdcAmount} USDC and{" "}
                      {addQuote.estimatedTokenAmount} {tokenSymbol}.
                    </div>
                    <div className="text-[10px] text-emerald-700">
                      Max spend with slippage buffer: {addQuote.maxUsdcAmount} USDC and{" "}
                      {addQuote.maxTokenAmount} {tokenSymbol}.
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={
                creating ||
                adding ||
                quoting ||
                !tokenSymbol ||
                !usdcAmount ||
                (!hasSelectedPool && !commodityAmount) ||
                (hasSelectedPool && (!addQuote || !!quoteError))
              }
              className="w-full px-6 py-2.5 bg-anansi-red text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-anansi-red-light transition-colors active:scale-[0.98]"
            >
              {hasSelectedPool
                ? adding
                  ? "Adding Liquidity..."
                  : "Add Liquidity"
                : creating
                  ? "Deploying to Cetus..."
                  : "Create Liquidity Pool"}
            </button>
          </form>

          {result && (
            <ResultBanner
              result={result}
              successMsg={
                result.mode === "add" ? (
                  <>
                    <span className="font-medium block mb-1">Liquidity Added Successfully!</span>
                    <span className="font-mono text-[10px] block truncate">
                      Pool: {result.poolId}
                    </span>
                    {result.quote && (
                      <span className="text-xs text-anansi-muted mt-2 block">
                        Deposited {result.quote.estimatedUsdcAmount} USDC and{" "}
                        {result.quote.estimatedTokenAmount} {tokenSymbol}.
                      </span>
                    )}
                    {result.positionId && (
                      <span className="font-mono text-[10px] block truncate mt-1">
                        Position: {result.positionId}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="font-medium block mb-1">Pool Created Successfully!</span>
                    <span className="font-mono text-[10px] block truncate">
                      ID: {result.poolId}
                    </span>
                    <span className="text-xs text-anansi-muted mt-2 block">
                      Add this ID to NEXT_PUBLIC_TOKEN_CONFIG in .env.local and restart the server.
                    </span>
                  </>
                )
              }
            />
          )}
        </div>

        {/* Right Column: Live Pool Stats */}
        <div className="space-y-3">
          <h3 className="font-semibold mb-2">Live Pools</h3>
          {registeredTokens.map((symbol) => {
            const poolId = TOKEN_REGISTRY[symbol]?.poolId || "";
            const hasPool = poolId.trim() !== "";
            const livePrice = prices[symbol]?.priceUsdc;

            return (
              <div key={symbol} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{symbol}</span>
                    <span
                      className={`badge ${hasPool ? "badge-open" : "bg-gray-100 text-gray-500"}`}
                    >
                      {hasPool ? "Active" : "No Pool"}
                    </span>
                  </div>
                  {hasPool && livePrice && (
                    <span className="font-semibold text-emerald-700">${livePrice.toFixed(4)}</span>
                  )}
                </div>

                {hasPool ? (
                  <div className="mt-3 pt-3 border-t border-anansi-border flex justify-between items-center">
                    <p className="text-[10px] font-mono text-anansi-muted truncate mr-4">
                      {poolId}
                    </p>
                    <button
                      onClick={() => handleRemoveLiquidity(symbol)}
                      disabled={removing === symbol}
                      className="text-[10px] uppercase tracking-wider font-semibold text-red-600 hover:text-red-800 transition-colors shrink-0"
                    >
                      {removing === symbol ? "Removing..." : "Withdraw"}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-anansi-muted mt-1">Pending initialization</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TreasuryPanel({ api }) {
  const [treasury, setTreasury] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingReceiver, setSavingReceiver] = useState(false);
  const [savingBurnRate, setSavingBurnRate] = useState(false);
  const [result, setResult] = useState(null);
  const [treasuryAddress, setTreasuryAddress] = useState("");
  const [burnPercent, setBurnPercent] = useState("");

  const loadTreasury = useCallback(async () => {
    const data = await api("treasury");
    setTreasury(data);
    setTreasuryAddress(data.treasuryReceiverAddress || "");
    setBurnPercent(data.burnPercent || "0.00");
  }, [api]);

  useEffect(() => {
    loadTreasury()
      .catch((err) => setResult({ success: false, error: err.message }))
      .finally(() => setLoading(false));
  }, [loadTreasury]);

  const handleUpdateReceiver = async (e) => {
    e.preventDefault();
    setSavingReceiver(true);
    setResult(null);
    try {
      const data = await api("treasury", {
        method: "PATCH",
        body: JSON.stringify({ action: "set_receiver", treasuryAddress }),
      });
      if (data.error) throw new Error(data.error);
      setResult({ success: true, digest: data.digest });
      await loadTreasury();
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setSavingReceiver(false);
    }
  };

  const handleUpdateBurnRate = async (e) => {
    e.preventDefault();
    setSavingBurnRate(true);
    setResult(null);
    try {
      const burnBps = Math.round(parseFloat(burnPercent || "0") * 100);
      const data = await api("treasury", {
        method: "PATCH",
        body: JSON.stringify({ action: "set_burn_rate", burnBps }),
      });
      if (data.error) throw new Error(data.error);
      setResult({ success: true, digest: data.digest });
      await loadTreasury();
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setSavingBurnRate(false);
    }
  };

  if (loading) {
    return <div className="card p-6 h-48 animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-lg">Treasury</h2>
        <p className="text-sm text-anansi-muted">
          Monitor CARIB treasury balances and manage the fee-routing settings that control burns and
          treasury flows.
        </p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="stat-label">Treasury Balance</p>
          <p className="stat-value text-lg">{treasury?.treasuryBalance || "0"} CARIB</p>
          <p className="text-xs text-anansi-muted mt-1">At the current treasury receiver address</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">Total Burned</p>
          <p className="stat-value text-lg">{treasury?.totalBurned || "0"} CARIB</p>
          <p className="text-xs text-anansi-muted mt-1">
            All-time across the CARIB treasury object
          </p>
        </div>
        <div className="card p-5">
          <p className="stat-label">Routed To Treasury</p>
          <p className="stat-value text-lg">{treasury?.totalToTreasury || "0"} CARIB</p>
          <p className="text-xs text-anansi-muted mt-1">Cumulative from fee_converter</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">Burn Rate</p>
          <p className="stat-value text-lg">{treasury?.burnPercent || "0.00"}%</p>
          <p className="text-xs text-anansi-muted mt-1">
            {treasury?.feeEventCount || 0} fee events processed
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Treasury Receiver</h3>
          <form onSubmit={handleUpdateReceiver} className="space-y-4">
            <Field
              label="Treasury Address"
              value={treasuryAddress}
              onChange={setTreasuryAddress}
              placeholder="0x..."
              help="Future treasury CARIB flows will be sent here. Existing balances are not moved."
              mono
            />
            <button
              type="submit"
              disabled={savingReceiver || !treasuryAddress}
              className="px-6 py-2.5 bg-anansi-red text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-anansi-red-light transition-colors active:scale-[0.98]"
            >
              {savingReceiver ? "Updating..." : "Update Treasury Receiver"}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-4">Fee Management</h3>
          <form onSubmit={handleUpdateBurnRate} className="space-y-4">
            <Field
              label="Burn Percentage"
              value={burnPercent}
              onChange={setBurnPercent}
              placeholder="50.00"
              type="number"
              help="Percent of each CARIB fee to burn. The remainder is routed to the treasury receiver."
            />
            <button
              type="submit"
              disabled={savingBurnRate || burnPercent === ""}
              className="px-6 py-2.5 bg-anansi-black text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-anansi-black/90 transition-colors active:scale-[0.98]"
            >
              {savingBurnRate ? "Updating..." : "Update Burn Rate"}
            </button>
          </form>
          <div className="mt-4 pt-4 border-t border-anansi-border text-sm space-y-2">
            <div className="flex justify-between gap-4">
              <span className="text-anansi-muted">Current Burned Via Fees</span>
              <span className="font-mono text-[11px]">{treasury?.burnedViaFees || "0"} CARIB</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-anansi-muted">Fee Converter</span>
              <span className="font-mono text-[11px] break-all text-right">
                {treasury?.feeConverterId || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold mb-4">On-Chain Details</h3>
        <div className="space-y-3 text-sm">
          {[
            ["Receiver", treasury?.treasuryReceiverAddress],
            ["Treasury Object Holder", treasury?.treasuryObjectOwner],
            ["CARIB Treasury Object", treasury?.caribTreasuryId],
            ["Fee Converter", treasury?.feeConverterId],
            ["Burned Via Fees", `${treasury?.burnedViaFees || "0"} CARIB`],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between gap-4 py-2 border-b border-anansi-border last:border-0"
            >
              <span className="text-anansi-muted">{label}</span>
              <span className="font-mono text-[11px] text-right break-all">{value || "—"}</span>
            </div>
          ))}
        </div>

        {result && (
          <div className="mt-4">
            <ResultBanner
              result={result}
              successMsg={`Treasury setting updated. Tx: ${result.digest}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function StakingPanel({ api }) {
  const [staking, setStaking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingCooldown, setSavingCooldown] = useState(false);
  const [savingThresholds, setSavingThresholds] = useState(false);
  const [result, setResult] = useState(null);
  const [cooldownHours, setCooldownHours] = useState("");
  const [form, setForm] = useState({
    governanceThreshold: "",
    premiumThreshold: "",
    feeReductionThreshold: "",
    priorityAccessThreshold: "",
  });

  const loadStaking = useCallback(async () => {
    const data = await api("staking");
    setStaking(data);
    setCooldownHours(data.cooldownHours || "");
    setForm({
      governanceThreshold: data.governanceThreshold || "",
      premiumThreshold: data.premiumThreshold || "",
      feeReductionThreshold: data.feeReductionThreshold || "",
      priorityAccessThreshold: data.priorityAccessThreshold || "",
    });
  }, [api]);

  useEffect(() => {
    loadStaking()
      .catch((err) => setResult({ success: false, error: err.message }))
      .finally(() => setLoading(false));
  }, [loadStaking]);

  const handleUpdateCooldown = async (e) => {
    e.preventDefault();
    setSavingCooldown(true);
    setResult(null);
    try {
      const data = await api("staking", {
        method: "PATCH",
        body: JSON.stringify({ action: "set_cooldown", cooldownHours: parseFloat(cooldownHours) }),
      });
      if (data.error) throw new Error(data.error);
      setResult({ success: true, digest: data.digest });
      await loadStaking();
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setSavingCooldown(false);
    }
  };

  const handleUpdateThresholds = async (e) => {
    e.preventDefault();
    setSavingThresholds(true);
    setResult(null);
    try {
      const data = await api("staking", {
        method: "PATCH",
        body: JSON.stringify({
          action: "set_thresholds",
          governanceThreshold: parseFloat(form.governanceThreshold),
          premiumThreshold: parseFloat(form.premiumThreshold),
          feeReductionThreshold: parseFloat(form.feeReductionThreshold),
          priorityAccessThreshold: parseFloat(form.priorityAccessThreshold),
        }),
      });
      if (data.error) throw new Error(data.error);
      setResult({ success: true, digest: data.digest });
      await loadStaking();
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setSavingThresholds(false);
    }
  };

  if (loading) {
    return <div className="card p-6 h-48 animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-lg">Staking</h2>
        <p className="text-sm text-anansi-muted">
          Monitor CARIB participation and govern the staking cooldown and benefit thresholds.
        </p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="stat-label">Total Staked</p>
          <p className="stat-value text-lg">{staking?.totalStaked || "0"} CARIB</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">Total Stakers</p>
          <p className="stat-value text-lg">{staking?.totalStakers || 0}</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">Cooldown</p>
          <p className="stat-value text-lg">{staking?.cooldownHours || "0.00"} hrs</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">Staking Config</p>
          <p className="font-mono text-[11px] break-all mt-2">{staking?.stakingConfigId || "—"}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Cooldown</h3>
          <form onSubmit={handleUpdateCooldown} className="space-y-4">
            <Field
              label="Cooldown Hours"
              value={cooldownHours}
              onChange={setCooldownHours}
              placeholder="24"
              type="number"
              help={`Allowed range: ${staking?.minCooldownHours || "0"} to ${staking?.maxCooldownHours || "0"} hours`}
            />
            <button
              type="submit"
              disabled={savingCooldown || cooldownHours === ""}
              className="px-6 py-2.5 bg-anansi-red text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-anansi-red-light transition-colors active:scale-[0.98]"
            >
              {savingCooldown ? "Updating..." : "Update Cooldown"}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-4">Benefit Thresholds</h3>
          <form onSubmit={handleUpdateThresholds} className="space-y-4">
            <Field
              label="Governance"
              value={form.governanceThreshold}
              onChange={(v) => setForm((p) => ({ ...p, governanceThreshold: v }))}
              placeholder="1000"
              type="number"
              help="Minimum active CARIB for governance voting"
            />
            <Field
              label="Premium"
              value={form.premiumThreshold}
              onChange={(v) => setForm((p) => ({ ...p, premiumThreshold: v }))}
              placeholder="5000"
              type="number"
              help="Minimum active CARIB for premium features"
            />
            <Field
              label="Fee Reduction"
              value={form.feeReductionThreshold}
              onChange={(v) => setForm((p) => ({ ...p, feeReductionThreshold: v }))}
              placeholder="10000"
              type="number"
              help="Minimum active CARIB for reduced fees"
            />
            <Field
              label="Priority Access"
              value={form.priorityAccessThreshold}
              onChange={(v) => setForm((p) => ({ ...p, priorityAccessThreshold: v }))}
              placeholder="50000"
              type="number"
              help="Minimum active CARIB for early access to new pools"
            />
            <button
              type="submit"
              disabled={savingThresholds || Object.values(form).some((value) => value === "")}
              className="px-6 py-2.5 bg-anansi-black text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-anansi-black/90 transition-colors active:scale-[0.98]"
            >
              {savingThresholds ? "Updating..." : "Update Thresholds"}
            </button>
          </form>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold mb-4">Current Thresholds</h3>
        <div className="space-y-3 text-sm">
          {[
            ["Governance", `${staking?.governanceThreshold || "0"} CARIB`],
            ["Premium", `${staking?.premiumThreshold || "0"} CARIB`],
            ["Fee Reduction", `${staking?.feeReductionThreshold || "0"} CARIB`],
            ["Priority Access", `${staking?.priorityAccessThreshold || "0"} CARIB`],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between gap-4 py-2 border-b border-anansi-border last:border-0"
            >
              <span className="text-anansi-muted">{label}</span>
              <span className="font-mono text-[11px] text-right break-all">{value}</span>
            </div>
          ))}
        </div>

        {result && (
          <div className="mt-4">
            <ResultBanner
              result={result}
              successMsg={`Staking setting updated. Tx: ${result.digest}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
