import Link from "next/link";

export const metadata = {
  title: "CaribCoin — The Charter | Anansi",
  description:
    "The protocol token that powers every Anansi product. Fixed supply. Deflationary burns. Participation, not permission.",
};

const ALLOCATIONS = [
  {
    label: "Community & Ecosystem",
    pct: 40,
    tokens: "4B",
    vest: "Gradual emission, 5–10 years",
    color: "bg-white",
  },
  {
    label: "Foundation Treasury",
    pct: 20,
    tokens: "2B",
    vest: "Locked. Released by governance.",
    color: "bg-anansi-red",
  },
  {
    label: "Contributors / Core Team",
    pct: 15,
    tokens: "1.5B",
    vest: "1-year cliff, 4-year linear",
    color: "bg-anansi-gray",
  },
  {
    label: "Early Backers (SAFT)",
    pct: 10,
    tokens: "1B",
    vest: "6–12 month cliff, 2–3 year linear",
    color: "bg-anansi-gray/60",
  },
  {
    label: "Public Launch Liquidity",
    pct: 10,
    tokens: "1B",
    vest: "No cliff. At public launch.",
    color: "bg-white/20",
  },
  {
    label: "Strategic Partners",
    pct: 5,
    tokens: "500M",
    vest: "Case-by-case, 1–2 year",
    color: "bg-white/10 border border-white/20",
  },
];

