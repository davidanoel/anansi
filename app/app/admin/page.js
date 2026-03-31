'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../components/AuthProvider'
import AppNav from '../../components/AppNav'
import { recordDelivery, createLot, createAssetType, startSelling, updateValuation } from '../../lib/transactions'
import { getRegistryAdmin, getCustodianCaps, getAssetTypes, getRecentDeliveries, getActiveLots } from '../../lib/data'
import { uploadToIPFS } from '../../lib/ipfs'

export default function AdminPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('deliveries')
  const [registryAdminId, setRegistryAdminId] = useState(null)
  const [custodianCaps, setCustodianCaps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAdminState() {
      if (!user?.address) return
      try {
        const [adminId, caps] = await Promise.all([
          getRegistryAdmin(user.address),
          getCustodianCaps(user.address),
        ])
        setRegistryAdminId(adminId)
        setCustodianCaps(caps)
      } catch (err) {
        console.error('Failed to load admin state:', err)
      } finally {
        setLoading(false)
      }
    }
    loadAdminState()
  }, [user])

  if (!user) {
    return <p className="p-6">Please sign in to access the admin dashboard.</p>
  }

  if (loading) {
    return (
      <>
        <AppNav />
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-anansi-red border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    )
  }

  const tabs = [
    { id: 'deliveries', label: 'Record Delivery' },
    { id: 'lots', label: 'Manage Lots' },
    ...(registryAdminId ? [{ id: 'assets', label: 'Asset Types' }] : []),
    { id: 'history', label: 'Recent Activity' },
  ]

  return (
    <>
      <AppNav />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-anansi-gray text-sm mt-1">
              {registryAdminId ? 'Platform Admin' : 'Custodian'} · {custodianCaps.length} asset type{custodianCaps.length !== 1 ? 's' : ''} managed
            </p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-anansi-light rounded-lg p-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-white text-anansi-black shadow-sm'
                  : 'text-anansi-gray hover:text-anansi-black'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'deliveries' && <RecordDeliveryForm custodianCaps={custodianCaps} />}
        {tab === 'lots' && <LotManager custodianCaps={custodianCaps} />}
        {tab === 'assets' && registryAdminId && (
          <AssetTypeManager registryAdminId={registryAdminId} userAddress={user.address} />
        )}
        {tab === 'history' && <RecentActivity />}
      </div>
    </>
  )
}

// ============================================================
// Asset Type Manager — only visible to RegistryAdmin holders (you)
// ============================================================

