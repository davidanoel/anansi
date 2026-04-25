import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="hero-section min-h-[85svh] md:min-h-[87svh] relative overflow-hidden">
        {/* ===== Layer 1: V1-style web atmosphere + orbit system ===== */}
        <div className="absolute inset-0 pointer-events-none">
          <svg
            className="w-full h-full"
            viewBox="0 0 1920 1080"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <radialGradient id="heroGlow" cx="50%" cy="50%" r="42%">
                <stop offset="0%" stopColor="#C4141C" stopOpacity="0.46" />
                <stop offset="30%" stopColor="#911219" stopOpacity="0.24" />
                <stop offset="65%" stopColor="#42090E" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#1A0407" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="heroArcLeft" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#C4141C" stopOpacity="0" />
                <stop offset="50%" stopColor="#DC2626" stopOpacity="0.72" />
                <stop offset="100%" stopColor="#C4141C" stopOpacity="0.04" />
              </linearGradient>
              <linearGradient id="heroArcRight" x1="100%" y1="50%" x2="0%" y2="50%">
                <stop offset="0%" stopColor="#C4141C" stopOpacity="0" />
                <stop offset="50%" stopColor="#DC2626" stopOpacity="0.72" />
                <stop offset="100%" stopColor="#C4141C" stopOpacity="0.04" />
              </linearGradient>
              <linearGradient id="heroCopyFade" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#05070B" stopOpacity="0" />
                <stop offset="100%" stopColor="#05070B" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            <rect x="0" y="0" width="1920" height="1080" fill="#06080B" />

            <g transform="translate(0 -134)">
              <g className="hero-web-layer">
                <path
                  d="M -30 240 L 182 336 L 328 486 L 512 474 L 736 536"
                  className="hero-web-line hero-web-line-fine"
                />
                <path
                  d="M 58 118 L 182 336 L 328 486 L 468 662 L 710 742"
                  className="hero-web-line hero-web-line-soft"
                />
                <path d="M 18 566 L 328 486 L 512 474 L 710 742" className="hero-web-line" />
                <path
                  d="M -20 742 L 194 700 L 468 662 L 710 742"
                  className="hero-web-line hero-web-line-soft"
                />
                <path d="M 182 336 L 194 700" className="hero-web-line hero-web-line-fine" />
                <path d="M 328 486 L 194 700" className="hero-web-line hero-web-line-diag-soft" />
                <path d="M 328 486 L 468 662" className="hero-web-line hero-web-line-diag" />
                <path
                  d="M 512 474 L 726 396 L 876 404"
                  className="hero-web-line hero-web-line-soft"
                />
                <path d="M 736 536 L 876 404" className="hero-web-line hero-web-line-fine" />
                <path d="M 710 742 L 892 668" className="hero-web-line hero-web-line-fine" />

                <path
                  d="M 1950 238 L 1738 334 L 1592 484 L 1408 472 L 1184 534"
                  className="hero-web-line hero-web-line-fine"
                />
                <path
                  d="M 1862 116 L 1738 334 L 1592 484 L 1452 660 L 1210 740"
                  className="hero-web-line hero-web-line-soft"
                />
                <path d="M 1902 564 L 1592 484 L 1408 472 L 1210 740" className="hero-web-line" />
                <path
                  d="M 1940 740 L 1726 698 L 1452 660 L 1210 740"
                  className="hero-web-line hero-web-line-soft"
                />
                <path d="M 1738 334 L 1726 698" className="hero-web-line hero-web-line-fine" />
                <path d="M 1592 484 L 1726 698" className="hero-web-line hero-web-line-diag-soft" />
                <path d="M 1592 484 L 1452 660" className="hero-web-line hero-web-line-diag" />
                <path
                  d="M 1408 472 L 1194 394 L 1044 402"
                  className="hero-web-line hero-web-line-soft"
                />
                <path d="M 1184 534 L 1044 402" className="hero-web-line hero-web-line-fine" />
                <path d="M 1210 740 L 1028 666" className="hero-web-line hero-web-line-fine" />

                <path
                  d="M 18 566 L 194 700 L 468 662"
                  className="hero-web-line hero-web-line-diag-soft"
                />
                <path
                  d="M 1902 564 L 1726 698 L 1452 660"
                  className="hero-web-line hero-web-line-diag-soft"
                />
                <path
                  d="M 58 118 L 328 166 L 726 192 L 1038 198"
                  className="hero-web-line hero-web-line-soft"
                />
                <path
                  d="M 1862 116 L 1592 164 L 1194 190 L 882 196"
                  className="hero-web-line hero-web-line-soft"
                />

                <circle cx="58" cy="118" r="1.8" className="hero-web-node hero-web-node-soft" />
                <circle cx="182" cy="336" r="2.1" className="hero-web-node" />
                <circle cx="194" cy="700" r="1.9" className="hero-web-node hero-web-node-soft" />
                <circle cx="328" cy="486" r="2.1" className="hero-web-node" />
                <circle cx="468" cy="662" r="1.9" className="hero-web-node hero-web-node-soft" />
                <circle cx="512" cy="474" r="1.8" className="hero-web-node hero-web-node-soft" />
                <circle cx="726" cy="396" r="1.8" className="hero-web-node hero-web-node-soft" />
                <circle cx="736" cy="536" r="2.1" className="hero-web-node" />
                <circle cx="710" cy="742" r="1.8" className="hero-web-node hero-web-node-soft" />
                <circle cx="1738" cy="334" r="2.1" className="hero-web-node" />
                <circle cx="1726" cy="698" r="1.9" className="hero-web-node hero-web-node-soft" />
                <circle cx="1592" cy="484" r="2.1" className="hero-web-node" />
                <circle cx="1452" cy="660" r="1.9" className="hero-web-node hero-web-node-soft" />
                <circle cx="1408" cy="472" r="1.8" className="hero-web-node hero-web-node-soft" />
                <circle cx="1194" cy="394" r="1.8" className="hero-web-node hero-web-node-soft" />
                <circle cx="1184" cy="534" r="2.1" className="hero-web-node" />
                <circle cx="1210" cy="740" r="1.8" className="hero-web-node hero-web-node-soft" />
                <circle cx="1862" cy="116" r="1.8" className="hero-web-node hero-web-node-soft" />
              </g>

              <circle cx="960" cy="566" r="300" fill="url(#heroGlow)" className="hero-red-bloom" />
              <circle cx="960" cy="566" r="286" className="hero-orbit-outer" />

              <path
                d="M 819.2 374 A 238 238 0 0 0 819.2 758"
                stroke="url(#heroArcLeft)"
                strokeWidth="1.8"
                fill="none"
                className="hero-arc"
              />
              <circle cx="819.2" cy="374" r="3.2" className="hero-arc-endpoint" />
              <circle cx="819.2" cy="758" r="3.2" className="hero-arc-endpoint" />

              <path
                d="M 1100.8 374 A 238 238 0 0 1 1100.8 758"
                stroke="url(#heroArcRight)"
                strokeWidth="1.8"
                fill="none"
                className="hero-arc"
              />
              <circle cx="1100.8" cy="374" r="3.2" className="hero-arc-endpoint" />
              <circle cx="1100.8" cy="758" r="3.2" className="hero-arc-endpoint" />

              <rect x="0" y="580" width="1920" height="500" fill="url(#heroCopyFade)" />
            </g>
          </svg>
        </div>

        {/* ===== Layer 2: Embossed symbol ===== */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none -translate-y-[11vh] md:-translate-y-[10vh]">
          <div className="hero-symbol-position">
            <div className="hero-symbol-wrap animate-fade-up animate-fade-up-delay-1">
              <Image
                src="/brand/symbol/anansi-symbol-color1.svg"
                alt="Anansi"
                width={622}
                height={905}
                priority
                className="hero-symbol"
              />
            </div>
          </div>
        </div>

        <div className="relative z-20 min-h-[85svh] md:min-h-[87svh] flex flex-col items-center pt-[calc(36vh+8px)] sm:pt-[calc(40vh+14px)] md:pt-[calc(46vh+28px)] pb-6 md:pb-10 px-6 -translate-y-[2vh]">
          <h1 className="sr-only">ANANSI</h1>
          <div className="mt-10 md:mt-12 animate-fade-up animate-fade-up-delay-2">
            <div style={{ transform: "translateY(56px)" }}>
              <Image
                src="/brand/wordmark/anansi-wordmark-primary.svg"
                alt="ANANSI"
                width={1916}
                height={821}
                priority
                className="hero-wordmark-v1 w-[min(78vw,330px)] sm:w-[min(72vw,380px)] md:w-[min(42vw,470px)] h-auto"
              />
            </div>
          </div>

          <div className="translate-y-[6px] md:translate-y-[10px]">
            <h2 className="max-w-[920px] text-center font-display font-medium text-[clamp(24px,4.8vw,38px)] leading-[1.08] mt-4 sm:mt-5 md:mt-6 text-anansi-gray-300 animate-fade-up animate-fade-up-delay-2">
              Technology for markets the world has{" "}
              <span className="inline-block whitespace-nowrap text-anansi-red font-semibold">
                ignored.
              </span>
            </h2>

            <p className="mx-auto max-w-[420px] sm:max-w-[660px] text-[11px] sm:text-[12px] md:text-[13px] tracking-[0.1em] sm:tracking-[0.14em] uppercase text-anansi-gray-300/90 mt-5 text-center animate-fade-up animate-fade-up-delay-3">
              Applied AI · Real Assets · Real Markets
            </p>

            <div className="mt-8 mx-auto flex w-full max-w-[320px] sm:w-auto sm:max-w-none flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-fade-up animate-fade-up-delay-3">
              <a
                href="#pillars"
                className="inline-flex w-full sm:w-auto items-center justify-center px-6 py-3.5 bg-anansi-red hover:bg-anansi-red-deep text-white text-[13px] tracking-[0.1em] uppercase font-semibold transition-all duration-200 shadow-red-glow hover:shadow-red-glow-intense min-w-[180px]"
              >
                What We Build
              </a>
              <Link
                href="/spice"
                className="inline-flex w-full sm:w-auto items-center justify-center px-6 py-3.5 border border-white/20 hover:border-anansi-red/60 text-white text-[13px] tracking-[0.1em] uppercase font-semibold transition-all duration-200 min-w-[180px]"
              >
                Explore Spice
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-20 hidden sm:flex flex-col items-center gap-3 animate-fade-up animate-fade-up-delay-3 -translate-y-[10vh]">
          <span className="block w-px h-10 bg-gradient-to-b from-anansi-red/40 to-transparent animate-scroll-pulse" />
        </div>
      </section>

      {/* ===== WHY NOW ===== */}
      <section className="relative overflow-hidden py-24 md:py-28 border-t border-b border-anansi-line">
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
          <div className="grid lg:grid-cols-[minmax(0,1.15fr)_380px] gap-10 md:gap-14 items-start">
            <div className="reveal">
              <Eyebrow>Why Now</Eyebrow>
              <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] leading-[1.1] max-w-[760px] text-white">
                AI is becoming practical. Real assets are moving on-chain.
              </h2>
              <p className="text-[16px] text-anansi-gray-400 max-w-[660px] mt-6 leading-[1.75]">
                Trillions in real-world value are locked in markets that traditional software never
                reached — from smallholder farms in Grenada to mid-market SMBs in Sao Paulo. AI is
                finally cheap enough to deploy. Blockchain is finally fast enough to use. We build
                where those curves finally meet.
              </p>
            </div>

            <div className="reveal bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.015)_100%)] border border-white/[0.08] rounded-sm p-6 md:p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_24px_60px_rgba(0,0,0,0.22)]">
              <p className="text-[10px] tracking-[0.2em] uppercase text-anansi-red font-semibold mb-5">
                Converging Signals
              </p>
              <div className="space-y-5">
                <Signal
                  title="AI cost curve"
                  text="Cheap enough to deploy in production, not demos."
                />
                <Signal
                  title="On-chain rails"
                  text="Settlement and tokenization, finally fast enough to ship."
                />
                <Signal
                  title="Ignored demand"
                  text="Overlooked markets still need software built for them."
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mt-14 md:mt-16 reveal-stagger">
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

          <div className="grid md:grid-cols-2 gap-14 md:gap-20 mt-14 md:mt-16 items-start">
            <div className="reveal">
              <p className="text-[17px] text-[#555] leading-[1.75] max-w-[560px]">
                Spice tokenizes physical commodities, property, and revenue streams. A farmer in St.
                Mark, Grenada delivers nutmeg, receives tokens on a phone, and can exit into USDC
                instantly. No wallet setup. No gas fees. Sign in with Google.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {["Custodian rails", "Instant exit to USDC", "Phone-first onboarding"].map(
                  (item, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3.5 py-2 border border-black/10 rounded-sm text-[10px] tracking-[0.14em] uppercase text-[#666] bg-white"
                    >
                      {item}
                    </span>
                  ),
                )}
              </div>

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
              <div className="bg-white border border-black/10 rounded-sm shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_22px_48px_rgba(0,0,0,0.07)] overflow-hidden">
                <div className="px-6 md:px-7 py-5 border-b border-black/8 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] tracking-[0.18em] uppercase text-[#8a8a8f] mb-1.5">
                      Settlement Flow
                    </p>
                    <h3 className="font-display font-bold text-[24px] text-anansi-black">
                      How the rail works
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-anansi-red" />
                    <span className="w-2 h-2 rounded-full bg-black/15" />
                    <span className="w-2 h-2 rounded-full bg-black/15" />
                  </div>
                </div>
                <ul className="space-y-0 px-6 md:px-7 pb-2">
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
                      className="flex gap-5 items-baseline py-6 border-b border-anansi-line-light last:border-b-0 first:border-t"
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
            <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.015)_100%)] border border-white/[0.08] rounded-sm p-7 md:p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_24px_60px_rgba(0,0,0,0.22)]">
              <p className="text-[10px] tracking-[0.2em] uppercase text-anansi-red font-semibold mb-6">
                Operator Intensive
              </p>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: "Format", value: "In-person" },
                  { label: "Duration", value: "2-3 days" },
                  { label: "Audience", value: "Working professionals" },
                  { label: "Location", value: "Cohorts in Miami" },
                ].map((d, i) => (
                  <div key={i} className="pt-5 border-t border-anansi-line">
                    <p className="text-[10px] tracking-[0.15em] uppercase text-anansi-gray-500 mb-1.5">
                      {d.label}
                    </p>
                    <p className="font-display font-bold text-xl text-white">{d.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-anansi-line space-y-3">
                <Outcome text="Clear mental model for how modern AI systems actually work" />
                <Outcome text="Practical use cases for your role, team, or company" />
                <Outcome text="Hands-on frameworks you can apply immediately after the workshop" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHAT ANANSI BUILDS ===== */}
      <section className="py-28 md:py-32" id="pillars">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-10 md:gap-14 items-end reveal">
            <div>
              <Eyebrow>What Anansi Builds</Eyebrow>
              <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] leading-[1.1] max-w-[720px] text-white">
                One company.
                <br />
                Three <span className="text-anansi-red">engines.</span>
              </h2>
              <p className="text-[16px] text-anansi-gray-400 max-w-[580px] mt-6 leading-[1.75]">
                Anansi builds across applied AI, financial rails, and custom engineering — with each
                engine reinforcing the others in product, data, and distribution.
              </p>
            </div>
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
              title={<>Applied AI Research</>}
              desc="Production AI agents, LLM evaluation, and AI safety — backed by published R&D inside a global financial institution. Selective, premium, by inbound only."
              primary="Agent Portfolio"
              secondary="LLM Evaluation & Safety"
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
            <h2 className="font-display text-[clamp(28px,3.5vw,44px)] leading-[0.95] tracking-tight">
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
              <Eyebrow>Why Anansi</Eyebrow>
              <div className="inline-flex items-center justify-center w-28 h-28 md:w-32 md:h-32 rounded-full border border-white/[0.12] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,248,251,0.98)_48%,rgba(232,236,242,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.78),inset_0_-14px_22px_rgba(17,19,26,0.08),0_18px_36px_rgba(0,0,0,0.24)] mb-10">
                <Image
                  src="/brand/symbol/anansi-symbol-dark.svg"
                  alt=""
                  width={622}
                  height={905}
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
            <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,rgba(255,255,255,0.01)_100%)] border border-white/[0.06] rounded-sm p-7 md:p-8">
              <p className="text-[16px] text-anansi-gray-400 leading-[1.8]">
                The figure in our mark is both spider and human — inspired by indigenous Carib
                petroglyphs found across the islands. Technology rooted in culture. Intelligence
                from the edges, not the center.
              </p>

              <div className="mt-8 pt-6 border-t border-anansi-line space-y-4">
                <Principle
                  title="Edge-first"
                  text="Real leverage lives where legacy software didn't reach."
                />
                <Principle
                  title="Systems over slogans"
                  text="Products, rails, and workflow design matter more than narrative or hype."
                />
                <Principle
                  title="Culture as signal"
                  text="Context is not decoration. It changes what gets built and who it works for."
                />
              </div>
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
          <p className="text-[16px] text-anansi-gray-400 max-w-[560px] mx-auto mt-6 leading-[1.75]">
            We partner selectively on products, infrastructure, and systems that need both technical
            depth and real-world deployment judgment.
          </p>
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

