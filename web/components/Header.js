"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [overLight, setOverLight] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const checkState = () => {
      setScrolled(window.scrollY > 80);

      // Check if we've scrolled past the hero section
      const hero = document.querySelector(".hero-section");
      if (hero) {
        const heroBottom = hero.getBoundingClientRect().bottom;
        setPastHero(heroBottom < 80);
      } else {
        // No hero on this page (e.g., /spice, /caribcoin) — always show logo
        setPastHero(true);
      }

      // Check if nav is over a light section
      const navBottom = navRef.current?.getBoundingClientRect()?.bottom || 64;
      const lightSections = document.querySelectorAll(
        '.section-light, [class*="bg-anansi-white"]',
      );
      let isOverLight = false;
      for (const section of lightSections) {
        const rect = section.getBoundingClientRect();
        if (rect.top < navBottom && rect.bottom > 0) {
          isOverLight = true;
          break;
        }
      }
      setOverLight(isOverLight);
    };

    window.addEventListener("scroll", checkState, { passive: true });
    checkState();
    return () => window.removeEventListener("scroll", checkState);
  }, []);

  const light = overLight && scrolled;

  return (
    <header
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "py-3" : "py-6"
      } ${
        scrolled
          ? overLight
            ? "backdrop-blur-xl border-b border-black/[0.06]"
            : "backdrop-blur-xl border-b border-white/[0.06]"
          : ""
      }`}
      style={
        scrolled
          ? { backgroundColor: overLight ? "rgba(255,255,255,0.92)" : "rgba(20,20,20,0.95)" }
          : undefined
      }
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3.5 group">
          {/* Spider mark — hidden while hero is visible, fades in on scroll */}
          <div
            className="transition-all duration-500 overflow-hidden"
            style={{
              width: pastHero ? 32 : 0,
              opacity: pastHero ? 1 : 0,
            }}
          >
            <Image
              src={light ? "/logo-mark.png" : "/logo-dark.png"}
              alt="Anansi"
              width={32}
              height={32}
              className="transition-transform group-hover:scale-105"
            />
          </div>
          <span
            className={`font-display font-bold text-[15px] tracking-[0.12em] transition-colors duration-300 ${
              light ? "text-[#0A0A0A]" : "text-white"
            }`}
          >
            ANANSI
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-9">
          {[
            { label: "Products", href: "#pillars" },
            { label: "Spice", href: "#spice" },
            { label: "CaribCoin", href: "#caribcoin" },
            { label: "Academy", href: "#academy" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-[12px] tracking-[0.1em] uppercase transition-colors duration-300 ${
                light
                  ? "text-[#0A0A0A]/40 hover:text-[#0A0A0A]"
                  : "text-white/35 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://anansi-navy.vercel.app"
            className={`text-[12px] tracking-[0.1em] uppercase font-display font-semibold
                       px-6 py-2.5 rounded-sm transition-all duration-300 border ${
                         light
                           ? "text-[#0A0A0A] border-[#0A0A0A]/15 hover:bg-[#0A0A0A] hover:text-white hover:border-[#0A0A0A]"
                           : "text-white border-white/12 hover:bg-white hover:text-[#0A0A0A] hover:border-white"
                       }`}
          >
            Launch App
          </a>
        </nav>

        <button
          className={`md:hidden text-xl p-2 transition-colors duration-300 ${
            light ? "text-[#0A0A0A]/60" : "text-white/60"
          }`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <div
          className={`md:hidden backdrop-blur-xl px-6 py-6 space-y-4 border-t ${
            light
              ? "bg-white/95 border-black/[0.06]"
              : "bg-[#060606]/95 border-white/[0.03]"
          }`}
        >
          {[
            { label: "Products", href: "#pillars" },
            { label: "Spice", href: "#spice" },
            { label: "CaribCoin", href: "#caribcoin" },
            { label: "Academy", href: "#academy" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`block text-sm uppercase tracking-widest ${
                light ? "text-[#0A0A0A]/50" : "text-white/50"
              }`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://anansi-navy.vercel.app"
            className={`block text-center text-sm uppercase tracking-widest py-3 rounded-sm border ${
              light ? "text-[#0A0A0A] border-[#0A0A0A]/15" : "text-white border-white/12"
            }`}
            onClick={() => setMenuOpen(false)}
          >
            Launch App
          </a>
        </div>
      )}
    </header>
  );
}
