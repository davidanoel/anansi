import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Spice — Real-World Asset Tokenization | Anansi",
  description:
    "Tokenize commodities, property, and revenue streams. Farmers receive tokens on their phone, exit to USDC instantly. No wallet. No gas fees. Live on Sui.",
};

const APP_URL = "https://anansi-navy.vercel.app";

export default function SpicePage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="hero-section min-h-[85vh] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <svg
            className="w-full h-full"
            viewBox="0 0 1920 1080"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <radialGradient id="spiceGlow" cx="50%" cy="50%" r="35%">
                <stop offset="0%" stopColor="#7A0F14" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#7A0F14" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="spiceThread" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.04" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle cx="960" cy="540" r="400" fill="url(#spiceGlow)" />
            <line x1="960" y1="540" x2="150" y2="80" stroke="url(#spiceThread)" strokeWidth="0.5" />
            <line
              x1="960"
              y1="540"
              x2="1770"
              y2="120"
              stroke="url(#spiceThread)"
              strokeWidth="0.5"
            />
            <line x1="960" y1="540" x2="80" y2="750" stroke="url(#spiceThread)" strokeWidth="0.5" />
            <line
              x1="960"
              y1="540"
              x2="1840"
              y2="850"
              stroke="url(#spiceThread)"
              strokeWidth="0.5"
            />
            <circle
              cx="960"
              cy="540"
              r="300"
              fill="none"
              stroke="white"
              strokeOpacity="0.02"
              strokeWidth="0.5"
            />
            <circle
              cx="960"
              cy="540"
              r="450"
              fill="none"
              stroke="white"
              strokeOpacity="0.015"
              strokeWidth="0.5"
            />
          </svg>
        </div>

        <div className="relative max-w-[1200px] mx-auto px-6 md:px-12 text-center animate-fade-up animate-fade-up-delay-1">
          <p className="text-[11px] tracking-[0.3em] uppercase text-anansi-red font-medium mb-8">
            Flagship Product — Live on Sui
          </p>

          <h1 className="font-display font-bold text-[clamp(44px,7vw,96px)] leading-[0.98] tracking-tight max-w-[900px] mx-auto">
            Real-world assets.
            <br />
            <span className="text-anansi-red">Global liquidity.</span>
          </h1>

          <p className="max-w-[640px] mx-auto font-display font-medium text-[clamp(18px,2.2vw,26px)] leading-[1.4] mt-10 text-white/75 animate-fade-up animate-fade-up-delay-2">
            A farmer delivers nutmeg. Tokens appear on his phone. He can hold, or exit to USDC
            instantly. No wallet. No gas fees. Sign in with Google.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5 mt-12 animate-fade-up animate-fade-up-delay-3">
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-9 py-4
                         font-display font-semibold text-[13px] tracking-[0.1em] uppercase
                         text-anansi-black bg-white border border-white rounded-sm
                         hover:bg-anansi-red hover:border-anansi-red hover:text-white transition-all group"
            >
              Launch App <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-3 px-9 py-4
                         font-display font-semibold text-[13px] tracking-[0.1em] uppercase
                         text-white/65 border border-white/12 rounded-sm
                         hover:text-white hover:border-white/30 transition-all"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* ===== THE PROBLEM ===== */}
      <section className="py-28 border-t border-b border-anansi-line">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="reveal">
            <Eyebrow>The Problem</Eyebrow>
            <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] leading-[1.1] max-w-[840px]">
              Billions flow through Caribbean commodity markets.
              <br />
              <span className="text-anansi-red">Farmers wait months to get paid.</span>
            </h2>
            <p className="text-[16px] text-anansi-gray max-w-[620px] mt-6 leading-[1.75]">
              Traditional commodity cooperatives operate on long timelines — farmers deliver,
              receive a small advance, and wait for the full payout until the lot sells overseas.
              The system works, but it locks value in place for weeks or months. Spice changes the
              timing.
            </p>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="section-light bg-anansi-white text-anansi-black py-40" id="how-it-works">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="reveal">
            <EyebrowLight>How It Works</EyebrowLight>
            <h2 className="font-display font-bold text-[clamp(32px,4.5vw,56px)] leading-[1.05]">
              James is a nutmeg farmer
              <br />
              <span className="text-anansi-red">in Grenada.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-20 mt-16">
            <div className="reveal">
              <ul className="space-y-0">
                {[
                  {
                    num: "01",
                    title: "James delivers nutmeg",
                    body: "Same process as always. The cooperative weighs, inspects, and pays the standard advance. Nothing changes for James here.",
                  },
                  {
                    num: "02",
                    title: "Delivery is recorded on Spice",
                    body: "The receiving officer enters the delivery. James receives NUTMEG tokens on his phone automatically — each representing 1 kg in the pool.",
                  },
                  {
                    num: "03",
                    title: "James chooses: hold or exit",
                    body: "He can hold his tokens and wait for full surplus when the lot sells. Or he can sell immediately for USDC if he needs cash now.",
                  },
                  {
                    num: "04",
                    title: "Lot sells overseas",
                    body: "Surplus is automatically distributed to all token holders, pro-rata. Transparent, trackable, and instant — no waiting months for a check.",
                  },
                ].map((step) => (
                  <li
                    key={step.num}
                    className="flex gap-6 items-baseline py-7 border-b border-anansi-line-light first:border-t"
                  >
                    <span className="font-display font-bold text-[11px] text-anansi-red tracking-[0.1em] shrink-0">
                      {step.num}
                    </span>
                    <div>
                      <h3 className="font-display font-semibold text-[17px] mb-1">{step.title}</h3>
                      <p className="text-[15px] text-[#555] leading-[1.65]">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="reveal">
              <div className="sticky top-28 space-y-6">
                <div>
                  <p className="text-[10px] tracking-[0.25em] uppercase text-anansi-red font-medium mb-4">
                    The Key Insight
                  </p>
                  <p className="font-display font-medium text-[clamp(20px,2.5vw,28px)] leading-[1.35] text-anansi-black">
                    James signs in with Google. He never sees a wallet, a gas fee, or a blockchain.
                    He sees a number on his phone — and a button that turns it into cash.
                  </p>
                </div>

                <div className="pt-6 border-t border-anansi-line-light">
                  <p className="text-[14px] text-[#555] leading-[1.7]">
                    The blockchain is invisible. The product is a savings app that happens to be
                    backed by tokenized nutmeg. That is the entire design goal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TECHNOLOGY ===== */}
      <section className="py-40">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="reveal">
            <Eyebrow>Technology</Eyebrow>
            <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] leading-[1.1] max-w-[720px]">
              Zero friction.
              <br />
              By design.
            </h2>
            <p className="text-[16px] text-anansi-gray max-w-[580px] mt-6 leading-[1.75]">
              The blockchain is a tool — not a product. Every technical decision is made to hide
              complexity, not showcase it.
            </p>
          </div>

          {/* Featured: zkLogin */}
          <div className="mt-16 reveal">
            <div className="bg-anansi-deep border border-anansi-line p-12 md:p-16 relative overflow-hidden">
              <div
                className="absolute -right-20 -top-20 w-[420px] h-[420px] rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(122,15,20,0.08) 0%, transparent 60%)",
                }}
              />
              <div className="relative grid md:grid-cols-2 gap-14 items-start">
                <div>
                  <p className="font-display font-bold text-[11px] text-anansi-red tracking-[0.15em] mb-6">
                    Core Innovation
                  </p>
                  <h3 className="font-display font-bold text-[clamp(28px,3.2vw,42px)] leading-[1.1]">
                    Sign in with Google.
                    <br />
                    <span className="text-anansi-red">That's it.</span>
                  </h3>
                </div>
                <div>
                  <p className="text-[16px] text-anansi-gray leading-[1.8]">
                    Sui zkLogin creates an invisible, non-custodial blockchain wallet from a Google
                    account. No seed phrases. No wallet apps. No browser extensions. The user's
                    private key is derived from their OAuth login — they own it, but never see it.
                  </p>
                  <p className="text-[16px] text-anansi-gray leading-[1.8] mt-5">
                    Every transaction fee is sponsored by Anansi. Users never pay gas, never hold
                    SUI, never see a "confirm transaction" prompt. The blockchain becomes an
                    implementation detail.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Supporting tech */}
          <div className="grid md:grid-cols-3 gap-px bg-anansi-line mt-px reveal-stagger">
            <TechCard
              title="Built on Sui"
              body="Sub-second finality. Sponsored gas. Native support for zkLogin. Transaction fees under $0.003 — fast enough for real-time commodity trading."
            />
            <TechCard
              title="Real asset backing"
              body="Every token represents physical inventory held by a licensed custodian. The pool is transparent, auditable, and redeemable."
            />
            <TechCard
              title="Deep DEX liquidity"
              body="Tokens trade against USDC on Cetus. Holders can exit to dollars instantly, 24/7 — no intermediary, no waiting for the cooperative."
            />
          </div>
        </div>
      </section>

      {/* ===== ASSET ROADMAP ===== */}
      <section className="py-28 border-t border-b border-anansi-line">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="reveal">
            <Eyebrow>Beyond Nutmeg</Eyebrow>
            <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] leading-[1.1] max-w-[680px]">
              One platform.
              <br />
              Every real asset.
            </h2>
            <p className="text-[16px] text-anansi-gray max-w-[580px] mt-6 leading-[1.75]">
              The architecture that tokenizes nutmeg can tokenize any real-world asset. Adding a new
              commodity, country, or asset class is a configuration change — not a rebuild.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-anansi-line mt-16 reveal-stagger">
            {[
              {
                phase: "Now",
                title: "Agriculture",
                items: [
                  "Grenada Nutmeg, Cocoa",
                  "Jamaica Coffee",
                  "Mace, Spices",
                  "Partner onboarding",
                ],
              },
              {
                phase: "Next",
                title: "Real Estate",
                items: [
                  "Caribbean villas",
                  "Boutique hotels",
                  "Fractional ownership",
                  "Diaspora investment",
                ],
              },
              {
                phase: "Future",
                title: "Revenue Streams",
                items: [
                  "Rum distillery cash flows",
                  "Tourism revenue",
                  "Carbon credits",
                  "Renewable energy",
                ],
              },
            ].map((card) => (
              <div key={card.title} className="bg-anansi-deep p-10">
                <p className="text-[10px] tracking-[0.25em] uppercase text-anansi-red mb-5 font-medium">
                  {card.phase}
                </p>
                <h3 className="font-display font-bold text-[22px]">{card.title}</h3>
                <ul className="mt-6 space-y-3 text-[14px] text-anansi-gray leading-relaxed">
                  {card.items.map((item) => (
                    <li key={item} className="pt-3 border-t border-anansi-line">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHO IT'S FOR ===== */}
      <section className="py-40">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          <div className="reveal">
            <Eyebrow>Who It's For</Eyebrow>
            <h2 className="font-display font-bold text-[clamp(28px,3.5vw,44px)] leading-[1.1] max-w-[720px]">
              Three roles.
              <br />
              One platform.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-anansi-line mt-14 reveal-stagger">
            <RoleCard
              num="01"
              title="Farmers"
              desc="Deliver commodities as normal. Receive tokens on your phone. Hold for surplus or exit early for cash. Fees are zero."
            />
            <RoleCard
              num="02"
              title="Custodians"
              desc="Cooperatives and licensed buyers record deliveries through a simple admin interface. No blockchain knowledge required."
            />
            <RoleCard
              num="03"
              title="Investors"
              desc="Buy commodity-backed tokens for yield. Real asset exposure, transparent redemption, instant USDC settlement."
            />
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-48 text-center relative border-t border-anansi-line">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(122,15,20,0.05) 0%, transparent 60%)",
          }}
        />
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 reveal relative">
          <p className="text-[11px] tracking-[0.3em] uppercase text-anansi-red font-medium mb-8">
            Live on Sui
          </p>
          <h2 className="font-display font-bold text-[clamp(36px,5vw,64px)] leading-[1.05]">
            Try it now.
            <br />
            <span className="text-anansi-red">Sign in with Google.</span>
          </h2>
          <p className="text-[16px] text-anansi-gray mt-6 max-w-[520px] mx-auto leading-[1.7]">
            No wallet. No crypto knowledge required. Just a Google account and sixty seconds.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5 mt-12">
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-9 py-4
                         font-display font-semibold text-[13px] tracking-[0.1em] uppercase
                         text-anansi-black bg-white border border-white rounded-sm
                         hover:bg-anansi-red hover:border-anansi-red hover:text-white transition-all group"
            >
              Launch App <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>
            <a
              href="mailto:spice@anansi.tech"
              className="inline-flex items-center gap-3 px-9 py-4
                         font-display font-semibold text-[13px] tracking-[0.1em] uppercase
                         text-white/65 border border-white/12 rounded-sm
                         hover:text-white hover:border-white/30 transition-all"
            >
              Partner with us
            </a>
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

function EyebrowLight({ children }) {
  return (
    <p className="text-[10px] tracking-[0.25em] uppercase text-anansi-red font-medium mb-7">
      {children}
    </p>
  );
}

function TechCard({ title, body }) {
  return (
    <div className="bg-anansi-deep p-10">
      <h3 className="font-display font-bold text-[18px] mb-3">{title}</h3>
      <p className="text-[14px] text-anansi-gray leading-[1.7]">{body}</p>
    </div>
  );
}

function RoleCard({ num, title, desc }) {
  return (
    <div className="bg-anansi-deep p-10 hover:bg-[#0f0f0f] transition-colors">
      <p className="font-display font-bold text-[11px] text-anansi-red tracking-[0.15em] mb-6">
        {num}
      </p>
      <h3 className="font-display font-bold text-[22px]">{title}</h3>
      <p className="text-[14px] text-anansi-gray leading-[1.7] mt-4">{desc}</p>
    </div>
  );
}
