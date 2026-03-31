import { NextResponse } from 'next/server'
import { getLot } from '../../../../lib/data'

export async function GET(request, { params }) {
  try {
    const lot = await getLot(params.id)
    if (!lot) return NextResponse.json({ error: 'Lot not found' }, { status: 404 })
    return NextResponse.json(lot)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
