'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../components/AuthProvider'
import AppNav from '../../components/AppNav'
import { getTokenPortfolio, getActiveLots } from '../../lib/data'
import { LOT_STATUS } from '../../lib/constants'

export default function BuyerPage() {
  const { user } = useAuth()
  const [tokens, setTokens] = useState([])
  const [lots, setLots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user?.address) { setLoading(false); return }
      try {
        const [t, l] = await Promise.all([
          getTokenPortfolio(user.address),
          getActiveLots(),
        ])
        setTokens(t)
        setLots(l)
      } catch (err) {
        console.error('Failed to load marketplace:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (!user) {
    return <p className="p-6">Please sign in to access the marketplace.</p>
  }

  const unitPrice = 0.55 // placeholder
  const portfolioValue = tokens.reduce((sum, t) => sum + t.balance * unitPrice, 0)

  return (
    <>
      <AppNav />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <p className="text-anansi-gray text-sm mt-1 mb-8">
          Browse active commodity lots and invest in Caribbean real-world assets.
        </p>

        {/* Portfolio Summary */}
        {tokens.length > 0 && (
          <div className="p-5 bg-anansi-black text-white rounded-xl mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Your portfolio</p>
                <p className="text-3xl font-bold">${portfolioValue.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Holdings</p>
                <p className="text-lg font-bold">{tokens.length} token{tokens.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        )}

        {/* Active Lots */}
        <h2 className="font-bold text-lg mb-4">Active Lots</h2>
        {loading ? (
          <div className="text-center py-12 text-anansi-gray text-sm">Loading lots from chain...</div>
        ) : lots.length === 0 ? (
          <div className="text-center py-12 border border-anansi-border rounded-xl bg-white">
            <p className="text-3xl mb-2">🏝️</p>
            <p className="text-anansi-gray text-sm">No active lots yet.</p>
            <p className="text-anansi-gray text-xs mt-1">Lots appear here when GCNA creates them and starts recording deliveries.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lots.map(lot => (
              <div key={lot.id} className="p-6 border border-anansi-border rounded-xl bg-white hover:border-anansi-red transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{lot.assetTypeSymbol} — Lot #{lot.lotNumber}</h3>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                        lot.status === 0 ? 'bg-green-50 text-green-700' :
                        lot.status === 1 ? 'bg-yellow-50 text-yellow-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>{lot.statusLabel}</span>
                    </div>
                    <p className="text-sm text-anansi-gray mt-1">
                      Custodian: {lot.custodian?.slice(0, 8)}...
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${unitPrice.toFixed(2)}</p>
                    <p className="text-xs text-anansi-gray">per unit</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-anansi-border">
                  <MiniStat label="Total supply" value={`${lot.totalUnits.toLocaleString()} units`} />
                  <MiniStat label="Pool value" value={lot.estimatedValueUsdc > 0 ? `$${(lot.estimatedValueUsdc / 1e6).toFixed(0)}` : '—'} />
                  <MiniStat label="Deliveries" value={lot.deliveryCount} />
                  <MiniStat label="Token" value={lot.assetTypeSymbol} />
                </div>

                <button className="w-full mt-4 py-2.5 bg-anansi-black text-white rounded-lg text-sm font-medium hover:bg-anansi-red transition-colors">
                  Buy {lot.assetTypeSymbol}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* How it Works */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <InfoCard step="1" title="Browse lots"
            description="Each lot represents a batch of physical Caribbean commodities held by a trusted custodian." />
          <InfoCard step="2" title="Buy tokens"
            description="Purchase SpiceTokens with USDC. Each token represents a unit of the underlying asset." />
          <InfoCard step="3" title="Earn surplus"
            description="When the custodian sells the commodity, surplus is distributed pro-rata in USDC." />
        </div>

        {/* Risk */}
        <div className="mt-8 p-4 bg-anansi-light rounded-xl border border-anansi-border text-xs text-anansi-gray">
          <p className="font-semibold text-anansi-black mb-1">Risk Disclosure</p>
          <p>
            SpiceTokens represent claims on surplus from real-world commodity sales.
            No returns are guaranteed. Participation involves risk. Do your own research.
          </p>
        </div>
      </div>
    </>
  )
}

function MiniStat({ label, value }) {
  return <div><p className="text-xs text-anansi-gray">{label}</p><p className="text-sm font-semibold">{value}</p></div>
}

function InfoCard({ step, title, description }) {
  return (
    <div className="p-5 border border-anansi-border rounded-xl">
      <span className="text-2xl font-bold text-anansi-red/20 font-mono">{step}</span>
      <h3 className="font-semibold mt-2">{title}</h3>
      <p className="text-sm text-anansi-gray mt-1">{description}</p>
    </div>
  )
}
