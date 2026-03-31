import Link from 'next/link'

export const metadata = {
  title: 'CaribCoin — Protocol Token | Anansi',
  description: 'The token that powers every Anansi product. Fixed supply. Deflationary burns. Participation, not permission.',
}

const ALLOCATIONS = [
  { label: 'Community & Ecosystem', pct: 40, color: 'bg-anansi-black' },
  { label: 'Foundation Treasury', pct: 20, color: 'bg-anansi-red' },
  { label: 'Contributors / Core Team', pct: 15, color: 'bg-anansi-gray' },
  { label: 'Early Backers', pct: 10, color: 'bg-anansi-gray/60' },
  { label: 'Public Launch Liquidity', pct: 10, color: 'bg-anansi-border' },
  { label: 'Strategic Partners', pct: 5, color: 'bg-anansi-light border border-anansi-border' },
]

export default function CaribCoinPage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16">
        <p className="text-anansi-red font-mono text-sm mb-4">CARIBCOIN (CARIB)</p>
        <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight max-w-3xl">
          Participation,
          <br />
          <span className="text-anansi-red">not permission.</span>
        </h1>
        <p className="text-xl text-anansi-gray mt-6 max-w-2xl leading-relaxed">
          CaribCoin is the protocol token that powers every product Anansi builds.
          Fixed supply. Deflationary burns. No promises — only participation.
        </p>
      </section>

      {/* Charter Summary */}
      <section className="bg-white border-y border-anansi-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-anansi-red font-mono text-sm mb-4">THE CHARTER</p>
          <h2 className="text-3xl font-bold mb-8">What CaribCoin is — and is not.</h2>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="font-semibold mb-3">CaribCoin IS:</h3>
              <ul className="space-y-2 text-anansi-gray">
                <li className="flex gap-2"><span className="text-anansi-red">→</span> A protocol fee token across all Anansi products</li>
                <li className="flex gap-2"><span className="text-anansi-red">→</span> A staking token for governance and priority access</li>
                <li className="flex gap-2"><span className="text-anansi-red">→</span> A cultural coordination primitive for the Caribbean</li>
                <li className="flex gap-2"><span className="text-anansi-red">→</span> Open to anyone — retail and institutional</li>
                <li className="flex gap-2"><span className="text-anansi-red">→</span> Market-discovered in value</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">CaribCoin is NOT:</h3>
              <ul className="space-y-2 text-anansi-gray">
                <li className="flex gap-2"><span className="text-anansi-gray">✕</span> A stablecoin</li>
                <li className="flex gap-2"><span className="text-anansi-gray">✕</span> A guaranteed investment</li>
                <li className="flex gap-2"><span className="text-anansi-gray">✕</span> A dividend or revenue-sharing instrument</li>
                <li className="flex gap-2"><span className="text-anansi-gray">✕</span> A replacement for local currencies</li>
                <li className="flex gap-2"><span className="text-anansi-gray">✕</span> A promise of returns</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tokenomics */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-anansi-red font-mono text-sm mb-4">TOKENOMICS</p>
        <h2 className="text-3xl font-bold mb-2">10,000,000,000 CARIB</h2>
        <p className="text-anansi-gray mb-10">Fixed supply. No inflation. Burns are permanent.</p>

        <div className="space-y-3">
          {ALLOCATIONS.map((a) => (
            <div key={a.label} className="flex items-center gap-4">
              <div className="w-48 text-sm shrink-0">{a.label}</div>
              <div className="flex-1 bg-anansi-light rounded-full h-8 overflow-hidden">
                <div
                  className={`h-full rounded-full ${a.color} flex items-center justify-end pr-3`}
                  style={{ width: `${a.pct}%` }}
                >
                  <span className="text-xs font-mono text-white drop-shadow">{a.pct}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <StatBox label="Blockchain" value="Sui" />
          <StatBox label="Decimals" value="9" />
          <StatBox label="Inflation" value="None, ever" />
        </div>
      </section>

      {/* How Value Flows */}
      <section className="bg-anansi-black text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-anansi-red font-mono text-sm mb-4">ECONOMICS</p>
          <h2 className="text-3xl font-bold mb-10">How CaribCoin captures value.</h2>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <FlowStep title="Every product generates fees">
                When Spice mints tokens, distributes surplus, or processes trades,
                a small fee is collected.
              </FlowStep>
              <FlowStep title="Fees auto-convert to CARIB">
                Behind the scenes, fee USDC is swapped to CARIB via DEX liquidity
                in one atomic transaction. Users never see this.
              </FlowStep>
              <FlowStep title="50% is burned permanently">
                Half of every fee is destroyed — permanently reducing the supply
                of CARIB that will ever exist.
              </FlowStep>
              <FlowStep title="50% funds the ecosystem">
                The other half goes to the treasury — funding grants, development,
                and ecosystem growth.
              </FlowStep>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-6xl font-bold text-anansi-red">∞</p>
                <p className="text-gray-400 mt-4 max-w-xs">
                  More products → more fees → more burns → less supply.
                  Every island, every asset, every user strengthens the cycle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Staking */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-anansi-red font-mono text-sm mb-4">STAKING</p>
        <h2 className="text-3xl font-bold mb-6">Participation has advantages.</h2>
        <p className="text-anansi-gray max-w-2xl mb-10">
          Staking CARIB is voluntary. It does not promise yield or returns.
          It provides protocol-level benefits for active participants.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <BenefitCard title="Reduced fees" description="Up to 50% reduction on all Spice and CaribStone platform fees." />
          <BenefitCard title="Priority access" description="Early access to new asset pools before public availability." />
          <BenefitCard title="Governance" description="Vote on protocol parameters: fee rates, new assets, treasury spending." />
          <BenefitCard title="Ecosystem rewards" description="Eligibility for airdrops from the Community & Ecosystem allocation." />
        </div>
      </section>

      {/* Risk Disclosure */}
      <section className="max-w-6xl mx-auto px-6 py-12 mb-12">
        <div className="p-6 bg-anansi-light border border-anansi-border rounded-xl text-sm text-anansi-gray">
          <p className="font-semibold text-anansi-black mb-2">Risk Disclosure</p>
          <p>
            CaribCoin does not promise returns, yield, dividends, or price appreciation.
            Participation involves risk including market volatility, technical risk,
            and regulatory uncertainty. Participation is voluntary and at your own risk.
            Do your own research.
          </p>
        </div>
      </section>
    </>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="p-4 border border-anansi-border rounded-lg">
      <p className="text-xs text-anansi-gray font-mono">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  )
}

function FlowStep({ title, children }) {
  return (
    <div className="border-l-2 border-anansi-red pl-4">
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{children}</p>
    </div>
  )
}

function BenefitCard({ title, description }) {
  return (
    <div className="p-5 border border-anansi-border rounded-xl">
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-anansi-gray">{description}</p>
    </div>
  )
}
