import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { jwt } = await request.json();
    const apiKey = process.env.SHINAMI_ZKLOGIN_KEY;

    const response = await fetch("https://api.us1.shinami.com/sui/zkwallet/v1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "shinami_zkw_getOrCreateZkLoginWallet",
        params: [jwt],
        id: 1,
      }),
    });

    const data = await response.json();
    console.log("Shinami response:", JSON.stringify(data));

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    // Returns both salt and address
    return NextResponse.json({
      salt: data.result.salt,
      address: data.result.address,
    });
  } catch (err) {
    console.error("Salt route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
