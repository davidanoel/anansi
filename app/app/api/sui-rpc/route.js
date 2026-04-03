import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const rpcUrl = process.env.SUI_RPC_URL || "https://fullnode.testnet.sui.io/";

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
