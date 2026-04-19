"use client";

import { useEffect, useMemo, useState } from "react";

export default function PlatformAnalyticsPanel({ api }) {
  const [overview, setOverview] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [byAssetType, setByAssetType] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const activityPageSize = 5;

  async function request(path) {
    const data = await api(path);
    if (data?.error) throw new Error(data.error);
    return data;
  }

  async function loadAnalytics(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [overviewData, deliveryData, assetData, farmerData, activityData] = await Promise.all([
        request("analytics/overview"),
        request("analytics/deliveries-over-time?days=14"),
        request("analytics/by-asset-type"),
        request("analytics/farmers?limit=8"),
        request("analytics/recent-activity?limit=48"),
      ]);

      setOverview(overviewData);
      setDeliveries(Array.isArray(deliveryData) ? deliveryData : []);
      setByAssetType(Array.isArray(assetData) ? assetData : []);
      setFarmers(Array.isArray(farmerData) ? farmerData : []);
      setRecentActivity(Array.isArray(activityData) ? activityData : []);
      setActivityPage(1);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, [api]);

  const normalizedOverview = useMemo(() => normalizeOverview(overview), [overview]);
  const normalizedDeliveries = useMemo(
    () =>
      deliveries.map((item) => ({
        date: item.date,
        deliveriesCount: toNumber(item.deliveries_count),
        totalUnits: toNumber(item.total_units),
        totalTokensMinted: toNumber(item.total_tokens_minted),
      })),
    [deliveries],
  );
  const maxDeliveries = useMemo(
    () => Math.max(...normalizedDeliveries.map((item) => item.deliveriesCount), 1),
    [normalizedDeliveries],
  );
  const totalActivityPages = useMemo(
    () => Math.max(1, Math.ceil(recentActivity.length / activityPageSize)),
    [recentActivity.length],
  );
  const pagedActivity = useMemo(() => {
    const start = (activityPage - 1) * activityPageSize;
    return recentActivity.slice(start, start + activityPageSize);
  }, [activityPage, recentActivity]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="card p-5 h-28 animate-pulse" />
          ))}
        </div>
        <div className="grid lg:grid-cols-[1.4fr,0.8fr] gap-6">
          <div className="card p-6 h-72 animate-pulse" />
          <div className="card p-6 h-72 animate-pulse" />
        </div>
        <div className="card p-6 h-80 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-semibold text-lg">Analytics</h2>
          <p className="text-sm text-anansi-muted mt-1">
            Parallel indexer-backed dashboard for internal operations and platform health.
          </p>
        </div>
        <button
          onClick={() => loadAnalytics(true)}
          className="btn-ghost text-sm"
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg text-sm bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <MetricCard label="Asset Types" value={formatNumber(normalizedOverview.totalAssetTypes)} />
        <MetricCard label="Total Lots" value={formatNumber(normalizedOverview.totalLots)} />
        <MetricCard label="Active Lots" value={formatNumber(normalizedOverview.activeLots)} />
        <MetricCard
          label="Total Deliveries"
          value={formatNumber(normalizedOverview.totalDeliveries)}
        />
        <MetricCard label="Unique Farmers" value={formatNumber(normalizedOverview.uniqueFarmers)} />
        <MetricCard
          label="Units Tokenized"
          value={formatNumber(normalizedOverview.totalUnitsTokenized)}
        />
        <MetricCard
          label="Tokens Minted"
          value={formatNumber(normalizedOverview.totalTokensMinted)}
        />
        <MetricCard
          label="Surplus Deposited"
          value={formatUsd(normalizedOverview.totalSurplusDeposited)}
        />
        <MetricCard
          label="Surplus Distributed"
          value={formatUsd(normalizedOverview.totalSurplusDistributed)}
        />
        <MetricCard
          label="CARIB Burned"
          value={formatToken(normalizedOverview.totalCaribBurned, 9)}
        />
      </div>

      <div className="grid lg:grid-cols-[1.4fr,0.8fr] gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold">Deliveries Over Time</h3>
              <p className="text-xs text-anansi-muted mt-1">Last 14 indexed days</p>
            </div>
            <div className="text-right">
              <p className="stat-label">Total Units</p>
              <p className="text-sm font-semibold">
                {formatNumber(sumBy(normalizedDeliveries, "totalUnits"))}
              </p>
            </div>
          </div>

          {normalizedDeliveries.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-anansi-muted">
              No indexed deliveries yet.
            </div>
          ) : (
            <div className="h-56 flex items-end gap-3">
              {normalizedDeliveries.map((item) => {
                const height = Math.max(10, (item.deliveriesCount / maxDeliveries) * 100);
                return (
                  <div key={item.date} className="flex-1 min-w-0">
                    <div className="h-44 flex items-end">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-anansi-red to-anansi-black/80"
                        style={{ height: `${height}%` }}
                        title={`${item.date}: ${item.deliveriesCount} deliveries`}
                      />
                    </div>
                    <p className="text-[11px] text-anansi-muted mt-3 truncate">
                      {formatChartDate(item.date)}
                    </p>
                    <p className="text-xs font-medium mt-1">{item.deliveriesCount}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-5">Protocol Snapshot</h3>
          <div className="space-y-4 text-sm">
            <SnapshotRow label="Closed Lots" value={formatNumber(normalizedOverview.closedLots)} />
            <SnapshotRow label="Claim Rate" value={formatPercent(normalizedOverview.claimRate)} />
            <SnapshotRow
              label="Unclaimed Surplus"
              value={formatUsd(normalizedOverview.unclaimedSurplus)}
            />
            <SnapshotRow
              label="Surplus Deposits"
              value={formatNumber(normalizedOverview.surplusDepositCount)}
            />
            <SnapshotRow
              label="Surplus Claims"
              value={formatNumber(normalizedOverview.surplusClaimCount)}
            />
            <SnapshotRow
              label="Fees Collected"
              value={formatUsd(normalizedOverview.totalFeesCollected)}
            />
            <SnapshotRow
              label="Cursor Slots"
              value={formatNumber(normalizedOverview.cursorCount)}
            />
            <SnapshotRow
              label="Latest Indexed Event"
              value={
                normalizedOverview.latestIndexedEventAt
                  ? formatRelativeTime(normalizedOverview.latestIndexedEventAt)
                  : "Awaiting data"
              }
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-anansi-border">
          <h3 className="font-semibold">By Asset Type</h3>
          <p className="text-sm text-anansi-muted mt-1">
            Supply, activity, and surplus rollups by commodity.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-anansi-border bg-anansi-light/50">
                {["Asset", "Lots", "Deliveries", "Units", "Tokens", "Surplus", "Claimed"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="text-left px-6 py-3 stat-label font-medium whitespace-nowrap"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {byAssetType.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-anansi-muted">
                    No asset types have been indexed yet.
                  </td>
                </tr>
              ) : (
                byAssetType.map((row) => (
                  <tr
                    key={row.symbol}
                    className="border-b border-anansi-border last:border-0 hover:bg-anansi-light/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold">{row.symbol}</p>
                        <p className="text-xs text-anansi-muted mt-1">
                          {row.name || "Unnamed asset"}
                          {row.unit ? ` | ${row.unit}` : ""}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">{formatNumber(toNumber(row.lot_count))}</td>
                    <td className="px-6 py-4">{formatNumber(toNumber(row.deliveries_count))}</td>
                    <td className="px-6 py-4">{formatNumber(toNumber(row.total_units))}</td>
                    <td className="px-6 py-4">{formatNumber(toNumber(row.total_tokens_minted))}</td>
                    <td className="px-6 py-4">
                      {formatUsd(toNumber(row.total_surplus_deposited))}
                    </td>
                    <td className="px-6 py-4">
                      {formatUsd(toNumber(row.total_surplus_distributed))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1fr,1fr] gap-6">
        <div className="card overflow-hidden">
          <div className="px-6 py-5 border-b border-anansi-border">
            <h3 className="font-semibold">Top Farmers</h3>
            <p className="text-sm text-anansi-muted mt-1">
              Participation ranked by delivered volume.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-anansi-border bg-anansi-light/50">
                  {["Farmer", "Units", "Tokens", "Lots", "Claimed", "Last Active"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="text-left px-6 py-3 stat-label font-medium whitespace-nowrap"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {farmers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-anansi-muted">
                      No farmer participation has been indexed yet.
                    </td>
                  </tr>
                ) : (
                  farmers.map((farmer) => (
                    <tr
                      key={farmer.address}
                      className="border-b border-anansi-border last:border-0 hover:bg-anansi-light/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs">
                        {shortAddress(farmer.address)}
                      </td>
                      <td className="px-6 py-4">
                        {formatNumber(toNumber(farmer.total_units_delivered))}
                      </td>
                      <td className="px-6 py-4">
                        {formatNumber(toNumber(farmer.total_tokens_minted))}
                      </td>
                      <td className="px-6 py-4">
                        {formatNumber(toNumber(farmer.lots_participated))}
                      </td>
                      <td className="px-6 py-4">
                        {formatUsd(toNumber(farmer.total_surplus_claimed))}
                      </td>
                      <td className="px-6 py-4 text-anansi-muted">
                        {formatRelativeTime(farmer.last_activity_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold">Recent Activity</h3>
              <p className="text-sm text-anansi-muted mt-1">
                Fast view into the indexed platform event stream.
              </p>
            </div>
            {recentActivity.length > activityPageSize && (
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setActivityPage((page) => Math.max(1, page - 1))}
                  disabled={activityPage === 1}
                  className="btn-ghost px-3 py-1 disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-anansi-muted whitespace-nowrap">
                  Page {activityPage} of {totalActivityPages}
                </span>
                <button
                  onClick={() => setActivityPage((page) => Math.min(totalActivityPages, page + 1))}
                  disabled={activityPage === totalActivityPages}
                  className="btn-ghost px-3 py-1 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="text-sm text-anansi-muted py-8 text-center">
                No recent activity yet.
              </div>
            ) : (
              pagedActivity.map((item) => {
                const detail = describeActivity(item);
                return (
                  <div
                    key={`${item.kind}-${item.reference_id}-${item.timestamp}`}
                    className="rounded-xl border border-anansi-border bg-white/60 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{detail.title}</p>
                        <p className="text-sm text-anansi-gray mt-1 leading-relaxed">
                          {detail.description}
                        </p>
                      </div>
                      <span className="text-[11px] text-anansi-muted whitespace-nowrap">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-3 text-[11px] text-anansi-muted">
                      <span>{detail.meta}</span>
                      {item.tx_digest ? (
                        <a
                          href={txUrl(item.tx_digest)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-anansi-red hover:underline font-mono"
                        >
                          {item.tx_digest.slice(0, 10)}...
                        </a>
                      ) : (
                        <span className="font-mono">{shortAddress(item.reference_id)}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="card p-5">
      <p className="stat-label">{label}</p>
      <p className="stat-value mt-2">{value}</p>
    </div>
  );
}

function SnapshotRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-anansi-border pb-3 last:border-0 last:pb-0">
      <span className="text-anansi-muted">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function normalizeOverview(overview) {
  const totalSurplusDeposited = toNumber(overview?.total_surplus_deposited);
  const totalSurplusDistributed = toNumber(overview?.total_surplus_distributed);
  return {
    totalAssetTypes: toNumber(overview?.total_asset_types),
    totalLots: toNumber(overview?.total_lots),
    activeLots: toNumber(overview?.active_lots),
    closedLots: toNumber(overview?.closed_lots),
    totalDeliveries: toNumber(overview?.total_deliveries),
    uniqueFarmers: toNumber(overview?.unique_farmers),
    totalUnitsTokenized: toNumber(overview?.total_units_tokenized),
    totalTokensMinted: toNumber(overview?.total_tokens_minted),
    surplusDepositCount: toNumber(overview?.surplus_deposit_count),
    surplusClaimCount: toNumber(overview?.surplus_claim_count),
    totalSurplusDeposited,
    totalSurplusDistributed,
    totalFeesCollected: toNumber(overview?.total_fees_collected),
    totalCaribBurned: toNumber(overview?.total_carib_burned),
    claimRate: Number(overview?.claim_rate || 0),
    latestIndexedEventAt: toNumber(overview?.latest_indexed_event_at),
    cursorCount: toNumber(overview?.cursor_count),
    unclaimedSurplus: totalSurplusDeposited - totalSurplusDistributed,
  };
}

function describeActivity(item) {
  const assetLabel = item.asset_type_symbol || "Platform";

  if (item.kind === "delivery_recorded") {
    return {
      title: `${assetLabel} delivery recorded`,
      description: `${shortAddress(item.actor)} delivered ${formatNumber(item.amount)} units into lot ${shortAddress(item.lot_id)}.`,
      meta: `${formatNumber(item.secondary_amount)} tokens minted${item.label ? ` | Grade ${item.label}` : ""}`,
    };
  }

  if (item.kind === "surplus_received") {
    return {
      title: `${assetLabel} surplus deposited`,
      description: `${formatUsd(item.amount)} net surplus was deposited for lot ${shortAddress(item.lot_id)}.`,
      meta: `${formatUsd(item.secondary_amount)} gross deposited`,
    };
  }

  if (item.kind === "surplus_claimed") {
    return {
      title: `${assetLabel} surplus claimed`,
      description: `${shortAddress(item.actor)} claimed ${formatUsd(item.amount)} from lot ${shortAddress(item.lot_id)}.`,
      meta: `${formatNumber(item.secondary_amount)} tokens used for claim`,
    };
  }

  if (item.kind === "carib_burned") {
    return {
      title: "CARIB burn recorded",
      description: `${shortAddress(item.actor)} burned ${formatToken(item.amount, 9)} CARIB.`,
      meta: `Cumulative burned: ${formatToken(item.secondary_amount, 9)} CARIB`,
    };
  }

  return {
    title: `${assetLabel} lot created`,
    description: `Lot ${item.label ? `#${item.label}` : shortAddress(item.lot_id)} entered the platform lifecycle.`,
    meta: shortAddress(item.actor),
  };
}

function txUrl(txDigest) {
  const network = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";
  return `https://suiscan.xyz/${network}/tx/${txDigest}`;
}

function toNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function sumBy(items, key) {
  return items.reduce((sum, item) => sum + toNumber(item[key]), 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(toNumber(value));
}

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(toNumber(value) / 1e6);
}

function formatToken(value, decimals = 0) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    toNumber(value) / 10 ** decimals,
  );
}

function formatPercent(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function shortAddress(value) {
  if (!value) return "--";
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatRelativeTime(timestamp) {
  const value = toNumber(timestamp);
  if (!value) return "--";

  const diff = Date.now() - value;
  const minutes = Math.round(diff / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(value).toLocaleDateString();
}

function formatChartDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
