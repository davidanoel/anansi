'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-anansi-cream/95 backdrop-blur-sm border-b border-anansi-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          {/* Spider mark — replace with actual logo image */}
          <div className="w-9 h-9 rounded bg-gradient-to-b from-anansi-black to-anansi-red" />
          <span className="font-bold text-lg tracking-tight">ANANSI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm">
          <Link href="/spice" className="hover:text-anansi-red transition-colors">
            Spice
          </Link>
          <Link href="/caribcoin" className="hover:text-anansi-red transition-colors">
            CaribCoin
          </Link>
          <a
            href="https://app.spice.anansi.tech"
            className="px-4 py-2 bg-anansi-black text-white rounded-lg text-sm hover:bg-anansi-red transition-colors"
          >
            Launch App
          </a>
        </nav>

        <button
          className="md:hidden text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-anansi-border bg-anansi-cream px-6 py-4 space-y-3">
          <Link href="/spice" className="block py-2" onClick={() => setMenuOpen(false)}>
            Spice
          </Link>
          <Link href="/caribcoin" className="block py-2" onClick={() => setMenuOpen(false)}>
            CaribCoin
          </Link>
          <a
            href="https://app.spice.anansi.tech"
            className="block py-2 px-4 bg-anansi-black text-white rounded-lg text-center"
          >
            Launch App
          </a>
        </div>
      )}
    </header>
  )
}
