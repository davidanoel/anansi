export const metadata = {
  title: "Spice — Real-World Asset Tokenization | Anansi",
  description:
    "Tokenize commodities, real estate, and revenue streams. Starting with Caribbean agriculture, scaling globally.",
};

const ASSET_CATEGORIES = [
  {
    phase: "Now",
    title: "Agriculture",
    items: ["Grenada Nutmeg, Cocoa", "Jamaica Coffee", "Mace", "Spices"],
  },
  {
    phase: "Next",
    title: "Real Estate",
    items: ["Caribbean Villas", "Boutique Hotels", "Fractional Ownership", "Diaspora Investment"],
  },
  {
    phase: "Future",
    title: "Revenue Streams",
    items: ["Rum Distillery Cash Flows", "Tourism Revenue", "Carbon Credits", "Renewable Energy"],
  },
];

export default function SpicePage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-40 pb-20 max-w-[1200px] mx-auto px-6 md:px-12">
        <div className="reveal">
          <p className="text-[10px] tracking-[0.25em] uppercase text-anansi-red font-medium mb-7">
            Spice — by Anansi
          </p>
          <h1 className="font-display font-bold text-[clamp(40px,5.5vw,72px)] leading-[1.05] max-w-[700px]">
            Real-world assets.
            <br />
            <span className="text-anansi-red">Global liquidity.</span>
          </h1>
          <p className="text-[18px] text-anansi-gray mt-8 max-w-[560px] leading-[1.75]">
            Spice turns physical commodities, property, and revenue streams into tradeable digital
            tokens that anyone in the world can access. No wallet required. No crypto experience
            needed.
          </p>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-anansi-white text-anansi-black border-y border-anansi-line-light">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-24">
          <div className="reveal">
            <p className="text-[10px] tracking-[0.25em] uppercase text-anansi-red font-medium mb-7">
              How It Works
            </p>
            <h2 className="font-display font-bold text-3xl mb-12">
              James is a nutmeg farmer in Grenada.
            </h2>
          </div>

          <div className="space-y-0 reveal">
            {[
              {
                num: "01",
                title: "James delivers nutmeg to GCNA",
                body: "Same process as always. GCNA weighs, inspects, and pays the EC$ advance. Nothing changes for James here.",
              },
              {
                num: "02",
                title: "GCNA records the delivery on Spice",
                body: "The receiving officer enters the delivery into Spice. James receives NUTMEG tokens on his phone — each representing 1 kg of nutmeg in the pool.",
              },
              {
                num: "03",
                title: "James has options he never had before",
                body: "He can hold his NUTMEG and wait for the surplus (transparent, trackable). Or he can sell some NUTMEG immediately for USDC if he needs cash now. Instant liquidity.",
              },
              {
                num: "04",
                title: "GCNA sells the nutmeg overseas",
                body: "When the pool sells, surplus is automatically distributed to everyone holding NUTMEG. James gets his share deposited directly — no waiting months, no opacity.",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="flex gap-6 items-baseline py-8 border-b border-anansi-line-light first:border-t"
              >
                <span className="font-display font-bold text-2xl text-anansi-red/20 shrink-0">
                  {step.num}
                </span>
                <div>
                  <h3 className="font-display font-semibold text-lg mb-1">{step.title}</h3>
                  <p className="text-[#555] leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-8 bg-anansi-black/[0.03] rounded-lg border border-anansi-line-light reveal">
            <p className="font-display font-semibold">The key insight:</p>
            <p className="text-[#555] mt-2 leading-relaxed">
              James signs in with Google. He never sees a wallet, a gas fee, or a blockchain. He
              sees a number on his phone that tells him what his nutmeg is worth and a button that
              turns it into cash.
            </p>
          </div>
        </div>
      </section>

      {/* Multi-Asset */}
      <section className="py-24 max-w-[1200px] mx-auto px-6 md:px-12">
        <div className="reveal">
          <p className="text-[10px] tracking-[0.25em] uppercase text-anansi-red font-medium mb-7">
            Beyond Nutmeg
          </p>
          <h2 className="font-display font-bold text-3xl mb-3">One platform. Every asset class.</h2>
          <p className="text-anansi-gray max-w-[540px] mb-12">
            The same system that tokenizes nutmeg can tokenize any real-world asset. Adding a new
            commodity, a new country, or a new asset class is a configuration change, not a rebuild.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-anansi-line reveal-stagger">
          {ASSET_CATEGORIES.map((card) => (
            <div key={card.title} className="bg-anansi-deep p-10">
              <p className="text-[9px] tracking-[0.25em] uppercase text-anansi-red mb-5 font-medium">
                {card.phase}
              </p>
              <h3 className="font-display font-bold text-[22px]">{card.title}</h3>
              <ul className="mt-5 space-y-2.5 text-[14px] text-anansi-gray leading-relaxed">
                {card.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-[0.45rem] h-1.5 w-1.5 rounded-full bg-anansi-red/70 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Technology */}
      <section className="bg-anansi-deep border-t border-anansi-line">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-24">
          <div className="reveal">
            <p className="text-[10px] tracking-[0.25em] uppercase text-anansi-red font-medium mb-7">
              Technology
            </p>
            <h2 className="font-display font-bold text-3xl mb-12">Zero friction by design.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-anansi-line reveal-stagger">
            {[
              {
                title: "Sign in with Google",
                body: "Sui zkLogin creates an invisible blockchain wallet from your Google account. No seed phrases. No wallet apps. No crypto knowledge required.",
              },
              {
                title: "Zero gas fees",
                body: "Anansi sponsors every transaction. Users never pay fees, never need SUI tokens, never see a gas prompt. The blockchain is invisible.",
              },
              {
                title: "Sub-second finality",
                body: "Built on Sui — transactions confirm in under a second with fees under $0.003. Fast enough for real-time commodity trading.",
              },
            ].map((card, i) => (
              <div key={i} className="bg-anansi-black p-10">
                <h3 className="font-display font-bold text-lg mb-3">{card.title}</h3>
                <p className="text-anansi-gray text-[14px] leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center max-w-[1200px] mx-auto px-6 md:px-12">
        <div className="reveal">
          <h2 className="font-display font-bold text-3xl mb-4">Interested in the pilot?</h2>
          <p className="text-anansi-gray max-w-lg mx-auto mb-10">
            We're starting with Grenadian nutmeg through GCNA. If you're a farmer, buyer, or
            institutional partner, we'd love to hear from you.
          </p>
          <a
            href="mailto:spice@anansi.tech"
            className="inline-flex items-center gap-3 px-9 py-4
                       font-display font-semibold text-[13px] tracking-[0.1em] uppercase
                       text-anansi-black bg-anansi-red text-white border border-anansi-red rounded-sm
                       hover:bg-[#5a0b10] transition-all group"
          >
            Get in touch <span className="transition-transform group-hover:translate-x-1">?</span>
          </a>
        </div>
      </section>
    </>
  );
}
