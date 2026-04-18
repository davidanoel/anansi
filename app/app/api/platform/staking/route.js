import { verifyPlatformAuth } from "../../../../lib/platform-auth";
import {
  adminUpdateStakingCooldown,
  adminUpdateStakingThresholds,
  getStakingStats,
} from "../../../../lib/admin-signer";

const CARIB_DECIMALS = 9;

function toRawCarib(value) {
  return String(Math.round(Number(value || 0) * 10 ** CARIB_DECIMALS));
}

export async function GET(req) {
  const authError = verifyPlatformAuth(req);
  if (authError) return Response.json({ error: authError.error }, { status: authError.status });

  try {
    const staking = await getStakingStats();
    return Response.json(staking);
  } catch (err) {
    console.error("Failed to get staking stats:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  const authError = verifyPlatformAuth(req);
  if (authError) return Response.json({ error: authError.error }, { status: authError.status });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "set_cooldown";

    if (action === "set_cooldown") {
      const cooldownHours = Number(body.cooldownHours);
      if (!Number.isFinite(cooldownHours) || cooldownHours <= 0) {
        return Response.json({ error: "cooldownHours must be a positive number" }, { status: 400 });
      }

      const cooldownMs = Math.round(cooldownHours * 3_600_000);
      const result = await adminUpdateStakingCooldown(cooldownMs);
      return Response.json({ success: true, digest: result.digest });
    }

    if (action === "set_thresholds") {
      const governance = Number(body.governanceThreshold);
      const premium = Number(body.premiumThreshold);
      const feeReduction = Number(body.feeReductionThreshold);
      const priorityAccess = Number(body.priorityAccessThreshold);

      const values = [governance, premium, feeReduction, priorityAccess];
      if (values.some((v) => !Number.isFinite(v) || v < 0)) {
        return Response.json({ error: "Thresholds must be non-negative numbers" }, { status: 400 });
      }

      const result = await adminUpdateStakingThresholds({
        governanceRaw: toRawCarib(governance),
        premiumRaw: toRawCarib(premium),
        feeReductionRaw: toRawCarib(feeReduction),
        priorityAccessRaw: toRawCarib(priorityAccess),
      });
      return Response.json({ success: true, digest: result.digest });
    }

    return Response.json(
      { error: "Unknown action. Use: set_cooldown or set_thresholds" },
      { status: 400 },
    );
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
