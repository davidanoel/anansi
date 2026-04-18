"use client";

import { useCallback } from "react";
import PlatformAnalyticsPanel from "../../../components/PlatformAnalyticsPanel";
import PlatformAuthGate from "../../../components/PlatformAuthGate";

export default function PlatformAnalyticsPage() {
  return (
    <PlatformAuthGate>
      {({ platformKey, onLogout }) => (
        <PlatformAnalyticsScreen platformKey={platformKey} onLogout={onLogout} />
      )}
    </PlatformAuthGate>
  );
}

function PlatformAnalyticsScreen({ platformKey, onLogout }) {
  const api = useCallback(
    async (path, options = {}) => {
      const res = await fetch(`/api/platform/${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "x-platform-key": platformKey,
          ...options.headers,
        },
      });
      if (res.status === 401) {
        onLogout();
        throw new Error("Unauthorized");
      }
      return res.json();
    },
    [platformKey, onLogout],
  );

  return (
    <div className="min-h-screen bg-anansi-cream">
      <header className="sticky top-0 z-50 bg-anansi-black/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-anansi-red to-anansi-accent" />
            <span className="font-display text-white text-lg tracking-tight">Anansi</span>
            <span className="badge bg-anansi-red/20 text-anansi-red ring-0 text-[10px]">
              Analytics
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/platform" className="text-xs text-gray-400 hover:text-white transition-colors">
              Back to Platform
            </a>
            <button
              onClick={onLogout}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-in">
        <PlatformAnalyticsPanel api={api} />
      </div>
    </div>
  );
}
