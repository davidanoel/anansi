"use client";

import { useEffect, useMemo, useState } from "react";
import AppNav from "../../components/AppNav";
import { useAuth } from "../../components/AuthProvider";
import { getAddressVestingSchedules, getVestingConfig } from "../../lib/vesting-data";
import {
  claimVestedTokens,
  revokeVestingSchedule,
  transferVestingSchedule,
} from "../../lib/vesting-transactions";

const STORAGE_KEY = "platform-admin-key";

function plusMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function toInputValue(date) {
  const value = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  const year = value.getFullYear();
  const month = pad(value.getMonth() + 1);
  const day = pad(value.getDate());
  const hours = pad(value.getHours());
  const minutes = pad(value.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDateTime(ms) {
  if (!ms) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}

function formatAddress(address) {
  return address ? `${address.slice(0, 8)}···${address.slice(-4)}` : "—";
}

export default function VestingPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("beneficiary");
  const [config, setConfig] = useState(null);
  const [beneficiarySchedules, setBeneficiarySchedules] = useState([]);
  const [creatorSchedules, setCreatorSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [transferTargets, setTransferTargets] = useState({});

  const [platformKey, setPlatformKey] = useState("");
  const [platformPassword, setPlatformPassword] = useState("");
  const [adminStats, setAdminStats] = useState(null);
  const [adminSchedules, setAdminSchedules] = useState([]);
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminMessage, setAdminMessage] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminForm, setAdminForm] = useState(() => {
    const now = new Date();
    return {
      beneficiary: "",
      amount: "",
      revocable: true,
      startAt: toInputValue(now),
      cliffAt: toInputValue(plusMonths(now, 12)),
      endAt: toInputValue(plusMonths(now, 48)),
    };
  });

  async function loadUserData() {
    if (!user?.address) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [nextConfig, schedules] = await Promise.all([
        getVestingConfig(),
        getAddressVestingSchedules(user.address),
      ]);
      setConfig(nextConfig);
      setBeneficiarySchedules(schedules.beneficiarySchedules);
      setCreatorSchedules(schedules.creatorSchedules);
    } catch (err) {
      console.error("Failed to load vesting data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = window.sessionStorage.getItem(STORAGE_KEY) || "";
      if (storedKey) setPlatformKey(storedKey);
    }
    loadUserData();
  }, [user?.address]);

  const adminApi = async (method = "GET", body) => {
    const res = await fetch("/api/platform/vesting", {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-platform-key": platformKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401 && typeof window !== "undefined") {
        window.sessionStorage.removeItem(STORAGE_KEY);
        setPlatformKey("");
      }
      throw new Error(data.error || "Request failed");
    }
    return data;
  };

  async function loadAdminData() {
    if (!platformKey) return;
    setAdminLoading(true);
    try {
      const stats = await adminApi("GET");
      setAdminStats(stats);
      const schedules = await getAddressVestingSchedules(stats.adminAddress);
      setAdminSchedules(schedules.creatorSchedules);
    } catch (err) {
      setAdminMessage({ success: false, text: err.message });
    } finally {
      setAdminLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "admin" && platformKey) {
      loadAdminData();
    }
  }, [tab, platformKey]);

  const beneficiaryClaimableCount = beneficiarySchedules.filter((s) => s.claimableRaw !== "0").length;
  const creatorRevocableCount = creatorSchedules.filter((s) => s.revocable && !s.revoked).length;

  const beneficiarySummary = useMemo(
    () => beneficiarySchedules.reduce((sum, s) => sum + Number(s.claimableDisplay || 0), 0),
    [beneficiarySchedules],
  );

  if (!user) {
    return (
      <>
        <AppNav />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <p className="text-anansi-gray">Please sign in to view your vesting schedules.</p>
        </div>
      </>
    );
  }

  async function handleClaim(scheduleId) {
    setBusyId(`claim:${scheduleId}`);
    try {
      await claimVestedTokens(scheduleId);
      await loadUserData();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId("");
    }
  }

  async function handleTransfer(scheduleId) {
    const newBeneficiary = String(transferTargets[scheduleId] || "").trim();
    if (!newBeneficiary.startsWith("0x")) {
      return alert("Enter a valid beneficiary address");
    }
    setBusyId(`transfer:${scheduleId}`);
    try {
      await transferVestingSchedule(scheduleId, newBeneficiary);
      setTransferTargets((prev) => ({ ...prev, [scheduleId]: "" }));
      await loadUserData();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId("");
    }
  }

  async function handleCreatorRevoke(scheduleId) {
    if (!confirm("Revoke this schedule's unvested portion?")) return;
    setBusyId(`revoke:${scheduleId}`);
    try {
      await revokeVestingSchedule(scheduleId);
      await loadUserData();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId("");
    }
  }

  function handleAdminLogin(e) {
    e.preventDefault();
    if (!platformPassword) return;
    window.sessionStorage.setItem(STORAGE_KEY, platformPassword);
    setPlatformKey(platformPassword);
    setPlatformPassword("");
    setAdminMessage(null);
  }

  function handleAdminLogout() {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setPlatformKey("");
    setAdminStats(null);
    setAdminSchedules([]);
    setAdminMessage(null);
  }

  async function handlePauseToggle(nextPaused) {
    setAdminBusy(true);
    setAdminMessage(null);
    try {
      await adminApi("PATCH", { action: "set_paused", paused: nextPaused });
      setAdminMessage({
        success: true,
        text: nextPaused ? "Vesting paused." : "Vesting unpaused.",
      });
      await loadAdminData();
      await loadUserData();
    } catch (err) {
      setAdminMessage({ success: false, text: err.message });
    } finally {
      setAdminBusy(false);
    }
  }

  async function handleAdminCreate(e) {
    e.preventDefault();
    setAdminBusy(true);
    setAdminMessage(null);
    try {
      const result = await adminApi("POST", {
        beneficiary: adminForm.beneficiary,
        amount: Number(adminForm.amount),
        revocable: adminForm.revocable,
        startMs: Date.parse(adminForm.startAt),
        cliffMs: Date.parse(adminForm.cliffAt),
        endMs: Date.parse(adminForm.endAt),
      });
      setAdminMessage({
        success: true,
        text: `Schedule created${result.scheduleId ? `: ${result.scheduleId}` : ""}`,
      });
      await loadAdminData();
    } catch (err) {
      setAdminMessage({ success: false, text: err.message });
    } finally {
      setAdminBusy(false);
    }
  }

  async function handleAdminRevoke(scheduleId) {
    if (!confirm("Revoke this schedule from the platform admin wallet?")) return;
    setAdminBusy(true);
    setAdminMessage(null);
    try {
      await adminApi("PATCH", { action: "revoke_schedule", scheduleId });
      setAdminMessage({ success: true, text: `Revoked ${formatAddress(scheduleId)}` });
      await loadAdminData();
    } catch (err) {
      setAdminMessage({ success: false, text: err.message });
    } finally {
      setAdminBusy(false);
    }
  }

  const tabs = [
    { id: "beneficiary", label: "As Beneficiary" },
    { id: "creator", label: "As Creator" },
    { id: "admin", label: "Admin Panel" },
  ];

  return (
    <>
      <AppNav />
      <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-in">
        <div className="mb-8">
          <p className="section-title">CaribCoin</p>
          <h1 className="text-display-sm font-display">Vesting</h1>
          <p className="text-anansi-gray mt-2 max-w-2xl">
            Track locked CARIB allocations, claim vested tokens, transfer beneficiary rights, and
            manage admin-created schedules.
          </p>
        </div>

        {config?.paused && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-4">
            <p className="text-sm font-medium">Vesting is currently paused.</p>
            <p className="text-sm mt-1">
              Claims and new schedules are blocked until the platform admin unpauses the module.
            </p>
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <SummaryCard
            label="Claimable now"
            value={beneficiarySummary.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            helper={`${beneficiaryClaimableCount} schedule${beneficiaryClaimableCount === 1 ? "" : "s"} with claimable CARIB`}
          />
          <SummaryCard
            label="My beneficiary schedules"
            value={beneficiarySchedules.length}
            helper="Schedules where you can claim or transfer"
          />
          <SummaryCard
            label="My creator schedules"
            value={creatorSchedules.length}
            helper={`${creatorRevocableCount} revocable schedule${creatorRevocableCount === 1 ? "" : "s"}`}
          />
        </div>

        <div className="flex gap-1 bg-anansi-light rounded-lg p-1 overflow-x-auto mb-6">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${tab === item.id ? "bg-white text-anansi-black shadow-card" : "text-anansi-muted hover:text-anansi-black"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card p-8 text-sm text-anansi-muted">Loading vesting schedules...</div>
        ) : null}

        {!loading && tab === "beneficiary" && (
          <div className="space-y-4">
            {beneficiarySchedules.length === 0 ? (
              <EmptyCard
                title="No beneficiary schedules yet"
                subtitle="Once a schedule names your wallet as beneficiary, it will appear here."
              />
            ) : (
              beneficiarySchedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.scheduleId}
                  schedule={schedule}
                  mode="beneficiary"
                  busyId={busyId}
                  transferTarget={transferTargets[schedule.scheduleId] || ""}
                  onTransferTargetChange={(value) =>
                    setTransferTargets((prev) => ({ ...prev, [schedule.scheduleId]: value }))
                  }
                  onClaim={() => handleClaim(schedule.scheduleId)}
                  onTransfer={() => handleTransfer(schedule.scheduleId)}
                />
              ))
            )}
          </div>
        )}

        {!loading && tab === "creator" && (
          <div className="space-y-4">
            {creatorSchedules.length === 0 ? (
              <EmptyCard
                title="No creator schedules for this wallet"
                subtitle="Creator schedules appear here only if this wallet originally funded them."
              />
            ) : (
              creatorSchedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.scheduleId}
                  schedule={schedule}
                  mode="creator"
                  busyId={busyId}
                  onRevoke={() => handleCreatorRevoke(schedule.scheduleId)}
                />
              ))
            )}
          </div>
        )}

        {!loading && tab === "admin" && (
          <div className="space-y-6">
            {!platformKey ? (
              <div className="card p-6 max-w-md">
                <h2 className="font-semibold text-lg">Platform Admin</h2>
                <p className="text-sm text-anansi-muted mt-1 mb-5">
                  Use the same platform key as `/platform` to manage vesting schedules.
                </p>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <input
                    type="password"
                    value={platformPassword}
                    onChange={(e) => setPlatformPassword(e.target.value)}
                    placeholder="Platform admin key"
                    className="input-field font-mono"
                  />
                  <button type="submit" disabled={!platformPassword} className="btn-primary w-full">
                    Unlock Admin Panel
                  </button>
                </form>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-lg">Vesting Admin</h2>
                    <p className="text-sm text-anansi-muted">
                      Create schedules, pause claims/creation, and manage admin-created grants.
                    </p>
                  </div>
                  <button onClick={handleAdminLogout} className="btn-ghost text-sm">
                    Sign out admin
                  </button>
                </div>

                {adminMessage && (
                  <div
                    className={`rounded-xl p-4 text-sm border ${adminMessage.success ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}
                  >
                    {adminMessage.text}
                  </div>
                )}

                <div className="grid md:grid-cols-4 gap-4">
                  <SummaryCard
                    label="Paused"
                    value={adminStats ? (adminStats.paused ? "Yes" : "No") : "—"}
                    helper={adminStats ? "Create + claim guardrail" : "Loading..."}
                  />
                  <SummaryCard
                    label="Schedules"
                    value={adminStats?.totalSchedules ?? "—"}
                    helper="Global total"
                  />
                  <SummaryCard
                    label="Locked"
                    value={adminStats?.totalLocked ?? "—"}
                    helper="CARIB across all schedules"
                  />
                  <SummaryCard
                    label="Released"
                    value={adminStats?.totalReleased ?? "—"}
                    helper="CARIB already claimed"
                  />
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold">Pause controls</h3>
                      <p className="text-sm text-anansi-muted mt-1">
                        Pause blocks new schedules and claims, but not revoke.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={adminBusy || adminLoading}
                      onClick={() => handlePauseToggle(!adminStats?.paused)}
                      className={adminStats?.paused ? "btn-primary" : "btn-ghost"}
                    >
                      {adminStats?.paused ? "Unpause Vesting" : "Pause Vesting"}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleAdminCreate} className="card p-6 grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <h3 className="font-semibold">Create schedule</h3>
                    <p className="text-sm text-anansi-muted mt-1">
                      Funds come from the platform admin wallet’s CARIB balance.
                    </p>
                  </div>
                  <Field
                    label="Beneficiary"
                    value={adminForm.beneficiary}
                    onChange={(v) => setAdminForm((prev) => ({ ...prev, beneficiary: v }))}
                    placeholder="0x..."
                    mono
                  />
                  <Field
                    label="Amount (CARIB)"
                    value={adminForm.amount}
                    onChange={(v) => setAdminForm((prev) => ({ ...prev, amount: v }))}
                    placeholder="1000000"
                    type="number"
                  />
                  <Field
                    label="Start"
                    value={adminForm.startAt}
                    onChange={(v) => setAdminForm((prev) => ({ ...prev, startAt: v }))}
                    type="datetime-local"
                  />
                  <Field
                    label="Cliff"
                    value={adminForm.cliffAt}
                    onChange={(v) => setAdminForm((prev) => ({ ...prev, cliffAt: v }))}
                    type="datetime-local"
                  />
                  <Field
                    label="End"
                    value={adminForm.endAt}
                    onChange={(v) => setAdminForm((prev) => ({ ...prev, endAt: v }))}
                    type="datetime-local"
                  />
                  <div>
                    <label className="block text-xs font-medium text-anansi-muted uppercase tracking-wider mb-1.5">
                      Revocable
                    </label>
                    <select
                      value={adminForm.revocable ? "true" : "false"}
                      onChange={(e) =>
                        setAdminForm((prev) => ({
                          ...prev,
                          revocable: e.target.value === "true",
                        }))
                      }
                      className="input-field"
                    >
                      <option value="true">Yes — creator can claw back unvested</option>
                      <option value="false">No — permanent beneficiary right</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={adminBusy || adminLoading}
                      className="btn-primary"
                    >
                      {adminBusy ? "Creating..." : "Create Schedule"}
                    </button>
                  </div>
                </form>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Admin-created schedules</h3>
                    <p className="text-sm text-anansi-muted mt-1">
                      This list is derived from current on-chain state for the admin signer address.
                    </p>
                  </div>
                  {adminLoading ? (
                    <div className="card p-6 text-sm text-anansi-muted">Loading admin schedules...</div>
                  ) : adminSchedules.length === 0 ? (
                    <EmptyCard
                      title="No admin-created schedules yet"
                      subtitle="Create a schedule above and it will appear here."
                    />
                  ) : (
                    adminSchedules.map((schedule) => (
                      <ScheduleCard
                        key={schedule.scheduleId}
                        schedule={schedule}
                        mode="admin"
                        busyId={adminBusy ? schedule.scheduleId : ""}
                        onRevoke={() => handleAdminRevoke(schedule.scheduleId)}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function SummaryCard({ label, value, helper }) {
  return (
    <div className="card p-5">
      <p className="stat-label">{label}</p>
      <p className="text-3xl font-bold mt-2 tabular-nums">{value}</p>
      <p className="text-xs text-anansi-muted mt-1">{helper}</p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", mono = false }) {
  return (
    <div>
      <label className="block text-xs font-medium text-anansi-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`input-field ${mono ? "font-mono text-xs" : ""}`}
      />
    </div>
  );
}

function EmptyCard({ title, subtitle }) {
  return (
    <div className="card p-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-anansi-muted mt-1">{subtitle}</p>
    </div>
  );
}

function ScheduleCard({
  schedule,
  mode,
  busyId,
  transferTarget,
  onTransferTargetChange,
  onClaim,
  onTransfer,
  onRevoke,
}) {
  const claimBusy = busyId === `claim:${schedule.scheduleId}`;
  const transferBusy = busyId === `transfer:${schedule.scheduleId}`;
  const revokeBusy =
    busyId === `revoke:${schedule.scheduleId}` || busyId === schedule.scheduleId;

  return (
    <div className="card p-6 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="badge bg-anansi-red/10 text-anansi-red ring-0 text-[10px]">
              {schedule.revoked ? "Revoked" : schedule.revocable ? "Revocable" : "Locked"}
            </span>
            {schedule.claimableRaw !== "0" && (
              <span className="badge bg-emerald-100 text-emerald-700 ring-0 text-[10px]">
                Claimable now
              </span>
            )}
          </div>
          <p className="font-mono text-xs text-anansi-muted break-all">{schedule.scheduleId}</p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-xs text-anansi-muted uppercase tracking-wider">Claimable</p>
          <p className="text-2xl font-bold tabular-nums">{schedule.claimableDisplay}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <Meta label="Beneficiary" value={formatAddress(schedule.beneficiary)} />
        <Meta label="Creator" value={formatAddress(schedule.creator)} />
        <Meta label="Total" value={`${schedule.totalDisplay} CARIB`} />
        <Meta label="Released" value={`${schedule.releasedDisplay} CARIB`} />
        <Meta label="Vested" value={`${schedule.vestedDisplay} CARIB`} />
        <Meta label="Remaining" value={`${schedule.remainingDisplay} CARIB`} />
        <Meta label="Start" value={formatDateTime(schedule.startMs)} />
        <Meta label="Cliff" value={formatDateTime(schedule.cliffMs)} />
        <Meta label="End" value={formatDateTime(schedule.endMs)} />
      </div>

      {mode === "beneficiary" && (
        <div className="space-y-4 border-t border-anansi-border pt-5">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onClaim}
              disabled={claimBusy || schedule.claimableRaw === "0"}
              className="btn-primary disabled:opacity-50"
            >
              {claimBusy ? "Claiming..." : "Claim vested CARIB"}
            </button>
          </div>
          <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
            <Field
              label="Transfer beneficiary rights"
              value={transferTarget}
              onChange={onTransferTargetChange}
              placeholder="0x..."
              mono
            />
            <button
              type="button"
              onClick={onTransfer}
              disabled={transferBusy || !transferTarget}
              className="btn-ghost disabled:opacity-50"
            >
              {transferBusy ? "Transferring..." : "Transfer"}
            </button>
          </div>
        </div>
      )}

      {(mode === "creator" || mode === "admin") && (
        <div className="border-t border-anansi-border pt-5">
          <button
            type="button"
            onClick={onRevoke}
            disabled={revokeBusy || !schedule.revocable || schedule.revoked}
            className="btn-ghost disabled:opacity-50"
          >
            {revokeBusy ? "Revoking..." : "Revoke unvested portion"}
          </button>
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <p className="text-xs text-anansi-muted uppercase tracking-wider">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
