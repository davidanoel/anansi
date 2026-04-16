import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="hero-section min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <svg
            className="w-full h-full"
            viewBox="0 0 1920 1080"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <radialGradient id="glow" cx="50%" cy="50%" r="35%">
                <stop offset="0%" stopColor="#7A0F14" stopOpacity="0.09" />
                <stop offset="100%" stopColor="#7A0F14" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="thread" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.045" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>

            <circle cx="960" cy="540" r="420" fill="url(#glow)" />
            <line x1="960" y1="540" x2="150" y2="80" stroke="url(#thread)" strokeWidth="0.5" />
            <line x1="960" y1="540" x2="1770" y2="120" stroke="url(#thread)" strokeWidth="0.5" />
            <line x1="960" y1="540" x2="80" y2="750" stroke="url(#thread)" strokeWidth="0.5" />
            <line x1="960" y1="540" x2="1840" y2="850" stroke="url(#thread)" strokeWidth="0.5" />
            <line x1="960" y1="540" x2="300" y2="30" stroke="url(#thread)" strokeWidth="0.3" />
            <line x1="960" y1="540" x2="1620" y2="1000" stroke="url(#thread)" strokeWidth="0.3" />
            <line x1="960" y1="540" x2="50" y2="400" stroke="url(#thread)" strokeWidth="0.3" />
            <line x1="960" y1="540" x2="1870" y2="500" stroke="url(#thread)" strokeWidth="0.3" />

            <circle
              cx="960"
              cy="540"
              r="210"
              fill="none"
              stroke="white"
              strokeOpacity="0.02"
              strokeWidth="0.5"
            />
            <circle
              cx="960"
              cy="540"
              r="350"
              fill="none"
              stroke="white"
              strokeOpacity="0.015"
              strokeWidth="0.5"
            />
            <circle
              cx="960"
              cy="540"
              r="500"
              fill="none"
              stroke="white"
              strokeOpacity="0.01"
              strokeWidth="0.5"
            />
          </svg>
        </div>

        <Image
          src="/logo-dark.png"
          alt="Anansi"
          width={240}
          height={240}
          priority
          className="relative animate-fade-up animate-fade-up-delay-1"
        />

        <h1 className="relative font-display font-extrabold text-[clamp(32px,5vw,56px)] tracking-[0.2em] uppercase mt-10 animate-fade-up animate-fade-up-delay-2">
          ANANSI
        </h1>

        <h2 className="relative max-w-[760px] text-center font-display font-bold text-[clamp(26px,3.9vw,50px)] leading-[1.06] mt-8 animate-fade-up animate-fade-up-delay-2">
          Technology for markets the world has <span className="text-anansi-red">ignored.</span>
        </h2>

        <p className="relative text-[11px] tracking-[0.22em] uppercase text-white/18 mt-7 animate-fade-up animate-fade-up-delay-3">
          AI-first · Real Assets · Caribbean-founded
        </p>

        <div className="absolute bottom-10 flex flex-col items-center gap-3 animate-fade-up animate-fade-up-delay-3">
          <span className="block w-px h-10 bg-gradient-to-b from-white/20 to-transparent animate-scroll-pulse" />
        </div>
      </section>

      {/* ===== WHY NOW ===== */}
      <section className="py-24 border-t border-b border-anansi-line">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="reveal mb-14">
            <Eyebrow>Why Now</Eyebrow>
            <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] leading-[1.1] max-w-[760px]">
              AI is becoming practical. Real assets are moving on-chain.
            </h2>
            <p className="text-[16px] text-anansi-gray max-w-[620px] mt-6 leading-[1.75]">
              The tools now exist to build serious technology for markets that were too fragmented,
              too analog, or too overlooked to attract meaningful product investment.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 reveal-stagger">
            <Stat number="$40B" unit="+" label="Trapped value in Caribbean real assets" />
            <Stat number="$12B" unit="+" label="Tokenized RWA on-chain globally" />
            <Stat number="83" unit="%" label="Workers who say AI will affect their jobs" />
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
                  className="font-display font-semibold text-[13px] tracking-[0.1em] uppercase text-anansi-black/55 hover:text-anansi-black transition-colors"
                >
                  How Spice Works
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
                        on Spice. Tokens appear on the farmer’s phone automatically.
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

      {/* ===== WHAT ANANSI BUILDS ===== */}
      <section className="py-40" id="pillars">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="reveal">
            <Eyebrow>What Anansi Builds</Eyebrow>
            <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] leading-[1.1] max-w-[720px]">
              One company.
              <br />
              Three <span className="text-anansi-red">engines.</span>
            </h2>
            <p className="text-[16px] text-anansi-gray max-w-[560px] mt-6 leading-[1.75]">
              Anansi builds across applied AI, financial rails, and niche software — with each area
              reinforcing the others.
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
                  Software &amp;
                  <br />
                  Trust
                </>
              }
              desc="Custom systems, identity rails, and software for institutions operating where trust and precision matter."
              primary="Custom AI Solutions"
              secondary="ZK Identity"
            />
          </div>
        </div>
      </section>

      {/* ===== ACADEMY ===== */}
      <section className="py-28 border-t border-b border-anansi-line" id="academy">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-20 items-center reveal">
            <div>
              <Eyebrow>AI Academy</Eyebrow>
              <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] leading-[1.15]">
                Learn AI.
                <br />
                Face to face.
                <br />
                In 2-3 days.
              </h2>
              <p className="text-[17px] text-anansi-gray max-w-[500px] mt-6 leading-[1.75]">
                A practical intensive for working professionals who keep hearing about AI and still
                do not have a clear framework for using it. No fluff. No passive slides. You leave
                knowing what AI is, where it fits, and how to apply it immediately.
              </p>
              <a
                href="mailto:academy@anansi.tech"
                className="inline-flex items-center gap-3 mt-9 px-9 py-4
                           font-display font-semibold text-[13px] tracking-[0.1em] uppercase
                           text-white border border-white/12 rounded-sm
                           hover:bg-white hover:text-anansi-black hover:border-white transition-all group"
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
                  <p className="text-[10px] tracking-[0.15em] uppercase text-anansi-gray mb-1.5">
                    {d.label}
                  </p>
                  <p className="font-display font-bold text-xl">{d.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CARIBCOIN ===== */}
      <section className="relative overflow-hidden" id="caribcoin">
        {/* Dramatic red glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(122,15,20,0.12) 0%, rgba(122,15,20,0.03) 40%, transparent 70%)",
            }}
          />
        </div>

        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-48 relative">
          <div className="reveal text-center">
            <p className="text-[10px] tracking-[0.4em] uppercase text-anansi-red font-medium mb-8">
              Coming Soon
            </p>
            <h2 className="font-display font-extrabold text-[clamp(48px,8vw,96px)] leading-[0.95] tracking-tight">
              CARIB
              <span className="text-anansi-red">COIN</span>
            </h2>
            <p className="text-[18px] text-white/40 mt-6 max-w-[480px] mx-auto leading-relaxed">
              The protocol token for everything Anansi builds. Fixed supply. Deflationary burns. One
              token across the ecosystem.
            </p>

            <div className="flex items-center justify-center gap-12 mt-14">
              <div className="text-center">
                <p className="font-display font-bold text-2xl">10B</p>
                <p className="text-[10px] text-white/25 uppercase tracking-widest mt-1">
                  Fixed Supply
                </p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="font-display font-bold text-2xl">50%</p>
                <p className="text-[10px] text-white/25 uppercase tracking-widest mt-1">
                  Fee Burn Rate
                </p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="font-display font-bold text-2xl">∞</p>
                <p className="text-[10px] text-white/25 uppercase tracking-widest mt-1">
                  Deflationary
                </p>
              </div>
            </div>

            <Link
              href="/caribcoin"
              className="inline-flex items-center gap-3 mt-14 px-9 py-4
                         font-display font-semibold text-[13px] tracking-[0.1em] uppercase
                         text-white border border-anansi-red/40 rounded-sm
                         hover:bg-anansi-red hover:border-anansi-red transition-all group"
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
                className="opacity-[0.22] mb-10"
              />
              <h2 className="font-display font-bold text-4xl leading-[1.2]">Why Anansi</h2>
              <p className="text-[16px] text-anansi-gray leading-[1.8] mt-6">
                Anansi — the spider from West African and Caribbean folklore. The trickster who
                outsmarts larger powers through cleverness, not force. He builds webs that connect
                what was disconnected. He turns nothing into something valuable.
              </p>
            </div>
            <div>
              <p className="text-[16px] text-anansi-gray leading-[1.8]">
                The figure in our mark is both spider and human, inspired by indigenous Carib
                petroglyphs found across the islands. Technology rooted in culture. Intelligence
                from the edges, not the center.
              </p>
              <p className="text-[16px] text-anansi-gray leading-[1.8] mt-6">
                We named the company after a figure who turns insight into leverage. That felt
                right.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-52 text-center relative">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(122,15,20,0.05) 0%, transparent 60%)",
          }}
        />
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 reveal relative">
          <h2 className="font-display font-bold text-[clamp(32px,4vw,56px)] leading-[1.1]">
            Built from insight.
            <br />
            Designed for <span className="text-anansi-red">scale.</span>
          </h2>
          <p className="text-[16px] text-anansi-gray mt-5 max-w-[680px] mx-auto leading-[1.75]">
            From AI systems to real-world asset rails, Anansi is building technology for markets the
            world has overlooked for too long.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5 mt-12">
            <a
              href="mailto:hello@anansi.tech"
              className="inline-flex items-center gap-3 px-9 py-4
                         font-display font-semibold text-[13px] tracking-[0.1em] uppercase
                         text-white border border-white/12 rounded-sm
                         hover:bg-white hover:text-anansi-black hover:border-white transition-all group"
            >
              Partner with us{" "}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>
            <Link
              href="/spice"
              className="inline-flex items-center gap-3 px-9 py-4
                         font-display font-semibold text-[13px] tracking-[0.1em] uppercase
                         text-white/65 border border-white/8 rounded-sm
                         hover:text-white hover:border-white/20 transition-all"
            >
              Explore Spice
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Eyebrow({ children }) {
  return (
    <p className="text-[10px] tracking-[0.25em] uppercase text-anansi-red font-medium mb-7">
      {children}
    </p>
  );
}

function Stat({ number, unit, label }) {
  return (
    <div className="px-4 md:px-8 border-l border-anansi-line first:border-l-0 first:pl-0">
      <p className="font-display font-bold text-[clamp(32px,3.5vw,52px)] leading-none">
        {number}
        {unit && <span className="text-[0.55em] opacity-50">{unit}</span>}
      </p>
      <p className="text-[11px] text-anansi-gray mt-3 uppercase tracking-[0.08em] leading-[1.5]">
        {label}
      </p>
    </div>
  );
}

function Capability({ num, title, desc, primary, secondary }) {
  return (
    <div className="bg-anansi-deep p-12 md:p-11 hover:bg-[#0f0f0f] transition-colors">
      <p className="font-display font-bold text-[11px] text-anansi-red tracking-[0.15em] mb-6">
        {num}
      </p>
      <h3 className="font-display font-bold text-[26px] leading-[1.2]">{title}</h3>
      <p className="text-[14px] text-anansi-gray leading-[1.7] mt-4">{desc}</p>

      <div className="mt-8 pt-6 border-t border-anansi-line space-y-3">
        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase text-anansi-gray mb-1">Flagship</p>
          <p className="text-[15px] font-medium">{primary}</p>
        </div>
        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase text-anansi-gray mb-1">Also</p>
          <p className="text-[15px] font-medium text-white/75">{secondary}</p>
        </div>
      </div>
    </div>
  );
}
