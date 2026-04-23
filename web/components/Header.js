"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [overLight, setOverLight] = useState(false);
  const navRef = useRef(null);
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const ctaLabel = pathname === "/spice" ? "Launch App" : "Explore Spice";

  const navLinks = [
    { label: "What We Build", href: isHomePage ? "#pillars" : "/#pillars" },
    { label: "Spice", href: "/spice" },
    { label: "Academy", href: isHomePage ? "#academy" : "/#academy" },
    { label: "CaribCoin", href: "/caribcoin" },
  ];
  const visibleNavLinks = navLinks.filter((link) => link.href !== pathname);

  useEffect(() => {
    const checkState = () => {
      setScrolled(window.scrollY > 80);

      // Check if we've scrolled past the hero section.
      const hero = document.querySelector(".hero-section");
      if (hero) {
        const heroBottom = hero.getBoundingClientRect().bottom;
        setPastHero(heroBottom < 80);
      } else {
        // No hero on this page (for example, /caribcoin), so always show the logo.
        setPastHero(true);
      }

      // Check if the nav is sitting over a light section.
      const navBottom = navRef.current?.getBoundingClientRect()?.bottom || 64;
      const lightSections = document.querySelectorAll('.section-light, [class*="bg-anansi-white"]');
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
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const light = overLight && scrolled;

  return (
    <header
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "py-3" : "py-4 md:py-6"
      } ${
        scrolled
          ? overLight
            ? "backdrop-blur-xl border-b border-black/[0.06]"
            : "backdrop-blur-xl border-b border-white/[0.06]"
          : ""
      }`}
      style={
        scrolled
          ? {
              backgroundColor: overLight ? "rgba(255,250,250,0.92)" : "rgba(12,12,14,0.88)",
              boxShadow: overLight
                ? "0 10px 40px rgba(10,10,10,0.08)"
                : "0 10px 40px rgba(0,0,0,0.28)",
            }
          : undefined
      }
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-anansi-red/60 to-transparent pointer-events-none" />
      <div className="max-w-[1200px] mx-auto px-5 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 md:gap-3.5 group">
          {/* Spider mark - hidden while the hero is visible, fades in on scroll. */}
          <div
            className="transition-all duration-500 overflow-hidden"
            style={{
              width: pastHero ? 32 : 0,
              opacity: pastHero ? 1 : 0,
            }}
          >
            <Image
              src={light ? "/brand/symbol/anansi-symbol-dark.svg" : "/brand/symbol/anansi-symbol-white.svg"}
              alt="Anansi"
              width={622}
              height={905}
              className="h-8 w-auto transition-transform group-hover:scale-105"
            />
          </div>
          <Image
            src="/brand/wordmark/anansi-wordmark-primary.svg"
            alt="Anansi"
            width={1916}
            height={821}
            className={`w-[84px] md:w-[102px] h-auto transition-all duration-300 ${
              light ? "opacity-95" : "invert opacity-95"
            }`}
          />
        </Link>

        <nav className="hidden md:flex items-center gap-9">
          {visibleNavLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-[12px] tracking-[0.1em] uppercase transition-colors duration-300 ${
                light
                  ? "text-[#0A0A0A]/65 hover:text-[#0A0A0A]"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://anansi-navy.vercel.app"
            target="_blank"
            className={`text-[12px] tracking-[0.1em] uppercase font-display font-semibold
                       px-6 py-2.5 rounded-sm transition-all duration-300 border shadow-[0_0_0_rgba(0,0,0,0)] ${
                         light
                           ? "text-[#0A0A0A] border-[#0A0A0A]/20 hover:bg-[#0A0A0A] hover:text-white hover:border-[#0A0A0A]"
                           : "text-white border-anansi-red/35 bg-anansi-red/8 hover:bg-anansi-red hover:text-white hover:border-anansi-red hover:shadow-[0_0_32px_rgba(220,38,38,0.22)]"
                       }`}
          >
            {ctaLabel}
          </a>
        </nav>

        <button
          className={`md:hidden text-xl p-1.5 transition-colors duration-300 ${
            light ? "text-[#0A0A0A]/70" : "text-white/75"
          }`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "\u2715" : "\u2630"}
        </button>
      </div>

      {menuOpen && (
        <div
          className={`md:hidden backdrop-blur-xl px-6 py-6 space-y-4 border-t ${
            light ? "bg-white/95 border-black/[0.06]" : "bg-[#060606]/95 border-white/[0.03]"
          }`}
        >
          {visibleNavLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`block text-sm uppercase tracking-widest ${
                light ? "text-[#0A0A0A]/70" : "text-white/75"
              }`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://anansi-navy.vercel.app"
            className={`block text-center text-sm uppercase tracking-widest py-3 rounded-sm border ${
              light
                ? "text-[#0A0A0A] border-[#0A0A0A]/18"
                : "text-white border-anansi-red/35 bg-anansi-red/8"
            }`}
            onClick={() => setMenuOpen(false)}
          >
            {ctaLabel}
          </a>
        </div>
      )}
    </header>
  );
}
