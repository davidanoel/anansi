'use client'

import { useAuth } from '../components/AuthProvider'
import { startLogin } from '../lib/auth'
import AppNav from '../components/AppNav'
import Link from 'next/link'

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-anansi-red border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-anansi-gray mt-4 text-sm">Loading Spice...</p>
        </div>
      </div>
    )
  }

  // Not logged in — show login screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-b from-anansi-black to-anansi-red mx-auto" />
          <h1 className="text-2xl font-bold mt-6">Spice</h1>
          <p className="text-anansi-gray text-sm mt-2 mb-8">
            Real-world asset tokenization for the Caribbean.
            Sign in to manage deliveries, view your tokens, or explore the marketplace.
          </p>
          <button
            onClick={startLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-anansi-border rounded-lg hover:border-anansi-black transition-colors"
          >
            <GoogleIcon />
            <span className="font-medium">Sign in with Google</span>
          </button>
          <p className="text-xs text-anansi-gray mt-6">
            No wallet or crypto experience needed. Your Google account is all you need.
          </p>
        </div>
      </div>
    )
  }

  // Logged in — show role selection / dashboard
  return (
    <>
      <AppNav />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold">Welcome, {user.name?.split(' ')[0]}</h1>
        <p className="text-anansi-gray mt-1 mb-8">Choose how you want to participate today.</p>

        <div className="grid md:grid-cols-3 gap-4">
          <RoleCard
            href="/admin"
            title="GCNA Admin"
            description="Record deliveries, manage lots, trigger distributions. For GCNA receiving station staff."
            icon="📋"
          />
          <RoleCard
            href="/farmer"
            title="Farmer"
            description="View your deliveries, check token balances, withdraw funds, claim surplus."
            icon="🌿"
          />
          <RoleCard
            href="/buyer"
            title="Marketplace"
            description="Browse active lots, buy SpiceTokens, track your portfolio and yields."
            icon="🌍"
          />
        </div>

        <div className="mt-8 p-4 bg-anansi-light rounded-lg border border-anansi-border">
          <p className="text-xs text-anansi-gray">
            <span className="font-semibold text-anansi-black">Your Spice address: </span>
            <span className="font-mono">{user.address}</span>
          </p>
        </div>
      </div>
    </>
  )
}

function RoleCard({ href, title, description, icon }) {
  return (
    <Link
      href={href}
      className="block p-6 border border-anansi-border rounded-xl hover:border-anansi-red transition-all hover:shadow-sm"
    >
      <span className="text-3xl">{icon}</span>
      <h3 className="font-bold mt-3">{title}</h3>
      <p className="text-sm text-anansi-gray mt-1">{description}</p>
    </Link>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 01-1.8 2.71v2.26h2.92a8.78 8.78 0 002.68-6.62z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 009 18z" fill="#34A853"/>
      <path d="M3.96 10.71A5.41 5.41 0 013.68 9c0-.6.1-1.17.28-1.71V4.96H.96A9 9 0 000 9c0 1.45.35 2.82.96 4.04l3-2.33z" fill="#FBBC05"/>
      <path d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
