import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="hero-section hero-grid-bg min-h-screen relative overflow-hidden">
        {/* Deep radial glow behind the logo — now bolder */}
        <div className="absolute inset-0 pointer-events-none">
          <svg
            className="w-full h-full"
            viewBox="0 0 1920 1080"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              {/* Primary glow — warm command red, significantly stronger than before */}
              <radialGradient id="glow" cx="50%" cy="50%" r="40%">
                <stop offset="0%" stopColor="#DC2626" stopOpacity="0.16" />
                <stop offset="40%" stopColor="#991B1B" stopOpacity="0.055" />
                <stop offset="100%" stopColor="#991B1B" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="heroGloss" cx="50%" cy="34%" r="28%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
                <stop offset="42%" stopColor="#ffffff" stopOpacity="0.02" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="thread" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.10" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="thread-bright" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
              </linearGradient>
            </defs>

            <circle cx="960" cy="420" r="290" fill="url(#heroGloss)" />
            <circle cx="960" cy="540" r="480" fill="url(#glow)" />

            {/* Thread lines — brighter, with two accented in red */}
            <line
              x1="960"
              y1="540"
              x2="150"
              y2="80"
              stroke="url(#thread-bright)"
              strokeWidth="0.6"
            />
            <line x1="960" y1="540" x2="1770" y2="120" stroke="url(#thread)" strokeWidth="0.6" />
            <line x1="960" y1="540" x2="80" y2="750" stroke="url(#thread)" strokeWidth="0.6" />
            <line
              x1="960"
              y1="540"
              x2="1840"
              y2="850"
              stroke="url(#thread-bright)"
              strokeWidth="0.6"
            />
            <line x1="960" y1="540" x2="300" y2="30" stroke="url(#thread)" strokeWidth="0.4" />
            <line x1="960" y1="540" x2="1620" y2="1000" stroke="url(#thread)" strokeWidth="0.4" />
            <line x1="960" y1="540" x2="50" y2="400" stroke="url(#thread)" strokeWidth="0.4" />
            <line x1="960" y1="540" x2="1870" y2="500" stroke="url(#thread)" strokeWidth="0.4" />

            {/* Concentric rings — slightly more visible than before */}
            <circle
              cx="960"
              cy="540"
              r="210"
              fill="none"
              stroke="white"
              strokeOpacity="0.04"
              strokeWidth="0.5"
            />
            <circle
              cx="960"
              cy="540"
              r="350"
              fill="none"
              stroke="white"
              strokeOpacity="0.03"
              strokeWidth="0.5"
            />
            <circle
              cx="960"
              cy="540"
              r="500"
              fill="none"
              stroke="white"
              strokeOpacity="0.02"
              strokeWidth="0.5"
            />
          </svg>
        </div>

        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="hero-orbit-position">
            <div className="hero-orbit-wrap animate-fade-up animate-fade-up-delay-1">
              <svg className="hero-orbit-svg" viewBox="0 0 420 420" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="heroOrbitRed" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f87171" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity="0.25" />
                  </linearGradient>
                  <linearGradient id="heroOrbitWhite" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
                  </linearGradient>
                </defs>

                <g className="hero-orbit-rotation-slow">
                  <circle cx="210" cy="210" r="198" className="hero-orbit-ring-faint" />
                  <path
                    d="M210 12 A198 198 0 0 1 364 86"
                    className="hero-orbit-arc hero-orbit-arc-red"
                  />
                  <path
                    d="M395 245 A198 198 0 0 1 320 365"
                    className="hero-orbit-arc hero-orbit-arc-white"
                  />
                  <circle
                    cx="210"
                    cy="12"
                    r="4.5"
                    className="hero-orbit-node hero-orbit-node-red"
                  />
                </g>

                <g className="hero-orbit-rotation-reverse">
                  <circle cx="210" cy="210" r="158" className="hero-orbit-ring-mid" />
                  <path
                    d="M60 165 A158 158 0 0 1 145 80"
                    className="hero-orbit-arc hero-orbit-arc-white"
                  />
                  <path
                    d="M278 356 A158 158 0 0 0 365 245"
                    className="hero-orbit-arc hero-orbit-arc-red"
                  />
                  <circle
                    cx="365"
                    cy="245"
                    r="3.5"
                    className="hero-orbit-node hero-orbit-node-pink"
                  />
                </g>

                <g className="hero-orbit-rotation-fast">
                  <circle cx="210" cy="210" r="118" className="hero-orbit-ring-dashed" />
                  <path
                    d="M118 135 A118 118 0 0 1 210 92"
                    className="hero-orbit-arc hero-orbit-arc-soft"
                  />
                  <path
                    d="M236 325 A118 118 0 0 1 136 308"
                    className="hero-orbit-arc hero-orbit-arc-white"
                  />
                </g>
              </svg>
              <div className="hero-orbit-core">
                <Image
                  src="/brand/symbol/anansi-symbol-primary-darksite.png"
                  alt="Anansi"
                  width={280}
                  height={280}
                  priority
                  className="hero-orbit-logo relative z-10 drop-shadow-[0_12px_28px_rgba(0,0,0,0.38)]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-20 min-h-screen flex flex-col items-center pt-[calc(50vh+84px)] sm:pt-[calc(50vh+96px)] md:pt-[calc(50vh+125px)] pb-16 md:pb-20 px-6">
          <h1 className="sr-only">ANANSI</h1>
          <div className="mt-1 md:mt-2 animate-fade-up animate-fade-up-delay-2">
            <Image
              src="/brand/wordmark/anansi-wordmark-primary.svg"
              alt="ANANSI"
              width={1916}
              height={821}
              priority
              className="w-[min(78vw,330px)] sm:w-[min(72vw,380px)] md:w-[min(42vw,470px)] h-auto invert opacity-95 drop-shadow-[0_10px_28px_rgba(0,0,0,0.32)]"
            />
          </div>

          <h2 className="max-w-[620px] text-center font-display font-medium text-[clamp(19px,5.4vw,34px)] leading-[1.16] mt-8 sm:mt-9 md:mt-10 text-anansi-gray-300 animate-fade-up animate-fade-up-delay-2">
            We build AI and decentralized software that creates{" "}
            <span className="text-anansi-red font-semibold text-glow-red">economic access</span>.
          </h2>

          <p className="max-w-[340px] sm:max-w-[560px] text-[9px] sm:text-[10px] md:text-[11px] tracking-[0.14em] sm:tracking-[0.18em] uppercase text-anansi-gray-500 mt-5 text-center animate-fade-up animate-fade-up-delay-3">
            Applied AI · Real Assets · Starting in the Caribbean, built for the world
          </p>

          <div className="mt-8 mx-auto flex w-full max-w-[320px] sm:w-auto sm:max-w-none flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-fade-up animate-fade-up-delay-3">
            <a
              href="#pillars"
              className="inline-flex w-full sm:w-auto items-center justify-center px-6 py-3.5 bg-anansi-red hover:bg-anansi-red-deep text-white text-[13px] tracking-[0.1em] uppercase font-semibold transition-all duration-200 shadow-red-glow hover:shadow-red-glow-intense min-w-[180px]"
            >
              See What We Build
            </a>
            <Link
              href="/spice"
              className="inline-flex w-full sm:w-auto items-center justify-center px-6 py-3.5 border border-white/20 hover:border-anansi-red/60 text-white text-[13px] tracking-[0.1em] uppercase font-semibold transition-all duration-200 min-w-[180px]"
            >
              Try Spice
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-20 hidden sm:flex flex-col items-center gap-3 animate-fade-up animate-fade-up-delay-3">
          <span className="block w-px h-10 bg-gradient-to-b from-anansi-red/40 to-transparent animate-scroll-pulse" />
        </div>
      </section>

      {/* ===== WHY NOW ===== */}
      <section className="relative overflow-hidden py-20 md:py-24 border-t border-b border-anansi-line">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[880px] h-[880px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0.01) 34%, transparent 72%)",
            }}
          />
          <div
            className="absolute bottom-[-36%] left-[12%] w-[420px] h-[420px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(220,38,38,0.045) 0%, rgba(153,27,27,0.012) 40%, transparent 74%)",
            }}
          />
        </div>
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 relative">
          <div className="reveal mb-14">
            <Eyebrow>Why Now</Eyebrow>
            <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] leading-[1.1] max-w-[760px] text-white">
              AI is becoming practical. Real assets are moving on-chain.
            </h2>
            <p className="text-[16px] text-anansi-gray-400 max-w-[640px] mt-6 leading-[1.75]">
              Trillions in real-world value are locked in markets that traditional software never
              reached — from smallholder farms in Grenada to mid-market SMBs in São Paulo. AI is
              finally cheap enough to deploy. Blockchain is finally fast enough to use. We build for
              the gap.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4 reveal-stagger">
            <Stat number="$15.7T" label="AI contribution to global GDP by 2030 (PwC)" />
            <Stat number="$16T" label="Projected RWA tokenization market by 2030 (BCG)" />
            <Stat number="$5T" unit="+" label="Trapped value in emerging-market real assets" />
            <Stat
              number="1.7B"
              label="Adults without access to basic financial services (World Bank)"
            />
          </div>
        </div>
      </section>

      {/* ===== SPICE ===== */}
      <section
        className="section-light bg-anansi-white text-anansi-black py-28 md:py-32"
        id="spice"
      >
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="reveal">
            <Eyebrow>Flagship Product</Eyebrow>
            <h2 className="font-display font-bold text-[clamp(36px,5vw,60px)] leading-[1.05]">
              Real-world assets.
              <br />
              <span className="text-anansi-red">Global liquidity.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-14 md:gap-20 mt-14 md:mt-16">
            <div className="reveal">
              <p className="text-[17px] text-[#555] leading-[1.75] max-w-[560px]">
                Spice tokenizes physical commodities, property, and revenue streams. A farmer
                delivers nutmeg, receives tokens on a phone, and can exit into USDC instantly. No
                wallet setup. No gas fees. Sign in with Google.
              </p>

              <div className="grid grid-cols-2 gap-4 sm:gap-5 mt-8 md:mt-10 max-w-[520px]">
                {["Google sign-in", "No gas fees", "Live product", "Built on Sui"].map(
                  (item, i) => (
                    <div key={i} className="pt-4 border-t border-black/10">
                      <p className="text-[11px] tracking-[0.12em] uppercase text-[#777]">{item}</p>
                    </div>
                  ),
                )}
              </div>

              <div className="mt-8 md:mt-10 flex flex-wrap items-center gap-6">
                <Link
                  href="/spice"
                  className="font-display font-semibold text-[13px] tracking-[0.1em] uppercase text-anansi-black/55 hover:text-anansi-red transition-colors"
                >
                  How Spice Works →
                </Link>
              </div>
            </div>

            <div className="reveal">
              <ul className="space-y-0">
                {[
                  {
                    num: "01",
                    text: (
                      <>
                        <strong className="text-anansi-black font-medium">
                          Farmer delivers commodity
                        </strong>{" "}
                        to local custodian. The existing workflow stays familiar.
                      </>
                    ),
                  },
                  {
                    num: "02",
                    text: (
                      <>
                        <strong className="text-anansi-black font-medium">
                          Custodian records delivery
                        </strong>{" "}
                        on Spice. Tokens appear on the farmer's phone automatically.
                      </>
                    ),
                  },
                  {
                    num: "03",
                    text: (
                      <>
                        <strong className="text-anansi-black font-medium">
                          Farmer holds or exits early.
                        </strong>{" "}
                        Wait for full surplus, or swap out for USDC.
                      </>
                    ),
                  },
                  {
                    num: "04",
                    text: (
                      <>
                        <strong className="text-anansi-black font-medium">
                          Lot sells globally.
                        </strong>{" "}
                        Surplus is distributed transparently to token holders.
                      </>
                    ),
                  },
                ].map((step, i) => (
                  <li
                    key={i}
                    className="flex gap-5 items-baseline py-6 border-b border-anansi-line-light first:border-t"
                  >
                    <span className="font-display font-bold text-[11px] text-anansi-red tracking-[0.1em] shrink-0">
                      {step.num}
                    </span>
                    <p className="text-[15px] text-[#555] leading-[1.6]">{step.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ACADEMY ===== */}
      <section
        className="relative overflow-hidden py-24 md:py-28 border-b border-anansi-line"
        id="academy"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-[18%] left-[10%] w-[520px] h-[520px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(220,38,38,0.05) 0%, rgba(153,27,27,0.014) 36%, transparent 74%)",
            }}
          />
          <div
            className="absolute top-[8%] right-[8%] w-[360px] h-[360px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0.008) 42%, transparent 74%)",
            }}
          />
        </div>
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 relative">
          <div className="grid md:grid-cols-2 gap-14 md:gap-20 items-center reveal">
            <div>
              <Eyebrow>Anansi Academy</Eyebrow>
              <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] leading-[1.15] text-white">
                Learn AI.
                <br />
                Face to face.
                <br />
                In 2-3 days.
              </h2>
              <p className="text-[17px] text-anansi-gray-400 max-w-[500px] mt-6 leading-[1.75]">
                A practical intensive for working professionals who keep hearing about AI and still
                do not have a clear framework for using it. No fluff. No passive slides. You leave
                knowing what AI is, where it fits, and how to apply it immediately.
              </p>
              <a
                href="mailto:academy@anansi.tech"
                className="inline-flex items-center gap-3 mt-9 px-9 py-4
                           font-display font-semibold text-[13px] tracking-[0.1em] uppercase
                           text-white bg-anansi-red rounded-sm
                           hover:bg-anansi-red-deep hover:shadow-red-glow transition-all group"
              >
                Inquire <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: "Format", value: "In-person" },
                { label: "Duration", value: "2-3 days" },
                { label: "Audience", value: "Working professionals" },
                { label: "Location", value: "Miami / Caribbean" },
              ].map((d, i) => (
                <div key={i} className="pt-5 border-t border-anansi-line">
                  <p className="text-[10px] tracking-[0.15em] uppercase text-anansi-gray-500 mb-1.5">
                    {d.label}
                  </p>
                  <p className="font-display font-bold text-xl text-white">{d.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHAT ANANSI BUILDS ===== */}
      <section className="py-28 md:py-32" id="pillars">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="reveal">
            <Eyebrow>What Anansi Builds</Eyebrow>
            <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] leading-[1.1] max-w-[720px] text-white">
              One company.
              <br />
              Three <span className="text-anansi-red">engines.</span>
            </h2>
            <p className="text-[16px] text-anansi-gray-400 max-w-[580px] mt-6 leading-[1.75]">
              Anansi builds across applied AI, financial rails, and custom engineering — with each
              area reinforcing the others.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-anansi-line mt-14 md:mt-16 reveal-stagger">
            <Capability
              num="01"
              title={
                <>
                  AI &amp;
                  <br />
                  Intelligence
                </>
              }
              desc="Applied AI products and systems for professionals, institutions, and teams that need leverage fast."
              primary="CogniCare"
              secondary="Thryve"
            />
            <Capability
              num="02"
              title={
                <>
                  Finance &amp;
                  <br />
                  Real Assets
                </>
              }
              desc="Financial rails for people and markets shut out of modern capital. From tokenized commodities to web3 savings products."
              primary="Spice"
              secondary="DollarBank"
            />
            <Capability
              num="03"
              title={
                <>
                  Custom AI &amp;
                  <br />
                  Software
                </>
              }
              desc="Senior-level engagements for enterprise clients and institutions who need AI, data, or Web3 systems built right. Selective, premium, by inbound only."
              primary="Custom AI Solutions"
              secondary="Enterprise Partnerships"
            />
          </div>
        </div>
      </section>

      {/* ===== CARIBCOIN ===== */}
      <section className="relative border-t border-anansi-line overflow-hidden" id="caribcoin">
        {/* Layered ambient glow — warmer, deeper, more confident */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[980px] h-[980px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.012) 32%, transparent 72%)",
            }}
          />
          <div
            className="absolute top-[58%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(220,38,38,0.075) 0%, rgba(153,27,27,0.02) 34%, transparent 74%)",
            }}
          />
          <div
            className="absolute top-[61%] left-[54%] -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full animate-pulse-glow"
            style={{
              background:
                "radial-gradient(circle, rgba(239,68,68,0.035) 0%, rgba(239,68,68,0.01) 38%, transparent 72%)",
            }}
          />
        </div>

        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-32 md:py-36 relative">
          <div className="reveal text-center">
            <p className="text-[10px] tracking-[0.4em] uppercase text-anansi-red font-semibold mb-8">
              Coming Soon
            </p>
            <h2 className="font-display text-[clamp(48px,8vw,96px)] leading-[0.95] tracking-tight">
              CARIB
              <span className="text-anansi-red text-glow-red">COIN</span>
            </h2>
            <p className="text-[18px] text-anansi-gray-400 mt-6 max-w-[560px] mx-auto leading-relaxed">
              The protocol token that powers every product Anansi builds. Fixed supply. Deflationary
              burns. No promises — only participation.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 mt-12 md:mt-14">
              <div className="text-center">
                <p className="font-display font-bold text-2xl text-white">10B</p>
                <p className="text-[10px] text-anansi-gray-500 uppercase tracking-widest mt-1">
                  Fixed Supply
                </p>
              </div>
              <div className="hidden sm:block w-px h-10 bg-anansi-line" />
              <div className="text-center">
                <p className="font-display font-bold text-2xl text-white">50%</p>
                <p className="text-[10px] text-anansi-gray-500 uppercase tracking-widest mt-1">
                  Fee Burn Rate
                </p>
              </div>
              <div className="hidden sm:block w-px h-10 bg-anansi-line" />
              <div className="text-center">
                <p className="font-display font-bold text-2xl text-anansi-red">∞</p>
                <p className="text-[10px] text-anansi-gray-500 uppercase tracking-widest mt-1">
                  Deflationary
                </p>
              </div>
            </div>

            <Link
              href="/caribcoin"
              className="inline-flex items-center gap-3 mt-14 px-9 py-4
                         font-display font-semibold text-[13px] tracking-[0.1em] uppercase
                         text-white bg-anansi-red rounded-sm
                         hover:bg-anansi-red-deep hover:shadow-red-glow-intense
                         transition-all duration-300 group"
            >
              Read the Charter{" "}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== WHY ANANSI ===== */}
      <section className="relative overflow-hidden py-28 md:py-32 border-t border-anansi-line">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-[10%] right-[-8%] w-[420px] h-[420px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.024) 0%, rgba(255,255,255,0.008) 38%, transparent 72%)",
            }}
          />
          <div className="absolute top-12 right-10 hidden lg:block opacity-[0.07]">
            <Image
              src="/brand/wordmark/anansi-wordmark-dotted.svg"
              alt=""
              width={1916}
              height={821}
              className="w-[300px] h-auto invert"
            />
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 relative">
          <div className="grid md:grid-cols-2 gap-14 md:gap-20 reveal">
            <div>
              <div className="inline-flex items-center justify-center w-28 h-28 md:w-32 md:h-32 rounded-full border border-white/[0.12] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,248,251,0.98)_48%,rgba(232,236,242,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.78),inset_0_-14px_22px_rgba(17,19,26,0.08),0_18px_36px_rgba(0,0,0,0.24)] mb-10">
                <Image
                  src="/brand/symbol/anansi-symbol-primary-transparent.png"
                  alt=""
                  width={610}
                  height={872}
                  className="w-[66px] md:w-[80px] h-auto opacity-[0.98] drop-shadow-[0_8px_18px_rgba(0,0,0,0.12)]"
                />
              </div>
              <h2 className="font-display font-bold text-4xl leading-[1.2] text-white">
                Why Anansi
              </h2>
              <p className="text-[16px] text-anansi-gray-400 leading-[1.8] mt-6">
                Anansi — the spider from West African and Caribbean folklore. The trickster who
                outsmarts larger powers through cleverness, not force. He builds webs that connect
                what was disconnected. He turns nothing into something valuable.
              </p>
            </div>
            <div>
              <p className="text-[16px] text-anansi-gray-400 leading-[1.8]">
                The figure in our mark is both spider and human — inspired by indigenous Carib
                petroglyphs found across the islands. Technology rooted in culture. Intelligence
                from the edges, not the center.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-36 md:py-40 text-center relative overflow-hidden">
        <div
          className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[860px] h-[860px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.012) 34%, transparent 72%)",
          }}
        />
        <div
          className="absolute top-[58%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(220,38,38,0.035) 0%, rgba(153,27,27,0.01) 36%, transparent 74%)",
          }}
        />
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 reveal relative">
          <h2 className="font-display font-bold text-[clamp(32px,4vw,56px)] leading-[1.1] text-white">
            Built from insight.
            <br />
            Designed for <span className="text-anansi-red text-glow-red">scale.</span>
          </h2>
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-5 mt-12 md:mt-14">
            <a
              href="mailto:hello@anansi.tech"
              className="inline-flex w-full max-w-[320px] sm:w-auto items-center justify-center gap-3 px-9 py-4
                         font-display font-semibold text-[13px] tracking-[0.1em] uppercase
                         text-white bg-anansi-red rounded-sm
                         hover:bg-anansi-red-deep hover:shadow-red-glow
                         transition-all duration-300 group"
            >
              Partner with us{" "}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>
            <Link
              href="/spice"
              className="inline-flex w-full max-w-[320px] sm:w-auto items-center justify-center gap-3 px-9 py-4
                         font-display font-semibold text-[13px] tracking-[0.1em] uppercase
                         text-anansi-gray-300 border border-anansi-line rounded-sm
                         hover:text-white hover:border-anansi-gray-500 transition-all"
            >
              Explore Spice
            </Link>
          </div>
          <p className="text-[11px] tracking-[0.2em] uppercase text-anansi-gray-500 mt-10">
            Miami, FL
          </p>
        </div>
      </section>
    </>
  );
}

