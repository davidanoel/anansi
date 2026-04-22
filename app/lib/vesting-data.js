import { getSuiClient } from "./sui";
import { PACKAGE_ID, MODULES, VESTING_CONFIG_ID } from "./constants";

const CARIB_DECIMALS = 9;
const EVENT_PAGE_LIMIT = 100;
const MAX_EVENT_PAGES = 20;

function normalizeAddress(address) {
  return String(address || "").toLowerCase();
}

function parseRawValue(value) {
  if (value == null) return 0n;
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.trunc(value));
  if (typeof value === "string") return BigInt(value || "0");
  if (typeof value === "object") {
    if ("value" in value) return parseRawValue(value.value);
    if ("balance" in value) return parseRawValue(value.balance);
    if ("fields" in value) {
      return parseRawValue(value.fields?.value ?? value.fields?.balance ?? 0);
    }
  }
  return 0n;
}

function formatRawAmount(raw, decimals = CARIB_DECIMALS, maxFractionDigits = 4) {
  const amount = parseRawValue(raw);
  const negative = amount < 0n;
  const abs = negative ? -amount : amount;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const fraction = abs % base;

  if (fraction === 0n) return `${negative ? "-" : ""}${whole.toString()}`;

  let fractionText = fraction.toString().padStart(decimals, "0").slice(0, maxFractionDigits);
  fractionText = fractionText.replace(/0+$/, "");

  return `${negative ? "-" : ""}${whole.toString()}${fractionText ? `.${fractionText}` : ""}`;
}

function computeVestedRaw(fields, nowMs = Date.now()) {
  const total = parseRawValue(fields.total);
  const released = parseRawValue(fields.released);
  const startMs = parseRawValue(fields.start_ms);
  const cliffMs = parseRawValue(fields.cliff_ms);
  const endMs = parseRawValue(fields.end_ms);
  const revoked = !!fields.revoked;
  const revokedAtMs = parseRawValue(fields.revoked_at_ms);
  const now = BigInt(nowMs);

  const effectiveNow = revoked ? revokedAtMs : now;
  if (effectiveNow < cliffMs) return 0n;
  if (effectiveNow >= endMs) return total;
  if (endMs <= startMs) return released > total ? released : total;

  const elapsed = effectiveNow - startMs;
  const duration = endMs - startMs;
  return (total * elapsed) / duration;
}

function toScheduleSummary(fields, objectId, nowMs = Date.now()) {
  const totalRaw = parseRawValue(fields.total);
  const releasedRaw = parseRawValue(fields.released);
  const remainingRaw = parseRawValue(fields.balance);
  const vestedRaw = computeVestedRaw(fields, nowMs);
  const claimableRaw = vestedRaw > releasedRaw ? vestedRaw - releasedRaw : 0n;

  return {
    scheduleId: objectId,
    beneficiary: fields.beneficiary,
    creator: fields.creator,
    totalRaw: totalRaw.toString(),
    totalDisplay: formatRawAmount(totalRaw),
    releasedRaw: releasedRaw.toString(),
    releasedDisplay: formatRawAmount(releasedRaw),
    remainingRaw: remainingRaw.toString(),
    remainingDisplay: formatRawAmount(remainingRaw),
    vestedRaw: vestedRaw.toString(),
    vestedDisplay: formatRawAmount(vestedRaw),
    claimableRaw: claimableRaw.toString(),
    claimableDisplay: formatRawAmount(claimableRaw),
    startMs: Number(fields.start_ms || 0),
    cliffMs: Number(fields.cliff_ms || 0),
    endMs: Number(fields.end_ms || 0),
    revocable: !!fields.revocable,
    revoked: !!fields.revoked,
    revokedAtMs: Number(fields.revoked_at_ms || 0),
    isFullyVested: nowMs >= Number(fields.end_ms || 0),
    cliffReached: nowMs >= Number(fields.cliff_ms || 0),
  };
}

async function collectEventsByType(client, eventType) {
  const events = [];
  let cursor = null;

  for (let page = 0; page < MAX_EVENT_PAGES; page++) {
    const res = await client.queryEvents({
      query: { MoveEventType: eventType },
      cursor,
      limit: EVENT_PAGE_LIMIT,
      order: "descending",
    });

    events.push(...(res.data || []));
    if (!res.hasNextPage || !res.nextCursor) break;
    cursor = res.nextCursor;
  }

  return events;
}

