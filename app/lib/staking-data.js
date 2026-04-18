// ============================================================
// CaribCoin Staking — Client-side data reads
// ============================================================

import { getSuiClient } from "./sui";
import { PACKAGE_ID, CARIB_TYPE } from "./constants";

const STAKING_CONFIG_ID =
  process.env.NEXT_PUBLIC_STAKING_CONFIG_ID || "0x0";

// ============================================================
// CARIB balance
// ============================================================

export async function getCaribBalance(address) {
  const client = getSuiClient();
  const { data: coins } = await client.getCoins({
    owner: address,
    coinType: CARIB_TYPE,
  });
  const rawTotal = coins.reduce((sum, c) => sum + BigInt(c.balance), 0n);
  return {
    rawBalance: rawTotal.toString(),
    displayBalance: Number(rawTotal) / 1e9,
    coinCount: coins.length,
  };
}

// ============================================================
// Staking config (thresholds + cooldown)
// ============================================================

export async function getStakingConfig() {
  const client = getSuiClient();
  const obj = await client.getObject({
    id: STAKING_CONFIG_ID,
    options: { showContent: true },
  });
  const f = obj.data?.content?.fields;
  if (!f) return null;
  return {
    cooldownMs: Number(f.cooldown_ms),
    cooldownHours: Number(f.cooldown_ms) / 3_600_000,
    thresholds: {
      governance: Number(f.governance_threshold) / 1e9,
      premium: Number(f.premium_threshold) / 1e9,
      feeReduction: Number(f.fee_reduction_threshold) / 1e9,
      priorityAccess: Number(f.priority_access_threshold) / 1e9,
    },
    totalStaked: Number(f.total_staked) / 1e9,
    totalStakers: Number(f.total_stakers),
  };
}

// ============================================================
// User's stake positions
// ============================================================

/**
 * Find all StakePosition objects owned by this address.
 * Returns detail for the first one (most users will only have one).
 */
export async function getUserStakePosition(address) {
  const client = getSuiClient();
  const positionType = `${PACKAGE_ID}::staking::StakePosition`;

  const result = await client.getOwnedObjects({
    owner: address,
    filter: { StructType: positionType },
    options: { showContent: true, showType: true },
  });

  if (result.data.length === 0) return null;

  // Return the first position (primary). UI can handle multi-position later.
  const obj = result.data[0].data;
  const f = obj?.content?.fields;
  if (!f) return null;

  const stakedRaw = BigInt(f.balance || 0);
  const pendingUnstakeRaw = BigInt(f.pending_unstake_amount || 0);
  const activeRaw = pendingUnstakeRaw >= stakedRaw ? 0n : stakedRaw - pendingUnstakeRaw;

  return {
    positionId: obj.objectId,
    stakedRaw: stakedRaw.toString(),
    stakedDisplay: Number(stakedRaw) / 1e9,
    pendingUnstakeRaw: pendingUnstakeRaw.toString(),
    pendingUnstakeDisplay: Number(pendingUnstakeRaw) / 1e9,
    activeRaw: activeRaw.toString(),
    activeDisplay: Number(activeRaw) / 1e9,
    cooldownEndsAt: Number(f.cooldown_ends_at || 0),
    isCoolingDown: pendingUnstakeRaw > 0n,
    createdAt: Number(f.created_at || 0),
    lastStakedAt: Number(f.last_staked_at || 0),
  };
}

// ============================================================
// Tier helper — maps active amount → tier number + label
// ============================================================

export function computeTier(activeDisplay, thresholds) {
  if (!thresholds) return { level: 0, label: "None" };
  if (activeDisplay >= thresholds.priorityAccess)
    return { level: 4, label: "Priority Access" };
  if (activeDisplay >= thresholds.feeReduction)
    return { level: 3, label: "Fee Reduction" };
  if (activeDisplay >= thresholds.premium)
    return { level: 2, label: "Premium" };
  if (activeDisplay >= thresholds.governance)
    return { level: 1, label: "Governance" };
  return { level: 0, label: "None" };
}
