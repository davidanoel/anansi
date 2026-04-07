"use client";

import { useState } from "react";

export default function CetusAdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [usdcAmount, setUsdcAmount] = useState(10);
  const [nutmegAmount, setNutmegAmount] = useState(10);
  const [logs, setLogs] = useState([]);

  const addLog = (msg, type = "info") => {
    setLogs((prev) => [{ msg, type, time: new Date().toLocaleTimeString() }, ...prev]);
  };

  const handleDeployAndFund = async () => {
    setLoading(true);
    addLog(`Deploying pool with ${usdcAmount} USDC and ${nutmegAmount} NUTMEG...`);
    try {
      const res = await fetch("/api/cetus/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usdcAmount, nutmegAmount }),
      });
      const data = await res.json();

      if (data.success) {
        addLog(`SUCCESS! Digest: ${data.digest}`, "success");
        addLog("Find the Pool Object ID on Suiscan and add it to your .env file.", "info");
      } else {
        addLog(`Error: ${data.error}`, "error");
      }
    } catch (err) {
      addLog(`Request failed: ${err.message}`, "error");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 font-sans">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cetus DEX Admin</h1>
        <p className="text-gray-500 mt-2">Deploy your market with custom starting liquidity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border rounded-xl shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">Deploy & Seed</h2>

          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">USDC</label>
              <input
                type="number"
                value={usdcAmount}
                onChange={(e) => setUsdcAmount(Number(e.target.value))}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">NUTMEG</label>
              <input
                type="number"
                value={nutmegAmount}
                onChange={(e) => setNutmegAmount(Number(e.target.value))}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>

          <div className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
            Starting Price: 1 NUTMEG = ${(usdcAmount / nutmegAmount).toFixed(4)} USDC
          </div>

          <button
            onClick={handleDeployAndFund}
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? "Processing Transaction..." : "Deploy & Fund Pool"}
          </button>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 h-64 overflow-y-auto font-mono text-sm shadow-inner">
          {logs.length === 0 ? (
            <p className="text-gray-500 italic">Ready.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-gray-500 shrink-0">[{log.time}]</span>
                  <span
                    className={`${log.type === "error" ? "text-red-400" : ""} ${log.type === "success" ? "text-green-400 font-bold" : ""} ${log.type === "info" ? "text-blue-300" : ""}`}
                  >
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
