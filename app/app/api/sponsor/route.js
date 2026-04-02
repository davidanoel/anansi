import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { txBytes, sender } = await request.json();
    const apiKey = process.env.SHINAMI_GAS_STATION_KEY;

    const response = await fetch("https://api.us1.shinami.com/sui/gas/v1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "gas_sponsorTransactionBlock",
        params: [txBytes, sender],
        id: 1,
      }),
    });

    const data = await response.json();
    console.log("Shinami gas response:", JSON.stringify(data).slice(0, 200));

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    return NextResponse.json(data.result);
  } catch (err) {
    console.error("Sponsor route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
