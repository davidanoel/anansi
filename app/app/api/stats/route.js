import { NextResponse } from 'next/server'
import { getPlatformStats } from '../../../lib/data'

export async function GET() {
  try {
    const stats = await getPlatformStats()
    return NextResponse.json(stats)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
