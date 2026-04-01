import { NextResponse } from 'next/server'
import { verifyPlatformAuth } from '../../../../lib/platform-auth'
import {
  getOwnedAssetTypes,
  createAssetType,
  deactivateAssetType,
  reactivateAssetType,
  getAdminStats,
} from '../../../../lib/admin-signer'

// GET /api/platform/asset-types — list all asset types
export async function GET(request) {
  const authError = verifyPlatformAuth(request)
  if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

  try {
    const assetTypes = await getOwnedAssetTypes()
    return NextResponse.json(assetTypes)
  } catch (err) {
    console.error('Failed to get asset types:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/platform/asset-types — create a new asset type
export async function POST(request) {
  const authError = verifyPlatformAuth(request)
  if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

  try {
    const body = await request.json()
    const { symbol, name, unit, region, custodianName, custodianAddress } = body

    if (!symbol || !name || !unit || !region || !custodianName || !custodianAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await createAssetType({
      symbol: symbol.toUpperCase(),
      name,
      unit,
      region,
      custodianName,
      custodianAddress,
    })

    const created = result.objectChanges?.filter(c => c.type === 'created') || []

    return NextResponse.json({
      success: true,
      digest: result.digest,
      objects: created.map(c => ({
        type: c.objectType?.split('::').pop(),
        id: c.objectId,
      })),
    })
  } catch (err) {
    console.error('Failed to create asset type:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH /api/platform/asset-types — deactivate or reactivate
export async function PATCH(request) {
  const authError = verifyPlatformAuth(request)
  if (authError) return NextResponse.json({ error: authError.error }, { status: authError.status })

  try {
    const { assetTypeId, action } = await request.json()

    if (!assetTypeId || !action) {
      return NextResponse.json({ error: 'Missing assetTypeId or action' }, { status: 400 })
    }

    let result
    if (action === 'deactivate') {
      result = await deactivateAssetType(assetTypeId)
    } else if (action === 'reactivate') {
      result = await reactivateAssetType(assetTypeId)
    } else {
      return NextResponse.json({ error: 'Invalid action. Use deactivate or reactivate.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, digest: result.digest })
  } catch (err) {
    console.error('Failed to update asset type:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
