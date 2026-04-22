import { verifyPlatformAuth } from "../../../../lib/platform-auth";
import {
  adminCreateVestingSchedule,
  adminRevokeVestingSchedule,
  adminSetVestingPaused,
  getAdminAddress,
  getVestingStats,
} from "../../../../lib/admin-signer";

const CARIB_DECIMALS = 9;

function toRawCarib(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "0";

  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [wholePart = "0", fractionPart = ""] = unsigned.split(".");
  const whole = wholePart.replace(/\D/g, "") || "0";
  const fraction = fractionPart.replace(/\D/g, "").slice(0, CARIB_DECIMALS);
  const paddedFraction = fraction.padEnd(CARIB_DECIMALS, "0");
  const combined = `${whole}${paddedFraction}`.replace(/^0+(?=\d)/, "") || "0";

  return negative ? `-${combined}` : combined;
}

function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}

export async function GET(req) {
  const authError = verifyPlatformAuth(req);
  if (authError) return Response.json({ error: authError.error }, { status: authError.status });

  try {
    const stats = await getVestingStats();
    return Response.json({ ...stats, adminAddress: getAdminAddress() });
  } catch (err) {
    console.error("Failed to get vesting stats:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const authError = verifyPlatformAuth(req);
  if (authError) return Response.json({ error: authError.error }, { status: authError.status });

  try {
    const body = await req.json().catch(() => ({}));
    const beneficiary = String(body.beneficiary || "").trim();
    const amount = String(body.amount ?? "").trim();
    const [, amountFraction = ""] = amount.split(".");
    const startMs = Number(body.startMs);
    const cliffMs = Number(body.cliffMs);
    const endMs = Number(body.endMs);
    const revocable = parseBoolean(body.revocable);

    if (!beneficiary.startsWith("0x")) {
      return Response.json({ error: "beneficiary must be a valid Sui address" }, { status: 400 });
    }
    if (!/^\d+(\.\d+)?$/.test(amount) || Number(amount) <= 0) {
      return Response.json({ error: "amount must be a positive number" }, { status: 400 });
    }
    if (amountFraction.length > CARIB_DECIMALS) {
      return Response.json(
        { error: `amount supports at most ${CARIB_DECIMALS} decimal places` },
        { status: 400 },
      );
    }
    if (![startMs, cliffMs, endMs].every(Number.isFinite)) {
      return Response.json({ error: "startMs, cliffMs, and endMs are required" }, { status: 400 });
    }
    if (!(startMs <= cliffMs && cliffMs <= endMs && endMs > startMs)) {
      return Response.json(
        { error: "Time range must satisfy startMs <= cliffMs <= endMs and endMs > startMs" },
        { status: 400 },
      );
    }

    const result = await adminCreateVestingSchedule({
      beneficiary,
      amountRaw: toRawCarib(amount),
      startMs: Math.round(startMs),
      cliffMs: Math.round(cliffMs),
      endMs: Math.round(endMs),
      revocable,
    });

    const created = result.objectChanges?.find((change) =>
      change.type === "created" && change.objectType?.includes("::vesting::VestingSchedule"),
    );

    return Response.json({
      success: true,
      digest: result.digest,
      scheduleId: created?.objectId || null,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  const authError = verifyPlatformAuth(req);
  if (authError) return Response.json({ error: authError.error }, { status: authError.status });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "set_paused";

    if (action === "set_paused") {
      const paused = parseBoolean(body.paused);
      const result = await adminSetVestingPaused(paused);
      return Response.json({ success: true, digest: result.digest, paused });
    }

    if (action === "revoke_schedule") {
      const scheduleId = String(body.scheduleId || "").trim();
      if (!scheduleId.startsWith("0x")) {
        return Response.json({ error: "scheduleId must be provided" }, { status: 400 });
      }

      const result = await adminRevokeVestingSchedule(scheduleId);
      return Response.json({ success: true, digest: result.digest, scheduleId });
    }

    return Response.json(
      { error: "Unknown action. Use: set_paused or revoke_schedule" },
      { status: 400 },
    );
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
