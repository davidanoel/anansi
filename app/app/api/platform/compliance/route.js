import { verifyPlatformAuth } from '../../../../lib/platform-auth'
import {
  adminVerifyUser,
  adminFreezeUser,
  adminUnfreezeUser,
  adminSetEnforcement,
  getComplianceState,
  getVerifiedUsers,
} from '../../../../lib/admin-signer'

// GET — list verified users + compliance state
export async function GET(req) {
  const authError = verifyPlatformAuth(req)
  if (authError) return Response.json({ error: authError.error }, { status: authError.status })

  try {
    const [state, users] = await Promise.all([
      getComplianceState(),
      getVerifiedUsers(),
    ])
    return Response.json({ ...state, users })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// POST — verify user, freeze, unfreeze, or toggle enforcement
export async function POST(req) {
  const authError = verifyPlatformAuth(req)
  if (authError) return Response.json({ error: authError.error }, { status: authError.status })

  try {
    const body = await req.json()
    const { action } = body

    if (action === 'verify') {
      const { userAddress, jurisdiction, providerRef, role } = body
      if (!userAddress || !jurisdiction) {
        return Response.json({ error: 'Missing userAddress or jurisdiction' }, { status: 400 })
      }
      const result = await adminVerifyUser(userAddress, jurisdiction, providerRef || '', role || 0)
      return Response.json({ success: true, digest: result.digest })
    }

    if (action === 'freeze') {
      const { userAddress, reason } = body
      if (!userAddress) {
        return Response.json({ error: 'Missing userAddress' }, { status: 400 })
      }
      const result = await adminFreezeUser(userAddress, reason || 'Regulatory hold')
      return Response.json({ success: true, digest: result.digest })
    }

    if (action === 'unfreeze') {
      const { userAddress } = body
      if (!userAddress) {
        return Response.json({ error: 'Missing userAddress' }, { status: 400 })
      }
      const result = await adminUnfreezeUser(userAddress)
      return Response.json({ success: true, digest: result.digest })
    }

    if (action === 'set_enforcement') {
      const { enabled } = body
      if (typeof enabled !== 'boolean') {
        return Response.json({ error: 'Missing enabled (boolean)' }, { status: 400 })
      }
      const result = await adminSetEnforcement(enabled)
      return Response.json({ success: true, digest: result.digest })
    }

    return Response.json({ error: 'Unknown action. Use: verify, freeze, unfreeze, set_enforcement' }, { status: 400 })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
