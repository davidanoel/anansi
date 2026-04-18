"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "platform-admin-key";

export default function PlatformAuthGate({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [platformKey, setPlatformKey] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedKey = window.sessionStorage.getItem(STORAGE_KEY) || "";
    if (storedKey) {
      setPlatformKey(storedKey);
      setAuthenticated(true);
    }
    setReady(true);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    window.sessionStorage.setItem(STORAGE_KEY, password);
    setPlatformKey(password);
    setAuthenticated(true);
  };

  const handleLogout = () => {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setAuthenticated(false);
    setPlatformKey("");
    setPassword("");
  };

  if (!ready) {
    return <div className="min-h-screen bg-anansi-cream" />;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-anansi-cream">
        <div className="max-w-sm w-full animate-fade-in">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-anansi-red to-anansi-black mx-auto shadow-elevated" />
          <h1 className="font-display text-display-sm text-center mt-6">Platform Admin</h1>
          <p className="text-anansi-muted text-sm text-center mt-2 mb-8">
            Anansi Technology Corporation
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Platform admin key"
              className="input-field font-mono text-center"
              autoFocus
            />
            <button type="submit" disabled={!password} className="btn-primary w-full">
              Sign in
            </button>
          </form>
        </div>
        <p className="text-[11px] text-anansi-muted mt-12">
          Miami, FL · Anansi Technology Corporation
        </p>
      </div>
    );
  }

  return children({ platformKey, onLogout: handleLogout });
}
