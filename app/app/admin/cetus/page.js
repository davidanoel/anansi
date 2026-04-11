"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../components/AuthProvider";
import AppNav from "../../../components/AppNav";

export default function CetusPoolAdmin() {
  const { user } = useAuth();
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null);

  // Dynamically read registered tokens from the environment
  const registeredTokens = (process.env.NEXT_PUBLIC_REGISTERED_TOKENS || "NUTMEG")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Default to the first token in the list on load
  useEffect(() => {
    if (!tokenSymbol && registeredTokens.length > 0) {
      setTokenSymbol(registeredTokens[0]);
    }
  }, []);

  const handleCreatePool = async (e) => {
    e.preventDefault();
    setCreating(true);
    setResult(null);

    try {
      const res = await fetch("/api/cetus/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: tokenSymbol }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create pool");

      setResult({ success: true, poolId: data.poolId });
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setCreating(false);
    }
  };

  // if (!user) {
  //   return (
  //     <>
  //       <AppNav />
  //       <div className="max-w-lg mx-auto px-6 py-20 text-center">
  //         <p className="text-anansi-gray">Please sign in to access the DEX admin.</p>
  //       </div>
  //     </>
  //   );
  // }

  return (
    <>
      <AppNav />
      <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in">
        <div className="mb-8">
          <p className="section-title">Cetus DEX Admin</p>
          <h1 className="text-display-sm font-display">Liquidity Pools</h1>
          <p className="text-anansi-gray mt-1">
            Initialize new trading pairs on the Cetus Testnet. USDC is always the base token.
          </p>
        </div>

        <div className="card p-6 border-anansi-border">
          <h3 className="font-semibold mb-4">Create New Pool</h3>
          <form onSubmit={handleCreatePool} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-anansi-muted uppercase tracking-wider mb-1.5">
                Commodity Token
              </label>
              <select
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                className="input-field w-full"
                required
              >
                {registeredTokens.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <p className="text-xs text-anansi-muted mt-2">
                This token will be paired with testnet USDC.
              </p>
            </div>

            <button
              type="submit"
              disabled={creating || !tokenSymbol}
              className="btn-primary w-full py-3"
            >
              {creating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Initializing Pool...
                </span>
              ) : (
                `Initialize ${tokenSymbol} / USDC Pool`
              )}
            </button>
          </form>

          {result && (
            <div
              className={`mt-5 p-4 rounded-lg text-sm ${
                result.success
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {result.success ? (
                <>
                  <span className="font-medium">Pool Created!</span>
                  <br />
                  <span className="font-mono text-xs mt-1 block">Pool ID: {result.poolId}</span>
                  <p className="text-xs mt-2 font-medium">
                    Remember to copy this Pool ID into your .env.local file!
                  </p>
                </>
              ) : (
                `Error: ${result.error}`
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
