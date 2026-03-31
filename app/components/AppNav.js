'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'

export default function AppNav() {
  const { user, signOut } = useAuth()

  if (!user) return null

  return (
    <header className="sticky top-0 z-50 bg-anansi-black text-white">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold tracking-tight">SPICE</Link>
          <nav className="hidden md:flex items-center gap-4 text-sm text-gray-400">
            <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
            <Link href="/farmer" className="hover:text-white transition-colors">Farmer</Link>
            <Link href="/buyer" className="hover:text-white transition-colors">Marketplace</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm">{user.name}</p>
            <p className="text-xs text-gray-400 font-mono">
              {user.address?.slice(0, 6)}...{user.address?.slice(-4)}
            </p>
          </div>
          {user.picture && (
            <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
          )}
          <button
            onClick={signOut}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