/* ===== Eyebrow: now with a red accent bar for command presence ===== */
function Eyebrow({ children }) {
  return (
    <div className="flex items-center gap-3 mb-7">
      <span className="block w-8 h-px bg-anansi-red" />
      <p className="text-[10px] tracking-[0.25em] uppercase text-anansi-red font-semibold">
        {children}
      </p>
    </div>
  );
}

function Stat({ number, unit, label }) {
  return (
    <div className="pt-5 border-t border-anansi-line first:border-t-0 md:pt-0 md:px-8 md:border-t-0 md:border-l md:first:border-l-0 md:first:pl-0">
      <p className="font-display font-bold text-[clamp(32px,3.5vw,52px)] leading-none text-white">
        {number}
        {unit && <span className="text-[0.55em] text-anansi-red">{unit}</span>}
      </p>
      <p className="text-[11px] text-anansi-gray-500 mt-3 uppercase tracking-[0.08em] leading-[1.5]">
        {label}
      </p>
    </div>
  );
}

function Capability({ num, title, desc, primary, secondary }) {
  return (
    <div className="bg-anansi-deep p-9 sm:p-10 md:p-11 hover:bg-anansi-surface transition-colors duration-300 group relative overflow-hidden">
      {/* Subtle red glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(255,255,255,0.03) 0%, rgba(220,38,38,0.018) 28%, transparent 56%)",
        }}
      />
      <div className="relative">
        <p className="font-display font-bold text-[11px] text-anansi-red tracking-[0.15em] mb-6">
          {num}
        </p>
        <h3 className="font-display font-bold text-[26px] leading-[1.2] text-white">{title}</h3>
        <p className="text-[14px] text-anansi-gray-400 leading-[1.7] mt-4">{desc}</p>

        <div className="mt-8 pt-6 border-t border-anansi-line space-y-3">
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-anansi-gray-500 mb-1">
              Flagship
            </p>
            <p className="text-[15px] font-medium text-white">{primary}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-anansi-gray-500 mb-1">
              Also
            </p>
            <p className="text-[15px] font-medium text-anansi-gray-300">{secondary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