async function getCandidateScheduleIds(address) {
  const client = getSuiClient();
  const normalized = normalizeAddress(address);
  const createdType = `${PACKAGE_ID}::${MODULES.VESTING}::ScheduleCreated`;
  const transferredType = `${PACKAGE_ID}::${MODULES.VESTING}::ScheduleTransferred`;

  const [createdEvents, transferredEvents] = await Promise.all([
    collectEventsByType(client, createdType),
    collectEventsByType(client, transferredType),
  ]);

  const ids = new Set();

  for (const event of createdEvents) {
    const parsed = event.parsedJson || {};
    if (
      normalizeAddress(parsed.beneficiary) === normalized ||
      normalizeAddress(parsed.creator) === normalized
    ) {
      ids.add(parsed.schedule_id);
    }
  }

  for (const event of transferredEvents) {
    const parsed = event.parsedJson || {};
    if (
      normalizeAddress(parsed.old_beneficiary) === normalized ||
      normalizeAddress(parsed.new_beneficiary) === normalized
    ) {
      ids.add(parsed.schedule_id);
    }
  }

  return [...ids].filter(Boolean);
}

export async function getVestingConfig() {
  if (!VESTING_CONFIG_ID || VESTING_CONFIG_ID === "0x0") return null;

  const client = getSuiClient();
  const obj = await client.getObject({
    id: VESTING_CONFIG_ID,
    options: { showContent: true },
  });

  const fields = obj.data?.content?.fields;
  if (!fields) return null;

  return {
    vestingConfigId: VESTING_CONFIG_ID,
    paused: !!fields.paused,
    totalSchedules: Number(fields.total_schedules || 0),
    totalLockedRaw: String(fields.total_locked || "0"),
    totalLockedDisplay: formatRawAmount(fields.total_locked || "0"),
    totalReleasedRaw: String(fields.total_released || "0"),
    totalReleasedDisplay: formatRawAmount(fields.total_released || "0"),
    totalRevokedRaw: String(fields.total_revoked || "0"),
    totalRevokedDisplay: formatRawAmount(fields.total_revoked || "0"),
  };
}

export async function getVestingSchedule(scheduleId) {
  if (!scheduleId) return null;
  const client = getSuiClient();
  const obj = await client.getObject({
    id: scheduleId,
    options: { showContent: true, showType: true },
  });
  const fields = obj.data?.content?.fields;
  if (!fields) return null;
  return toScheduleSummary(fields, scheduleId);
}

export async function getAddressVestingSchedules(address) {
  if (!address) return { beneficiarySchedules: [], creatorSchedules: [] };

  const client = getSuiClient();
  const scheduleIds = await getCandidateScheduleIds(address);
  if (scheduleIds.length === 0) return { beneficiarySchedules: [], creatorSchedules: [] };

  const objects = await Promise.all(
    scheduleIds.map((id) =>
      client.getObject({
        id,
        options: { showContent: true, showType: true },
      }),
    ),
  );

  const normalized = normalizeAddress(address);
  const beneficiarySchedules = [];
  const creatorSchedules = [];
  const nowMs = Date.now();

  for (const obj of objects) {
    const objectId = obj.data?.objectId;
    const fields = obj.data?.content?.fields;
    const objectType = obj.data?.type || obj.data?.content?.type || "";

    if (!objectId || !fields || !String(objectType).includes(`::${MODULES.VESTING}::VestingSchedule`)) {
      continue;
    }

    const summary = toScheduleSummary(fields, objectId, nowMs);

    if (normalizeAddress(summary.beneficiary) === normalized) {
      beneficiarySchedules.push(summary);
    }
    if (normalizeAddress(summary.creator) === normalized) {
      creatorSchedules.push(summary);
    }
  }

  const sortSchedules = (items) =>
    items.sort((a, b) => {
      const claimableDiff = parseRawValue(b.claimableRaw) - parseRawValue(a.claimableRaw);
      if (claimableDiff !== 0n) return claimableDiff > 0n ? 1 : -1;
      return b.endMs - a.endMs;
    });

  return {
    beneficiarySchedules: sortSchedules(beneficiarySchedules),
    creatorSchedules: sortSchedules(creatorSchedules),
  };
}
