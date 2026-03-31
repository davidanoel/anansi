# Anansi Technology Corporation — Company Blueprint

**Internal Planning Document — v0.1**
**Status: Pre-launch / Paper planning phase**

---

## 0. What This Document Is

This is the internal north star for Anansi Technology Corporation.

It defines what Anansi is, what it builds, in what order, and why. Every product decision, hiring decision, and fundraising conversation should be traceable back to something in this document.

This is not a pitch deck. It is not a whitepaper. It is the honest, private answer to: "What are we actually building, and how do we get there without killing ourselves?"

---

## 1. The Company

### 1.1 Identity

**Name:** Anansi Technology Corporation (ATC)
**Tagline:** Weaving threads of intelligence
**Incorporation:** Florida LLC (Miami) — convert to C-Corp if/when raising institutional capital
**Founder:** Solo. PhD in Computer Science. Senior AI/ML Cybersecurity Engineer at Fortune 10 financial company. Caribbean-born, Miami-based.

### 1.2 What Anansi Is

Anansi is an AI and software company. Not a crypto company. Not a token company. Not a fintech.

It builds software products that use AI, blockchain, and web technologies where they make sense — not as an identity, but as tools. The blockchain work is one vertical, not the whole company.

This distinction matters for three reasons:

1. **Perception.** Governments, institutional partners, and enterprises take "AI and software company" meetings. They decline "crypto startup" meetings. Anansi needs to sit across the table from the Grenada Cocoa Association, the Caribbean Development Bank, and Sui Foundation. The framing determines which doors open.

2. **Resilience.** If crypto winters hit (they will), Anansi survives on AI/ML consulting, SaaS revenue, and software contracts. The company is not existentially dependent on token prices.

3. **Talent.** The best Caribbean engineers want to work at a technology company, not a token project. Anansi recruits on the strength of the mission and the quality of the engineering, not the promise of token appreciation.

### 1.3 The Mission

**One sentence:** Anansi builds technology that unlocks trapped value in the Caribbean — starting with real-world assets, expanding into AI, education, and culture.

**The longer version:**

The Caribbean participates in the global economy every day — through tourism, agriculture, culture, diaspora remittances, and intellectual output. But most of that value passes through without compounding locally. Coordination across fragmented island economies is hard. Institutional infrastructure is uneven. Talent leaves because opportunity lives elsewhere.

Anansi exists to change that equation. Not by replacing existing institutions, but by building software layers that make coordination easier, capital more accessible, and opportunity more local.

The name matters. Anansi — the spider from West African and Caribbean folklore — is the trickster who outsmarts bigger powers through cleverness, not force. He weaves webs that connect things. He turns nothing into something valuable through storytelling and intelligence. That is exactly what this company does: weave the fragmented Caribbean economy into one connected, programmable, globally accessible network.

### 1.4 What Anansi Is Not

Anansi is not:

- A hedge fund or investment vehicle
- A token project with a company attached
- A consulting shop (though consulting may fund early operations)
- A charity or NGO
- A government contractor (though government partnerships are expected)

Anansi is a product company that builds software people pay to use.

---

## 2. The Architecture — Three Layers

Anansi operates in three distinct layers. Keeping them separate in your head (and in how you talk about them) is critical.

### Layer 1: The Company (Anansi Technology Corporation)

This is the legal entity, the team, the IP, the bank account. It holds everything.

Anansi signs contracts, employs people (eventually), builds products, and makes revenue. It is incorporated in Florida and operates under U.S. law. It may establish Caribbean subsidiaries or foundations as needed for specific products or regulatory requirements.

Revenue comes from:

- Product subscriptions (SaaS)
- Platform fees (RWA issuance, NFT minting)
- AI/ML consulting and contract work
- Education programs
- CaribCoin ecosystem fees (eventually)

### Layer 2: The Products

Each product has its own name, its own users, and its own value proposition. Products are built by Anansi but branded independently. A farmer using Spice doesn't need to know about CaribStone. An artist on CaribStone doesn't need to understand yield engines.

**Current product portfolio (planned):**

