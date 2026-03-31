import { NextResponse } from 'next/server'
import { getLotDeliveries } from '../../../../../lib/data'

export async function GET(request, { params }) {
  try {
    const deliveries = await getLotDeliveries(params.id)
    return NextResponse.json(deliveries)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
