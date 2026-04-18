"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthProvider";
import AppNav from "../../components/AppNav";
import {
  getCaribBalance,
  getStakingConfig,
  getUserStakePosition,
  computeTier,
} from "../../lib/staking-data";
import {
  stakeCarib,
  stakeIntoPosition,
  requestUnstake,
  cancelUnstake,
  withdrawUnstakedFor,
  closePosition,
} from "../../lib/staking-transactions";

export default function StakePage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState({ displayBalance: 0 });
  const [config, setConfig] = useState(null);
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  async function loadData() {
    if (!user?.address) {
      setLoading(false);
      return;
    }
    try {
      const [b, c, p] = await Promise.all([
        getCaribBalance(user.address),
        getStakingConfig(),
        getUserStakePosition(user.address),
      ]);
      setBalance(b);
      setConfig(c);
      setPosition(p);
    } catch (err) {
      console.error("Failed to load staking data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user]);

  // Tick every second for cooldown countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!user) {
    return (
      <>
        <AppNav />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <p className="text-anansi-gray">Please sign in to stake CARIB.</p>
        </div>
      </>
    );
  }

  const tier =
    position && config
      ? computeTier(position.activeDisplay, config.thresholds)
      : { level: 0, label: "None" };

  const cooldownRemaining = position?.cooldownEndsAt
    ? Math.max(0, position.cooldownEndsAt - now)
    : 0;
  const canWithdraw = position?.isCoolingDown && cooldownRemaining === 0;

  // ==========================================================
  // Actions
  // ==========================================================

  async function handleStake() {
    const amt = parseFloat(stakeAmount);
    if (!amt || amt <= 0) return alert("Enter a valid amount");
    if (amt > balance.displayBalance) return alert("Insufficient CARIB");

    setBusy(true);
    try {
      if (position && !position.isCoolingDown) {
        await stakeIntoPosition(position.positionId, amt, user.address);
      } else if (position && position.isCoolingDown) {
        return alert("Cancel the pending unstake before adding more");
      } else {
        await stakeCarib(amt, user.address);
      }
      setStakeAmount("");
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRequestUnstake() {
    const amt = parseFloat(unstakeAmount);
    if (!amt || amt <= 0) return alert("Enter a valid amount");
    if (!position) return;
    if (amt > position.stakedDisplay) return alert("Amount exceeds staked balance");

    setBusy(true);
    try {
      await requestUnstake(position.positionId, amt);
      setUnstakeAmount("");
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!position) return;
    setBusy(true);
    try {
      await cancelUnstake(position.positionId);
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleWithdraw() {
    if (!position) return;
    setBusy(true);
    try {
      await withdrawUnstakedFor(position.positionId, user.address);
      // If this emptied the position, close it
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleClose() {
    if (!position) return;
    setBusy(true);
    try {
      await closePosition(position.positionId);
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  // ==========================================================
  // Render helpers
  // ==========================================================

  const formatDuration = (ms) => {
    if (ms <= 0) return "Ready";
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const fmt = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <>
      <AppNav />
      <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in">
        <div className="mb-8">
          <p className="section-title">CaribCoin</p>
          <h1 className="text-display-sm font-display">Stake CARIB</h1>
          <p className="text-anansi-gray mt-2 max-w-xl">
            Stake to participate. Unstake anytime — benefits pause during a 24-hour cooldown. The
            protocol pays no yield. This is about participation, not returns.
          </p>
        </div>

        {/* Wallet + Staked summary */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="card p-5">
            <p className="stat-label">CARIB in wallet</p>
            <p className="text-3xl font-bold mt-2 tabular-nums">{fmt(balance.displayBalance)}</p>
            <p className="text-xs text-anansi-muted mt-1">Available to stake</p>
          </div>
          <div className="card p-5 bg-gradient-to-br from-anansi-black to-anansi-black/95 text-white">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              CARIB staked
            </p>
            <p className="text-3xl font-bold mt-2 tabular-nums">
              {position ? fmt(position.stakedDisplay) : "0"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {position?.isCoolingDown
                ? `${fmt(position.activeDisplay)} active · ${fmt(position.pendingUnstakeDisplay)} in cooldown`
                : position
                  ? "All active"
                  : "No position yet"}
            </p>
          </div>
        </div>

        {!loading && balance.displayBalance === 0 && (
          <div className="mb-8 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900">
            <p className="text-sm font-medium">No stakeable CARIB found in this wallet.</p>
            <p className="text-sm mt-1">
              If you received CARIB from an earlier testnet deployment, those are legacy coins and
              will not appear on this staking page. Only CARIB from the current deployment can be
              staked here.
            </p>
          </div>
        )}

        {/* Tier + benefits */}
        {config && (
          <div className="card p-5 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="stat-label">Current tier</p>
                <p className="text-2xl font-bold mt-1">{tier.label}</p>
              </div>
              <div className="text-right">
                <p className="stat-label">Active stake</p>
                <p className="text-2xl font-bold tabular-nums mt-1">
                  {position ? fmt(position.activeDisplay) : "0"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <TierRow
                active={position?.activeDisplay >= config.thresholds.governance}
                threshold={config.thresholds.governance}
                label="Governance voting"
                detail="1 CARIB = 1 vote on protocol proposals"
              />
              <TierRow
                active={position?.activeDisplay >= config.thresholds.premium}
                threshold={config.thresholds.premium}
                label="Premium features"
                detail="Advanced analytics, API access"
              />
              <TierRow
                active={position?.activeDisplay >= config.thresholds.feeReduction}
                threshold={config.thresholds.feeReduction}
                label="Fee reduction"
                detail="Up to 50% off Spice and CaribStone fees"
              />
              <TierRow
                active={position?.activeDisplay >= config.thresholds.priorityAccess}
                threshold={config.thresholds.priorityAccess}
                label="Priority pool access"
                detail="24h early access to new asset pools"
              />
            </div>
          </div>
        )}

        {/* Stake form */}
        <div className="card p-5 mb-4">
          <p className="section-title mb-3">Stake</p>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Amount to stake"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="flex-1 px-3 py-2 rounded border border-anansi-border"
              disabled={busy}
            />
            <button
              onClick={() => setStakeAmount(balance.displayBalance.toString())}
              className="px-3 py-2 text-sm rounded border border-anansi-border hover:bg-gray-50"
              disabled={busy}
            >
              Max
            </button>
            <button
              onClick={handleStake}
              disabled={busy || !stakeAmount}
              className="px-5 py-2 rounded bg-anansi-black text-white hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Processing..." : "Stake"}
            </button>
          </div>
          {position?.isCoolingDown && (
            <p className="text-xs text-amber-700 mt-2">
              Cancel the pending unstake before adding more.
            </p>
          )}
        </div>

        {/* Unstake / cooldown status */}
        {position && (
          <div className="card p-5">
            <p className="section-title mb-3">Unstake</p>

            {position.isCoolingDown ? (
              <div>
                <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-3">
                  <p className="text-sm font-medium text-amber-900">
                    {fmt(position.pendingUnstakeDisplay)} CARIB in cooldown
                  </p>
                  <p className="text-2xl font-bold tabular-nums mt-1 text-amber-900">
                    {formatDuration(cooldownRemaining)}
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    {canWithdraw
                      ? "Ready to withdraw"
                      : "Benefits for this amount are paused during cooldown"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {canWithdraw ? (
                    <button
                      onClick={handleWithdraw}
                      disabled={busy}
                      className="flex-1 px-5 py-2 rounded bg-anansi-black text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {busy ? "Processing..." : "Withdraw to wallet"}
                    </button>
                  ) : (
                    <button
                      onClick={handleCancel}
                      disabled={busy}
                      className="flex-1 px-5 py-2 rounded border border-anansi-border hover:bg-gray-50 disabled:opacity-50"
                    >
                      {busy ? "Processing..." : "Cancel unstake"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Amount to unstake"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  className="flex-1 px-3 py-2 rounded border border-anansi-border"
                  disabled={busy || position.stakedDisplay === 0}
                />
                <button
                  onClick={() => setUnstakeAmount(position.stakedDisplay.toString())}
                  className="px-3 py-2 text-sm rounded border border-anansi-border hover:bg-gray-50"
                  disabled={busy || position.stakedDisplay === 0}
                >
                  Max
                </button>
                <button
                  onClick={handleRequestUnstake}
                  disabled={busy || !unstakeAmount || position.stakedDisplay === 0}
                  className="px-5 py-2 rounded border border-anansi-border hover:bg-gray-50 disabled:opacity-50"
                >
                  {busy ? "Processing..." : "Request unstake"}
                </button>
              </div>
            )}

            <p className="text-xs text-anansi-muted mt-3">
              Cooldown: {config?.cooldownHours ?? 24}h. Benefits pause for the pending amount during
              cooldown. You can cancel anytime before withdrawal.
            </p>

            {position.stakedDisplay === 0 && !position.isCoolingDown && (
              <button
                onClick={handleClose}
                disabled={busy}
                className="mt-3 text-xs text-anansi-muted hover:text-anansi-black"
              >
                Close empty position
              </button>
            )}
          </div>
        )}

        {/* Protocol stats */}
        {config && (
          <div className="mt-8 text-xs text-anansi-muted flex gap-6">
            <span>Total staked: {fmt(config.totalStaked)} CARIB</span>
            <span>Stakers: {config.totalStakers}</span>
          </div>
        )}
      </div>
    </>
  );
}

function TierRow({ active, threshold, label, detail }) {
  const fmtThreshold = threshold.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return (
    <div
      className={`p-3 rounded border ${active ? "border-green-300 bg-green-50" : "border-anansi-border"}`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-sm font-medium ${active ? "text-green-900" : "text-anansi-black"}`}>
          {label}
        </p>
        <span className={`text-xs font-mono ${active ? "text-green-700" : "text-anansi-muted"}`}>
          {active ? "✓ Active" : `${fmtThreshold}+`}
        </span>
      </div>
      <p className="text-xs text-anansi-muted mt-1">{detail}</p>
    </div>
  );
}