| Product | Category | Status | Priority |
|---------|----------|--------|----------|
| **Spice** | Real-World Asset tokenization | Paper planning | **PRIMARY — build first** |
| **CaribStone** | NFT marketplace (Taíno-inspired cultural art) | Concept | Deferred to Phase 2 |
| **IslandPulse** | AI price prediction for tourism | Concept | Deferred |
| **Thryve** | AI mental health companion | Concept | Deferred |
| **Cognicare** | AI platform for therapists | Concept | Deferred |
| **DollarBank** | Web3 savings product | Concept | Deferred |
| **Anansi Academy** | Developer education (AI, Web3) | Concept | Runs informally from day one |

**The rule:** Only one product gets built at a time until it has users and revenue. Everything else stays on paper. The graveyard of solo-founder startups is full of people who tried to build six products simultaneously.

### Layer 3: The Token (CaribCoin)

CaribCoin is not a product. It is infrastructure — the shared economic primitive that flows through every Anansi product, eventually.

CaribCoin is:

- The fee token for Anansi's platforms
- A staking mechanism for participation and governance
- An access key for premium features and experiences
- A cultural coordination tool

CaribCoin is governed by its own charter (see Section 4) and managed through a foundation structure (to be established). It is deployed on the Sui blockchain.

**Critical design principle:** CaribCoin should accrue value from ecosystem activity *naturally*, not because every transaction is forced through a toll booth. Users should be able to do most things with USDC or fiat. CaribCoin creates advantages (lower fees, priority access, governance rights) for those who choose to hold and use it. Coercion kills adoption. Incentives drive it.

---

## 3. Product Detail — Spice (First Priority)

### 3.1 What Spice Is

Spice is a real-world asset (RWA) tokenization platform, purpose-built for Caribbean commodities, real estate, and revenue streams.

**Name rationale:** Grenada is "The Spice Isle." The word evokes the Caribbean without limiting the platform to one asset type. When you tokenize a beachfront villa in Antigua or a rum distillery in Barbados, "Spice" still works — it's the flavor, the richness, the variety of the region.

Spice is a product of Anansi Technology Corporation.

### 3.2 What Spice Does (MVP — Grenada Nutmeg)

The MVP tokenizes one asset: pooled nutmeg through the Grenada Cooperative Nutmeg Association (GCNA).

**The flow (matches existing GCNA operations):**

