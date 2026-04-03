import { NextResponse } from "next/server";
import { verifyPlatformAuth } from "../../../../lib/platform-auth";
import { adminDepositSurplus } from "../../../../lib/admin-signer";

export async function POST(request) {
  const authError = verifyPlatformAuth(request);
  if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status });

  try {
    const { lotId, amount } = await request.json();

    if (!lotId || !amount) {
      return NextResponse.json({ error: "Missing lotId or amount" }, { status: 400 });
    }

    const result = await adminDepositSurplus(lotId, parseFloat(amount));

    return NextResponse.json({
      success: true,
      digest: result.digest,
    });
  } catch (err) {
    console.error("Deposit failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
