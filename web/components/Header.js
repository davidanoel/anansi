"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
        scrolled ? "py-3 bg-anansi-deep/92 backdrop-blur-xl border-b border-white/[0.03]" : "py-6"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3.5 group">
          <Image
            src="/logo-dark.png"
            alt="Anansi"
            width={32}
            height={32}
            className="transition-transform group-hover:scale-105"
          />
          <span className="font-display font-bold text-[15px] tracking-[0.12em] text-white">
            ANANSI
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-9">
          <Link
            href="#pillars"
            className="text-white/35 text-[12px] tracking-[0.1em] uppercase hover:text-white transition-colors"
          >
            Products
          </Link>
          <Link
            href="#spice"
            className="text-white/35 text-[12px] tracking-[0.1em] uppercase hover:text-white transition-colors"
          >
            Spice
          </Link>
          <Link
            href="#academy"
            className="text-white/35 text-[12px] tracking-[0.1em] uppercase hover:text-white transition-colors"
          >
            Academy
          </Link>
          <a
            href="https://anansi-navy.vercel.app"
            className="text-white text-[12px] tracking-[0.1em] uppercase font-display font-semibold
                       px-6 py-2.5 border border-white/12 rounded-sm
                       hover:bg-white hover:text-anansi-black hover:border-white transition-all"
          >
            Launch App
          </a>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-white/60 text-xl p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-anansi-deep/95 backdrop-blur-xl border-t border-white/[0.03] px-6 py-6 space-y-4">
          <Link
            href="#pillars"
            className="block text-white/50 text-sm uppercase tracking-widest hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            Products
          </Link>
          <Link
            href="#spice"
            className="block text-white/50 text-sm uppercase tracking-widest hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            Spice
          </Link>
          <Link
            href="#academy"
            className="block text-white/50 text-sm uppercase tracking-widest hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            Academy
          </Link>
          <a
            href="https://anansi-navy.vercel.app"
            className="block text-center text-white text-sm uppercase tracking-widest
                       py-3 border border-white/12 rounded-sm hover:bg-white hover:text-anansi-black transition-all"
            onClick={() => setMenuOpen(false)}
          >
            Launch App
          </a>
        </div>
      )}
    </header>
  );
}
