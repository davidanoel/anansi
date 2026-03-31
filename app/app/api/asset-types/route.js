import { NextResponse } from 'next/server'
import { getAssetTypes } from '../../../lib/data'

export async function GET() {
  try {
    const types = await getAssetTypes()
    return NextResponse.json(types)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
