'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../components/AuthProvider'
import AppNav from '../../components/AppNav'
import { getNutmegBalance, getUsdcBalance, getFarmerDeliveries, getAllSurplusDeposits } from '../../lib/data'
import { claimSurplus, sellNutmeg } from '../../lib/transactions'
import { USDC_DECIMALS, NUTMEG_DECIMALS } from '../../lib/constants'

export default function FarmerPage() {
  const { user } = useAuth()
  const [nutmeg, setNutmeg] = useState({ displayBalance: 0, totalBalance: 0 })
  const [usdc, setUsdc] = useState({ displayBalance: 0 })
  const [deliveries, setDeliveries] = useState([])
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(null)
  const [sellAmount, setSellAmount] = useState('')
  const [selling, setSelling] = useState(false)
  const [showSell, setShowSell] = useState(false)

  async function loadData() {
    if (!user?.address) return
    try {
      const [n, u, d, s] = await Promise.all([
        getNutmegBalance(user.address),
        getUsdcBalance(user.address),
        getFarmerDeliveries(user.address),
        getAllSurplusDeposits().catch(() => []),
      ])
      setNutmeg(n)
      setUsdc(u)
      setDeliveries(d)
      setDeposits(s)
    } catch (err) {
      console.error('Failed to load farmer data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [user])

  const handleClaim = async (depositId) => {
    setClaiming(depositId)
    try {
      await claimSurplus(depositId)
      alert('Surplus claimed! USDC sent to your wallet.')
      await loadData()
    } catch (err) {
      if (err.message?.includes('EAlreadyClaimed') || err.message?.includes('204')) {
        alert('You have already claimed this surplus.')
      } else { alert('Claim failed: ' + err.message) }
    } finally { setClaiming(null) }
  }

  const handleSell = async () => {
    if (!sellAmount) return
    setSelling(true)
    try {
      await sellNutmeg(parseFloat(sellAmount))
      alert('NUTMEG sold for USDC!')
      setSellAmount('')
      setShowSell(false)
      await loadData()
    } catch (err) {
      alert(err.message)
    } finally { setSelling(false) }
  }

  if (!user) {
    return (
      <>
        <AppNav />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <p className="text-anansi-gray">Please sign in to view your farmer dashboard.</p>
        </div>
      </>
    )
  }

  const unitPrice = 0.55
  const totalValue = nutmeg.displayBalance * unitPrice

  return (
    <>
      <AppNav />
      <div className="max-w-lg mx-auto px-6 py-8 animate-fade-in">

        {/* Balance Card */}
        <div className="relative overflow-hidden bg-anansi-black text-white rounded-2xl p-6 shadow-elevated">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-anansi-red/20 to-transparent rounded-bl-full" />
          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">NUTMEG balance</p>
            <p className="text-4xl font-bold mt-2 tabular-nums">
              {loading ? (
                <span className="inline-block w-32 h-10 bg-white/10 rounded animate-pulse" />
              ) : (
                <>{nutmeg.displayBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</>
              )}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-xs text-gray-400">
                ≈ ${totalValue.toFixed(2)} USD
              </span>
              {usdc.displayBalance > 0 && (
                <>
                  <span className="w-px h-3 bg-gray-700" />
                  <span className="text-xs text-emerald-400">
                    ${usdc.displayBalance.toFixed(2)} USDC
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick actions */}
          {nutmeg.displayBalance > 0 && (
            <div className="mt-5 pt-4 border-t border-white/10">
              <button
                onClick={() => setShowSell(!showSell)}
                className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {showSell ? 'Cancel' : 'Sell Early →'}
              </button>
            </div>
          )}
        </div>

        {/* Sell Panel */}
        {showSell && (
          <div className="mt-4 card p-5 animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Sell NUTMEG for USDC</h3>
              <span className="badge badge-open">Via Cetus DEX</span>
            </div>
            <p className="text-xs text-anansi-muted mb-4">
              Swap your tokens for USDC instantly. Price determined by the NUTMEG/USDC liquidity pool.
            </p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="number"
                  step="1"
                  max={nutmeg.displayBalance}
                  value={sellAmount}
                  onChange={e => setSellAmount(e.target.value)}
                  placeholder="0"
                  className="input-field pr-20 text-lg font-semibold"
                />
                <button
                  onClick={() => setSellAmount(String(Math.floor(nutmeg.displayBalance)))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wider text-anansi-red hover:text-anansi-red-light px-2 py-1"
                >
                  Max
                </button>
              </div>
              <button
                onClick={handleSell}
                disabled={selling || !sellAmount || parseFloat(sellAmount) <= 0}
                className="btn-primary px-6"
              >
                {selling ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Selling
                  </span>
                ) : 'Sell'}
              </button>
            </div>
            {sellAmount && parseFloat(sellAmount) > 0 && (
              <p className="text-xs text-anansi-muted mt-2">
                ≈ ${(parseFloat(sellAmount) * unitPrice).toFixed(2)} USDC at current pool price
              </p>
            )}
          </div>
        )}

        {/* Surplus Claims */}
        {deposits.length > 0 && nutmeg.totalBalance > 0 && (
          <div className="mt-6">
            <p className="section-title">Available surplus</p>
            <div className="space-y-3">
              {deposits.map(deposit => {
                if (deposit.remaining === 0) return null
                const myShare = deposit.tokensSnapshot > 0
                  ? (deposit.netAmount * nutmeg.totalBalance) / deposit.tokensSnapshot
                  : 0
                if (myShare <= 0 || myShare > deposit.remaining) return null
                const shareUsdc = myShare / (10 ** USDC_DECIMALS)

                return (
                  <div key={deposit.id} className="card p-5 border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-emerald-800">${shareUsdc.toFixed(2)}</p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          {nutmeg.displayBalance.toLocaleString()} NUTMEG held · Pool: ${(deposit.remaining / (10 ** USDC_DECIMALS)).toFixed(2)} remaining
                        </p>
                      </div>
                      <button
                        onClick={() => handleClaim(deposit.id)}
                        disabled={claiming === deposit.id}
                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors active:scale-[0.98]"
                      >
                        {claiming === deposit.id ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Claiming
                          </span>
                        ) : 'Claim USDC'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Delivery History */}
        <div className="mt-8">
          <p className="section-title">Delivery history</p>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="card p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="w-24 h-4 bg-anansi-light rounded animate-pulse" />
                      <div className="w-16 h-3 bg-anansi-light rounded animate-pulse" />
                    </div>
                    <div className="w-20 h-4 bg-anansi-light rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : deliveries.length === 0 ? (
            <div className="card text-center py-12 px-6">
              <div className="w-12 h-12 rounded-full bg-anansi-light flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-anansi-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-sm font-medium mt-3">No deliveries yet</p>
              <p className="text-xs text-anansi-muted mt-1 max-w-xs mx-auto">
                Tokens appear here after GCNA records your nutmeg delivery on the Spice platform.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {deliveries.map((d, i) => (
                <div key={i} className="card p-4 flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{d.units} kg · Grade {d.grade}</p>
                      <p className="text-xs text-anansi-muted">
                        {d.timestamp ? new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-700">+{d.tokensMinted}</p>
                    <a
                      href={`https://suiscan.xyz/testnet/tx/${d.txDigest}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-anansi-muted hover:text-anansi-red font-mono transition-colors"
                    >
                      {d.txDigest?.slice(0, 10)}…
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How it Works */}
        <div className="mt-10 card p-6">
          <h3 className="font-display text-lg mb-4">How Spice works</h3>
          <div className="space-y-4">
            {[
              { step: '01', text: 'Deliver nutmeg to GCNA as usual and receive your EC$ advance.' },
              { step: '02', text: 'GCNA records the delivery — you receive NUTMEG tokens automatically.' },
              { step: '03', text: 'Hold tokens until the lot sells for your full surplus in USDC.' },
              { step: '04', text: 'Or sell early on the marketplace for instant USDC.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <span className="text-xs font-mono text-anansi-muted font-medium mt-0.5">{item.step}</span>
                <p className="text-sm text-anansi-gray leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
