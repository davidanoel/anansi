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
      <div className="min-h-screen flex items-center justify-center px-6 bg-anansi-cream">
        <div className="max-w-sm w-full">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-b from-anansi-black to-anansi-red mx-auto" />
          <h1 className="text-2xl font-bold text-center mt-6">Platform Admin</h1>
          <p className="text-anansi-gray text-sm text-center mt-2 mb-8">
            Anansi Technology Corporation
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Platform admin key"
              className="w-full px-4 py-3 border border-anansi-border rounded-lg text-sm font-mono"
              autoFocus
            />
            <button
              type="submit"
              disabled={!password}
              className="w-full py-3 bg-anansi-black text-white rounded-lg font-medium text-sm disabled:opacity-50 hover:bg-anansi-red transition-colors"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <PlatformDashboard
      platformKey={platformKey}
      onLogout={() => {
        setAuthenticated(false);
        setPlatformKey("");
      }}
    />
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
    { id: "deposits", label: "Surplus Deposits" },
    { id: "overview", label: "Overview" },
  ];

  return (
    <div className="min-h-screen bg-anansi-cream">
      <header className="sticky top-0 z-50 bg-anansi-red text-white">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-tight">ANANSI PLATFORM</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            {stats && (
              <span className="text-xs text-white/70 font-mono hidden sm:block">
                {stats.adminAddress?.slice(0, 8)}...{stats.adminAddress?.slice(-4)}
              </span>
            )}
            <button onClick={onLogout} className="text-xs text-white/70 hover:text-white">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard label="Admin Address" value={`${stats.adminAddress?.slice(0, 10)}...`} />
            <StatCard label="Asset Types" value={stats.assetTypes} />
            <StatCard label="Total Lots" value={stats.totalLots} />
            <StatCard label="Total Asset Types" value={stats.totalAssetTypes} />
          </div>
        )}

        {/* Tabs */}
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

        {tab === "assets" && <AssetTypesPanel api={api} />}
        {tab === "custodians" && <CustodiansPanel api={api} />}
        {tab === "deposits" && <DepositsPanel api={api} />}
        {tab === "overview" && <OverviewPanel stats={stats} />}
      </div>
    </div>
  );
}

// ============================================================
// Asset Types Panel
// ============================================================

