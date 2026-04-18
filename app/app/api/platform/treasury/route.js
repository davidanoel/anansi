import { verifyPlatformAuth } from "../../../../lib/platform-auth";
import { adminUpdateTreasuryReceiver, getTreasuryStats } from "../../../../lib/admin-signer";

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
    const newAddress = body.treasuryAddress;

    if (!newAddress) {
      return Response.json({ error: "Missing treasuryAddress" }, { status: 400 });
    }

    const result = await adminUpdateTreasuryReceiver(newAddress);
    return Response.json({ success: true, digest: result.digest });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
