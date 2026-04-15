import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="h-screen flex flex-col items-center justify-center relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(122,15,20,0.05)_0%,transparent_70%)] pointer-events-none" />

        <Image
          src="/logo-dark.png"
          alt="Anansi"
          width={200}
          height={200}
          priority
          className="animate-fade-up animate-fade-up-delay-1"
        />
        <h1 className="font-display font-extrabold text-[clamp(28px,4vw,48px)] tracking-[0.18em] uppercase mt-9 animate-fade-up animate-fade-up-delay-2">
          ANANSI
        </h1>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 flex flex-col items-center gap-3 animate-fade-up animate-fade-up-delay-3">
          <span className="block w-px h-10 bg-gradient-to-b from-white/20 to-transparent animate-scroll-pulse" />
        </div>
      </section>

      {/* ===== MISSION ===== */}
      <section className="min-h-screen flex items-center py-40" id="mission">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="reveal">
            <Eyebrow>The Mission</Eyebrow>
            <h2 className="font-display font-bold text-[clamp(32px,4.5vw,58px)] leading-[1.1] max-w-[940px]">
              We build software for systems that{" "}
              <span className="text-anansi-red">don't exist yet.</span>
            </h2>
            <p className="text-[17px] text-anansi-gray max-w-[520px] mt-12 leading-[1.75]">
              Anansi is an AI and software company. We find markets where value is trapped,
              invisible, or inaccessible — and we build the technology to unlock it. Finance.
              Intelligence. Identity.
            </p>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-20 border-t border-b border-anansi-line">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 reveal-stagger">
            <Stat number="$40B" unit="+" label="Trapped value in Caribbean real assets" />
            <Stat number="$12B" unit="+" label="Tokenized RWA on-chain globally" />
            <Stat number="83" unit="%" label="Workers who say AI will affect their jobs" />
            <Stat number="0" label="Infrastructure that connects it all" />
          </div>
        </div>
      </section>

      {/* ===== THREE PILLARS ===== */}
      <section className="py-40" id="pillars">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="reveal">
            <Eyebrow>What We Build</Eyebrow>
            <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] leading-[1.1] max-w-[600px]">
              Three pillars.
              <br />
              One company.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-anansi-line mt-16 reveal-stagger">
            <Pillar
              num="01"
              title={
                <>
                  Finance &amp;
                  <br />
                  Real Assets
                </>
              }
              desc="Technology that makes real-world value liquid, transparent, and globally accessible. From tokenized commodities to dollar savings."
              products={[
                { name: "Spice", status: "Live", live: true },
                { name: "DollarBank", status: "Building" },
                { name: "CaribCoin", status: "Building" },
                { name: "CaribStone", status: "Planned" },
              ]}
            />
            <Pillar
              num="02"
              title={
                <>
                  AI &amp;
                  <br />
                  Intelligence
                </>
              }
              desc="Building AI for companies that need it. Teaching professionals who want to understand it. Custom solutions and education."
              products={[
                { name: "AI Academy", status: "Enrolling", live: true },
                { name: "Custom AI Solutions", status: "Active" },
                { name: "IslandPulse", status: "Planned" },
              ]}
            />
            <Pillar
              num="03"
              title={
                <>
                  Identity &amp;
                  <br />
                  Wellbeing
                </>
              }
              desc="Software for the parts of life that matter most. Privacy, mental health, personal sovereignty. Built with zero-knowledge proofs."
              products={[
                { name: "CogniCare", status: "Building" },
                { name: "Thryve", status: "Building" },
                { name: "ZK Identity", status: "Research" },
              ]}
            />
          </div>
        </div>
      </section>

      {/* ===== SPICE FEATURE ===== */}
      <section className="section-light bg-anansi-white text-anansi-black py-40" id="spice">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="reveal">
            <Eyebrow>Featured — Live</Eyebrow>
            <h2 className="font-display font-bold text-[clamp(36px,5vw,60px)] leading-[1.05]">
              Real-world assets.
              <br />
              Global liquidity.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-20 mt-16">
            <div className="reveal">
              <p className="text-[17px] text-[#555] leading-[1.75] max-w-[540px]">
                Spice tokenizes physical commodities, property, and revenue streams. A farmer
                delivers nutmeg, receives tokens on his phone, and can sell for USDC instantly. No
                wallet. No gas fees. Sign in with Google. That's it.
              </p>
              <a
                href="https://anansi-navy.vercel.app"
                className="inline-flex items-center gap-3 mt-10 px-9 py-4
                           font-display font-semibold text-[13px] tracking-[0.1em] uppercase
                           text-anansi-black border border-black/15 rounded-sm
                           hover:bg-anansi-black hover:text-white hover:border-anansi-black transition-all group"
              >
                Launch Spice{" "}
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
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
                        to local custodian. Gets advance as usual. Nothing changes.
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
                        on Spice. Farmer receives tokens on his phone automatically.
                      </>
                    ),
                  },
                  {
                    num: "03",
                    text: (
                      <>
                        <strong className="text-anansi-black font-medium">
                          Farmer holds or sells early.
                        </strong>{" "}
                        Wait for full surplus, or swap for USDC instantly on the DEX.
                      </>
                    ),
                  },
                  {
                    num: "04",
                    text: (
                      <>
                        <strong className="text-anansi-black font-medium">
                          Lot sells overseas.
                        </strong>{" "}
                        Surplus distributed to all token holders. Transparent. Automatic.
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
      <section className="py-28 border-t border-b border-anansi-line" id="academy">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-20 items-center reveal">
            <div>
              <Eyebrow>AI Academy</Eyebrow>
              <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] leading-[1.15]">
                Learn AI.
                <br />
                From people who
                <br />
                build with it.
              </h2>
              <p className="text-[17px] text-anansi-gray max-w-[440px] mt-6 leading-[1.75]">
                An intensive 2–3 day course for working professionals. Not slides. Not theory.
                Hands-on, face-to-face training from engineers who deploy AI systems in production.
                You leave knowing how to use it — not just what it is.
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
                { label: "Duration", value: "2–3 days" },
                { label: "Investment", value: "$500 – $2,500" },
                { label: "Audience", value: "Professionals" },
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

      {/* ===== ORIGIN ===== */}
      <section className="py-40">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-20 reveal">
            <div>
              <Image
                src="/logo-dark.png"
                alt=""
                width={100}
                height={100}
                className="opacity-[0.12] mb-9"
              />
              <h2 className="font-display font-bold text-4xl leading-[1.2]">Why Anansi</h2>
              <p className="text-[16px] text-anansi-gray leading-[1.8] mt-6">
                Anansi — the spider from West African and Caribbean folklore. The trickster who
                outsmarts bigger powers through cleverness, not force. He builds webs that connect
                what was disconnected. He turns nothing into something valuable.
              </p>
            </div>
            <div>
              <p className="text-[16px] text-anansi-gray leading-[1.8]">
                The figure in our logo is both spider and human — arms raised, inspired by
                indigenous Carib petroglyphs found across the islands. Technology rooted in culture.
                Intelligence that comes from the edges, not the center.
              </p>
              <p className="text-[16px] text-anansi-gray leading-[1.8] mt-6">
                We named the company after a character who builds networks no one thought possible.
                That felt right.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FINAL ===== */}
      <section className="py-52 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(122,15,20,0.04)_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 reveal relative">
          <h2 className="font-display font-bold text-[clamp(32px,4vw,56px)] leading-[1.1]">
            AI and software
            <br />
            for the real world.
          </h2>
          <p className="text-[16px] text-anansi-gray mt-5">Miami, FL</p>
          <a
            href="mailto:hello@anansi.tech"
            className="inline-flex items-center gap-3 mt-12 px-9 py-4
                       font-display font-semibold text-[13px] tracking-[0.1em] uppercase
                       text-white border border-white/12 rounded-sm
                       hover:bg-white hover:text-anansi-black hover:border-white transition-all group"
          >
            Get in touch <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
        </div>
      </section>
    </>
  );
}

// ============================================================
// Components
// ============================================================

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

function Pillar({ num, title, desc, products }) {
  return (
    <div className="bg-anansi-deep p-12 md:p-11 hover:bg-[#0f0f0f] transition-colors">
      <p className="font-display font-bold text-[11px] text-anansi-red tracking-[0.15em] mb-6">
        {num}
      </p>
      <h3 className="font-display font-bold text-[26px] leading-[1.2]">{title}</h3>
      <p className="text-[14px] text-anansi-gray leading-[1.7] mt-4">{desc}</p>
      <div className="mt-8 pt-6 border-t border-anansi-line space-y-0">
        {products.map((p, i) => (
          <div key={i} className="flex items-baseline justify-between py-2.5">
            <span className="text-[14px] font-medium">{p.name}</span>
            <span
              className={`text-[9px] tracking-[0.15em] uppercase ${p.live ? "text-anansi-red font-medium" : "text-anansi-gray"}`}
            >
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
