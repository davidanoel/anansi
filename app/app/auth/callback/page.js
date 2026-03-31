'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { handleCallback } from '../../lib/auth'
import { useAuth } from '../../components/AuthProvider'

export default function AuthCallback() {
  const router = useRouter()
  const { setSession } = useAuth()
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('Processing login...')

  useEffect(() => {
    async function processCallback() {
      try {
        setStatus('Verifying your identity...')
        const session = await handleCallback()
        setStatus('Creating your Spice account...')
        setSession(session)

        // Small delay so user sees success state
        await new Promise(r => setTimeout(r, 500))
        router.push('/')
      } catch (err) {
        console.error('Auth callback failed:', err)
        setError(err.message)
      }
    }

    processCallback()
  }, [router, setSession])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <p className="text-anansi-red text-lg font-semibold mb-2">Login failed</p>
          <p className="text-anansi-gray text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-anansi-black text-white rounded-lg text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-anansi-red border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-anansi-gray mt-4 text-sm">{status}</p>
      </div>
    </div>
  )
}
