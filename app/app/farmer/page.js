"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthProvider";
import AppNav from "../../components/AppNav";
import { getTokenPortfolio, getFarmerDeliveries, getFarmerSurplusDeposits } from "../../lib/data";
import { claimSurplus } from "../../lib/transactions";
import { USDC_DECIMALS } from "../../lib/constants";

export default function FarmerPage() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);

  useEffect(() => {
    async function load() {
      if (!user?.address) return;
      try {
        const [t, d] = await Promise.all([
          getTokenPortfolio(user.address),
          getFarmerDeliveries(user.address),
        ]);
        setTokens(t);
        setDeliveries(d);

        // Load surplus deposits for lots the farmer has tokens in
        if (t.length > 0) {
          const surplusDeposits = await getFarmerSurplusDeposits(t);
          setDeposits(surplusDeposits);
        }
      } catch (err) {
        console.error("Failed to load farmer data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleClaim = async (depositId, tokenId) => {
    setClaiming(depositId);
    try {
      await claimSurplus(depositId, tokenId);
      alert("Surplus claimed successfully!");
      // Reload data
      const t = await getTokenPortfolio(user.address);
      setTokens(t);
      if (t.length > 0) {
        const surplusDeposits = await getFarmerSurplusDeposits(t);
        setDeposits(surplusDeposits);
      }
    } catch (err) {
      if (err.message?.includes("AlreadyClaimed")) {
        alert("You have already claimed this surplus.");
      } else {
        alert("Claim failed: " + err.message);
      }
    } finally {
      setClaiming(null);
    }
  };

  if (!user) {
    return <p className="p-6">Please sign in to view your farmer dashboard.</p>;
  }

  const unitPrice = 0.55;
  const totalBalance = tokens.reduce((sum, t) => sum + t.balance, 0);
  const totalValue = totalBalance * unitPrice;

  return (
    <>
      <AppNav />
      <div className="max-w-lg mx-auto px-6 py-8">
        {/* Balance Card */}
        <div className="bg-anansi-black text-white rounded-2xl p-6 mb-6">
          <p className="text-sm text-gray-400">Total estimated value</p>
          <p className="text-4xl font-bold mt-1">${loading ? "—" : totalValue.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {totalBalance.toLocaleString()} tokens · ${unitPrice}/unit
          </p>
        </div>

        {/* Surplus Claims */}
        {deposits.length > 0 && (
          <>
            <h2 className="font-bold mb-3">Available Surplus</h2>
            <div className="space-y-3 mb-6">
              {deposits.map((deposit) => {
                const matchingToken = tokens.find((t) => t.lotId === deposit.lotId);
                if (!matchingToken) return null;

                // Skip if no balance remaining in the deposit
                if (deposit.remaining === 0) return null;

                // Calculate share
                const share =
                  deposit.tokensSnapshot > 0
                    ? (deposit.netAmount * matchingToken.balance) / deposit.tokensSnapshot
                    : 0;

                // If share exceeds remaining, farmer likely already claimed
                if (share > deposit.remaining) return null;
                const shareUsdc = share / 10 ** USDC_DECIMALS;

                return (
                  <div
                    key={deposit.id}
                    className="p-4 border border-green-200 bg-green-50 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-green-800">
                          ${shareUsdc.toFixed(2)} USDC available
                        </p>
                        <p className="text-xs text-green-600 mt-0.5">
                          Lot surplus · {matchingToken.balance} tokens held of{" "}
                          {deposit.tokensSnapshot.toLocaleString()} total
                        </p>
                        <p className="text-xs text-green-600">
                          Pool: ${(deposit.netAmount / 10 ** USDC_DECIMALS).toFixed(2)} USDC (after
                          1% fee)
                        </p>
                      </div>
                      <button
                        onClick={() => handleClaim(deposit.id, matchingToken.id)}
                        disabled={claiming === deposit.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {claiming === deposit.id ? "Claiming..." : "Claim"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

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
            {tokens.map((token) => (
              <div key={token.id} className="p-4 border border-anansi-border rounded-xl bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">
                      {token.balance.toLocaleString()} {token.assetTypeSymbol || "NUTMG"}
                    </p>
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
              <div
                key={i}
                className="p-3 border border-anansi-border rounded-xl bg-white flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium">
                    {d.units} kg · Grade {d.grade}
                  </p>
                  <p className="text-xs text-anansi-gray">
                    {d.timestamp ? new Date(d.timestamp).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-700">+{d.tokensMinted} tokens</p>
                  <a
                    href={`https://suiscan.xyz/testnet/tx/${d.txDigest}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-anansi-red hover:underline font-mono"
                  >
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
            <li>GCNA records the delivery — you get tokens automatically.</li>
            <li>When the lot sells, GCNA deposits surplus USDC.</li>
            <li>Your share appears above — tap Claim to receive USDC.</li>
          </ol>
        </div>
      </div>
    </>
  );
}
