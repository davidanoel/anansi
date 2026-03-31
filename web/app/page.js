import Link from 'next/link'

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-3xl">
          <p className="text-anansi-red font-mono text-sm mb-4">ANANSI TECHNOLOGY CORPORATION</p>
          <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight">
            Building technology that unlocks
            <span className="text-anansi-red"> trapped value</span> in the Caribbean.
          </h1>
          <p className="text-xl text-anansi-gray mt-6 max-w-2xl leading-relaxed">
            Real-world asset tokenization. AI. Cultural infrastructure.
            Starting with the Caribbean, scaling globally.
          </p>
          <div className="flex gap-4 mt-8">
            <Link
              href="/spice"
              className="px-6 py-3 bg-anansi-black text-white rounded-lg font-medium hover:bg-anansi-red transition-colors"
            >
              Explore Spice
            </Link>
            <Link
              href="/caribcoin"
              className="px-6 py-3 border border-anansi-border rounded-lg font-medium hover:border-anansi-black transition-colors"
            >
              CaribCoin
            </Link>
          </div>
        </div>
      </section>

      {/* The Thesis */}
      <section className="bg-white border-y border-anansi-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-anansi-red font-mono text-sm mb-4">THE THESIS</p>
          <h2 className="text-3xl font-bold mb-6">
            The Caribbean participates globally. Value rarely compounds locally.
          </h2>
          <div className="grid md:grid-cols-2 gap-12 mt-8">
            <div>
              <p className="text-anansi-gray leading-relaxed">
                Billions flow through the region every year — tourism, agriculture,
                culture, diaspora remittances. But most of that value passes through
                without staying. Coordination across fragmented island economies is hard.
                Institutional infrastructure is uneven.
              </p>
              <p className="text-anansi-gray leading-relaxed mt-4">
                Anansi exists to change that equation. Not by replacing existing institutions,
                but by building software layers that make coordination easier, capital more
                accessible, and opportunity more local.
              </p>
            </div>
            <div className="space-y-6">
              <Stat number="$30B+" label="Annual Caribbean tourism revenue" />
              <Stat number="$10B+" label="Annual diaspora remittances" />
              <Stat number="40-50%" label="Unbanked Caribbean adults" />
              <Stat number="0" label="Liquid markets for Caribbean agricultural assets" />
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-anansi-red font-mono text-sm mb-4">PRODUCTS</p>
        <h2 className="text-3xl font-bold mb-10">One company. Multiple threads.</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <ProductCard
            title="Spice"
            status="Building"
            description="Real-world asset tokenization for Caribbean commodities, real estate, and revenue streams. Starting with Grenadian nutmeg."
            href="/spice"
            accent
          />
          <ProductCard
            title="CaribStone"
            status="Planned"
            description="NFT marketplace celebrating Caribbean and indigenous Taíno art. Cultural preservation through digital ownership."
          />
          <ProductCard
            title="AI / SaaS"
            status="Planned"
            description="IslandPulse (tourism AI), Cognicare (therapist tools), Anansi Academy (developer education). Caribbean-built, globally scalable."
          />
        </div>
      </section>

      {/* CaribCoin callout */}
      <section className="bg-anansi-black text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-anansi-red font-mono text-sm mb-4">CARIBCOIN</p>
            <h2 className="text-3xl font-bold mb-4">
              The protocol token that powers everything Anansi builds.
            </h2>
            <p className="text-gray-400 leading-relaxed">
              CaribCoin (CARIB) is the economic primitive that flows through every product —
              from Spice platform fees to CaribStone minting to AI subscriptions.
              Fixed supply. Deflationary burns. Participation, not promises.
            </p>
            <Link
              href="/caribcoin"
              className="inline-block mt-6 px-6 py-3 border border-gray-600 rounded-lg font-medium hover:border-white transition-colors"
            >
              Read the Charter →
            </Link>
          </div>
        </div>
      </section>

      {/* Why Anansi */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-anansi-red font-mono text-sm mb-4">THE NAME</p>
        <h2 className="text-3xl font-bold mb-6">Why Anansi?</h2>
        <div className="max-w-2xl">
          <p className="text-anansi-gray leading-relaxed">
            Anansi is the spider from West African and Caribbean folklore — the trickster
            who outsmarts bigger powers through cleverness, not force. He weaves webs
            that connect things. He turns nothing into something valuable through
            storytelling and intelligence.
          </p>
          <p className="text-anansi-gray leading-relaxed mt-4">
            That is exactly what this company does: weave the fragmented Caribbean
            economy into one connected, programmable, globally accessible network.
            The spider in our logo is also a human figure with raised hands —
            inspired by indigenous Carib stone carvings found across the region.
            Technology rooted in culture.
          </p>
        </div>
      </section>
    </>
  )
}

function Stat({ number, label }) {
  return (
    <div className="border-l-2 border-anansi-red pl-4">
      <p className="text-2xl font-bold">{number}</p>
      <p className="text-sm text-anansi-gray">{label}</p>
    </div>
  )
}

function ProductCard({ title, status, description, href, accent }) {
  const Wrapper = href ? Link : 'div'
  return (
    <Wrapper
      href={href || '#'}
      className={`block p-6 rounded-xl border transition-all ${
        accent
          ? 'border-anansi-red/30 bg-anansi-red/[0.03] hover:border-anansi-red'
          : 'border-anansi-border hover:border-anansi-gray'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">{title}</h3>
        <span className={`text-xs font-mono px-2 py-1 rounded-full ${
          status === 'Building'
            ? 'bg-anansi-red/10 text-anansi-red'
            : 'bg-anansi-light text-anansi-gray'
        }`}>
          {status}
        </span>
      </div>
      <p className="text-sm text-anansi-gray leading-relaxed">{description}</p>
      {href && (
        <p className="text-sm font-medium mt-4 text-anansi-red">Learn more →</p>
      )}
    </Wrapper>
  )
}
