'use client'

import { useState } from 'react'
import { useAuth } from '../../components/AuthProvider'
import AppNav from '../../components/AppNav'
import { recordDelivery, createLot, startSelling, updateValuation } from '../../lib/transactions'
import { uploadToIPFS } from '../../lib/ipfs'

export default function AdminPage() {
  const { user } = useAuth()

  if (!user) {
    return <p className="p-6">Please sign in to access the admin dashboard.</p>
  }

  return (
    <>
      <AppNav />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold">GCNA Admin Dashboard</h1>
        <p className="text-anansi-gray text-sm mt-1 mb-8">
          Record deliveries, manage lots, and trigger distributions.
        </p>

        <div className="grid lg:grid-cols-2 gap-6">
          <RecordDeliveryForm />
          <LotManager />
        </div>

        <RecentDeliveries />
      </div>
    </>
  )
}

function RecordDeliveryForm() {
  const [form, setForm] = useState({
    farmerAddress: '',
    units: '',
    grade: 'A',
    lotId: '',
    custodianCapId: '',
  })
  const [receiptFile, setReceiptFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)

    try {
      // Upload receipt to IPFS
      let receiptHash = ''
      if (receiptFile) {
        const uploaded = await uploadToIPFS(receiptFile)
        receiptHash = uploaded.hash
      }

      // Record delivery on-chain
      const txResult = await recordDelivery(
        form.custodianCapId,
        form.lotId,
        form.farmerAddress,
        parseInt(form.units),
        form.grade,
        receiptHash
      )

      setResult({
        success: true,
        digest: txResult.digest,
        tokens: form.units,
      })

      // Reset form
      setForm(prev => ({ ...prev, farmerAddress: '', units: '' }))
      setReceiptFile(null)
    } catch (err) {
      setResult({ success: false, error: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 border border-anansi-border rounded-xl bg-white">
      <h2 className="font-bold text-lg mb-4">Record Delivery</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Lot ID"
          value={form.lotId}
          onChange={v => setForm(p => ({ ...p, lotId: v }))}
          placeholder="0x..."
          mono
        />
        <Field
          label="Custodian Cap ID"
          value={form.custodianCapId}
          onChange={v => setForm(p => ({ ...p, custodianCapId: v }))}
          placeholder="0x..."
          mono
        />
        <Field
          label="Farmer Address"
          value={form.farmerAddress}
          onChange={v => setForm(p => ({ ...p, farmerAddress: v }))}
          placeholder="0x... (farmer's Spice address)"
          mono
        />
        <Field
          label="Weight (kg)"
          value={form.units}
          onChange={v => setForm(p => ({ ...p, units: v }))}
          placeholder="564"
          type="number"
        />
        <div>
          <label className="block text-sm font-medium mb-1">Grade</label>
          <select
            value={form.grade}
            onChange={e => setForm(p => ({ ...p, grade: e.target.value }))}
            className="w-full px-3 py-2 border border-anansi-border rounded-lg text-sm"
          >
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Warehouse Receipt (photo)</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setReceiptFile(e.target.files[0])}
            className="w-full text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !form.lotId || !form.farmerAddress || !form.units}
          className="w-full py-2.5 bg-anansi-black text-white rounded-lg font-medium text-sm disabled:opacity-50 hover:bg-anansi-red transition-colors"
        >
          {submitting ? 'Recording...' : 'Record Delivery & Mint Tokens'}
        </button>
      </form>

      {result && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {result.success
            ? `Delivery recorded. ${result.tokens} NUTMG minted. Tx: ${result.digest?.slice(0, 12)}...`
            : `Error: ${result.error}`
          }
        </div>
      )}
    </div>
  )
}

function LotManager() {
  const [lotId, setLotId] = useState('')

  return (
    <div className="p-6 border border-anansi-border rounded-xl bg-white">
      <h2 className="font-bold text-lg mb-4">Lot Manager</h2>

      <div className="space-y-4">
        <Field
          label="Active Lot ID"
          value={lotId}
          onChange={setLotId}
          placeholder="0x..."
          mono
        />

        <div className="grid grid-cols-2 gap-3">
          <button className="py-2 text-sm border border-anansi-border rounded-lg hover:border-anansi-black transition-colors">
            Create New Lot
          </button>
          <button className="py-2 text-sm border border-anansi-border rounded-lg hover:border-anansi-black transition-colors">
            Update Valuation
          </button>
          <button className="py-2 text-sm border border-anansi-border rounded-lg hover:border-anansi-black transition-colors">
            Mark as Selling
          </button>
          <button className="py-2 text-sm border border-anansi-border rounded-lg hover:border-anansi-black transition-colors">
            Distribute Surplus
          </button>
        </div>

        <div className="p-4 bg-anansi-light rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Lot Status</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <StatLine label="Status" value="—" />
            <StatLine label="Total Units" value="—" />
            <StatLine label="Tokens Minted" value="—" />
            <StatLine label="Est. Value" value="—" />
          </div>
        </div>
      </div>
    </div>
  )
}

function RecentDeliveries() {
  return (
    <div className="mt-8">
      <h2 className="font-bold text-lg mb-4">Recent Deliveries</h2>
      <div className="border border-anansi-border rounded-xl bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-anansi-border bg-anansi-light">
              <th className="text-left px-4 py-3 font-medium">Time</th>
              <th className="text-left px-4 py-3 font-medium">Farmer</th>
              <th className="text-left px-4 py-3 font-medium">Weight (kg)</th>
              <th className="text-left px-4 py-3 font-medium">Grade</th>
              <th className="text-left px-4 py-3 font-medium">Tokens</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-anansi-gray">
                No deliveries recorded yet. Use the form above to record the first delivery.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', mono }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-anansi-border rounded-lg text-sm ${mono ? 'font-mono text-xs' : ''}`}
      />
    </div>
  )
}

function StatLine({ label, value }) {
  return (
    <div>
      <p className="text-xs text-anansi-gray">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
