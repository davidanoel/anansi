"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function AppNav() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const links = [
    { href: "/admin", label: "Admin" },
    { href: "/farmer", label: "Farmer" },
    { href: "/buyer", label: "Marketplace" },
    { href: "/stake", label: "Stake" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-anansi-black/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-anansi-red to-anansi-accent" />
            <span className="font-display text-white text-lg tracking-tight">Spice</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  pathname === link.href
                    ? "text-white bg-white/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-white leading-none">{user.name}</p>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                {user.address?.slice(0, 6)}···{user.address?.slice(-4)}
              </p>
            </div>
            {user.picture && (
              <img
                src={user.picture}
                alt=""
                className="w-7 h-7 rounded-full ring-1 ring-white/10"
              />
            )}
          </div>
          <div className="w-px h-5 bg-white/10 hidden sm:block" />
          <button
            onClick={signOut}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden flex items-center gap-1 px-6 pb-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex-1 text-center py-1.5 rounded-md text-xs font-medium transition-colors ${
              pathname === link.href ? "text-white bg-white/10" : "text-gray-500 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
