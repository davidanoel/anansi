'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../components/AuthProvider'
import AppNav from '../../components/AppNav'
import { getNutmegBalance, getUsdcBalance, getActiveLots } from '../../lib/data'
import { buyNutmeg } from '../../lib/transactions'
import { USDC_DECIMALS, NUTMEG_DECIMALS } from '../../lib/constants'

export default function BuyerPage() {
  const { user } = useAuth()
  const [nutmeg, setNutmeg] = useState({ displayBalance: 0 })
  const [usdc, setUsdc] = useState({ displayBalance: 0 })
  const [lots, setLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [buyAmount, setBuyAmount] = useState('')
  const [buying, setBuying] = useState(false)

  async function loadData() {
    if (!user?.address) { setLoading(false); return }
    try {
      const [n, u, l] = await Promise.all([
        getNutmegBalance(user.address),
        getUsdcBalance(user.address),
        getActiveLots(),
      ])
      setNutmeg(n)
      setUsdc(u)
      setLots(l)
    } catch (err) {
      console.error('Failed to load marketplace:', err)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [user])

  const handleBuy = async () => {
    if (!buyAmount) return
    setBuying(true)
    try {
      await buyNutmeg(parseFloat(buyAmount))
      alert('NUTMEG purchased!')
      setBuyAmount('')
      await loadData()
    } catch (err) {
      alert(err.message)
    } finally { setBuying(false) }
  }

  if (!user) return <p className="p-6">Please sign in to access the marketplace.</p>

  const unitPrice = 0.55

  return (
    <>
      <AppNav />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <p className="text-anansi-gray text-sm mt-1 mb-8">
          Buy NUTMEG tokens and earn surplus when the commodity sells.
        </p>

        {/* Wallet Summary */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-5 bg-anansi-black text-white rounded-xl">
            <p className="text-sm text-gray-400">NUTMEG Balance</p>
            <p className="text-2xl font-bold">{nutmeg.displayBalance.toLocaleString()}</p>
            <p className="text-xs text-gray-500">~${(nutmeg.displayBalance * unitPrice).toFixed(2)}</p>
          </div>
          <div className="p-5 bg-white border border-anansi-border rounded-xl">
            <p className="text-sm text-anansi-gray">USDC Balance</p>
            <p className="text-2xl font-bold">${usdc.displayBalance.toFixed(2)}</p>
            <p className="text-xs text-anansi-gray">Available to invest</p>
          </div>
        </div>

        {/* Buy NUTMEG */}
        <div className="p-6 border-2 border-anansi-red/30 rounded-xl bg-white mb-8">
          <h2 className="font-bold text-lg mb-1">Buy NUTMEG</h2>
          <p className="text-sm text-anansi-gray mb-4">
            Purchase NUTMEG tokens with USDC. Each token represents 1 kg of Grenada nutmeg
            backed by GCNA warehouse receipts. Earn surplus when the commodity sells.
          </p>
          <div className="flex gap-3">
            <input type="number" step="1" value={buyAmount} onChange={e => setBuyAmount(e.target.value)}
              placeholder="Amount of NUTMEG to buy"
              className="flex-1 px-4 py-3 border border-anansi-border rounded-lg" />
            <button onClick={handleBuy} disabled={buying || !buyAmount}
              className="px-6 py-3 bg-anansi-black text-white rounded-lg font-medium hover:bg-anansi-red transition-colors disabled:opacity-50">
              {buying ? 'Processing...' : `Buy for ~$${(parseFloat(buyAmount || 0) * unitPrice).toFixed(2)}`}
            </button>
          </div>
          {usdc.displayBalance > 0 && (
            <p className="text-xs text-anansi-gray mt-2">
              You can buy up to ~{Math.floor(usdc.displayBalance / unitPrice).toLocaleString()} NUTMEG with your USDC balance.
            </p>
          )}
        </div>

        {/* Active Lots */}
        <h2 className="font-bold text-lg mb-4">Active Lots</h2>
        {loading ? (
          <div className="text-center py-12 text-anansi-gray text-sm">Loading...</div>
        ) : lots.length === 0 ? (
          <div className="text-center py-12 border border-anansi-border rounded-xl bg-white">
            <p className="text-3xl mb-2">{'\ud83c\udfe0'}</p>
            <p className="text-anansi-gray text-sm">No active lots yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lots.map(lot => (
              <div key={lot.id} className="p-6 border border-anansi-border rounded-xl bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{lot.assetTypeSymbol} {'\u2014'} Lot #{lot.lotNumber}</h3>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                        lot.status === 0 ? 'bg-green-50 text-green-700' :
                        lot.status === 1 ? 'bg-yellow-50 text-yellow-700' :
                        lot.status === 2 ? 'bg-blue-50 text-blue-700' :
                        'bg-gray-50 text-gray-700'
                      }`}>{lot.statusLabel}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${unitPrice.toFixed(2)}</p>
                    <p className="text-xs text-anansi-gray">per unit</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-anansi-border">
                  <MiniStat label="Total supply" value={`${lot.totalUnits.toLocaleString()} kg`} />
                  <MiniStat label="Tokens minted" value={lot.totalTokensMinted.toLocaleString()} />
                  <MiniStat label="Deliveries" value={lot.deliveryCount} />
                  <MiniStat label="Surplus" value={lot.totalSurplusDeposited > 0 ? `$${(lot.totalSurplusDeposited / 1e6).toFixed(2)}` : '\u2014'} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* How it Works */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <InfoCard step="1" title="Buy NUTMEG"
            description="Purchase tokens with USDC. Each token is backed by physical nutmeg in GCNA warehouses." />
          <InfoCard step="2" title="Hold or trade"
            description="Hold tokens to earn surplus when the lot sells. Or trade on the DEX at any time." />
          <InfoCard step="3" title="Earn surplus"
            description="When GCNA sells the nutmeg, surplus USDC is distributed pro-rata to all NUTMEG holders." />
        </div>

        <div className="mt-8 p-4 bg-anansi-light rounded-xl border border-anansi-border text-xs text-anansi-gray">
          <p className="font-semibold text-anansi-black mb-1">Risk Disclosure</p>
          <p>NUTMEG tokens represent claims on surplus from real-world commodity sales. No returns are guaranteed. The surplus depends on market prices for nutmeg. Do your own research.</p>
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
