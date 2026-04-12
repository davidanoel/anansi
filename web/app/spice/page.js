import Link from 'next/link'

export const metadata = {
  title: 'Spice — Real-World Asset Tokenization | Anansi',
  description: 'Tokenize Caribbean commodities, real estate, and revenue streams. Starting with Grenadian nutmeg.',
}

export default function SpicePage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16">
        <p className="text-anansi-red font-mono text-sm mb-4">SPICE — BY ANANSI</p>
        <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight max-w-3xl">
          Caribbean assets.
          <br />
          <span className="text-anansi-red">Global liquidity.</span>
        </h1>
        <p className="text-xl text-anansi-gray mt-6 max-w-2xl leading-relaxed">
          Spice turns physical commodities, property, and revenue streams into
          tradeable digital tokens that anyone in the world can access.
          No wallet required. No crypto experience needed.
        </p>
      </section>

      {/* How it Works — James's Story */}
      <section className="bg-white border-y border-anansi-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-anansi-red font-mono text-sm mb-4">HOW IT WORKS</p>
          <h2 className="text-3xl font-bold mb-10">
            James is a nutmeg farmer in Grenada.
          </h2>

          <div className="space-y-8">
            <Step number="01" title="James delivers nutmeg to GCNA">
              Same process as always. GCNA weighs, inspects, and pays the EC$ advance.
              Nothing changes for James here.
            </Step>
            <Step number="02" title="GCNA records the delivery on Spice">
              The receiving officer enters the delivery into Spice. James receives
              NUTMG tokens on his phone — each representing 1 kg of nutmeg in the pool.
            </Step>
            <Step number="03" title="James has options he never had before">
              He can hold his NUTMG and wait for the surplus (transparent, trackable).
              Or he can sell some NUTMG immediately for USDC if he needs cash for
              school fees, medical bills, or anything else. Instant liquidity.
            </Step>
            <Step number="04" title="GCNA sells the nutmeg overseas">
              When the pool sells, surplus is automatically distributed to everyone
              holding NUTMG. James gets his share deposited directly — no waiting
              months, no opacity.
            </Step>
          </div>

          <div className="mt-12 p-6 bg-anansi-light rounded-xl border border-anansi-border">
            <p className="font-semibold">The key insight:</p>
            <p className="text-anansi-gray mt-2">
              James signs in with Google. He never sees a wallet, a gas fee, or a
              blockchain. He sees a number on his phone that tells him what his
              nutmeg is worth and a button that turns it into cash.
            </p>
          </div>
        </div>
      </section>

      {/* Multi-Asset Vision */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-anansi-red font-mono text-sm mb-4">BEYOND NUTMEG</p>
        <h2 className="text-3xl font-bold mb-6">
          One platform. Every Caribbean asset.
        </h2>
        <p className="text-anansi-gray max-w-2xl mb-10">
          Spice is built modular. The same system that tokenizes nutmeg can tokenize
          any asset — adding a new commodity, a new island, or a new asset class
          is a configuration change, not a rebuild.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <AssetCard emoji="🫘" title="Agricultural Commodities" items={['Nutmeg (Grenada)', 'Cocoa (Grenada, Trinidad)', 'Coffee (Jamaica)', 'Mace, Spices']} phase="Phase 1" />
          <AssetCard emoji="🏠" title="Real Estate" items={['Beachfront villas', 'Boutique hotels', 'Student housing', 'Fractional ownership']} phase="Phase 2" />
          <AssetCard emoji="🌊" title="Revenue Streams" items={['Tourism revenue', 'Rum distillery cash flows', 'Carbon credits', 'Renewable energy']} phase="Phase 3" />
        </div>
      </section>

      {/* Technology */}
      <section className="bg-anansi-black text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-anansi-red font-mono text-sm mb-4">TECHNOLOGY</p>
          <h2 className="text-3xl font-bold mb-10">Zero friction by design.</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <TechCard
              title="Sign in with Google"
              description="Sui zkLogin creates an invisible blockchain wallet from your Google account. No seed phrases. No wallet apps. No crypto knowledge required."
            />
            <TechCard
              title="Zero gas fees"
              description="Anansi sponsors every transaction. Users never pay fees, never need SUI tokens, never see a gas prompt. The blockchain is invisible."
            />
            <TechCard
              title="Sub-second finality"
              description="Built on Sui — transactions confirm in under a second with fees under $0.003. Fast enough for real-time commodity trading."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Interested in the pilot?
        </h2>
        <p className="text-anansi-gray max-w-lg mx-auto mb-8">
          We're starting with Grenadian nutmeg through GCNA.
          If you're a farmer, buyer, or institutional partner, we'd love to hear from you.
        </p>
        <a
          href="mailto:spice@anansi.tech"
          className="inline-block px-6 py-3 bg-anansi-red text-white rounded-lg font-medium hover:bg-anansi-black transition-colors"
        >
          Get in touch
        </a>
      </section>
    </>
  )
}

function Step({ number, title, children }) {
  return (
    <div className="flex gap-6 items-start">
      <span className="text-3xl font-bold text-anansi-red/30 font-mono shrink-0">
        {number}
      </span>
      <div>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-anansi-gray leading-relaxed">{children}</p>
      </div>
    </div>
  )
}

function AssetCard({ emoji, title, items, phase }) {
  return (
    <div className="p-6 border border-anansi-border rounded-xl">
      <span className="text-2xl">{emoji}</span>
      <h3 className="font-bold mt-3 mb-2">{title}</h3>
      <ul className="text-sm text-anansi-gray space-y-1">
        {items.map((item, i) => (
          <li key={i}>· {item}</li>
        ))}
      </ul>
      <p className="text-xs font-mono text-anansi-red mt-4">{phase}</p>
    </div>
  )
}

function TechCard({ title, description }) {
  return (
    <div className="border border-gray-800 rounded-xl p-6">
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  )
}
