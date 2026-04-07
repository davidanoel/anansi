import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const rpcUrl = process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io/'

    let data
    let lastError
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        data = await response.json()
        if (!data.error) break
      } catch (err) {
        lastError = err
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000))
      }
    }

    if (!data && lastError) {
      return NextResponse.json({ error: lastError.message }, { status: 502 })
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
