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
      await loadData()
    } catch (err) {
      alert(err.message)
    } finally { setSelling(false) }
  }

  if (!user) return <p className="p-6">Please sign in to view your farmer dashboard.</p>

  const unitPrice = 0.55
  const totalValue = nutmeg.displayBalance * unitPrice

  return (
    <>
      <AppNav />
      <div className="max-w-lg mx-auto px-6 py-8">
        {/* Balance Card */}
        <div className="bg-anansi-black text-white rounded-2xl p-6 mb-6">
          <p className="text-sm text-gray-400">Your NUTMEG balance</p>
          <p className="text-4xl font-bold mt-1">
            {loading ? '\u2014' : nutmeg.displayBalance.toLocaleString()} <span className="text-lg text-gray-400">NUTMEG</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ~${totalValue.toFixed(2)} at ${unitPrice}/unit
          </p>
          {usdc.displayBalance > 0 && (
            <p className="text-xs text-green-400 mt-1">
              USDC balance: ${usdc.displayBalance.toFixed(2)}
            </p>
          )}
        </div>

        {/* Sell Early */}
        {nutmeg.displayBalance > 0 && (
          <div className="p-4 border border-anansi-border rounded-xl bg-white mb-6">
            <h3 className="font-semibold text-sm mb-2">Sell Early</h3>
            <p className="text-xs text-anansi-gray mb-3">
              Sell your NUTMEG tokens on the marketplace for USDC. Get cash now instead of waiting for surplus.
            </p>
            <div className="flex gap-2">
              <input type="number" step="1" max={nutmeg.displayBalance} value={sellAmount}
                onChange={e => setSellAmount(e.target.value)}
                placeholder={`Amount (max ${nutmeg.displayBalance})`}
                className="flex-1 px-3 py-2 border border-anansi-border rounded-lg text-sm" />
              <button onClick={handleSell} disabled={selling || !sellAmount}
                className="px-4 py-2 bg-anansi-red text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-red-700">
                {selling ? 'Selling...' : 'Sell'}
              </button>
            </div>
          </div>
        )}

        {/* Surplus Claims */}
        {deposits.length > 0 && nutmeg.totalBalance > 0 && (
          <>
            <h2 className="font-bold mb-3">Available Surplus</h2>
            <div className="space-y-3 mb-6">
              {deposits.map(deposit => {
                if (deposit.remaining === 0) return null

                // Pro-rata: (my_balance / total_at_snapshot) * net_amount
                const myShare = deposit.tokensSnapshot > 0
                  ? (deposit.netAmount * nutmeg.totalBalance) / deposit.tokensSnapshot
                  : 0
                if (myShare <= 0 || myShare > deposit.remaining) return null
                const shareUsdc = myShare / (10 ** USDC_DECIMALS)

                return (
                  <div key={deposit.id} className="p-4 border border-green-200 bg-green-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-green-800">${shareUsdc.toFixed(2)} USDC available</p>
                        <p className="text-xs text-green-600 mt-0.5">
                          {nutmeg.displayBalance.toLocaleString()} NUTMEG held of {(deposit.tokensSnapshot / (10 ** NUTMEG_DECIMALS)).toLocaleString()} total at snapshot
                        </p>
                        <p className="text-xs text-green-600">
                          Pool: ${(deposit.netAmount / (10 ** USDC_DECIMALS)).toFixed(2)} USDC remaining
                        </p>
                      </div>
                      <button onClick={() => handleClaim(deposit.id)} disabled={claiming === deposit.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                        {claiming === deposit.id ? 'Claiming...' : 'Claim'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Delivery History */}
        <h2 className="font-bold mb-3">Delivery History</h2>
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
                  <p className="text-sm font-medium">{d.units} kg {'\u00b7'} Grade {d.grade}</p>
                  <p className="text-xs text-anansi-gray">{d.timestamp ? new Date(d.timestamp).toLocaleDateString() : '\u2014'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-700">+{d.tokensMinted} NUTMEG</p>
                  <a href={`https://suiscan.xyz/testnet/tx/${d.txDigest}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-anansi-red hover:underline font-mono">{d.txDigest?.slice(0, 8)}...</a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* How it Works */}
        <div className="mt-8 p-4 bg-anansi-light rounded-xl border border-anansi-border">
          <p className="font-semibold text-sm mb-1">How this works</p>
          <ol className="text-xs text-anansi-gray space-y-1 list-decimal list-inside">
            <li>Deliver nutmeg to GCNA as usual and receive your EC$ advance.</li>
            <li>GCNA records the delivery {'\u2014'} you receive NUTMEG tokens automatically.</li>
            <li>Hold tokens until the lot sells to receive your surplus (USDC).</li>
            <li>Or tap "Sell Early" to swap NUTMEG for USDC on the marketplace.</li>
          </ol>
        </div>
      </div>
    </>
  )
}
