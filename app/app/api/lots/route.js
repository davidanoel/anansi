import { NextResponse } from 'next/server'
import { getAllLots, getActiveLots } from '../../../lib/data'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const lots = status === 'active' ? await getActiveLots() : await getAllLots()
    return NextResponse.json(lots)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
