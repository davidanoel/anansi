'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../components/AuthProvider'
import AppNav from '../../components/AppNav'
import { getSpiceTokens } from '../../lib/sui'
import { splitToken, transferToken } from '../../lib/transactions'
import { PACKAGE_ID } from '../../lib/constants'

export default function FarmerPage() {
  const { user } = useAuth()
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalValue, setTotalValue] = useState(0)

  useEffect(() => {
    async function loadTokens() {
      if (!user?.address) return
      try {
        const owned = await getSpiceTokens(user.address, PACKAGE_ID)
        const parsed = owned.map(obj => {
          const fields = obj.data?.content?.fields || {}
          return {
            id: obj.data?.objectId,
            lotId: fields.lot_id,
            symbol: fields.asset_type_symbol,
            lotNumber: fields.lot_number,
            balance: Number(fields.balance || 0),
          }
        })
        setTokens(parsed)
        // Placeholder value calc — in production, fetch from oracle/indexer
        setTotalValue(parsed.reduce((sum, t) => sum + t.balance * 0.55, 0))
      } catch (err) {
        console.error('Failed to load tokens:', err)
      } finally {
        setLoading(false)
      }
    }
    loadTokens()
  }, [user])

  if (!user) {
    return <p className="p-6">Please sign in to view your farmer dashboard.</p>
  }

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
          <p className="text-xs text-gray-500 mt-1">USDC equivalent</p>
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
          <div className="text-center py-8 text-anansi-gray text-sm">Loading tokens...</div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8 border border-anansi-border rounded-xl">
            <p className="text-3xl mb-2">🌿</p>
            <p className="text-anansi-gray text-sm">No tokens yet.</p>
            <p className="text-anansi-gray text-xs mt-1">
              Tokens appear here after you deliver to GCNA and they record it on Spice.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tokens.map(token => (
              <TokenCard key={token.id} token={token} />
            ))}
          </div>
        )}

        {/* Recent Activity */}
        <h2 className="font-bold mt-8 mb-3">Recent Activity</h2>
        <div className="border border-anansi-border rounded-xl bg-white">
          <div className="text-center py-8 text-anansi-gray text-sm">
            No activity yet.
          </div>
        </div>

        {/* Help */}
        <div className="mt-8 p-4 bg-anansi-light rounded-xl border border-anansi-border">
          <p className="font-semibold text-sm mb-1">How this works</p>
          <ul className="text-xs text-anansi-gray space-y-1">
            <li>1. Deliver nutmeg to GCNA as usual and receive your EC$ advance.</li>
            <li>2. GCNA records the delivery here — you get NUTMG tokens automatically.</li>
            <li>3. Hold tokens to receive surplus when the lot sells, or tap Withdraw to get cash now.</li>
          </ul>
        </div>
      </div>
    </>
  )
}

function TokenCard({ token }) {
  const unitPrice = 0.55 // placeholder — from oracle in production
  const value = token.balance * unitPrice

  return (
    <div className="p-4 border border-anansi-border rounded-xl bg-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold">{token.balance} {token.symbol || 'NUTMG'}</p>
          <p className="text-xs text-anansi-gray">Lot #{token.lotNumber}</p>
        </div>
        <div className="text-right">
          <p className="font-bold">${value.toFixed(2)}</p>
          <p className="text-xs text-anansi-gray">${unitPrice.toFixed(2)}/unit</p>
        </div>
      </div>
    </div>
  )
}
