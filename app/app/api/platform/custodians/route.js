import { NextResponse } from 'next/server'
import { verifyPlatformAuth } from '../../../../lib/platform-auth'
import { issueCustodianCap, getAllCustodianCaps } from '../../../../lib/admin-signer'

// GET /api/platform/custodians — list all issued custodian caps
export async function GET(request) {
  const authError = verifyPlatformAuth(request)
  if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

  try {
    const caps = await getAllCustodianCaps()
    return NextResponse.json(caps)
  } catch (err) {
    console.error('Failed to get custodians:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/platform/custodians — issue a new custodian cap
export async function POST(request) {
  const authError = verifyPlatformAuth(request)
  if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

  try {
    const { assetTypeId, custodianAddress } = await request.json()

    if (!assetTypeId || !custodianAddress) {
      return NextResponse.json({ error: 'Missing assetTypeId or custodianAddress' }, { status: 400 })
    }

    const result = await issueCustodianCap(assetTypeId, custodianAddress)

    return NextResponse.json({
      success: true,
      digest: result.digest,
    })
  } catch (err) {
    console.error('Failed to issue custodian cap:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