function Signal({ title, text }) {
  return (
    <div className="pt-4 border-t border-anansi-line first:pt-0 first:border-t-0">
      <p className="text-[10px] tracking-[0.16em] uppercase text-anansi-gray-500 mb-2">{title}</p>
      <p className="text-[14px] text-anansi-gray-300 leading-[1.7]">{text}</p>
    </div>
  );
}

function Stat({ number, unit, label }) {
  return (
    <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,rgba(255,255,255,0.01)_100%)] border border-white/[0.07] rounded-sm px-5 py-6 md:px-6 md:py-7 min-h-[170px] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
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
    <div className="bg-anansi-deep border border-white/[0.06] p-9 sm:p-10 md:p-11 hover:bg-anansi-surface transition-colors duration-300 group relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-[linear-gradient(90deg,rgba(220,38,38,0.55),rgba(255,255,255,0.08),transparent)]" />
      {/* Subtle red glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(255,255,255,0.03) 0%, rgba(220,38,38,0.018) 28%, transparent 56%)",
        }}
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-4 mb-6">
          <p className="font-display font-bold text-[11px] text-anansi-red tracking-[0.15em]">
            {num}
          </p>
          <p className="text-[10px] tracking-[0.18em] uppercase text-anansi-gray-500">Engine</p>
        </div>
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

function Outcome({ text }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-anansi-red shrink-0" />
      <p className="text-[14px] text-anansi-gray-300 leading-[1.7]">{text}</p>
    </div>
  );
}

function Principle({ title, text }) {
  return (
    <div className="pt-4 border-t border-anansi-line first:pt-0 first:border-t-0">
      <p className="text-[10px] tracking-[0.16em] uppercase text-anansi-red mb-2">{title}</p>
      <p className="text-[14px] text-anansi-gray-300 leading-[1.7]">{text}</p>
    </div>
  );
}
