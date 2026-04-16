import { NextResponse } from "next/server";
import { verifyPlatformAuth } from "../../../../../lib/platform-auth";
import { fetchIndexerJson } from "../../../../../lib/indexer-api";

export async function GET(request, { params }) {
  const authError = verifyPlatformAuth(request);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  try {
    const path = params.path?.join("/") || "overview";
    const search = request.nextUrl.search || "";
    const data = await fetchIndexerJson(`/api/analytics/${path}${search}`);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to proxy platform analytics request:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
