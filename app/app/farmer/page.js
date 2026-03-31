'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../components/AuthProvider'
import AppNav from '../../components/AppNav'
import { getTokenPortfolio, getFarmerDeliveries } from '../../lib/data'

export default function FarmerPage() {
  const { user } = useAuth()
  const [tokens, setTokens] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user?.address) return
      try {
        const [t, d] = await Promise.all([
          getTokenPortfolio(user.address),
          getFarmerDeliveries(user.address),
        ])
        setTokens(t)
        setDeliveries(d)
      } catch (err) {
        console.error('Failed to load farmer data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (!user) {
    return <p className="p-6">Please sign in to view your farmer dashboard.</p>
  }

  // Placeholder pricing — in production, fetched from oracle or lot valuation
  const unitPrice = 0.55
  const totalBalance = tokens.reduce((sum, t) => sum + t.balance, 0)
  const totalValue = totalBalance * unitPrice

  return (
    <>
      <AppNav />
      <div className="max-w-lg mx-auto px-6 py-8">
        {/* Balance Card */}
        <div className="bg-anansi-black text-white rounded-2xl p-6 mb-6">
          <p className="text-sm text-gray-400">Total estimated value</p>
          <p className="text-4xl font-bold mt-1">
            ${loading ? '—' : totalValue.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {totalBalance.toLocaleString()} tokens · ${unitPrice}/unit
          </p>
          <div className="flex gap-3 mt-6">
            <button className="flex-1 py-2.5 bg-anansi-red text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
              Withdraw
            </button>
            <button className="flex-1 py-2.5 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
              Claim Surplus
            </button>
          </div>
        </div>

        {/* Token Holdings */}
        <h2 className="font-bold mb-3">Your Tokens</h2>
        {loading ? (
          <div className="text-center py-8 text-anansi-gray text-sm">Loading...</div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8 border border-anansi-border rounded-xl bg-white">
            <p className="text-3xl mb-2">🌿</p>
            <p className="text-anansi-gray text-sm">No tokens yet.</p>
            <p className="text-anansi-gray text-xs mt-1">
              Tokens appear here after GCNA records your delivery on Spice.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tokens.map(token => (
              <div key={token.id} className="p-4 border border-anansi-border rounded-xl bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{token.balance.toLocaleString()} {token.assetTypeSymbol || 'NUTMG'}</p>
                    <p className="text-xs text-anansi-gray">Lot #{token.lotNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${(token.balance * unitPrice).toFixed(2)}</p>
                    <p className="text-xs text-anansi-gray">${unitPrice}/unit</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delivery History */}
        <h2 className="font-bold mt-8 mb-3">Delivery History</h2>
        {loading ? (
          <div className="text-center py-8 text-anansi-gray text-sm">Loading...</div>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-8 border border-anansi-border rounded-xl bg-white text-anansi-gray text-sm">
            No deliveries recorded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {deliveries.map((d, i) => (
              <div key={i} className="p-3 border border-anansi-border rounded-xl bg-white flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{d.units} kg · Grade {d.grade}</p>
                  <p className="text-xs text-anansi-gray">
                    {d.timestamp ? new Date(d.timestamp).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-700">+{d.tokensMinted} tokens</p>
                  <a href={`https://suiscan.xyz/testnet/tx/${d.txDigest}`} target="_blank"
                    rel="noopener noreferrer" className="text-xs text-anansi-red hover:underline font-mono">
                    {d.txDigest?.slice(0, 8)}...
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help */}
        <div className="mt-8 p-4 bg-anansi-light rounded-xl border border-anansi-border">
          <p className="font-semibold text-sm mb-1">How this works</p>
          <ol className="text-xs text-anansi-gray space-y-1 list-decimal list-inside">
            <li>Deliver nutmeg to GCNA as usual and receive your EC$ advance.</li>
            <li>GCNA records the delivery here — you get tokens automatically.</li>
            <li>Hold tokens to receive surplus when the lot sells, or tap Withdraw for cash now.</li>
          </ol>
        </div>
      </div>
    </>
  )
}
