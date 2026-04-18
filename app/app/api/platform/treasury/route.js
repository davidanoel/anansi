import { verifyPlatformAuth } from "../../../../lib/platform-auth";
import {
  adminUpdateBurnRate,
  adminUpdateTreasuryReceiver,
  getTreasuryStats,
} from "../../../../lib/admin-signer";

export async function GET(req) {
  const authError = verifyPlatformAuth(req);
  if (authError) return Response.json({ error: authError.error }, { status: authError.status });

  try {
    const treasury = await getTreasuryStats();
    return Response.json(treasury);
  } catch (err) {
    console.error("Failed to get treasury stats:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  const authError = verifyPlatformAuth(req);
  if (authError) return Response.json({ error: authError.error }, { status: authError.status });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "set_receiver";

    if (action === "set_receiver") {
      const newAddress = body.treasuryAddress;
      if (!newAddress) {
        return Response.json({ error: "Missing treasuryAddress" }, { status: 400 });
      }
      const result = await adminUpdateTreasuryReceiver(newAddress);
      return Response.json({ success: true, digest: result.digest });
    }

    if (action === "set_burn_rate") {
      const burnBps = Number(body.burnBps);
      if (!Number.isFinite(burnBps) || burnBps < 0 || burnBps > 10000) {
        return Response.json({ error: "burnBps must be between 0 and 10000" }, { status: 400 });
      }
      const result = await adminUpdateBurnRate(burnBps);
      return Response.json({ success: true, digest: result.digest });
    }

    return Response.json({ error: "Unknown action. Use: set_receiver or set_burn_rate" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