export default function CaribCoinPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px]"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.018) 34%, transparent 72%)",
            }}
          />
          <div
            className="absolute top-20 right-[10%] w-[420px] h-[420px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(220,38,38,0.065) 0%, rgba(220,38,38,0.018) 42%, transparent 74%)",
            }}
          />
          <div
            className="absolute top-10 left-[14%] w-[320px] h-[320px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 46%, transparent 76%)",
            }}
          />
        </div>

        <div className="max-w-[1200px] mx-auto px-6 md:px-12 pt-40 pb-20 relative">
          <div className="reveal">
          <p className="text-[10px] tracking-[0.25em] uppercase text-anansi-red font-medium mb-7">
            CaribCoin (CARIB) — The Charter
          </p>
          <h1 className="font-display font-bold text-[clamp(40px,5.5vw,72px)] leading-[1.05] max-w-[700px]">
            Participation,
            <br />
            <span className="text-anansi-red">not permission.</span>
          </h1>
          <p className="text-[18px] text-anansi-gray mt-8 max-w-[620px] leading-[1.75]">
            CaribCoin is the protocol token that powers every product Anansi builds. It captures
            value from real economic activity — not promises. Fixed supply. Deflationary burns. Open
            ecosystem. Open to anyone.
          </p>
        </div>
        </div>
      </section>

      {/* ===== CHARTER — IS / IS NOT ===== */}
      <section className="section-light bg-anansi-white text-anansi-black border-y border-anansi-line-light">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-24">
          <div className="reveal">
            <Eyebrow dark>The Charter</Eyebrow>
            <h2 className="font-display font-bold text-3xl mb-12">
              What CaribCoin is — and is not.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-16 reveal">
            <div>
              <h3 className="font-display font-semibold mb-5">CaribCoin IS:</h3>
              <ul className="space-y-3">
                {[
                  "A protocol fee token across all Anansi products",
                  "A staking token for governance and priority access",
                  "A coordination primitive for builders and participants",
                  "Open to anyone — retail and institutional",
                  "Market-discovered in value — no price management",
                  "Deflationary by design — fees are partially burned",
                  "Tradeable on public DEXs from day one",
                  "Chain-agnostic — Sui at launch, expandable",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-[15px] text-[#555]">
                    <span className="text-anansi-red shrink-0 mt-0.5">→</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display font-semibold mb-5">CaribCoin is NOT:</h3>
              <ul className="space-y-3">
                {[
                  "A stablecoin",
                  "A guaranteed investment",
                  "A dividend or revenue-sharing instrument",
                  "A replacement for local currencies",
                  "A protocol that pays yield to stakers",
                  "A centrally managed financial product",
                  "Required to use Anansi products — USDC is always accepted",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-[15px] text-[#555]">
                    <span className="text-[#999] shrink-0 mt-0.5">✕</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CORE PRINCIPLES ===== */}
      <section className="max-w-[1200px] mx-auto px-6 md:px-12 py-24">
        <div className="reveal">
          <Eyebrow>Core Principles</Eyebrow>
          <h2 className="font-display font-bold text-3xl mb-12">
            The rules that define CaribCoin.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-anansi-line reveal-stagger">
          {[
            {
              title: "Open Participation",
              body: "Anyone can acquire, use, build with, or speculate on CaribCoin. No permission required. No KYC to hold — only to use regulated products.",
            },
            {
              title: "Free Markets",
              body: "CaribCoin embraces price discovery, volatility, disagreement, and experimentation. There is no attempt to control price, guarantee stability, or suppress speculation.",
            },
            {
              title: "Use Before Narrative",
              body: "Usage over hype. Builders over promoters. Action over promises. Belief is optional. Participation is sufficient.",
            },
            {
              title: "Voluntary Adoption",
              body: "No individual, business, or community is required to use CaribCoin. Participation is opt-in. USDC is always accepted. Exit is always allowed.",
            },
          ].map((p, i) => (
            <div key={i} className="bg-anansi-deep p-10">
              <h3 className="font-display font-semibold text-lg mb-2">{p.title}</h3>
              <p className="text-[14px] text-anansi-gray leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TOKENOMICS ===== */}
      <section className="border-t border-anansi-line">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-24">
          <div className="reveal">
            <Eyebrow>Tokenomics</Eyebrow>
            <h2 className="font-display font-bold text-3xl mb-2">10,000,000,000 CARIB</h2>
            <p className="text-anansi-gray mb-12">
              Fixed supply. No inflation. All tokens minted at genesis. Burns are permanent.
            </p>
          </div>

          {/* Allocation bars */}
          <div className="space-y-3 reveal">
            {ALLOCATIONS.map((a) => (
              <div key={a.label} className="flex items-center gap-4">
                <div className="w-52 text-[13px] shrink-0 text-anansi-gray">{a.label}</div>
                <div className="flex-1 bg-anansi-line rounded-full h-8 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${a.color} flex items-center justify-end pr-3`}
                    style={{ width: `${a.pct}%` }}
                  >
                    <span className="text-[11px] font-display font-bold text-anansi-black drop-shadow">
                      {a.pct}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Token specs */}
          <div className="grid md:grid-cols-4 gap-px bg-anansi-line mt-14 reveal-stagger">
            {[
              { label: "Blockchain", value: "Sui" },
              { label: "Standard", value: "Coin<CARIB>" },
              { label: "Decimals", value: "9" },
              { label: "Inflation", value: "None, ever" },
            ].map((s, i) => (
              <div key={i} className="bg-anansi-deep p-6">
                <p className="text-[10px] tracking-[0.15em] uppercase text-anansi-gray mb-1">
                  {s.label}
                </p>
                <p className="font-display font-bold text-lg">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Vesting timeline */}
          <div className="mt-14 reveal">
            <h3 className="font-display font-semibold text-lg mb-6">Vesting & Supply Schedule</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-anansi-line text-left">
                    <th className="pb-3 pr-6 text-anansi-gray font-medium tracking-wider uppercase text-[10px]">
                      Category
                    </th>
                    <th className="pb-3 pr-6 text-anansi-gray font-medium tracking-wider uppercase text-[10px]">
                      Tokens
                    </th>
                    <th className="pb-3 pr-6 text-anansi-gray font-medium tracking-wider uppercase text-[10px]">
                      Vesting
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ALLOCATIONS.map((a, i) => (
                    <tr key={i} className="border-b border-anansi-line/50">
                      <td className="py-3 pr-6 font-medium">{a.label}</td>
                      <td className="py-3 pr-6 text-anansi-gray font-display">{a.tokens}</td>
                      <td className="py-3 text-anansi-gray">{a.vest}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[13px] text-anansi-gray/60 mt-4">
              Initial circulating supply at launch: ~600–700M CARIB (6–7% of total). Conservative
              float by design — less sell pressure, disciplined price discovery.
            </p>
          </div>
        </div>
      </section>

      {/* ===== FEE ARCHITECTURE ===== */}
      <section className="bg-anansi-deep border-t border-anansi-line">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-24">
          <div className="reveal">
            <Eyebrow>Economics</Eyebrow>
            <h2 className="font-display font-bold text-3xl mb-6">How CaribCoin captures value.</h2>
            <p className="text-anansi-gray max-w-[560px] mb-12 leading-relaxed">
              Every Anansi product generates fees. All fees are auto-converted to CaribCoin via DEX
              — users never need to buy or hold CARIB. The protocol does it behind the scenes in a
              single atomic transaction.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 reveal">
            <div className="space-y-0">
              {[
                {
                  title: "Every product generates fees",
                  body: "Spice minting (0.1%), surplus distribution (1%), CaribStone NFT sales (2.5%), DollarBank yield (0.5%), SaaS subscriptions — all create fee events.",
                },
                {
                  title: "Fees auto-convert to CARIB",
                  body: "Within one Sui PTB: fee USDC is swapped to CARIB on the DEX. The user sees the net amount. The conversion is invisible but fully auditable on-chain.",
                },
                {
                  title: "50% is burned permanently",
                  body: "Half of every fee is destroyed — sent to a null address, permanently reducing the supply of CARIB that will ever exist.",
                },
                {
                  title: "50% funds the ecosystem",
                  body: "The other half goes to the treasury — funding grants, development, infrastructure, and ecosystem growth. The ratio is adjustable by governance.",
                },
              ].map((step, i) => (
                <div key={i} className="border-l-2 border-anansi-red pl-5 py-5">
                  <h3 className="font-display font-semibold mb-1">{step.title}</h3>
                  <p className="text-anansi-gray text-[14px] leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-7xl font-display font-bold text-anansi-red">∞</p>
                <p className="text-anansi-gray mt-6 max-w-xs text-[15px] leading-relaxed">
                  More products → more fees → more burns → less supply. Every product Anansi ships
                  strengthens the cycle.
                </p>
                <div className="grid grid-cols-3 gap-6 mt-10 pt-8 border-t border-anansi-line">
                  {[
                    { label: "Spice", fee: "0.1% – 1%" },
                    { label: "CaribStone", fee: "2.5%" },
                    { label: "DollarBank", fee: "0.5%" },
                  ].map((f, i) => (
                    <div key={i}>
                      <p className="text-[10px] text-anansi-gray uppercase tracking-widest">
                        {f.label}
                      </p>
                      <p className="font-display font-bold text-sm mt-1">{f.fee}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STAKING ===== */}
      <section className="max-w-[1200px] mx-auto px-6 md:px-12 py-24">
        <div className="reveal">
          <Eyebrow>Staking</Eyebrow>
          <h2 className="font-display font-bold text-3xl mb-3">Stake freely.</h2>
          <p className="text-anansi-gray max-w-[620px] mb-12 leading-relaxed">
            Staking CARIB is voluntary and flexible. No fixed lock periods. No slashing. Unstake any
            time with a 24-hour cooldown. The protocol does not pay yield — it unlocks access.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-anansi-line reveal-stagger">
          {[
            {
              title: "Reduced fees",
              desc: "Stake ≥ 10,000 CARIB for up to 50% reduction on all platform fees across Spice, CaribStone, and future products.",
              tier: "10K CARIB",
            },
            {
              title: "Priority access",
              desc: "Stake ≥ 50,000 CARIB for 24-hour early access to new asset pools before public availability.",
              tier: "50K CARIB",
            },
            {
              title: "Governance voting",
              desc: "Stake ≥ 1,000 CARIB to vote on protocol parameters: fee rates, burn ratio, new asset approvals, treasury spending.",
              tier: "1K CARIB",
            },
            {
              title: "Ecosystem rewards",
              desc: "Stake any amount for eligibility for periodic airdrops from the Community & Ecosystem allocation. Proportional to stake.",
              tier: "Any amount",
            },
          ].map((b, i) => (
            <div key={i} className="bg-anansi-deep p-8">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-display font-semibold">{b.title}</h3>
                <span className="text-[9px] tracking-[0.15em] uppercase text-anansi-red font-medium">
                  {b.tier}
                </span>
              </div>
              <p className="text-[14px] text-anansi-gray leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 reveal">
          <h3 className="font-display font-semibold text-lg mb-6">How unstaking works</h3>
          <div className="grid md:grid-cols-3 gap-px bg-anansi-line">
            {[
              {
                num: "01",
                title: "Request unstake",
                desc: "Click unstake. Your tokens enter a 24-hour cooldown. Benefits deactivate immediately — no voting, no fee discounts, no priority.",
              },
              {
                num: "02",
                title: "Wait 24 hours",
                desc: "Tokens are locked during cooldown. You can cancel and restake at any point during this window with no penalty.",
              },
              {
                num: "03",
                title: "Withdraw",
                desc: "After 24 hours, claim your tokens back to your wallet. No slashing. No fees. No friction.",
              },
            ].map((step, i) => (
              <div key={i} className="bg-anansi-deep p-8">
                <p className="font-display font-bold text-[11px] text-anansi-red tracking-[0.15em] mb-4">
                  {step.num}
                </p>
                <h4 className="font-display font-semibold text-[16px] mb-2">{step.title}</h4>
                <p className="text-[14px] text-anansi-gray leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-anansi-gray/60 mt-4 leading-relaxed max-w-[720px]">
            The 24-hour cooldown exists to prevent flash-loan attacks on governance and priority
            access — not to punish users. It is the minimum friction required for the benefits to be
            meaningful.
          </p>
        </div>
      </section>

      {/* ===== YIELD SOURCES ===== */}
      <section className="border-t border-anansi-line">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-24">
          <div className="reveal">
            <Eyebrow>Ecosystem Yield</Eyebrow>
            <h2 className="font-display font-bold text-3xl mb-6">Where yield comes from.</h2>
            <p className="text-anansi-gray max-w-[640px] mb-12 leading-relaxed">
              CaribCoin the protocol does not pay yield. But the ecosystem around CaribCoin
              generates real economic activity — and participants can earn from that activity
              through three market-based mechanisms. None of these are promises from the protocol.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-anansi-line reveal-stagger">
            <div className="bg-anansi-deep p-8">
              <p className="font-display font-bold text-[11px] text-anansi-red tracking-[0.15em] mb-4">
                01
              </p>
              <h3 className="font-display font-semibold text-[18px] mb-3">DEX Liquidity Fees</h3>
              <p className="text-[14px] text-anansi-gray leading-relaxed">
                Provide liquidity to the CARIB/USDC pool on Cetus and earn a share of every swap
                fee. This is standard DEX economics — CaribCoin does not pay these fees; traders do.
              </p>
            </div>
            <div className="bg-anansi-deep p-8">
              <p className="font-display font-bold text-[11px] text-anansi-red tracking-[0.15em] mb-4">
                02
              </p>
              <h3 className="font-display font-semibold text-[18px] mb-3">Liquidity Incentives</h3>
              <p className="text-[14px] text-anansi-gray leading-relaxed">
                The Foundation may run programs distributing CARIB from the Community allocation to
                LPs. These are treasury-discretion incentives — not embedded protocol rewards. Can
                be paused or adjusted.
              </p>
            </div>
            <div className="bg-anansi-deep p-8">
              <p className="font-display font-bold text-[11px] text-anansi-red tracking-[0.15em] mb-4">
                03
              </p>
              <h3 className="font-display font-semibold text-[18px] mb-3">Third-Party Services</h3>
              <p className="text-[14px] text-anansi-gray leading-relaxed">
                Validators, DeFi protocols, and staking services may build products on top of CARIB
                that offer yield. These are separate agreements between users and third parties —
                not CaribCoin itself.
              </p>
            </div>
          </div>

          <p className="text-[13px] text-anansi-gray/60 mt-6 leading-relaxed max-w-[720px] reveal">
            This separation matters. The protocol stays honest: it does not promise returns. Yield
            exists in the ecosystem because real activity creates real revenue — earned, not issued.
          </p>
        </div>
      </section>

      {/* ===== GOVERNANCE ===== */}
      <section className="border-t border-anansi-line">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-24">
          <div className="reveal">
            <Eyebrow>Governance</Eyebrow>
            <h2 className="font-display font-bold text-3xl mb-12">Evolving, not premature.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-16 reveal">
            <div>
              <h3 className="font-display font-semibold mb-4">What's governed</h3>
              <ul className="space-y-2">
                {[
                  "Fee rates across all products",
                  "Burn-to-treasury ratio",
                  "New asset type approvals on Spice",
                  "Community & Ecosystem spending",
                  "Protocol upgrade approvals",
                  "Addition of new products to the fee stack",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-[14px] text-anansi-gray">
                    <span className="text-anansi-red shrink-0">→</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display font-semibold mb-4">What's never governed</h3>
              <ul className="space-y-2">
                {[
                  "Minting new CARIB — no function exists",
                  "Overriding Foundation multi-sig",
                  "Forcing custodians to act",
                  "Changing the charter's core principles",
                  "Intervening in market pricing",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-[14px] text-anansi-gray">
                    <span className="text-anansi-gray/40 shrink-0">✕</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-anansi-line mt-12 reveal-stagger">
            {[
              {
                phase: "Phase 1 — MVP",
                desc: "No on-chain governance. Decisions made transparently by the founder with community input. Avoids governance theater before there's a real community.",
              },
              {
                phase: "Phase 2 — Post-Launch",
                desc: "Soft governance — snapshot voting by CARIB stakers on key parameters. Results are advisory. Foundation implements if reasonable.",
              },
              {
                phase: "Phase 3 — Maturity",
                desc: "Binding on-chain governance for defined parameters. Foundation retains veto only for existential threats: security, legal compliance.",
              },
            ].map((g, i) => (
              <div key={i} className="bg-anansi-deep p-8">
                <p className="font-display font-semibold text-sm text-anansi-red mb-2">{g.phase}</p>
                <p className="text-[13px] text-anansi-gray leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ECONOMIC INVARIANTS ===== */}
      <section className="bg-anansi-deep border-t border-anansi-line">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-24">
          <div className="reveal">
            <Eyebrow>Invariants</Eyebrow>
            <h2 className="font-display font-bold text-3xl mb-12">Rules that never change.</h2>
          </div>

          <div className="space-y-0 reveal">
            {[
              "Total supply is fixed at 10B CARIB. No function exists to mint more. Ever.",
              "Burns are permanent. Burned tokens cannot be recovered.",
              "The protocol never pays yield. Staking benefits are fee reductions and access — earned by activity, not by holding.",
              "Unstaking is always permitted. The only friction is a 24-hour cooldown to prevent governance attacks.",
              "Fees are always a percentage, never a flat tax that scales badly.",
              "USDC is always accepted. CaribCoin is never the only payment method.",
              "Auto-conversion is transparent. Every fee conversion is visible as a Sui event.",
              "The charter governs. No economic change can contradict these core principles.",
            ].map((rule, i) => (
              <div
                key={i}
                className="flex gap-5 items-baseline py-5 border-b border-anansi-line first:border-t"
              >
                <span className="font-display font-bold text-[11px] text-anansi-red tracking-[0.1em] shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[15px] text-anansi-gray leading-relaxed">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STEWARDSHIP ===== */}
      <section className="max-w-[1200px] mx-auto px-6 md:px-12 py-24">
        <div className="grid md:grid-cols-2 gap-16 reveal">
          <div>
            <Eyebrow>Stewardship</Eyebrow>
            <h2 className="font-display font-bold text-3xl mb-6">The Foundation</h2>
            <p className="text-[16px] text-anansi-gray leading-[1.8]">
              CaribCoin will be stewarded by a foundation that exists to support ecosystem
              development, fund public goods and grants, maintain protocol infrastructure, and
              represent the network externally when necessary.
            </p>
          </div>
          <div>
            <p className="text-[16px] text-anansi-gray leading-[1.8]">
              The Foundation does not manage token price, promise returns, control markets, or
              override voluntary activity. Stewardship is not ownership. The network's direction is
              shaped by participants — not by any single entity.
            </p>
            <p className="text-[16px] text-anansi-gray leading-[1.8] mt-6">
              In its early stages, governance is informal and transparent. It is expected to evolve
              gradually as the network grows. No governance model is assumed to be final.
            </p>
          </div>
        </div>
      </section>

      {/* ===== RISK DISCLOSURE ===== */}
      <section className="max-w-[1200px] mx-auto px-6 md:px-12 pb-24">
        <div className="reveal p-10 border border-anansi-line rounded">
          <p className="font-display font-semibold text-white mb-4">Risk Disclosure</p>
          <div className="space-y-3 text-[14px] text-anansi-gray leading-relaxed">
            <p>
              CaribCoin does not promise returns, yield, dividends, or price appreciation. Its
              value, if any, is determined by how people choose to use it.
            </p>
            <p>
              Any yield opportunities in the CaribCoin ecosystem — such as DEX liquidity fees,
              Foundation-funded incentive programs, or third-party staking services — are generated
              by external market activity, not by the CaribCoin protocol itself. The protocol does
              not issue rewards from token supply.
            </p>
            <p>
              Participation involves risk including market volatility, technical risk, regulatory
              uncertainty, and social dynamics. Participation is voluntary and at your own risk.
            </p>
            <p>
              We do not predict market outcomes. The economic design creates conditions where usage
              drives demand and burns reduce supply. What the market does with that information is
              the market's business.
            </p>
          </div>
          <p className="text-[12px] text-anansi-gray/40 mt-6 italic">
            Participation, not permission. Usage, not promises. The market decides what CaribCoin
            becomes.
          </p>
        </div>
      </section>
    </>
  );
}

// ============================================================

function Eyebrow({ children, dark }) {
  return (
    <p
      className={`text-[10px] tracking-[0.25em] uppercase font-medium mb-7 ${dark ? "text-anansi-red" : "text-anansi-red"}`}
    >
      {children}
    </p>
  );
}