function AssetTypeManager({ registryAdminId, userAddress }) {
  const [assetTypes, setAssetTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    symbol: '', name: '', unit: 'kg', region: '', custodianName: '', custodianAddress: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => { loadAssetTypes() }, [])

  async function loadAssetTypes() {
    try {
      const types = await getAssetTypes()
      setAssetTypes(types)
    } catch (err) {
      console.error('Failed to load asset types:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)
    try {
      const txResult = await createAssetType(
        registryAdminId,
        form.symbol.toUpperCase(),
        form.name,
        form.unit,
        form.region,
        form.custodianName,
        form.custodianAddress || userAddress
      )
      setResult({ success: true, digest: txResult.digest })
      setForm({ symbol: '', name: '', unit: 'kg', region: '', custodianName: '', custodianAddress: '' })
      setShowForm(false)
      setTimeout(loadAssetTypes, 2000)
    } catch (err) {
      setResult({ success: false, error: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Asset Types</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-anansi-black text-white rounded-lg text-sm hover:bg-anansi-red transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Asset Type'}
        </button>
      </div>

      {showForm && (
        <div className="p-6 border border-anansi-red/30 bg-anansi-red/[0.02] rounded-xl">
          <h3 className="font-semibold mb-4">Register New Asset Type</h3>
          <p className="text-sm text-anansi-gray mb-4">
            This creates a new tokenizable asset category and issues a CustodianCap to the specified address.
            That custodian can then create lots and record deliveries for this asset type.
          </p>
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
            <Field label="Symbol" value={form.symbol} onChange={v => setForm(p => ({ ...p, symbol: v }))}
              placeholder="NUTMG" help="Short ticker — e.g., NUTMG, COCO, VILLA" />
            <Field label="Full Name" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))}
              placeholder="Grenada Nutmeg" />
            <Field label="Unit" value={form.unit} onChange={v => setForm(p => ({ ...p, unit: v }))}
              placeholder="kg" help="e.g., kg, sqft, barrel, unit" />
            <Field label="Region" value={form.region} onChange={v => setForm(p => ({ ...p, region: v }))}
              placeholder="Grenada" />
            <Field label="Custodian Name" value={form.custodianName} onChange={v => setForm(p => ({ ...p, custodianName: v }))}
              placeholder="GCNA" help="Organization holding physical custody" />
            <Field label="Custodian Address" value={form.custodianAddress} onChange={v => setForm(p => ({ ...p, custodianAddress: v }))}
              placeholder={userAddress} help="Leave blank to assign yourself" mono />
            <div className="md:col-span-2">
              <button type="submit"
                disabled={submitting || !form.symbol || !form.name || !form.region || !form.custodianName}
                className="px-6 py-2.5 bg-anansi-black text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-anansi-red transition-colors"
              >
                {submitting ? 'Creating...' : 'Register Asset Type'}
              </button>
            </div>
          </form>
          {result && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {result.success
                ? `Asset type created. CustodianCap issued. Tx: ${result.digest?.slice(0, 16)}...`
                : `Error: ${result.error}`}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-anansi-gray text-sm py-4">Loading...</p>
      ) : assetTypes.length === 0 ? (
        <div className="text-center py-12 border border-anansi-border rounded-xl bg-white">
          <p className="text-3xl mb-2">🌿</p>
          <p className="text-anansi-gray text-sm">No asset types registered yet.</p>
          <p className="text-anansi-gray text-xs mt-1">Click "+ New Asset Type" above to get started.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {assetTypes.map((at, i) => (
            <div key={i} className="p-4 border border-anansi-border rounded-xl bg-white">
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">{at.symbol}</span>
                <span className="text-xs font-mono px-2 py-0.5 bg-green-50 text-green-700 rounded-full">Active</span>
              </div>
              <p className="text-sm text-anansi-gray mt-1">{at.name}</p>
              <div className="flex gap-4 mt-3 text-xs text-anansi-gray">
                <span>{at.region}</span>
                <span>Custodian: {at.custodian}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Record Delivery Form
// ============================================================

function RecordDeliveryForm({ custodianCaps }) {
  const [form, setForm] = useState({ lotId: '', farmerAddress: '', units: '', grade: 'A' })
  const [selectedCap, setSelectedCap] = useState(custodianCaps[0]?.id || '')
  const [receiptFile, setReceiptFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (custodianCaps.length > 0 && !selectedCap) setSelectedCap(custodianCaps[0].id)
  }, [custodianCaps, selectedCap])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)
    try {
      let receiptHash = ''
      if (receiptFile) {
        const uploaded = await uploadToIPFS(receiptFile)
        receiptHash = uploaded.hash
      }
      const txResult = await recordDelivery(selectedCap, form.lotId, form.farmerAddress, parseInt(form.units), form.grade, receiptHash)
      setResult({ success: true, digest: txResult.digest, tokens: form.units })
      setForm(prev => ({ ...prev, farmerAddress: '', units: '' }))
      setReceiptFile(null)
    } catch (err) {
      setResult({ success: false, error: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (custodianCaps.length === 0) {
    return (
      <div className="text-center py-12 border border-anansi-border rounded-xl bg-white">
        <p className="text-3xl mb-2">🔒</p>
        <p className="text-anansi-gray text-sm">No custodian capabilities found.</p>
        <p className="text-anansi-gray text-xs mt-1">Register an asset type first (Asset Types tab), then you can record deliveries.</p>
      </div>
    )
  }

  return (
    <div className="p-6 border border-anansi-border rounded-xl bg-white">
      <h2 className="font-bold text-lg mb-4">Record Delivery</h2>
      {custodianCaps.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Asset Type</label>
          <select value={selectedCap} onChange={e => setSelectedCap(e.target.value)}
            className="w-full px-3 py-2 border border-anansi-border rounded-lg text-sm">
            {custodianCaps.map(cap => (
              <option key={cap.id} value={cap.id}>{cap.assetTypeSymbol}</option>
            ))}
          </select>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Lot ID" value={form.lotId} onChange={v => setForm(p => ({ ...p, lotId: v }))} placeholder="0x..." mono />
        <Field label="Farmer Address" value={form.farmerAddress} onChange={v => setForm(p => ({ ...p, farmerAddress: v }))} placeholder="0x..." mono />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Weight (kg)" value={form.units} onChange={v => setForm(p => ({ ...p, units: v }))} placeholder="564" type="number" />
          <div>
            <label className="block text-sm font-medium mb-1">Grade</label>
            <select value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))}
              className="w-full px-3 py-2 border border-anansi-border rounded-lg text-sm">
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Warehouse Receipt</label>
          <input type="file" accept="image/*,application/pdf" onChange={e => setReceiptFile(e.target.files[0])} className="w-full text-sm" />
        </div>
        <button type="submit" disabled={submitting || !form.lotId || !form.farmerAddress || !form.units}
          className="w-full py-2.5 bg-anansi-black text-white rounded-lg font-medium text-sm disabled:opacity-50 hover:bg-anansi-red transition-colors">
          {submitting ? 'Recording...' : 'Record Delivery & Mint Tokens'}
        </button>
      </form>
      {result && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {result.success ? `Recorded. ${result.tokens} tokens minted. Tx: ${result.digest?.slice(0, 16)}...` : `Error: ${result.error}`}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Lot Manager
// ============================================================

function LotManager({ custodianCaps }) {
  const [lots, setLots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try { setLots(await getActiveLots()) }
      catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Active Lots</h2>
        <button className="px-4 py-2 bg-anansi-black text-white rounded-lg text-sm hover:bg-anansi-red transition-colors">
          + New Lot
        </button>
      </div>
      {loading ? (
        <p className="text-anansi-gray text-sm py-4">Loading...</p>
      ) : lots.length === 0 ? (
        <div className="text-center py-12 border border-anansi-border rounded-xl bg-white">
          <p className="text-3xl mb-2">📦</p>
          <p className="text-anansi-gray text-sm">No active lots. Create one to start receiving deliveries.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lots.map(lot => (
            <div key={lot.id} className="p-4 border border-anansi-border rounded-xl bg-white">
              <div className="flex items-center justify-between">
                <span className="font-bold">{lot.assetTypeSymbol} — Lot #{lot.lotNumber}</span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                  lot.status === 0 ? 'bg-green-50 text-green-700' :
                  lot.status === 1 ? 'bg-yellow-50 text-yellow-700' :
                  'bg-blue-50 text-blue-700'
                }`}>{lot.statusLabel}</span>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                <MiniStat label="Units" value={lot.totalUnits.toLocaleString()} />
                <MiniStat label="Tokens" value={lot.totalTokensMinted.toLocaleString()} />
                <MiniStat label="Deliveries" value={lot.deliveryCount} />
                <MiniStat label="Value" value={lot.estimatedValueUsdc > 0 ? `$${(lot.estimatedValueUsdc / 1e6).toFixed(2)}` : '—'} />
              </div>
              <p className="text-xs text-anansi-gray font-mono mt-3 pt-3 border-t border-anansi-border truncate">ID: {lot.id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Recent Activity — queries Sui RPC directly, no indexer needed
// ============================================================

function RecentActivity() {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try { setDeliveries(await getRecentDeliveries(20)) }
      catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

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
              <tr><td colSpan={6} className="px-4 py-8 text-center text-anansi-gray">Loading...</td></tr>
            ) : deliveries.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-anansi-gray">No deliveries recorded yet.</td></tr>
            ) : deliveries.map((d, i) => (
              <tr key={i} className="border-b border-anansi-border last:border-0">
                <td className="px-4 py-3 text-xs text-anansi-gray">{d.timestamp ? new Date(d.timestamp).toLocaleString() : '—'}</td>
                <td className="px-4 py-3 font-mono text-xs">{d.farmer?.slice(0, 6)}...{d.farmer?.slice(-4)}</td>
                <td className="px-4 py-3">{d.units} kg</td>
                <td className="px-4 py-3">{d.grade}</td>
                <td className="px-4 py-3 font-semibold">{d.tokensMinted}</td>
                <td className="px-4 py-3">
                  <a href={`https://suiscan.xyz/testnet/tx/${d.txDigest}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-anansi-red hover:underline font-mono">{d.txDigest?.slice(0, 8)}...</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================
// Shared
// ============================================================

function Field({ label, value, onChange, placeholder, type = 'text', mono, help }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full px-3 py-2 border border-anansi-border rounded-lg text-sm ${mono ? 'font-mono text-xs' : ''}`} />
      {help && <p className="text-xs text-anansi-gray mt-1">{help}</p>}
    </div>
  )
}

function MiniStat({ label, value }) {
  return <div><p className="text-xs text-anansi-gray">{label}</p><p className="font-semibold">{value}</p></div>
}
