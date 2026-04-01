import { NextResponse } from 'next/server'
import { verifyPlatformAuth } from '../../../../lib/platform-auth'
import { getAdminStats } from '../../../../lib/admin-signer'

export async function GET(request) {
  const authError = verifyPlatformAuth(request)
  if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

  try {
    const stats = await getAdminStats()
    return NextResponse.json(stats)
  } catch (err) {
    console.error('Failed to get admin stats:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
