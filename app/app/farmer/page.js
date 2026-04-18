"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthProvider";
import AppNav from "../../components/AppNav";
import {
  getMultiTokenPortfolio,
  getUsdcBalance,
  getFarmerDeliveries,
  getAllSurplusDeposits,
  getClaimedDepositIds,
} from "../../lib/data";
import { claimSurplus, sellToken } from "../../lib/transactions";
import { USDC_DECIMALS } from "../../lib/constants";

export default function FarmerPage() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [usdc, setUsdc] = useState({ displayBalance: 0 });
  const [deliveries, setDeliveries] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [prices, setPrices] = useState({}); // { NUTMEG: { priceUsdc: 0.91, ... } }
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [sellState, setSellState] = useState({ symbol: null, amount: "", selling: false });
  const [claimedDepositIds, setClaimedDepositIds] = useState(new Set());

  // Fetch live prices from Cetus pools
  async function loadPrices() {
    try {
      const res = await fetch("/api/cetus/price");
      if (res.ok) {
        const data = await res.json();
        setPrices(data.prices || {});
      }
    } catch (err) {
      console.warn("Price fetch failed:", err.message);
    }
  }

  async function loadData() {
    if (!user?.address) return;
    try {
      const [p, u, d, s, claimed] = await Promise.all([
        getMultiTokenPortfolio(user.address),
        getUsdcBalance(user.address),
        getFarmerDeliveries(user.address),
        getAllSurplusDeposits().catch(() => []),
        getClaimedDepositIds(user.address).catch(() => new Set()),
      ]);
      setClaimedDepositIds(claimed);
      setPortfolio(p);
      setUsdc(u);
      setDeliveries(d);
      setDeposits(s);
    } catch (err) {
      console.error("Failed to load farmer data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    loadPrices();
    // Refresh prices every 30 seconds
    const interval = setInterval(loadPrices, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  // Helper: get price for a token
  const getPrice = (symbol) => prices[symbol]?.priceUsdc || null;

  const handleClaim = async (depositId, tokenSymbol) => {
    setClaiming(depositId);
    try {
      await claimSurplus(depositId, tokenSymbol);
      alert("Surplus claimed! USDC sent to your wallet.");
      await loadData();
    } catch (err) {
      if (err.message?.includes("EAlreadyClaimed") || err.message?.includes("204")) {
        alert("You have already claimed this surplus.");
        await loadData();
      } else {
        alert("Claim failed: " + err.message);
      }
    } finally {
      setClaiming(null);
    }
  };

  const handleSell = async (symbol) => {
    if (!sellState.amount) return;
    setSellState((s) => ({ ...s, selling: true }));
    try {
      await sellToken(parseFloat(sellState.amount), symbol);
      alert(`${symbol} sold for USDC!`);
      setSellState({ symbol: null, amount: "", selling: false });
      await loadData();
      loadPrices();
    } catch (err) {
      alert(err.message);
      setSellState((s) => ({ ...s, selling: false }));
    }
  };

  if (!user) {
    return (
      <>
        <AppNav />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <p className="text-anansi-gray">Please sign in to view your farmer dashboard.</p>
        </div>
      </>
    );
  }

  const totalAssetsValue = portfolio.reduce((acc, token) => {
    const price = getPrice(token.symbol) || 0;
    return acc + token.displayBalance * price;
  }, 0);

  const totalEquity = totalAssetsValue + (usdc.displayBalance || 0);
  const commodityPortfolio = portfolio.filter((token) => token.symbol !== "CARIB");

  const holdingsSummary = commodityPortfolio
    .filter((t) => t.displayBalance > 0)
    .map((t) => `${t.displayBalance.toLocaleString()} ${t.symbol}`)
    .join(" · ");
  const hasPrices = Object.keys(prices).length > 0;

  // Filter claimable deposits based on the SPECIFIC token, not a global sum
  const claimableDeposits = deposits.filter((deposit) => {
    if (deposit.remaining === 0) return false;
    if (claimedDepositIds.has(deposit.id)) return false;

    // Grab the specific token balance for this deposit's commodity
    const matchingToken = portfolio.find((t) => t.symbol === deposit.assetTypeSymbol);
    const tokenBalance = matchingToken ? matchingToken.totalBalance : 0;

    if (tokenBalance <= 0) return false;

    const myShare =
      deposit.tokensSnapshot > 0 ? (deposit.netAmount * tokenBalance) / deposit.tokensSnapshot : 0;
    return myShare > 0 && myShare <= deposit.remaining;
  });

  return (
    <>
      <AppNav />
      <div className="max-w-lg mx-auto px-6 py-8 animate-fade-in">
        {/* Portfolio Card */}
        <div className="relative overflow-hidden bg-anansi-black text-white rounded-2xl p-6 shadow-elevated border border-white/5">
          {/* Subtle Branding Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-anansi-red/5 to-transparent rounded-bl-full pointer-events-none" />

          <div className="relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
                  Total Value
                </p>
                <p className="text-4xl font-bold mt-1 tabular-nums tracking-tight">
                  {loading ? (
                    <span className="inline-block w-32 h-9 bg-white/5 rounded animate-pulse" />
                  ) : (
                    `$${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  )}
                </p>
              </div>

              {/* Small notification badge for Surplus */}
              {claimableDeposits.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">
                    Surplus
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5">
              {/* Itemized Assets line (Nutmeg, Cocoa, etc) */}
              <p className="text-xs font-medium text-gray-400 truncate">
                {holdingsSummary || "No active assets"}
              </p>

              {/* Explicit Financial Breakdown */}
              <div className="flex gap-4 mt-1.5 pt-1.5 border-t border-white/[0.03]">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">
                  Assets: <span className="text-gray-400">${totalAssetsValue.toFixed(2)}</span>
                </p>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">
                  Cash:{" "}
                  <span className="text-emerald-500/90">${usdc.displayBalance.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Token Holdings */}
        {!loading && commodityPortfolio.length > 0 && (
          <div className="mt-6">
            <p className="section-title">Your tokens</p>
            <div className="space-y-3">
              {commodityPortfolio.map((token) => {
                const price = getPrice(token.symbol);
                return (
                  <div key={token.symbol} className="card p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-lg">
                            {token.displayBalance.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          <span className="text-sm text-anansi-muted">{token.symbol}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {price !== null ? (
                            <>
                              <p className="text-xs text-anansi-muted">
                                ≈ ${(token.displayBalance * price).toFixed(2)} USD
                              </p>
                              <span className="text-[10px] text-anansi-muted">
                                · ${price.toFixed(4)}/token
                              </span>
                            </>
                          ) : (
                            <p className="text-xs text-anansi-muted">Price loading…</p>
                          )}
                        </div>
                      </div>
                      {token.hasPool && (
                        <button
                          onClick={() =>
                            setSellState((s) =>
                              s.symbol === token.symbol
                                ? { symbol: null, amount: "", selling: false }
                                : { symbol: token.symbol, amount: "", selling: false },
                            )
                          }
                          className={`text-xs px-4 py-2 rounded-lg font-medium transition-all ${
                            sellState.symbol === token.symbol
                              ? "bg-anansi-light text-anansi-gray"
                              : "bg-anansi-red text-white hover:bg-anansi-red-light"
                          }`}
                        >
                          {sellState.symbol === token.symbol ? "Cancel" : "Sell Early"}
                        </button>
                      )}
                    </div>

                    {/* Sell panel */}
                    {sellState.symbol === token.symbol && (
                      <div className="mt-4 pt-4 border-t border-anansi-border animate-scale-in">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Sell {token.symbol} for USDC</p>
                          <span className="badge badge-open">Via Cetus DEX</span>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <input
                              type="number"
                              step="1"
                              max={token.displayBalance}
                              value={sellState.amount}
                              onChange={(e) =>
                                setSellState((s) => ({ ...s, amount: e.target.value }))
                              }
                              placeholder="0"
                              className="input-field pr-16 text-lg font-semibold"
                            />
                            <button
                              onClick={() =>
                                setSellState((s) => ({
                                  ...s,
                                  amount: String(Math.floor(token.displayBalance)),
                                }))
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wider text-anansi-red px-2 py-1"
                            >
                              Max
                            </button>
                          </div>
                          <button
                            onClick={() => handleSell(token.symbol)}
                            disabled={
                              sellState.selling ||
                              !sellState.amount ||
                              parseFloat(sellState.amount) <= 0
                            }
                            className="btn-primary px-6"
                          >
                            {sellState.selling ? (
                              <span className="flex items-center gap-2">
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Selling
                              </span>
                            ) : (
                              "Sell"
                            )}
                          </button>
                        </div>
                        {sellState.amount && parseFloat(sellState.amount) > 0 && price !== null && (
                          <p className="text-xs text-anansi-muted mt-2">
                            ≈ ${(parseFloat(sellState.amount) * price).toFixed(2)} USDC at current
                            pool price
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Surplus Claims */}
        {claimableDeposits.length > 0 && (
          <div className="mt-6">
            <p className="section-title">Available surplus</p>
            <div className="space-y-3">
              {claimableDeposits.map((deposit) => {
                // Grab the specific token balance for this deposit's commodity
                const matchingToken = portfolio.find((t) => t.symbol === deposit.assetTypeSymbol);
                const tokenBalance = matchingToken ? matchingToken.totalBalance : 0;

                const myShare = (deposit.netAmount * tokenBalance) / deposit.tokensSnapshot;
                const shareUsdc = myShare / 10 ** USDC_DECIMALS;

                return (
                  <div
                    key={deposit.id}
                    className="card p-5 border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-white"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-emerald-800">
                          ${shareUsdc.toFixed(2)}
                        </p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          Your {deposit.assetTypeSymbol} pro-rata share
                        </p>
                      </div>
                      <button
                        onClick={() => handleClaim(deposit.id, deposit.assetTypeSymbol)}
                        disabled={claiming === deposit.id}
                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors active:scale-[0.98]"
                      >
                        {claiming === deposit.id ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Claiming
                          </span>
                        ) : (
                          "Claim USDC"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Delivery History */}
        <div className="mt-8">
          <p className="section-title">Delivery history</p>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-4 h-16 animate-pulse" />
              ))}
            </div>
          ) : deliveries.length === 0 ? (
            <div className="card text-center py-12 px-6">
              <div className="w-12 h-12 rounded-full bg-anansi-light flex items-center justify-center mx-auto">
                <svg
                  className="w-6 h-6 text-anansi-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium mt-3">No deliveries yet</p>
              <p className="text-xs text-anansi-muted mt-1 max-w-xs mx-auto">
                Tokens appear here after a custodian records your delivery on the Spice platform.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {deliveries.map((d, i) => (
                <div key={i} className="card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {d.assetTypeSymbol ? `${d.assetTypeSymbol} · ` : ""}
                        {d.units} kg · Grade {d.grade}
                      </p>
                      <p className="text-xs text-anansi-muted">
                        {d.timestamp
                          ? new Date(d.timestamp).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
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
              {
                step: "01",
                text: "Deliver your commodity to the local custodian and receive your advance.",
              },
              {
                step: "02",
                text: "The custodian records the delivery — you receive tokens automatically.",
              },
              {
                step: "03",
                text: "Hold tokens until the lot sells for your full surplus in USDC.",
              },
              { step: "04", text: "Or sell early on the marketplace for instant USDC." },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <span className="text-xs font-mono text-anansi-muted font-medium mt-0.5">
                  {item.step}
                </span>
                <p className="text-sm text-anansi-gray leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
