// Simple password auth for platform admin routes.
// In production, replace with proper auth (OAuth, 2FA, etc.)

import { NextResponse } from 'next/server'

export function verifyPlatformAuth(request) {
  const authHeader = request.headers.get('x-platform-key')
  const platformKey = process.env.PLATFORM_ADMIN_KEY

  if (!platformKey) {
    return { error: 'PLATFORM_ADMIN_KEY not configured', status: 500 }
  }

  if (!authHeader || authHeader !== platformKey) {
    return { error: 'Unauthorized', status: 401 }
  }

  return null // Auth passed
}
