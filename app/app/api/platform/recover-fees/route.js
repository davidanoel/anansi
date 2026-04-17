// Cron-safe fee recovery endpoint.
// Call this periodically (hourly/daily) to ensure no fee USDC or CARIB
// gets permanently stuck in the admin wallet due to transient failures.
//
// SECURITY: Protected by CRON_SECRET header. Set CRON_SECRET in env.
//   curl -H "Authorization: Bearer $CRON_SECRET" https://your.domain/api/admin/recover-fees
//
// Deploy options:
//   - Vercel Cron: add to vercel.json
//   - GitHub Actions: scheduled workflow calling this URL
//   - External cron service: cron-job.org, EasyCron, etc.

import { adminRecoverStuckFees } from "../../../../lib/admin-signer";

export async function POST(req) {
  // Auth check
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await adminRecoverStuckFees({ sourceTag: "cron_recovery" });

    // Log to your monitoring service
    console.log("[cron] Fee recovery results:", JSON.stringify(results));

    return Response.json({
      ok: true,
      ranAt: new Date().toISOString(),
      results,
    });
  } catch (err) {
    console.error("[cron] Fee recovery failed:", err);
    return Response.json(
      {
        ok: false,
        error: err.message,
        ranAt: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// GET handler for manual triggering via browser (dev only)
export async function GET(req) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Use POST in production" }, { status: 405 });
  }
  return POST(req);
}
