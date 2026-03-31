import { NextResponse } from 'next/server'
import { getTokenPortfolio, getFarmerDeliveries } from '../../../../lib/data'

export async function GET(request, { params }) {
  try {
    const [tokens, deliveries] = await Promise.all([
      getTokenPortfolio(params.address),
      getFarmerDeliveries(params.address),
    ])
    return NextResponse.json({ tokens, deliveries })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