function AssetTypesPanel({ api }) {
  const [assetTypes, setAssetTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    symbol: "",
    name: "",
    unit: "kg",
    region: "",
    custodianName: "",
    custodianAddress: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const loadAssetTypes = useCallback(async () => {
    try {
      const data = await api("asset-types");
      setAssetTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
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
      const data = await api("asset-types", {
        method: "POST",
        body: JSON.stringify(form),
      });
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
          <h2 className="font-bold text-lg">Asset Types</h2>
          <p className="text-sm text-anansi-gray">
            Register and manage tokenizable Caribbean assets.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-anansi-black text-white rounded-lg text-sm hover:bg-anansi-red transition-colors"
        >
          {showForm ? "Cancel" : "+ New Asset Type"}
        </button>
      </div>

      {showForm && (
        <div className="p-6 border-2 border-anansi-red/30 bg-white rounded-xl">
          <h3 className="font-semibold mb-1">Register New Asset Type</h3>
          <p className="text-sm text-anansi-gray mb-4">
            This creates a new tokenizable asset and issues a CustodianCap to the specified address.
            That custodian can then create lots and record deliveries from the Spice app.
          </p>
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
            <Field
              label="Symbol"
              value={form.symbol}
              onChange={(v) => setForm((p) => ({ ...p, symbol: v }))}
              placeholder="NUTMG"
              help="Short ticker (e.g., NUTMG, COCO, VILLA)"
              required
            />
            <Field
              label="Full Name"
              value={form.name}
              onChange={(v) => setForm((p) => ({ ...p, name: v }))}
              placeholder="Grenada Nutmeg"
              required
            />
            <Field
              label="Unit"
              value={form.unit}
              onChange={(v) => setForm((p) => ({ ...p, unit: v }))}
              placeholder="kg"
              help="kg, sqft, barrel, unit"
              required
            />
            <Field
              label="Region"
              value={form.region}
              onChange={(v) => setForm((p) => ({ ...p, region: v }))}
              placeholder="Grenada"
              required
            />
            <Field
              label="Custodian Name"
              value={form.custodianName}
              onChange={(v) => setForm((p) => ({ ...p, custodianName: v }))}
              placeholder="GCNA"
              help="Organization with physical custody"
              required
            />
            <Field
              label="Custodian Address"
              value={form.custodianAddress}
              onChange={(v) => setForm((p) => ({ ...p, custodianAddress: v }))}
              placeholder="0x..."
              help="Sui address of the custodian (GCNA staff's zkLogin address)"
              mono
              required
            />
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-anansi-red text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-red-700 transition-colors"
              >
                {submitting ? "Creating on-chain..." : "Create Asset Type"}
              </button>
            </div>
          </form>
          {result && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              {result.success ? (
                <div>
                  <p className="font-medium">Asset type created on-chain.</p>
                  <p className="font-mono text-xs mt-1">Tx: {result.data?.digest}</p>
                  {result.data?.objects?.map((obj, i) => (
                    <p key={i} className="font-mono text-xs mt-1">
                      {obj.type}: {obj.id}
                    </p>
                  ))}
                </div>
              ) : (
                `Error: ${result.error}`
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-anansi-gray text-sm py-4">Loading from chain...</p>
      ) : assetTypes.length === 0 ? (
        <div className="text-center py-16 border border-anansi-border rounded-xl bg-white">
          <p className="text-4xl mb-3">🌿</p>
          <p className="font-semibold">No asset types registered</p>
          <p className="text-anansi-gray text-sm mt-1">
            Click "+ New Asset Type" to register your first Caribbean asset.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assetTypes.map((at) => (
            <div key={at.id} className="p-5 border border-anansi-border rounded-xl bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold">{at.symbol}</span>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                      at.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {at.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <button
                  onClick={() => handleToggle(at.id, at.active)}
                  className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                    at.active
                      ? "border-red-200 text-red-600 hover:bg-red-50"
                      : "border-green-200 text-green-600 hover:bg-green-50"
                  }`}
                >
                  {at.active ? "Deactivate" : "Reactivate"}
                </button>
              </div>
              <p className="text-sm text-anansi-gray mt-2">{at.name}</p>
              <div className="flex gap-6 mt-3 text-xs text-anansi-gray">
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
              <p className="text-xs font-mono text-anansi-gray/60 mt-2">ID: {at.id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Custodians Panel
// ============================================================

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
      const data = await api("custodians", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (data.error) throw new Error(data.error);
      setResult({ success: true, digest: data.digest });
      setForm({ assetTypeId: "", custodianAddress: "" });
      setShowForm(false);
      // Reload
      const c = await api("custodians");
      setCustodians(Array.isArray(c) ? c : []);
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
          <h2 className="font-bold text-lg">Custodians</h2>
          <p className="text-sm text-anansi-gray">
            Manage who can create lots and record deliveries.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-anansi-black text-white rounded-lg text-sm hover:bg-anansi-red transition-colors"
        >
          {showForm ? "Cancel" : "+ Issue Custodian Cap"}
        </button>
      </div>

      {showForm && (
        <div className="p-6 border-2 border-anansi-red/30 bg-white rounded-xl">
          <h3 className="font-semibold mb-4">Issue New Custodian Capability</h3>
          <form onSubmit={handleIssue} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Asset Type</label>
              <select
                value={form.assetTypeId}
                onChange={(e) => setForm((p) => ({ ...p, assetTypeId: e.target.value }))}
                className="w-full px-3 py-2 border border-anansi-border rounded-lg text-sm"
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
              help="The Sui address of the new custodian (e.g., GCNA staff's zkLogin address)"
              mono
              required
            />
            <button
              type="submit"
              disabled={submitting || !form.assetTypeId || !form.custodianAddress}
              className="px-6 py-2.5 bg-anansi-red text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-red-700 transition-colors"
            >
              {submitting ? "Issuing on-chain..." : "Issue Custodian Cap"}
            </button>
          </form>
          {result && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              {result.success
                ? `Custodian cap issued. Tx: ${result.digest}`
                : `Error: ${result.error}`}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-anansi-gray text-sm py-4">Loading...</p>
      ) : custodians.length === 0 ? (
        <div className="text-center py-16 border border-anansi-border rounded-xl bg-white">
          <p className="text-4xl mb-3">👤</p>
          <p className="font-semibold">No custodians assigned</p>
          <p className="text-anansi-gray text-sm mt-1">
            Custodians are created automatically when you register an asset type, or you can issue
            additional caps above.
          </p>
        </div>
      ) : (
        <div className="border border-anansi-border rounded-xl bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-anansi-border bg-anansi-light">
                <th className="text-left px-4 py-3 font-medium">Asset Type</th>
                <th className="text-left px-4 py-3 font-medium">Custodian Address</th>
                <th className="text-left px-4 py-3 font-medium">Issued</th>
              </tr>
            </thead>
            <tbody>
              {custodians.map((c, i) => (
                <tr key={i} className="border-b border-anansi-border last:border-0">
                  <td className="px-4 py-3 font-semibold">{c.assetTypeSymbol}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.custodianAddress}</td>
                  <td className="px-4 py-3 text-xs text-anansi-gray">
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

// ============================================================
// Deposits Panel
// ============================================================
function DepositsPanel({ api }) {
  const [lotId, setLotId] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleDeposit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const data = await api("deposit", {
        method: "POST",
        body: JSON.stringify({ lotId, amount: parseFloat(amount) }),
      });
      if (data.error) throw new Error(data.error);
      setResult({ success: true, digest: data.digest });
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
        <h2 className="font-bold text-lg">Surplus Deposits</h2>
        <p className="text-sm text-anansi-gray">
          Deposit USDC surplus for a lot after commodity sale. The platform admin wallet holds the
          USDC and deposits it on-chain. 1% fee is collected, remainder is claimable by token
          holders.
        </p>
      </div>

      <div className="p-6 border-2 border-green-200 bg-white rounded-xl">
        <h3 className="font-semibold mb-4">Deposit USDC Surplus</h3>
        <form onSubmit={handleDeposit} className="space-y-4">
          <Field
            label="Lot ID"
            value={lotId}
            onChange={setLotId}
            placeholder="0x..."
            help="The lot that was sold. Find this in the GCNA admin dashboard under Manage Lots."
            mono
            required
          />
          <Field
            label="USDC Amount"
            value={amount}
            onChange={setAmount}
            placeholder="50.00"
            type="number"
            help="Total surplus in USDC. 1% fee will be deducted. Remainder distributed to token holders."
            required
          />
          <button
            type="submit"
            disabled={submitting || !lotId || !amount}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-green-700 transition-colors"
          >
            {submitting ? "Depositing on-chain..." : "Deposit Surplus"}
          </button>
        </form>
        {result && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
          >
            {result.success
              ? `Surplus deposited. Farmers can now claim their share. Tx: ${result.digest?.slice(0, 20)}...`
              : `Error: ${result.error}`}
          </div>
        )}
      </div>

      <div className="p-4 bg-anansi-light rounded-xl border border-anansi-border text-sm text-anansi-gray">
        <p className="font-semibold text-anansi-black mb-1">How surplus deposits work</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>GCNA sells the nutmeg lot overseas and receives payment.</li>
          <li>GCNA transfers the surplus USDC to the platform admin wallet.</li>
          <li>You deposit it here — the contract takes a 1% fee and holds the rest.</li>
          <li>Farmers see "Available Surplus" in their app and tap Claim.</li>
          <li>Each farmer receives their pro-rata share based on tokens held.</li>
        </ol>
      </div>
    </div>
  );
}

// ============================================================
// Overview Panel
// ============================================================

function OverviewPanel({ stats }) {
  return (
    <div className="space-y-6">
      <h2 className="font-bold text-lg">Platform Overview</h2>

      <div className="p-6 border border-anansi-border rounded-xl bg-white">
        <h3 className="font-semibold mb-4">How the roles work</h3>
        <div className="space-y-4 text-sm">
          <RoleRow
            role="Platform Admin (You)"
            path="/platform"
            description="Create asset types, assign custodians, manage platform settings. Signed server-side with CLI keypair."
            color="bg-anansi-red"
          />
          <RoleRow
            role="Custodian (GCNA Staff)"
            path="/admin"
            description="Create lots, record deliveries, manage lot lifecycle, trigger distributions. Signs in with zkLogin (Google)."
            color="bg-anansi-black"
          />
          <RoleRow
            role="Farmer"
            path="/farmer"
            description="View token balances, withdraw, claim surplus. Signs in with zkLogin (Google). Zero crypto knowledge needed."
            color="bg-green-600"
          />
          <RoleRow
            role="Buyer"
            path="/buyer"
            description="Browse active lots, buy tokens, track portfolio and yields. Signs in with zkLogin (Google)."
            color="bg-blue-600"
          />
        </div>
      </div>

      <div className="p-6 border border-anansi-border rounded-xl bg-white">
        <h3 className="font-semibold mb-4">Environment</h3>
        <div className="space-y-2 text-sm font-mono">
          <EnvRow label="Admin Address" value={stats?.adminAddress} />
          <EnvRow label="Asset Types" value={stats?.assetTypes} />
          <EnvRow label="Total Lots" value={stats?.totalLots} />
          <EnvRow
            label="Package"
            value={process.env.NEXT_PUBLIC_PACKAGE_ID?.slice(0, 16) + "..."}
          />
          <EnvRow label="Network" value={process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet"} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Shared Components
// ============================================================

function StatCard({ label, value }) {
  return (
    <div className="p-4 border border-anansi-border rounded-xl bg-white">
      <p className="text-xs text-anansi-gray">{label}</p>
      <p className="text-lg font-bold mt-1">
        {typeof value === "string" ? value : String(value ?? "—")}
      </p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", mono, help, required }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 border border-anansi-border rounded-lg text-sm ${mono ? "font-mono text-xs" : ""}`}
      />
      {help && <p className="text-xs text-anansi-gray mt-1">{help}</p>}
    </div>
  );
}

function RoleRow({ role, path, description, color }) {
  return (
    <div className="flex gap-3">
      <div className={`w-2 rounded-full ${color} shrink-0`} />
      <div>
        <p className="font-semibold">
          {role} <span className="font-mono text-xs text-anansi-gray">{path}</span>
        </p>
        <p className="text-anansi-gray">{description}</p>
      </div>
    </div>
  );
}

function EnvRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-anansi-gray">{label}</span>
      <span>{value ?? "—"}</span>
    </div>
  );
}
