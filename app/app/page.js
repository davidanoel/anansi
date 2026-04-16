"use client";

import { useAuth } from "../components/AuthProvider";
import { startLogin } from "../lib/auth";
import AppNav from "../components/AppNav";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Image
            src="/logo-mark.png"
            alt="Anansi"
            width={48}
            height={48}
            className="mx-auto"
            priority
          />
          <div className="w-5 h-5 border-2 border-anansi-red border-t-transparent rounded-full animate-spin mx-auto mt-6" />
        </div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <>
      <AppNav />
      <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in">
        <div className="mb-10">
          <p className="section-title">Dashboard</p>
          <h1 className="text-display-sm font-display">Welcome back, {user.name?.split(" ")[0]}</h1>
          <p className="text-anansi-gray mt-2">Choose how you want to participate today.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <RoleCard
            href="/admin"
            title="GCNA Admin"
            subtitle="Custodian"
            description="Record deliveries, manage lots, and trigger distributions."
            gradient="from-amber-500/10 to-orange-500/5"
            delay="stagger-1"
          />
          <RoleCard
            href="/farmer"
            title="Farmer"
            subtitle="Token holder"
            description="View deliveries, check balances, sell early, or claim surplus."
            gradient="from-emerald-500/10 to-green-500/5"
            delay="stagger-2"
          />
          <RoleCard
            href="/buyer"
            title="Marketplace"
            subtitle="Investor"
            description="Buy NUTMEG tokens, track your portfolio, and earn yield."
            gradient="from-blue-500/10 to-indigo-500/5"
            delay="stagger-3"
          />
        </div>
      </div>
    </>
  );
}

function LoginScreen() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Subtle radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(122,15,20,0.04) 0%, transparent 65%)",
        }}
      />

      <div className="flex-1 flex items-center justify-center px-6 relative">
        <div className="max-w-md w-full text-center animate-fade-in">
          <Image
            src="/logo-mark.png"
            alt="Anansi"
            width={72}
            height={72}
            className="mx-auto"
            priority
          />

          <h1 className="font-display font-bold text-4xl mt-8 tracking-tight">Spice</h1>
          <p className="text-sm tracking-[0.2em] uppercase text-anansi-red font-medium mt-3">
            Real-World Assets · Tokenized
          </p>

          <p className="text-[15px] text-anansi-gray mt-8 mb-10 max-w-sm mx-auto leading-relaxed">
            Tokenize commodities, property, and revenue streams. Sign in with Google — no wallet or
            crypto experience needed.
          </p>

          <button
            onClick={startLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border border-anansi-border rounded-xl hover:border-anansi-black hover:shadow-card-hover transition-all duration-200 group"
          >
            <GoogleIcon />
            <span className="font-medium text-sm">Sign in with Google</span>
            <svg
              className="w-4 h-4 text-anansi-muted group-hover:translate-x-0.5 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <p className="text-xs text-anansi-muted mt-5">
            New to Spice?{" "}
            <a
              href="https://anansi.tech/spice"
              target="_blank"
              rel="noopener noreferrer"
              className="text-anansi-black hover:text-anansi-red transition-colors underline underline-offset-4"
            >
              Learn how it works →
            </a>
          </p>
        </div>
      </div>

      <footer className="pb-8 text-center relative">
        <p className="text-[11px] tracking-[0.1em] uppercase text-anansi-muted">
          By Anansi Technology Corporation · Miami, FL
        </p>
      </footer>
    </div>
  );
}

function RoleCard({ href, title, subtitle, description, gradient, delay }) {
  return (
    <Link href={href} className={`card-hover block p-6 group animate-slide-up ${delay}`}>
      <div
        className={`w-full h-24 rounded-lg bg-gradient-to-br ${gradient} mb-4 flex items-end p-3`}
      >
        <span className="text-xs font-medium text-anansi-muted uppercase tracking-wider">
          {subtitle}
        </span>
      </div>
      <h3 className="font-semibold text-lg group-hover:text-anansi-red transition-colors">
        {title}
      </h3>
      <p className="text-sm text-anansi-gray mt-1 leading-relaxed">{description}</p>
      <div className="mt-4 flex items-center gap-1 text-xs text-anansi-muted group-hover:text-anansi-red transition-colors">
        <span>Open</span>
        <svg
          className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 01-1.8 2.71v2.26h2.92a8.78 8.78 0 002.68-6.62z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.96 10.71A5.41 5.41 0 013.68 9c0-.6.1-1.17.28-1.71V4.96H.96A9 9 0 000 9c0 1.45.35 2.82.96 4.04l3-2.33z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
