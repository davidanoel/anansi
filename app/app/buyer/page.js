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

  if (!user) {
    return (
      <>
        <AppNav />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <p className="text-anansi-gray">Please sign in to access the marketplace.</p>
        </div>
      </>
    )
  }

  const unitPrice = 0.55

  return (
    <>
      <AppNav />
      <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in">

        {/* Header */}
        <div className="mb-8">
          <p className="section-title">Marketplace</p>
          <h1 className="text-display-sm font-display">
            Buy NUTMEG
          </h1>
          <p className="text-anansi-gray mt-2 max-w-xl">
            Purchase tokenized Grenada nutmeg backed by physical warehouse receipts.
            Earn surplus when the commodity sells.
          </p>
        </div>

        {/* Wallet Cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="card p-5 bg-gradient-to-br from-anansi-black to-anansi-black/95 text-white">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">NUTMEG holdings</p>
            <p className="text-3xl font-bold mt-2 tabular-nums">{nutmeg.displayBalance.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">≈ ${(nutmeg.displayBalance * unitPrice).toFixed(2)} USD</p>
          </div>
          <div className="card p-5">
            <p className="stat-label">USDC available</p>
            <p className="text-3xl font-bold mt-2 tabular-nums">${usdc.displayBalance.toFixed(2)}</p>
            <p className="text-xs text-anansi-muted mt-1">Ready to invest</p>
          </div>
        </div>

        {/* Buy Card */}
        <div className="card p-6 border-anansi-red/20 mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">Swap USDC → NUTMEG</h2>
              <p className="text-xs text-anansi-muted mt-0.5">Via Cetus DEX · 1% max slippage</p>
            </div>
            <span className="badge badge-open">Live</span>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="number"
                step="1"
                value={buyAmount}
                onChange={e => setBuyAmount(e.target.value)}
                placeholder="Enter USDC amount"
                className="input-field text-lg font-semibold pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-anansi-muted">USDC</span>
            </div>
            <button
              onClick={handleBuy}
              disabled={buying || !buyAmount || parseFloat(buyAmount) <= 0}
              className="btn-primary px-8"
            >
              {buying ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Swapping
                </span>
              ) : 'Buy'}
            </button>
          </div>

          {buyAmount && parseFloat(buyAmount) > 0 && (
            <div className="mt-3 p-3 bg-anansi-light rounded-lg flex items-center justify-between">
              <span className="text-xs text-anansi-muted">Estimated output</span>
              <span className="text-sm font-semibold">≈ {(parseFloat(buyAmount) / unitPrice).toFixed(2)} NUTMEG</span>
            </div>
          )}

          {usdc.displayBalance > 0 && !buyAmount && (
            <p className="text-xs text-anansi-muted mt-3">
              Max buy: ~{Math.floor(usdc.displayBalance / unitPrice).toLocaleString()} NUTMEG at current pool price
            </p>
          )}
        </div>

        {/* Active Lots */}
        <div>
          <p className="section-title">Active lots</p>
          {loading ? (
            <div className="space-y-4">
              {[1,2].map(i => (
                <div key={i} className="card p-6">
                  <div className="flex items-center justify-between">
                    <div className="w-32 h-5 bg-anansi-light rounded animate-pulse" />
                    <div className="w-16 h-5 bg-anansi-light rounded animate-pulse" />
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-5">
                    {[1,2,3,4].map(j => (
                      <div key={j} className="space-y-1">
                        <div className="w-12 h-3 bg-anansi-light rounded animate-pulse" />
                        <div className="w-16 h-4 bg-anansi-light rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : lots.length === 0 ? (
            <div className="card text-center py-16">
              <div className="w-12 h-12 rounded-full bg-anansi-light flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-anansi-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-sm font-medium mt-3">No active lots</p>
              <p className="text-xs text-anansi-muted mt-1">Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lots.map((lot, i) => {
                const statusBadge = lot.status === 0 ? 'badge-open' :
                  lot.status === 1 ? 'badge-selling' :
                  lot.status === 2 ? 'badge-distributing' : 'badge-closed'

                return (
                  <div key={lot.id} className="card p-6 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{lot.assetTypeSymbol} — Lot #{lot.lotNumber}</h3>
                        <span className={`badge ${statusBadge}`}>{lot.statusLabel}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${unitPrice.toFixed(2)}</p>
                        <p className="text-[10px] text-anansi-muted">per unit</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-5 pt-4 border-t border-anansi-border">
                      <div><p className="stat-label">Supply</p><p className="stat-value">{lot.totalUnits.toLocaleString()} kg</p></div>
                      <div><p className="stat-label">Tokens minted</p><p className="stat-value">{lot.totalTokensMinted.toLocaleString()}</p></div>
                      <div><p className="stat-label">Deliveries</p><p className="stat-value">{lot.deliveryCount}</p></div>
                      <div><p className="stat-label">Surplus</p><p className="stat-value">{lot.totalSurplusDeposited > 0 ? `$${(lot.totalSurplusDeposited / 1e6).toFixed(2)}` : '—'}</p></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* How it Works */}
        <div className="mt-12 grid sm:grid-cols-3 gap-5">
          {[
            { step: '01', title: 'Buy tokens', desc: 'Purchase NUTMEG with USDC. Each token is backed by physical nutmeg in GCNA warehouses.' },
            { step: '02', title: 'Hold or trade', desc: 'Hold tokens to earn surplus when the lot sells. Or trade on the DEX anytime.' },
            { step: '03', title: 'Earn surplus', desc: 'When GCNA sells the nutmeg, surplus USDC is distributed to all token holders.' },
          ].map((item, i) => (
            <div key={i} className="card p-5">
              <span className="text-2xl font-display italic text-anansi-border">{item.step}</span>
              <h3 className="font-semibold mt-3">{item.title}</h3>
              <p className="text-sm text-anansi-gray mt-1 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 card p-5 text-xs text-anansi-muted">
          <p className="font-medium text-anansi-black mb-1">Risk disclosure</p>
          <p className="leading-relaxed">
            NUTMEG tokens represent claims on surplus from real-world commodity sales.
            Returns depend on market prices and are not guaranteed. Do your own research.
          </p>
        </div>
      </div>
    </>
  )
}
