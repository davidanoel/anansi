export const metadata = {
  title: 'CaribCoin — Protocol Token | Anansi',
  description: 'The token that powers every Anansi product. Fixed supply. Deflationary burns. Participation, not permission.',
}

const ALLOCATIONS = [
  { label: 'Community & Ecosystem', pct: 40, color: 'bg-white' },
  { label: 'Foundation Treasury', pct: 20, color: 'bg-anansi-red' },
  { label: 'Contributors / Core Team', pct: 15, color: 'bg-anansi-gray' },
  { label: 'Early Backers', pct: 10, color: 'bg-anansi-gray/60' },
  { label: 'Public Launch Liquidity', pct: 10, color: 'bg-white/20' },
  { label: 'Strategic Partners', pct: 5, color: 'bg-white/10 border border-white/20' },
]

export default function CaribCoinPage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-6 md:px-12 pt-40 pb-20">
        <div className="reveal">
          <p className="text-[10px] tracking-[0.25em] uppercase text-anansi-red font-medium mb-7">CaribCoin (CARIB)</p>
          <h1 className="font-display font-bold text-[clamp(40px,5.5vw,72px)] leading-[1.05] max-w-[700px]">
            Participation,
            <br />
            <span className="text-anansi-red">not permission.</span>
          </h1>
          <p className="text-[18px] text-anansi-gray mt-8 max-w-[560px] leading-[1.75]">
            CaribCoin is the protocol token that powers every product Anansi builds.
            Fixed supply. Deflationary burns. No promises — only participation.
          </p>
        </div>
      </section>

      {/* Charter Summary */}
      <section className="bg-anansi-white text-anansi-black border-y border-anansi-line-light">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-24">
          <div className="reveal">
            <p className="text-[10px] tracking-[0.25em] uppercase text-anansi-red font-medium mb-7">The Charter</p>
            <h2 className="font-display font-bold text-3xl mb-10">What CaribCoin is — and is not.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-16 reveal">
            <div>
              <h3 className="font-display font-semibold mb-4">CaribCoin IS:</h3>
              <ul className="space-y-3 text-[#555]">
                {[
                  'A protocol fee token across all Anansi products',
                  'A staking token for governance and priority access',
                  'A cultural coordination primitive',
                  'Open to anyone — retail and institutional',
                  'Market-discovered in value',
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-[15px]">
                    <span className="text-anansi-red shrink-0">→</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display font-semibold mb-4">CaribCoin is NOT:</h3>
              <ul className="space-y-3 text-[#555]">
                {[
                  'A stablecoin',
                  'A guaranteed investment',
                  'A dividend or revenue-sharing instrument',
                  'A replacement for local currencies',
                  'A promise of returns',
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-[15px]">
                    <span className="text-[#999] shrink-0">✕</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tokenomics */}
      <section className="max-w-[1200px] mx-auto px-6 md:px-12 py-24">
        <div className="reveal">
          <p className="text-[10px] tracking-[0.25em] uppercase text-anansi-red font-medium mb-7">Tokenomics</p>
          <h2 className="font-display font-bold text-3xl mb-2">10,000,000,000 CARIB</h2>
          <p className="text-anansi-gray mb-12">Fixed supply. No inflation. Burns are permanent.</p>
        </div>

        <div className="space-y-3 reveal">
          {ALLOCATIONS.map((a) => (
            <div key={a.label} className="flex items-center gap-4">
              <div className="w-52 text-[14px] shrink-0 text-anansi-gray">{a.label}</div>
              <div className="flex-1 bg-anansi-line rounded-full h-8 overflow-hidden">
                <div
                  className={`h-full rounded-full ${a.color} flex items-center justify-end pr-3`}
                  style={{ width: `${a.pct}%` }}
                >
                  <span className="text-[11px] font-display font-bold text-anansi-black drop-shadow">{a.pct}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-anansi-line mt-14 reveal-stagger">
          {[
            { label: 'Blockchain', value: 'Sui' },
            { label: 'Decimals', value: '9' },
            { label: 'Inflation', value: 'None, ever' },
          ].map((s, i) => (
            <div key={i} className="bg-anansi-deep p-6">
              <p className="text-[10px] tracking-[0.15em] uppercase text-anansi-gray mb-1">{s.label}</p>
              <p className="font-display font-bold text-xl">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How Value Flows */}
      <section className="bg-anansi-deep border-t border-anansi-line">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-24">
          <div className="reveal">
            <p className="text-[10px] tracking-[0.25em] uppercase text-anansi-red font-medium mb-7">Economics</p>
            <h2 className="font-display font-bold text-3xl mb-12">How CaribCoin captures value.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-16 reveal">
            <div className="space-y-0">
              {[
                { title: 'Every product generates fees', body: 'When Spice mints tokens, distributes surplus, or processes trades, a small fee is collected.' },
                { title: 'Fees auto-convert to CARIB', body: 'Behind the scenes, fee USDC is swapped to CARIB via DEX liquidity in one atomic transaction.' },
                { title: '50% is burned permanently', body: 'Half of every fee is destroyed — permanently reducing the supply of CARIB that will ever exist.' },
                { title: '50% funds the ecosystem', body: 'The other half goes to the treasury — funding grants, development, and ecosystem growth.' },
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
                  More products → more fees → more burns → less supply.
                  Every product Anansi ships strengthens the cycle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Staking */}
      <section className="max-w-[1200px] mx-auto px-6 md:px-12 py-24">
        <div className="reveal">
          <p className="text-[10px] tracking-[0.25em] uppercase text-anansi-red font-medium mb-7">Staking</p>
          <h2 className="font-display font-bold text-3xl mb-3">Participation has advantages.</h2>
          <p className="text-anansi-gray max-w-[540px] mb-12">
            Staking CARIB is voluntary. It does not promise yield or returns.
            It provides protocol-level benefits for active participants.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-anansi-line reveal-stagger">
          {[
            { title: 'Reduced fees', desc: 'Up to 50% reduction on all Spice and CaribStone platform fees.' },
            { title: 'Priority access', desc: 'Early access to new asset pools before public availability.' },
            { title: 'Governance', desc: 'Vote on protocol parameters: fee rates, new assets, treasury spending.' },
            { title: 'Ecosystem rewards', desc: 'Eligibility for airdrops from the Community & Ecosystem allocation.' },
          ].map((b, i) => (
            <div key={i} className="bg-anansi-deep p-8">
              <h3 className="font-display font-semibold mb-2">{b.title}</h3>
              <p className="text-[14px] text-anansi-gray leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Risk Disclosure */}
      <section className="max-w-[1200px] mx-auto px-6 md:px-12 pb-24">
        <div className="reveal p-8 bg-anansi-deep border border-anansi-line rounded text-[14px] text-anansi-gray">
          <p className="font-display font-semibold text-white mb-2">Risk Disclosure</p>
          <p className="leading-relaxed">
            CaribCoin does not promise returns, yield, dividends, or price appreciation.
            Participation involves risk including market volatility, technical risk,
            and regulatory uncertainty. Participation is voluntary and at your own risk.
          </p>
        </div>
      </section>
    </>
  )
}
