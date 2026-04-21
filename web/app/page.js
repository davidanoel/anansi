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
                <stop offset="0%" stopColor="#DC2626" stopOpacity="0.22" />
                <stop offset="40%" stopColor="#991B1B" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#991B1B" stopOpacity="0" />
              </radialGradient>
              {/* Secondary rim glow for depth */}
              <radialGradient id="glow-rim" cx="50%" cy="50%" r="55%">
                <stop offset="60%" stopColor="#DC2626" stopOpacity="0" />
                <stop offset="85%" stopColor="#DC2626" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="thread" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.10" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="thread-bright" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
              </linearGradient>
            </defs>

            <circle cx="960" cy="540" r="480" fill="url(#glow)" />
            <circle cx="960" cy="540" r="720" fill="url(#glow-rim)" />

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
          <div className="hero-orbit-wrap animate-fade-up animate-fade-up-delay-1">
            <svg
              className="hero-orbit-svg"
              viewBox="0 0 420 420"
              fill="none"
              aria-hidden="true"
            >
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
                <circle cx="210" cy="12" r="4.5" className="hero-orbit-node hero-orbit-node-red" />
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
                <circle cx="365" cy="245" r="3.5" className="hero-orbit-node hero-orbit-node-pink" />
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
                src="/logo-dark.png"
                alt="Anansi"
                width={280}
                height={280}
                priority
                className="hero-orbit-logo relative z-10 drop-shadow-[0_0_80px_rgba(220,38,38,0.5)]"
              />
            </div>
          </div>
        </div>

        <div className="relative z-20 min-h-screen flex flex-col items-center pt-[calc(50vh+145px)] md:pt-[calc(50vh+175px)] pb-20 px-6">
          <h1 className="font-display font-extrabold text-[clamp(32px,5vw,56px)] tracking-[0.2em] uppercase text-white animate-fade-up animate-fade-up-delay-2">
            ANANSI
          </h1>

          <h2 className="max-w-[860px] text-center font-display font-medium text-[clamp(22px,3.2vw,42px)] leading-[1.15] mt-7 text-anansi-gray-200 animate-fade-up animate-fade-up-delay-2">
            We build AI and decentralized software that creates{" "}
            <span className="text-anansi-red font-semibold text-glow-red">economic access</span>.
          </h2>

          <p className="text-[11px] tracking-[0.22em] uppercase text-anansi-gray-500 mt-7 text-center animate-fade-up animate-fade-up-delay-3">
            Applied AI · Real Assets · Starting in the Caribbean, built for the world
          </p>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 animate-fade-up animate-fade-up-delay-3">
          <span className="block w-px h-10 bg-gradient-to-b from-anansi-red/40 to-transparent animate-scroll-pulse" />
        </div>
      </section>

      {/* ===== WHY NOW ===== */}
      <section className="py-24 border-t border-b border-anansi-line">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 reveal-stagger">
            <Stat number="$15.7T" label="AI contribution to global GDP by 2030 (PwC)" />
            <Stat number="$16T" label="Projected RWA tokenization market by 2030 (BCG)" />
            <Stat number="$5T" unit="+" label="Trapped value in emerging-market real assets" />
            <Stat number="0" label="Infrastructure that connects it all" />
          </div>
        </div>
      </section>

      {/* ===== SPICE ===== */}
      <section className="section-light bg-anansi-white text-anansi-black py-40" id="spice">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="reveal">
            <Eyebrow>Flagship Product</Eyebrow>
            <h2 className="font-display font-bold text-[clamp(36px,5vw,60px)] leading-[1.05]">
              Real-world assets.
              <br />
              <span className="text-anansi-red">Global liquidity.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-20 mt-16">
            <div className="reveal">
              <p className="text-[17px] text-[#555] leading-[1.75] max-w-[560px]">
                Spice tokenizes physical commodities, property, and revenue streams. A farmer
                delivers nutmeg, receives tokens on a phone, and can exit into USDC instantly. No
                wallet setup. No gas fees. Sign in with Google.
              </p>

              <div className="grid grid-cols-2 gap-5 mt-10 max-w-[520px]">
                {["Google sign-in", "No gas fees", "Live product", "Built on Sui"].map(
                  (item, i) => (
                    <div key={i} className="pt-4 border-t border-black/10">
                      <p className="text-[11px] tracking-[0.12em] uppercase text-[#777]">{item}</p>
                    </div>
                  ),
                )}
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-6">
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
      <section className="py-28 border-b border-anansi-line" id="academy">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-20 items-center reveal">
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
      <section className="py-40" id="pillars">
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

          <div className="grid md:grid-cols-3 gap-px bg-anansi-line mt-16 reveal-stagger">
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
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(220,38,38,0.22) 0%, rgba(153,27,27,0.08) 35%, transparent 70%)",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full animate-pulse-glow"
            style={{
              background: "radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 60%)",
            }}
          />
        </div>

        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-48 relative">
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

            <div className="flex items-center justify-center gap-12 mt-14">
              <div className="text-center">
                <p className="font-display font-bold text-2xl text-white">10B</p>
                <p className="text-[10px] text-anansi-gray-500 uppercase tracking-widest mt-1">
                  Fixed Supply
                </p>
              </div>
              <div className="w-px h-10 bg-anansi-line" />
              <div className="text-center">
                <p className="font-display font-bold text-2xl text-white">50%</p>
                <p className="text-[10px] text-anansi-gray-500 uppercase tracking-widest mt-1">
                  Fee Burn Rate
                </p>
              </div>
              <div className="w-px h-10 bg-anansi-line" />
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
      <section className="py-40 border-t border-anansi-line">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-20 reveal">
            <div>
              <Image
                src="/logo-dark.png"
                alt=""
                width={120}
                height={120}
                className="opacity-[0.28] mb-10"
              />
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
      <section className="py-52 text-center relative overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(220,38,38,0.12) 0%, rgba(153,27,27,0.04) 40%, transparent 70%)",
          }}
        />
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 reveal relative">
          <h2 className="font-display font-bold text-[clamp(32px,4vw,56px)] leading-[1.1] text-white">
            Built from insight.
            <br />
            Designed for <span className="text-anansi-red text-glow-red">scale.</span>
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-5 mt-14">
            <a
              href="mailto:hello@anansi.tech"
              className="inline-flex items-center gap-3 px-9 py-4
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
              className="inline-flex items-center gap-3 px-9 py-4
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
    <div className="px-4 md:px-8 border-l border-anansi-line first:border-l-0 first:pl-0">
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
    <div className="bg-anansi-deep p-12 md:p-11 hover:bg-anansi-surface transition-colors duration-300 group relative overflow-hidden">
      {/* Subtle red glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(220,38,38,0.06) 0%, transparent 50%)",
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