1. Farmer delivers nutmeg to GCNA
2. GCNA weighs, inspects, pays the usual EC$ advance (unchanged — this is critical)
3. GCNA processes and pools the nutmeg
4. GCNA admin logs the pool in Spice → mints NUTMG tokens → farmers receive their proportional share
5. NUTMG represents a claim on future surplus from the pool (not the advance — that's already paid)
6. Global buyers can purchase NUTMG with USDC for exposure to the pool
7. When GCNA sells the pooled nutmeg overseas, surplus USDC flows to the yield engine contract
8. Surplus is distributed pro-rata to NUTMG holders on-chain
9. Farmers can sell NUTMG at any time for immediate USDC liquidity

**What this unlocks for farmers:** Liquidity they've never had. Today, a farmer delivers nutmeg and waits months for surplus payments (if they come). With Spice, the surplus is tokenized and tradeable immediately. They can sell their NUTMG tokens the same day if they need cash now.

**What this unlocks for global buyers:** Direct, transparent exposure to Caribbean agricultural commodities without intermediaries, brokers, or opaque supply chains.

### 3.3 Technical Architecture (Sui Move)

Four core smart contract modules:

1. **carib_coin.move** — CaribCoin token definition. Standard Coin<CARIB> with controlled mint/burn. 10B total supply. Fee-burn mechanics. Treasury object held by Foundation.

2. **asset_pool.move** — Generic pooled asset module. For MVP, instantiated as NUTMG. Shared Pool object tracks: total commodity in pool (kg), current USD value (oracle-fed), outstanding token supply, IPFS hash of warehouse receipt. GCNA admin calls `create_pool()` and `mint_tokens()` after delivery/processing. Designed to be reused for COCO, MACE, real estate series, etc.

3. **yield_engine.move** — Receives USDC from asset sales → distributes pro-rata surplus to token holders (claim-based). Collects CaribCoin fees on distribution events. Handles fee routing (burn vs. treasury vs. ecosystem fund).

4. **platform.move** — Admin capabilities, access control, event emission for off-chain indexing. Whitelisting for MVP participants.

**Key design decisions:**

- Modular from day one — new asset types deploy as new Pool instances, not new contracts
- Minimal shared objects (Sui best practice for performance)
- Heavy use of events for off-chain indexing and transparency
- All contracts upgradeable via Sui's package system
- No complex DeFi primitives in v0

### 3.4 Frontend

Single-page React app, mobile-first (farmers access via phone):

- **GCNA admin dashboard:** Upload pool data, attach warehouse receipt, mint tokens, view pool status
- **Farmer view:** "You delivered X bags → received Y NUTMG on top of your EC$ advance." Claim button for surplus distributions. Sell button for instant USDC liquidity.
- **Global buyer view:** Browse active pools, buy tokens with USDC, view yield history

Tech stack: React + @mysten/dapp-kit + Tailwind. Sui wallet connect. IPFS for document storage.

### 3.5 What Spice Is NOT (MVP Scope Boundaries)

The MVP does NOT include:

- Multiple asset types (nutmeg only)
- Multiple islands (Grenada only)
- Complex governance or voting
- On-chain KYC (whitelisted addresses for MVP)
- Automated oracle pricing (manual GCNA upload; IoT/satellite later)
- Secondary market / DEX integration (holders trade peer-to-peer or on existing Sui DEXs)
- Legal SPV wrapper (designed for, but not deployed in MVP)

### 3.6 The Hard Part (Non-Technical)

The GCNA relationship is the unlock. Without institutional buy-in from the Grenada Cooperative Nutmeg Association, Spice is theoretical.

**What GCNA needs to believe:**

- Their existing operations don't change (advance payments continue as-is)
- Spice adds liquidity and transparency, it doesn't replace their role
- They retain physical custody and control of the commodity
- The technology is auditable and they understand it
- There's no regulatory risk they're uncomfortable with

**What you need to do before writing code:**

- Travel to Grenada and meet GCNA leadership in person
- Understand their actual operational pain points (not your assumptions)
- Co-design the flow with their staff
- Get written agreement (even informal) to pilot
- Identify the specific person who will be "GCNA admin" in the system

**Timeline reality:** This relationship-building takes 4-8 weeks minimum. It cannot be done remotely. It cannot be shortcut.

### 3.7 Legal Structure (Must Be Designed Before MVP)

NUTMG tokens that represent "future surplus" from commodity sales, with automatic USDC distribution to holders, will likely be classified as securities under the Howey test. The charter's disclaimers do not override economic reality.

**Paths to explore with a crypto-literate attorney:**

- Regulation D (506(c)) exemption for accredited investors (limits retail participation initially)
- Regulation S exemption for non-U.S. persons (Caribbean participants)
- Caribbean regulatory sandbox (Barbados, Bermuda, or Cayman have frameworks)
- SPV/Series LLC wrapper per asset pool
- Utility token carve-out for CaribCoin (separate from NUTMG which is the security-like instrument)

**Key insight:** CaribCoin and NUTMG have very different regulatory profiles. CaribCoin is a utility/participation token (fee payment, staking, access). NUTMG is a commodity-backed instrument with yield distribution. They should be structured and regulated differently. This is actually an advantage — it means CaribCoin can launch broadly while individual asset tokens (NUTMG, COCO, etc.) operate under appropriate exemptions.

**Budget for legal:** $15,000–$30,000 for initial structuring. This is not optional.

### 3.8 Scaling Spice Beyond Nutmeg

Once the nutmeg MVP proves the loop, the same modular contracts support:

| Asset | Island | Partner | Timeline |
|-------|--------|---------|----------|
| Cocoa (COCO) | Grenada | Grenada Cocoa Association | Month 4-6 |
| Mace (MACE) | Grenada | GCNA (already processes mace) | Month 4-6 |
| Tourism revenue streams | Multiple | Hotel groups, tourism boards | Month 9-12 |
| Real estate fractions | Antigua, Barbados | Property developers | Month 12-18 |
| Carbon credits | Multiple | Environmental orgs | Year 2+ |
| Rum distillery cash flows | Jamaica, Barbados | Distilleries | Year 2+ |

Each new asset type is a new Pool instance — same contracts, same yield engine, same frontend patterns. CaribCoin fees increase with every new pool. This is where the flywheel begins.

---

## 4. CaribCoin — The Blood

### 4.1 Charter Summary

CaribCoin is governed by its charter (formerly the tokenX Charter, v0.1). The charter defines:

- Fixed supply of 10,000,000,000 CARIB
- No inflation, no rebasing
- Participation-first design (no promises of returns)
- Free market price discovery
- Foundation stewardship (not ownership)
- On-chain, auditable vesting

The full charter is published separately and should be treated as a binding commitment to participants.

### 4.2 How CaribCoin Flows Through Products

**In Spice (RWA):**

- Pool creation fee: paid in CARIB (small, fixed amount)
- Yield distribution fee: % of surplus routed as CARIB (burn or treasury)
- Staking: stake CARIB for reduced fees, priority access to new pools, or governance signaling
- Optional: farmers receive small CARIB rewards for early participation (ecosystem allocation)

**In CaribStone (NFTs, future):**

- Minting fee: paid in CARIB
- Marketplace royalty routing: portion in CARIB
- Staking: access to premium artist drops or curated collections

**In AI/SaaS products (future):**

- Premium subscription tier: payable in CARIB at a discount
- API credits: purchasable with CARIB
- Academy completion rewards: earn CARIB for finishing courses

**In all products:**

- CARIB is never the *only* payment method — USDC and fiat are always accepted
- CARIB provides advantages (discounts, priority, governance) for those who hold and use it
- This creates organic demand without coercion

### 4.3 Supply Allocation & Fundraising Roles

| Category | % | Tokens | Fundraising Role | Timing |
|----------|---|--------|-----------------|--------|
| Community & Ecosystem | 40% | 4,000,000,000 | **Never sold.** Distributed through participation rewards, grants, ecosystem programs over years. | Gradual emission, starting at Spice launch |
| Foundation Treasury | 20% | 2,000,000,000 | **Never sold.** Long-term stewardship, infrastructure funding, emergency reserves. | Locked. Controlled by Foundation multi-sig. |
| Contributors / Core Team | 15% | 1,500,000,000 | **Founder + future team allocation.** 4-year vest, 1-year cliff. Not liquid at launch. | Vesting begins at CaribCoin mainnet launch |
| Early Backers | 10% | 1,000,000,000 | **SAFT pre-sale.** Sold to 15-30 accredited/strategic buyers before product launch. Target raise: $500K–$2M. 6-12 month cliff, 2-3 year linear vest. | Phase 0–1 (before or during Spice MVP build) |
| Public Launch Liquidity | 10% | 1,000,000,000 | **Public token sale + DEX liquidity.** Sold only AFTER Spice MVP is live with real activity. This is the "ICO" — but backed by a working product. | Phase 2 (after first surplus distribution) |
| Strategic Partners | 5% | 500,000,000 | **Not sold. Allocated for ecosystem leverage.** Sui Foundation partnership tokens, GCNA partnership allocation, exchange listing reserves, future institutional partners. | Allocated as partnerships formalize |

### 4.4 Fundraising Strategy — How CaribCoin Funds the Mission

CaribCoin serves a dual purpose: it is the protocol token that powers Anansi's ecosystem, and it is the primary mechanism for funding the company's development. But the sequencing of how and when tokens are sold is the difference between building a credible project and creating regulatory exposure.

**The core principle:** Never sell tokens into a vacuum. Every token sale should correspond to a real milestone — either approaching or already achieved.

**Fundraising Phase 1: SAFT Pre-Sale (During Phase 0–1)**

A SAFT (Simple Agreement for Future Tokens) is a contract — not the tokens themselves — sold to accredited investors. The SAFT is a security (and is treated as one, filed under Reg D 506(c)). The tokens delivered later are utility tokens on a live network.

This is the Filecoin/Solana model. It works because:
- The legal instrument (SAFT) is the security, not the token
- Buyers are accredited and understand the risk
- Tokens aren't delivered until the network has real utility
- The charter's "no promises" language aligns with the SAFT structure

Target: 15-30 strategic buyers from the Early Backers allocation (10% / 1B CARIB).
Raise: $500K–$2M.
Vesting: 6-12 month cliff after token delivery, 2-3 year linear vest.
Use of funds: Legal structuring ($20-35K), Grenada trips and GCNA partnership development, Move audit ($5-8K), infrastructure costs, gas station funding, and runway to reduce dependence on the day job.

**Who to sell to (in priority order):**
1. Caribbean and diaspora founders/operators who understand the mission
2. Sui ecosystem participants (validators, builders, fund managers)
3. RWA-focused crypto funds
4. Accredited individuals with Caribbean connection
5. Angel investors with crypto/fintech backgrounds

**Who NOT to sell to:**
- Anyone who asks "when moon?" first
- Anonymous buyers who won't do KYC
- Anyone seeking a quick flip (the vesting prevents this, but filter at the door too)

**Fundraising Phase 2: Sui Foundation Grant (Parallel)**

Sui actively funds ecosystem development. An RWA platform tokenizing Caribbean commodities on Sui — using zkLogin, sponsored transactions, and Move — is exactly the kind of differentiated, real-world use case the Foundation wants to showcase. A $50-100K grant could fund 6+ months of development costs without selling a single token or diluting equity.

Apply during Phase 0 with: Spice product spec, technical architecture, team background, Caribbean impact thesis.

**Fundraising Phase 3: Public Token Sale (After Spice MVP is Live)**

Only after Spice has real activity — at least one GCNA pool, at least one surplus distribution, real farmers holding NUTMG — does CaribCoin go public.

This uses the Public Launch Liquidity allocation (10% / 1B CARIB).

The sale is structured as:
- Direct public offering on Sui DEX (provide initial liquidity pool: CARIB/USDC)
- Possible launchpad partnership (Sui ecosystem launchpads)
- Accompanied by the launch narrative, charter, and community materials already prepared

By this point, the pitch is not "buy this token and hope we build something." It is: "This token already powers fees on a live platform with real farmers, real commodities, and real yield distributions. Here is the on-chain proof."

That is a fundamentally different conversation — with regulators, with buyers, and with the market.

**Fundraising Phase 4: Equity Round (Optional, Year 2+)**

If Anansi needs institutional capital for aggressive expansion (multiple islands, team of 10+, AI product development), a traditional equity round (seed or Series A) may be appropriate. This is separate from token sales and funds the company, not the protocol.

At this stage, Anansi has: a live product, revenue from platform fees, a growing token ecosystem, and institutional partnerships. The equity story is: "We're the operating system for the tokenized Caribbean economy. Here's the traction. Help us scale."

**Capital Stack Summary:**

| Source | Amount | Timing | What it funds |
|--------|--------|--------|---------------|
| Amex salary (self-funding) | ~$100K+ equivalent runway | Now through Phase 1 | Everything until external capital arrives |
| SAFT pre-sale (Early Backers) | $500K–$2M | Phase 0–1 | Legal, partnerships, infrastructure, audits, partial runway |
| Sui Foundation grant | $50–$100K | Phase 0–1 | Development costs, gas station, ecosystem integration |
| Public token sale (Launch Liquidity) | Market-dependent | Phase 2 (post-MVP) | DEX liquidity, ecosystem growth, Foundation capitalization |
| Strategic partner allocations | Non-cash (token allocations) | Ongoing | Sui Foundation, GCNA, exchange listings, institutional partners |
| Equity round (optional) | $2–$10M | Year 2+ | Team scaling, multi-island expansion, AI product development |

### 4.5 When to Launch CaribCoin (Revised Sequence)

**Not before Spice MVP is live.** But the groundwork happens earlier.

1. **Phase 0:** SAFT agreements signed with Early Backers (tokens not delivered yet)
2. **Phase 0:** Sui Foundation grant application submitted
3. **Phase 1:** CaribCoin contracts deployed on Sui testnet; integrated with Spice testnet
4. **Phase 1:** Spice MVP goes live on mainnet (USDC-only initially for user-facing transactions; CARIB fees active internally)
5. **Phase 2:** First surplus distribution completed — proof the system works
6. **Phase 2:** CaribCoin launches on mainnet; SAFT tokens delivered to Early Backers (vesting begins)
7. **Phase 2:** Public Launch Liquidity deployed to DEX (CARIB/USDC pool)
8. **Phase 2:** Launch narrative, charter, and community materials published
9. **Phase 2:** Strategic Partner allocations distributed as partnerships formalize

### 4.6 The CaribCoin Foundation

A separate foundation entity (likely Caribbean-incorporated) should steward CaribCoin. This provides:

- Legal separation between Anansi (the company) and CaribCoin (the network)
- Credibility that the token isn't just a corporate instrument
- Governance pathway as the ecosystem matures

The Foundation holds the treasury allocation, funds grants, and maintains protocol infrastructure. It does not control price, promise returns, or override market activity.

**Timing:** Establish the Foundation before CaribCoin mainnet launch.

---

## 5. Product Roadmap — Sequenced for a Solo Founder

### Phase 0: Paper & Foundations (Now — 8 weeks)

**Goal:** Complete planning. Establish legal structure. Begin GCNA relationship. Begin SAFT fundraise.

- [ ] Finalize this blueprint
- [ ] File Florida LLC for Anansi Technology Corporation
- [ ] Register domain: spice.xyz / spiceapp.io / getspice.app (or similar)
- [ ] Register domain: anansitech.com (or similar)
- [ ] Engage crypto-literate attorney for RWA token structure + SAFT agreements
- [ ] Travel to Grenada — meet GCNA leadership
- [ ] Co-design Spice flow with GCNA staff
- [ ] Secure written pilot agreement (even informal MOU)
- [ ] Write Spice Product Spec (detailed, not this overview)
- [ ] Write CaribCoin Economic Design document
- [ ] Identify and approach 15-30 SAFT pre-sale targets
- [ ] Begin SAFT conversations (target: first commitments before Phase 1)
- [ ] Submit Sui Foundation grant application

**Funding during this phase:** Amex salary. SAFT commitments begin (funds may not close until early Phase 1).

### Phase 1: Spice MVP (Weeks 9-20)

**Goal:** One live NUTMG pool on Sui mainnet with real GCNA data. Close SAFT round.

- [ ] Close SAFT pre-sale ($500K–$2M from Early Backers allocation)
- [ ] Deploy Sui Move contracts to testnet (including CaribCoin)
- [ ] Build React frontend (mobile-first)
- [ ] GCNA admin onboarding and training
- [ ] Testnet pilot with GCNA (simulated data)
- [ ] Security review (self-audit + one external Move audit)
- [ ] Mainnet deployment
- [ ] First real NUTMG pool minted
- [ ] 10-50 farmers + test buyers holding NUTMG
- [ ] First real surplus distribution in USDC

**Funding during this phase:** Amex salary + SAFT proceeds + Sui Foundation grant (if awarded). SAFT funds used for: legal ($20-35K), Move audit ($5-8K), infrastructure, gas station, Grenada travel.

### Phase 2: CaribCoin Public Launch + Expansion (Months 6-12)

**Goal:** Launch CaribCoin publicly. Execute public token sale. Expand Spice. Begin community building.

- [ ] Establish CaribCoin Foundation (Caribbean jurisdiction)
- [ ] Deploy CaribCoin on Sui mainnet
- [ ] Deliver SAFT tokens to Early Backers (vesting begins)
- [ ] Integrate CARIB fees into Spice
- [ ] Execute public token sale (Public Launch Liquidity allocation — 1B CARIB)
- [ ] Provide DEX liquidity (CARIB/USDC pool)
- [ ] Launch narrative + community (use the existing charter, threads, and content)
- [ ] Add COCO pool (Grenada Cocoa Association)
- [ ] Begin conversations with second island partner
- [ ] Launch CaribStone MVP (Taíno-inspired NFT marketplace)
- [ ] Begin Anansi Academy (informal — workshops, content, mentoring)
- [ ] Allocate Strategic Partner tokens (Sui Foundation, GCNA, exchange reserves)

**Funding during this phase:** SAFT proceeds (ongoing deployment) + public token sale revenue + Spice platform fees (small but growing). This is the inflection point — if the public sale succeeds and Spice has traction, consider reducing Amex hours or transitioning to full-time founder.

### Phase 3: Regional Scale (Year 2)

**Goal:** Multiple islands, multiple asset types, growing team.

- [ ] 5+ islands with active Spice pools
- [ ] 10+ asset types tokenized
- [ ] CaribStone established with active artist community
- [ ] Anansi Academy producing trained developers
- [ ] First AI product (IslandPulse or Cognicare) in beta
- [ ] Team of 3-5 engineers
- [ ] Series A or equivalent fundraise

**Funding during this phase:** Platform fees at scale. SaaS subscriptions. Consulting. Token ecosystem activity. Equity round (Series A or equivalent) if aggressive scaling is warranted — this funds the company, not the token.

### Phase 4: Global Expansion (Year 3+)

**Goal:** Caribbean is the most tokenized region on Earth. Anansi is the operating system.

- [ ] Spice operating across the Caribbean
- [ ] AI products (IslandPulse, Thryve, Cognicare) serving global markets
- [ ] CaribCoin listed on major exchanges
- [ ] Government partnerships for revenue stream tokenization
- [ ] DollarBank or similar savings product live
- [ ] Anansi recognized as the leading Caribbean technology company

---

## 6. Competitive Moat

What makes Anansi defensible over time:

**Cultural authenticity.** No Silicon Valley company will out-Caribbean you. The name, the brand, the relationships, the understanding of how island economies actually work — this is not replicable by a team that learned about the Caribbean from a market research deck.

**Institutional relationships.** GCNA, cocoa associations, tourism boards, Caribbean governments — these relationships take years to build. They are your moat against fast-followers.

**AI/ML depth.** Your PhD and Amex experience give you credibility in AI that most crypto founders lack. When you build IslandPulse or Cognicare, it's not a wrapper around an API — it's real engineering. This differentiates Anansi from pure Web3 plays.

**Regulatory head start.** By designing legal compliance into v0 (SPV wrappers, proper token classification, foundation structure), you create a barrier that move-fast-break-things competitors can't easily clear.

**Network effects.** Every new island, every new asset type, every new pool increases CaribCoin demand. Every trained developer from Anansi Academy becomes a potential builder on Spice. Every artist on CaribStone brings cultural legitimacy. The web compounds.

---

## 7. Risk Register

| Risk | Severity | Mitigation |
|------|----------|------------|
| GCNA declines to partner | Critical | Have backup partners identified (cocoa association, smaller cooperatives). But GCNA is the ideal first partner — don't give up easily. |
| NUTMG classified as security | High | Design legal structure proactively. Separate NUTMG (security-like) from CaribCoin (utility). Work with attorney before code. |
| SAFT round fails to raise target | High | Self-fund via Amex salary (slower but viable). Reduce scope to bare MVP. Pursue Sui Foundation grant aggressively. The product can launch without SAFT — it just takes longer. |
| Public token sale underperforms | Medium | Don't depend on public sale for operational funding. By Phase 2, SAFT + salary + grant should have already funded the MVP. Public sale is growth capital, not survival capital. |
| CaribCoin SAFT triggers SEC scrutiny | Medium | SAFT is a known, well-precedented structure (Filecoin raised $257M via SAFT). File under Reg D 506(c). Work with experienced crypto-securities attorney. Do not sell to non-accredited U.S. buyers pre-launch. |
| Crypto winter / market collapse | High | Anansi is a software company first. Consulting and SaaS revenue sustain operations. Don't over-index on token value. SAFT with vesting protects against early dumping. |
| Solo founder burnout | High | Keep your Amex job until Spice has real traction. Don't build six products. Phase ruthlessly. SAFT capital can fund contractors for specific tasks. |
| Sui blockchain risk (technical or adoption) | Medium | Design contracts to be chain-agnostic in logic. Migrate to alternative L1/L2 if needed. |
| Caribbean regulatory uncertainty | Medium | Engage regulators early. Work within existing sandboxes. The Foundation structure provides flexibility. |
| Competitors copy the model | Low (short-term) | Relationships and cultural authenticity can't be forked. Move fast on partnerships. |

---

## 8. What Success Looks Like

### 12 months from now:

- One live GCNA nutmeg pool with real farmers holding NUTMG
- At least one successful surplus distribution in USDC
- SAFT round closed ($500K–$2M raised from Early Backers)
- CaribCoin live on Sui mainnet with DEX liquidity
- Public token sale completed (Public Launch Liquidity deployed)
- 100+ community participants (not all token holders — builders, creators, critics)
- Second asset type in pipeline
- Legal structure established and clean
- Foundation entity incorporated

### 36 months from now:

- 5+ Caribbean islands with active Spice pools
- CaribStone operational with Caribbean artist community
- First AI product generating SaaS revenue
- Team of 5+
- CaribCoin on at least one major exchange
- Anansi Academy training developers
- Government partnerships active

### The real measure:

When a farmer in Grenada can deliver nutmeg on Monday and have liquidity in their wallet by Tuesday — and when that same system works for a cocoa farmer in Trinidad, a villa owner in Antigua, and a rum distiller in Jamaica — Anansi has done what it set out to do.

---

## 9. Decisions to Make Now

Before anything else, the founder must decide:

1. **Company name confirmation.** Anansi Technology Corporation. Decided.

2. **First product name confirmation.** Spice. Decided.

3. **When to leave Amex.** Not yet. Not until Spice MVP is live and the public token sale or equity round provides runway. The salary is your self-funding mechanism — it's worth ~$100K+ in effective runway. Earliest realistic transition: after Phase 2 public token sale, if traction warrants it.

4. **Legal budget.** Allocate $20,000-$35,000 for initial structuring (RWA token structure + SAFT agreements + Foundation formation). This comes from SAFT proceeds or personal savings. This is not optional and should happen before code.

5. **Grenada trip.** Book it. The GCNA relationship is the single most important dependency in the entire plan.

6. **SAFT pricing.** Work with attorney to determine CARIB valuation for SAFT pre-sale. This sets the implied fully-diluted valuation. Common approach: price at a significant discount to projected public sale price, reflecting the risk early backers take. Typical SAFT discounts: 30-60% below anticipated public price.

7. **SAFT target list.** Begin identifying the 15-30 people you'd approach for the pre-sale. Start with people who understand the Caribbean, understand crypto, and won't flip at unlock. The quality of your early backers shapes the quality of your community.

8. **Sui Foundation grant.** Prepare application materials in parallel with Phase 0. This is free money with ecosystem benefits — no reason not to pursue it.

---

## 10. What This Blueprint Does NOT Cover (Future Documents Needed)

- **Spice Product Specification** — detailed user flows, wireframes, data model, API design *(completed — see spice_product_spec.md)*
- **CaribCoin Economic Design** — token flow diagrams per product, fee structures, staking mechanics, supply release schedule tied to milestones
- **Legal Structure Memo** — output of attorney engagement, entity structure, compliance framework, SAFT template
- **GCNA Partnership Proposal** — the document you bring to Grenada
- **SAFT Term Sheet** — standard terms for Early Backer pre-sale (attorney-drafted)
- **Sui Foundation Grant Application** — ecosystem impact narrative, technical plan, budget
- **Pitch Deck** — for SAFT conversations and future equity rounds
- **CaribStone Product Specification** — deferred to Phase 2
- **AI Product Specifications** — deferred to Phase 3+

---

*This is a living document. Update it as decisions are made and reality intervenes.*

*Anansi Technology Corporation — Weaving threads of intelligence.*
