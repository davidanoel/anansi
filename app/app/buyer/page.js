"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthProvider";
import AppNav from "../../components/AppNav";
import { getMultiTokenPortfolio, getUsdcBalance, getActiveLots } from "../../lib/data";
import { buyToken } from "../../lib/transactions";
import { getTradableTokens, USDC_DECIMALS } from "../../lib/constants";

export default function BuyerPage() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [usdc, setUsdc] = useState({ displayBalance: 0 });
  const [lots, setLots] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [buyState, setBuyState] = useState({ token: null, amount: "", buying: false });

  const tradableTokens = getTradableTokens();

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
    if (!user?.address) {
      setLoading(false);
      return;
    }
    try {
      const [p, u, l] = await Promise.all([
        getMultiTokenPortfolio(user.address),
        getUsdcBalance(user.address),
        getActiveLots(),
      ]);
      setPortfolio(p);
      setUsdc(u);
      setLots(l);
    } catch (err) {
      console.error("Failed to load marketplace:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    loadPrices();
    const interval = setInterval(loadPrices, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  const getPrice = (symbol) => prices[symbol]?.priceUsdc || null;

  const handleBuy = async (symbol) => {
    if (!buyState.amount) return;
    setBuyState((s) => ({ ...s, buying: true }));
    try {
      await buyToken(parseFloat(buyState.amount), symbol);
      alert(`${symbol} purchased!`);
      setBuyState({ token: null, amount: "", buying: false });
      await loadData();
      loadPrices();
    } catch (err) {
      alert(err.message);
      setBuyState((s) => ({ ...s, buying: false }));
    }
  };

  if (!user) {
    return (
      <>
        <AppNav />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <p className="text-anansi-gray">Please sign in to access the marketplace.</p>
        </div>
      </>
    );
  }

  const hasPrices = Object.keys(prices).length > 0;
  const totalHoldingsValue = portfolio.reduce((sum, t) => {
    const price = getPrice(t.symbol);
    return sum + (price ? t.displayBalance * price : 0);
  }, 0);

  return (
    <>
      <AppNav />
      <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in">
        <div className="mb-8">
          <p className="section-title">Marketplace</p>
          <h1 className="text-display-sm font-display">Buy Tokens</h1>
          <p className="text-anansi-gray mt-2 max-w-xl">
            Purchase tokenized real-world assets backed by physical commodities and property. Earn
            surplus when assets are sold.
          </p>
        </div>

        {/* Wallet Summary */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="card p-5 bg-gradient-to-br from-anansi-black to-anansi-black/95 text-white">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Your holdings
            </p>
            <p className="text-3xl font-bold mt-2 tabular-nums">
              {hasPrices ? `$${totalHoldingsValue.toFixed(2)}` : "—"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {portfolio
                .filter((t) => t.totalBalance > 0)
                .map((t) => {
                  const price = getPrice(t.symbol);
                  return `${t.displayBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${t.symbol}${price ? ` · $${price.toFixed(4)}` : ""}`;
                })
                .join(" · ") || "No tokens held"}
            </p>
          </div>
          <div className="card p-5">
            <p className="stat-label">USDC available</p>
            <p className="text-3xl font-bold mt-2 tabular-nums">
              ${usdc.displayBalance.toFixed(2)}
            </p>
            <p className="text-xs text-anansi-muted mt-1">Ready to invest</p>
          </div>
        </div>

        {/* Available Tokens */}
        <p className="section-title">Available tokens</p>
        <div className="space-y-4 mb-10">
          {tradableTokens.map((token) => {
            const held = portfolio.find((p) => p.symbol === token.symbol);
            const isExpanded = buyState.token === token.symbol;
            const price = getPrice(token.symbol);

            return (
              <div key={token.symbol} className="card p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{token.symbol}</h3>
                      <span className="badge badge-open">Live on DEX</span>
                      {price !== null && (
                        <span className="text-sm font-semibold text-anansi-black">
                          ${price.toFixed(4)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-anansi-muted mt-1">
                      {token.moduleName.charAt(0).toUpperCase() + token.moduleName.slice(1)} ·
                      Coin&lt;{token.symbol}&gt;
                      {price === null && " · Price loading…"}
                    </p>
                  </div>
                  <div className="text-right">
                    {held && held.totalBalance > 0 && (
                      <p className="text-sm font-semibold">
                        {held.displayBalance.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}{" "}
                        held
                      </p>
                    )}
                    <button
                      onClick={() =>
                        setBuyState((s) =>
                          s.token === token.symbol
                            ? { token: null, amount: "", buying: false }
                            : { token: token.symbol, amount: "", buying: false },
                        )
                      }
                      className={`mt-1 text-xs px-4 py-2 rounded-lg font-medium transition-all ${
                        isExpanded ? "bg-anansi-light text-anansi-gray" : "btn-primary"
                      }`}
                    >
                      {isExpanded ? "Cancel" : `Buy ${token.symbol}`}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-5 pt-4 border-t border-anansi-border animate-scale-in">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium">Swap USDC → {token.symbol}</p>
                      <span className="text-xs text-anansi-muted">
                        Via Cetus DEX · 1% max slippage
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          step="1"
                          value={buyState.amount}
                          onChange={(e) => setBuyState((s) => ({ ...s, amount: e.target.value }))}
                          placeholder="USDC amount"
                          className="input-field text-lg font-semibold pr-16"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-anansi-muted">
                          USDC
                        </span>
                      </div>
                      <button
                        onClick={() => handleBuy(token.symbol)}
                        disabled={
                          buyState.buying || !buyState.amount || parseFloat(buyState.amount) <= 0
                        }
                        className="btn-primary px-8"
                      >
                        {buyState.buying ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Swapping
                          </span>
                        ) : (
                          "Buy"
                        )}
                      </button>
                    </div>
                    {buyState.amount && parseFloat(buyState.amount) > 0 && price !== null && (
                      <div className="mt-3 p-3 bg-anansi-light rounded-lg flex items-center justify-between">
                        <span className="text-xs text-anansi-muted">Estimated output</span>
                        <span className="text-sm font-semibold">
                          ≈ {(parseFloat(buyState.amount) / price).toFixed(2)} {token.symbol}
                        </span>
                      </div>
                    )}
                    {buyState.amount && parseFloat(buyState.amount) > 0 && price === null && (
                      <p className="text-xs text-anansi-muted mt-2">Fetching live price…</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {tradableTokens.length === 0 && (
            <div className="card text-center py-16">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium mt-3">No tokens available for trading</p>
              <p className="text-xs text-anansi-muted mt-1">
                Tokens will appear here once DEX pools are created.
              </p>
            </div>
          )}
        </div>

        {/* Active Lots */}
        <p className="section-title">Active lots</p>
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="card p-6 h-32 animate-pulse" />
            ))}
          </div>
        ) : lots.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-sm font-medium">No active lots</p>
            <p className="text-xs text-anansi-muted mt-1">Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lots.map((lot, i) => {
              const sBadge =
                lot.status === 0
                  ? "badge-open"
                  : lot.status === 1
                    ? "badge-selling"
                    : lot.status === 2
                      ? "badge-distributing"
                      : "badge-closed";
              const lotPrice = getPrice(lot.assetTypeSymbol);
              return (
                <div
                  key={lot.id}
                  className="card p-6 animate-slide-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">
                        {lot.assetTypeSymbol} — Lot #{lot.lotNumber}
                      </h3>
                      <span className={`badge ${sBadge}`}>{lot.statusLabel}</span>
                    </div>
                    {lotPrice !== null && (
                      <div className="text-right">
                        <p className="font-bold">${lotPrice.toFixed(4)}</p>
                        <p className="text-[10px] text-anansi-muted">per token (live)</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-5 pt-4 border-t border-anansi-border">
                    <div>
                      <p className="stat-label">Supply</p>
                      <p className="stat-value">{lot.totalUnits.toLocaleString()} kg</p>
                    </div>
                    <div>
                      <p className="stat-label">Tokens</p>
                      <p className="stat-value">{lot.totalTokensMinted.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="stat-label">Deliveries</p>
                      <p className="stat-value">{lot.deliveryCount}</p>
                    </div>
                    <div>
                      <p className="stat-label">Surplus</p>
                      <p className="stat-value">
                        {lot.totalSurplusDeposited > 0
                          ? `$${(lot.totalSurplusDeposited / 1e6).toFixed(2)}`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* How it Works */}
        <div className="mt-12 grid sm:grid-cols-3 gap-5">
          {[
            {
              step: "01",
              title: "Buy tokens",
              desc: "Purchase tokens with USDC. Each is backed by physical assets held by a local custodian.",
            },
            {
              step: "02",
              title: "Hold or trade",
              desc: "Hold tokens to earn surplus when assets are sold. Or trade on the DEX anytime.",
            },
            {
              step: "03",
              title: "Earn surplus",
              desc: "When the custodian sells the commodity, surplus USDC is distributed to all holders.",
            },
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
          <p>
            Tokens represent claims on surplus from real-world asset sales. Returns depend on market
            prices and are not guaranteed.
          </p>
        </div>
      </div>
    </>
  );
}
