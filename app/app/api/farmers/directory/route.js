import { NextResponse } from "next/server";
import { fetchIndexerJson } from "../../../../lib/indexer-api";

export async function GET(request) {
  try {
    const search = request.nextUrl.search || "";
    const data = await fetchIndexerJson(`/api/farmers/directory${search}`);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const data = await fetchIndexerJson("/api/farmers/directory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
