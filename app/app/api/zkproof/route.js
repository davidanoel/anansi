import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { jwt, maxEpoch, ephemeralPublicKey, jwtRandomness, salt } = await request.json();
    const apiKey = process.env.SHINAMI_ZKLOGIN_KEY;

    const response = await fetch("https://api.us1.shinami.com/sui/zkprover/v1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "shinami_zkp_createZkLoginProof",
        params: [jwt, maxEpoch, ephemeralPublicKey, jwtRandomness, salt],
        id: 1,
      }),
    });

    const data = await response.json();
    console.log("Shinami prover status:", response.status);
    console.log("Shinami prover response:", JSON.stringify(data).slice(0, 200));

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    return NextResponse.json(data.result.zkProof);
  } catch (err) {
    console.error("ZK proof route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
