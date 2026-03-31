# Spice — Product Specification

**The Real-World Asset Platform by Anansi Technology Corporation**
**Version 0.1 — Internal Planning Document**

---

## 0. The One Rule That Governs Everything

James is a nutmeg farmer in Grenada. He wakes up at 5am, harvests nutmeg, loads bags onto a truck, and delivers them to the GCNA receiving station. He gets paid his advance in EC$ and goes home.

James does not know what a blockchain is. He does not want to know. He does not have a Sui wallet. He does not have SUI tokens. He does not understand gas fees, seed phrases, or token standards.

James has a phone. He has a Google account. He can tap a button.

**If James cannot use Spice without understanding any of the above, we have failed.**

Every technical decision in this document is subordinate to that constraint. Blockchain is the engine. James never sees the engine. He sees a dashboard that says: "You delivered 47 bags. You earned 4,700 NUTMG. Your current value: $312 USDC. Tap to withdraw."

That's it. That's the product.

---

## 1. What Spice Is

Spice is a real-world asset tokenization platform purpose-built for the Caribbean. It turns physical commodities, property, and revenue streams into tradeable digital tokens that anyone in the world can access.

Spice is a product of Anansi Technology Corporation.

**The name:** Grenada is "The Spice Isle." The word evokes Caribbean richness without limiting the platform to one commodity. When Spice tokenizes cocoa in Trinidad, villas in Antigua, or rum cash flows in Barbados, the name still works. Spice is the flavor of the region, not the description of one crop.

**The thesis:** Billions of dollars in Caribbean value — agriculture, tourism, real estate, natural resources — sit trapped in illiquid, opaque, locally-siloed systems. Spice makes that value liquid, transparent, and globally accessible. A farmer in Grenada gets instant liquidity. An investor in Singapore gets direct exposure to Caribbean commodities. Neither of them needs to understand the infrastructure that connects them.

---

## 2. Industry Context — RWA in 2026

The tokenized RWA market has crossed $12 billion in on-chain value as of March 2026, more than doubling from the prior year. Tokenized U.S. Treasuries alone account for nearly $6 billion. Private credit, real estate, and commodities are growing fast behind them.

What the leading platforms have proven:

**Ondo Finance** (>$2.5B TVL) demonstrated that tokenized yield-bearing instruments can achieve massive scale when they combine regulated issuance with DeFi composability. Their USDY token circulates across nine blockchains as a permissionless yield-bearing stablecoin alternative.

**Securitize + BlackRock BUIDL** ($1.9B) proved that the world's largest asset manager will put real assets on public blockchains when the legal wrapper and custody are right. The key: clear SPV structure, qualified purchaser gating, and institutional-grade custody.

**Centrifuge** pioneered the pooled-asset model for private credit — multiple loans aggregated into a single on-chain pool with tranching. MakerDAO holds over $2B in RWA collateral through structures Centrifuge helped build.

**RealT** proved real estate tokenization for retail investors by wrapping each property in its own LLC and issuing tokens as membership interests. Simple, legally clean, and accessible to non-accredited investors via Reg D/Reg S.

**What none of them have done:** tokenized Caribbean agricultural commodities with direct farmer participation. Spice enters a white space. The infrastructure patterns are proven. The region is untouched.

**Key industry best practices Spice adopts:**

1. **Legal wrapper per asset pool** — each tokenized pool operates through an SPV (Special Purpose Vehicle) or Series LLC, legally isolating assets and liabilities
2. **Permissioned token standards with compliance controls** — transfer restrictions, whitelisting, and KYC enforcement at the smart contract level (industry standard is ERC-3643 on Ethereum; Spice implements equivalent controls natively in Sui Move)
3. **Proof of reserves / attestation** — on-chain verification that physical assets back the tokens (Chainlink's Proof of Reserve pattern, adapted for Spice using GCNA attestations and eventually IoT/satellite data)
4. **Separation of asset tokens from protocol tokens** — NUTMG (the asset token) and CaribCoin (the protocol token) are legally and functionally distinct, following the pattern established by platforms like Centrifuge (which separates CFG governance tokens from pool-specific tokens)
5. **USDC as the settlement layer** — all yield distributions and primary purchases denominated in USDC, avoiding stablecoin risk and regulatory complexity
6. **Account abstraction for onboarding** — zero-wallet, zero-gas-fee experience for end users, following the pattern set by Sui's own ecosystem (45.3 million accounts, up 77x since 2023, largely driven by zkLogin adoption)

---

## 3. The Users

### 3.1 James — The Farmer

James grows nutmeg in St. Andrew's Parish, Grenada. He delivers to GCNA 2-3 times per month during harvest season. He receives an EC$ advance on delivery (this process is unchanged). What he doesn't receive today: any liquidity on the surplus value of his nutmeg until GCNA completes overseas sales — which can take months, and the payout amount is opaque.

**What Spice gives James:**

- Instant digital representation of his surplus claim (NUTMG tokens)
- Ability to sell those tokens immediately for USDC if he needs cash now
- Transparent tracking of pool value and surplus distributions
- All of this through a phone app he logs into with his Google account

**What Spice never asks James to do:**

- Install a crypto wallet
- Buy SUI tokens
- Understand gas fees
- Manage seed phrases
- Read a smart contract

### 3.2 The GCNA Admin

A GCNA staff member responsible for receiving, weighing, grading, and recording nutmeg deliveries. Today this is done on paper or in a basic spreadsheet. The admin is the bridge between the physical commodity and the digital token.

**What the admin does in Spice:**

- Logs into a web dashboard (desktop, at the receiving station)
- Records deliveries: farmer ID, weight, grade, quality notes
- Uploads supporting documents (warehouse receipt, quality cert) — stored on IPFS
- Triggers pool creation and token minting with one button
- Views pool status, total inventory, outstanding tokens, surplus distributions

**What the admin never does:**

- Manage private keys (zkLogin with institutional Google Workspace account)
- Pay gas fees (all transactions are sponsored by Anansi)
- Make pricing decisions (oracle/manual price feed is separate from admin flow)

### 3.3 The Global Buyer

An individual or institutional investor anywhere in the world who wants direct exposure to Caribbean agricultural commodities. Today this is impossible without physical commodity trading relationships, broker accounts, and significant capital.

**What Spice gives the buyer:**

- Fractional, liquid access to commodity pools (buy $50 of NUTMG or $50,000)
- Real-time transparency on pool composition, quality, and value
- Automatic surplus distribution in USDC when the pool sells
- Secondary market trading on Sui DEXs
- Portfolio diversification into uncorrelated, real-world Caribbean assets

**What the buyer needs:**

- A Sui-compatible wallet (for self-custody users) OR a Spice account via zkLogin
- USDC for purchases
- Completed KYC/AML (for regulatory compliance — lightweight, integrated into onboarding)

### 3.4 The Diaspora Investor

A Grenadian, Trinidadian, or Jamaican living in Miami, Brooklyn, Toronto, or London who wants to invest back home but has no practical way to do so. Today, the options are: send remittances (no return), buy property (illiquid, opaque), or nothing.

**What Spice gives them:**

- Direct investment into their home island's productive economy
- Transparent, on-chain proof of what their money backs
- Liquidity — they can exit anytime on secondary markets
- Cultural connection — they're not investing in an abstract fund, they're backing Grenadian nutmeg, Trinidadian cocoa, Jamaican rum

This is the emotional unlock. The diaspora is the largest untapped capital pool for the Caribbean. Spice gives them a way in.

---

## 4. The Zero-Friction Architecture

This is where Sui's native primitives solve the problem that kills most blockchain products: onboarding friction.

### 4.1 zkLogin — No Wallet Required

Sui's zkLogin allows users to authenticate with existing OAuth credentials (Google, Apple, Facebook) and have a blockchain address created behind the scenes using zero-knowledge proofs. The user never sees a seed phrase, never manages a private key, never knows they're "on a blockchain."

**How it works in Spice:**

1. James opens the Spice app on his phone
2. He taps "Sign in with Google"
3. Behind the scenes: Sui generates a zkLogin address tied to his Google credential + a salt. A zero-knowledge proof verifies he is the rightful owner without exposing his Google identity on-chain.
4. James now has a Sui address. He doesn't know this. He sees "Welcome, James."
5. All future transactions are signed using his Google credential — tap to approve, like any mobile app.

**Security model:**
- An attacker who compromises James's Google account still cannot transact without his salt
- An attacker who gets the salt still needs the Google credential
- James can recover via Google password reset (unlike seed phrases, which are permanently lost)
- Privacy: zero-knowledge proofs prevent anyone from linking James's Sui address to his Google identity

**zkLogin is audited.** The public ceremony for generating the cryptographic reference string included 100+ participants. The circuits have been independently audited by two firms specializing in zero-knowledge cryptography.

### 4.2 Sponsored Transactions — No Gas Fees Ever

Sui allows any entity to sponsor gas fees for another user's transactions. Anansi operates a gas station that covers all transaction fees for Spice users.

**What this means:**

- James never pays gas fees
- James never needs SUI tokens
- James never sees a "gas fee" prompt
- The GCNA admin never pays gas fees
- Even global buyers can have their first transactions sponsored during onboarding

**Cost to Anansi:** Sui gas fees average well under $0.003 per transaction. At 1,000 transactions per day, that's under $3/day. At 100,000 transactions per day, it's under $300/day. This is a rounding error compared to the value of frictionless onboarding. Anansi funds the gas station from platform fee revenue (collected in CaribCoin).

### 4.3 The Invisible Blockchain Stack

From the user's perspective, Spice is a mobile app / web app. Period.

| What the user sees | What actually happens |
|---|---|
| "Sign in with Google" | zkLogin creates a Sui address via zero-knowledge proof |
| "You delivered 47 bags" | GCNA admin recorded delivery → minted NUTMG tokens to James's address |
| "Your NUTMG is worth $312" | Oracle price feed × James's token balance |
| "Tap to withdraw $312" | NUTMG tokens are sold on DEX → USDC transferred to James's address → fiat off-ramp to local bank or mobile money |
| "Surplus payment: $45" | Yield engine distributed USDC pro-rata → James's balance updated |
| Transaction fee: (invisible) | Anansi sponsored the gas. CaribCoin micro-fee deducted from pool. |

**The principle:** Every blockchain interaction is abstracted behind a familiar mobile UX. If you removed the word "token" from the entire app, it would feel like a banking app that tracks commodity deliveries and pays you.

---

## 5. The CaribCoin Layer — Blood of the System

### 5.1 What CaribCoin Is (and Isn't)

CaribCoin is to Anansi's ecosystem what UNI is to Uniswap — the protocol token that governs and captures value from the platform's activity.

**Like UNI, CaribCoin:**

- Governs the protocol (voting on fee structures, new asset types, treasury allocation)
- Captures value from protocol activity (fees denominated in or routed through CARIB)
- Is not required for every user interaction (you can use Uniswap without holding UNI; you can use Spice without holding CARIB)
- Accrues value as the protocol grows (more pools → more fees → more CARIB demand)

**Unlike UNI, CaribCoin also:**

- Powers multiple products (Spice, CaribStone, future AI/SaaS tools) — not just one protocol
- Has a cultural dimension (Caribbean identity, community participation, cultural expression)
- Functions as a staking token for priority access and reduced fees across all Anansi products

### 5.2 How CaribCoin Flows Through Spice

CaribCoin operates at the protocol level, not the user level. James never touches CaribCoin unless he chooses to. The fees are embedded in the system.

**Fee structure (v0 — subject to governance):**

| Action | Fee | Denomination | Destination |
|---|---|---|---|
| Pool creation | Fixed fee (e.g., 100 CARIB) | CaribCoin | Treasury |
| Token minting | 0.1% of minted value | CaribCoin (auto-converted from USDC) | 50% burn / 50% treasury |
| Surplus distribution | 1% of distributed yield | CaribCoin (auto-converted) | 50% burn / 50% ecosystem fund |
| Secondary market trade | Standard DEX fees | SUI (Sui network) | Validators |
| Fiat off-ramp | Off-ramp provider fee | USDC | Third-party provider |

**Auto-conversion mechanics:** When a fee is denominated in CaribCoin but the user is interacting in USDC, the protocol automatically swaps the fee amount from USDC to CARIB via DEX liquidity before burning or routing to treasury. The user never sees this. It's one atomic transaction via Sui's Programmable Transaction Blocks (PTBs).

**Why this matters:** Every Spice pool that creates value generates CaribCoin demand. Every surplus distribution burns CaribCoin. Every new asset type (cocoa, villas, rum) added to Spice increases protocol activity and CaribCoin utility. The token doesn't need to be a toll booth — it's the economic gravity that compounds as the network grows.

### 5.3 Staking and Governance

**Staking CARIB provides:**

- Reduced platform fees (e.g., 50% reduction for stakers above a threshold)
- Priority access to new asset pools before public availability
- Governance voting rights on protocol parameters (fee rates, new asset approvals, treasury spending)
- Eligibility for ecosystem rewards (airdrops from the Community & Ecosystem allocation)

**Staking does not provide:**

- Guaranteed yield
- Dividends
- Revenue sharing
- Any promise of returns

This is critical for regulatory positioning. CaribCoin staking is participation-based, not investment-based. It follows the charter.

### 5.4 CaribCoin Across Future Products

| Product | CaribCoin role |
|---|---|
| **Spice** (RWA) | Pool fees, mint fees, yield distribution fees, staking for priority access |
| **CaribStone** (NFTs) | Minting fees, marketplace royalty routing, staking for premium drops |
| **IslandPulse** (AI tourism) | Premium API access, subscription discounts |
| **Anansi Academy** (Education) | Completion rewards, certification staking |
| **DollarBank** (Savings) | Protocol fees on yield, staking for enhanced rates |

One token. Every product. Compounding demand.

### 5.5 How CaribCoin Funds the Mission

CaribCoin is not just infrastructure — it is the primary funding mechanism for Anansi's development. The 10B fixed supply is allocated to serve both ecosystem growth and capital formation, sequenced to ensure tokens are never sold into a vacuum.

**Supply allocation with fundraising roles:**

| Category | % | Tokens | Role | Timing |
|---|---|---|---|---|
| Community & Ecosystem | 40% | 4B | Never sold. Participation rewards, grants, ecosystem programs. | Gradual emission from Spice launch |
| Foundation Treasury | 20% | 2B | Never sold. Long-term stewardship, infrastructure. | Locked under Foundation multi-sig |
| Contributors / Core Team | 15% | 1.5B | Founder + future team. 4-year vest, 1-year cliff. | Vesting begins at mainnet launch |
| Early Backers | 10% | 1B | **SAFT pre-sale** to 15-30 accredited/strategic buyers. Target: $500K–$2M. 6-12 month cliff, 2-3 year vest. | Phase 0–1 (before/during Spice MVP) |
| Public Launch Liquidity | 10% | 1B | **Public token sale + DEX liquidity.** Only after Spice MVP is live with real activity. | Phase 2 (post first surplus distribution) |
| Strategic Partners | 5% | 500M | Not sold. Ecosystem leverage — Sui Foundation, GCNA, exchange listings. | Allocated as partnerships formalize |

**The SAFT model:** A Simple Agreement for Future Tokens is a contract (not the tokens themselves) sold to accredited investors under Reg D 506(c). The SAFT is treated as a security. The tokens delivered later — on a live network with real utility — are utility tokens. This is the structure Filecoin ($257M raise), Solana, and many credible projects used. It works because the legal instrument is the security, not CaribCoin itself.

**The sequencing logic:** SAFT pre-sale funds the build. The Amex salary provides baseline runway. A Sui Foundation grant (applied for in parallel) provides non-dilutive development funding. The public token sale happens only after Spice has real farmers, real pools, and real surplus distributions — so the conversation is "this token already powers a live platform" rather than "buy this and hope we build something."

**Capital stack for Spice development:**

| Source | Amount | Timing |
|---|---|---|
| Amex salary (self-funding) | ~$100K+ effective runway | Now through Phase 1 |
| SAFT pre-sale (Early Backers) | $500K–$2M | Phase 0–1 |
| Sui Foundation grant | $50–$100K | Phase 0–1 |
| Public token sale (Launch Liquidity) | Market-dependent | Phase 2 |
| Equity round (optional) | $2–$10M | Year 2+ (for aggressive scaling) |

---

## 6. Smart Contract Architecture (Sui Move)

### 6.1 Design Principles

1. **Modular factory pattern** — new asset types deploy as new Pool instances from a shared template, not new contracts. Adding COCO takes hours, not weeks.

2. **Object-centric design** — Sui's object model is used to its full potential. Pools are shared objects. Tokens are owned objects. Admin capabilities are transferable objects. This enables fine-grained access control and composability.

3. **Minimal shared objects** — shared objects on Sui require consensus and reduce throughput. Only the Pool registry and yield engine use shared objects. Token balances are owned objects that can be processed in parallel.

4. **Compliance-native** — transfer restrictions, whitelisting, and KYC status are enforced at the contract level, not bolted on later. Following the pattern of ERC-3643 (the industry standard for permissioned tokens on Ethereum), adapted for Sui Move's object model.

5. **Upgradeable** — all contracts use Sui's package upgrade system. Bug fixes and feature additions don't require migration. Upgrade authority is controlled by a multi-sig requiring Foundation + Anansi + independent signer.

6. **Event-driven transparency** — every significant action emits Sui events, enabling off-chain indexing, auditing, and real-time dashboards. Events are the transparency layer that regulators and auditors consume.

### 6.2 Core Modules

**Module 1: `carib_coin.move`**

The CaribCoin token definition. Standard `Coin<CARIB>` following Sui's coin framework.

- Total supply: 10,000,000,000 CARIB, minted at genesis
- Treasury cap held by Foundation multi-sig
- Burn function: callable by yield engine and fee modules
- No additional minting function (supply is permanently fixed)
- Events: Mint, Burn, Transfer

**Module 2: `asset_pool.move`** (the factory)

The generic asset pool module. This is the core innovation — one module that handles any asset type.

- `create_pool()`: Creates a new Pool object with asset metadata (type, unit, custodian, legal wrapper reference, IPFS receipt)
- `mint_tokens()`: Admin-only. Mints asset tokens proportional to delivered quantity. Links to warehouse receipt hash.
- `update_valuation()`: Oracle-fed price update. Manual in MVP, automated later.
- `close_pool()`: Triggers final surplus distribution and marks pool as settled.
- Pool object tracks: total physical inventory (kg), current USD valuation, outstanding token supply, cumulative distributions, custodian attestation hash, legal SPV reference

**For MVP, instantiated as:**
- `NUTMG` — Grenada nutmeg pool
- Each NUTMG token represents a fixed unit claim (e.g., 1 NUTMG = 1 kg of processed nutmeg in the pool)

**For future instantiation:**
- `COCO` — cocoa pools
- `MACE` — mace pools
- `VILLA-001`, `VILLA-002` — individual real estate series
- `RUM-JA-001` — Jamaican rum distillery cash flow pool

**Module 3: `yield_engine.move`**

Handles surplus distribution from asset sales.

- `deposit_surplus()`: GCNA (or any custodian) deposits USDC after overseas sale
- `distribute()`: Calculates pro-rata share for each token holder, deducts CaribCoin fee (auto-converted), distributes USDC
- `claim()`: Token holders claim their distribution (or it's auto-pushed via batched transactions)
- Events: SurplusDeposited, DistributionCalculated, Claimed, FeeCollected, CaribCoinBurned

**Module 4: `compliance.move`**

Permissioned transfer and KYC enforcement.

- `register_user()`: Links a verified identity to a Sui address (KYC provider integration)
- `whitelist()`: Adds address to the approved list for a specific pool or jurisdiction
- `transfer_check()`: Called on every token transfer — verifies both sender and recipient are whitelisted
- `freeze()`: Regulatory freeze capability (required for compliance, used only under legal order)
- Jurisdiction-aware: different pools can have different compliance rules (Reg D for U.S. buyers, Reg S for international, local rules for Caribbean participants)

**Module 5: `platform.move`**

Admin capabilities, access control, and system configuration.

- Admin capability objects (transferable, revocable)
- Fee parameter configuration
- Oracle authorization
- Emergency pause
- Upgrade coordination

### 6.3 Programmable Transaction Blocks (PTBs)

Sui's PTBs allow bundling multiple operations into a single atomic transaction. This is critical for Spice because a typical user action involves multiple steps that must all succeed or all fail:

**Example — James sells his NUTMG for USDC:**

In one atomic transaction:
1. James's NUTMG tokens are sent to the DEX
2. DEX executes swap for USDC
3. CaribCoin fee is auto-converted and burned
4. USDC lands in James's address
5. Gas is paid by Anansi's sponsored transaction

James taps one button. Five on-chain operations execute in under a second. Total gas cost: < $0.003. James sees: "Withdrawal complete. $312 USDC sent to your account."

---

## 7. The Real-World Flow — James's Day

This is the complete flow, from nutmeg tree to USDC in James's pocket.

**Morning: Delivery**

James arrives at the GCNA receiving station in Gouyave with 47 bags of nutmeg. The GCNA weighs and inspects the delivery. James receives his EC$ advance — exactly as he does today. Nothing changes here. The advance is his guaranteed payment, the bedrock of the GCNA system.

**At the station: Digitization**

The GCNA admin opens the Spice dashboard on the station computer. They log in with their GCNA Google Workspace account (zkLogin). They enter: James's farmer ID, 47 bags, 564 kg total weight, Grade A quality. They snap a photo of the warehouse receipt and upload it. The system pins the document to IPFS and records the hash.

The admin clicks "Add to Pool." The system mints 564 NUTMG tokens (1 per kg) to James's Spice address. James's phone buzzes: "You delivered 564 kg of nutmeg. You received 564 NUTMG. Current estimated value: $312 USDC."

**That afternoon: Liquidity (optional)**

James needs cash for his daughter's school fees. He opens the Spice app, sees his 564 NUTMG balance worth $312, and taps "Withdraw." Behind the scenes, 200 NUTMG are swapped for USDC on a Sui DEX. $110 USDC arrives in James's mobile money account via an integrated off-ramp. James keeps 364 NUTMG for the surplus distribution later.

He didn't need to understand any of that. He tapped a button and money appeared.

**Weeks later: Surplus**

GCNA sells the pooled nutmeg to an overseas buyer. After deducting costs and the advance already paid, there's a surplus of $0.28 per kg. GCNA deposits the surplus USDC into the yield engine contract. The contract calculates: James holds 364 NUTMG out of 100,000 total outstanding. His share: $101.92. A 1% CaribCoin fee ($1.02) is auto-converted and burned. $100.90 USDC is deposited to James's Spice balance.

James's phone buzzes: "Surplus payment received: $100.90 USDC."

James's total for this delivery: EC$ advance (unchanged) + $110 from selling NUTMG + $100.90 surplus = significantly more liquidity and faster access than the old system.

**The multiplier:** James used to wait months for surplus that arrived opaquely, if at all. Now he has instant liquidity on the surplus claim and transparent, automatic distribution when the sale completes. This is the value unlock.

---

## 8. Proof of Reserves — Trust Without Trust

The single biggest risk in RWA tokenization is the gap between on-chain tokens and off-chain reality. What if NUTMG tokens exist on-chain but the nutmeg was never delivered? What if the warehouse is empty?

Industry best practice (used by Ondo, BUIDL, and recommended by Chainlink's Proof of Reserve framework): independent, verifiable attestation that the physical asset exists and is held by the custodian.

**Spice's attestation model (evolving over time):**

**MVP (Manual attestation):**
- GCNA admin uploads warehouse receipt + quality certificate at time of delivery
- Documents pinned to IPFS, hash recorded on-chain in the Pool object
- GCNA provides monthly signed attestation of total inventory
- Anansi publishes a public dashboard showing: tokens outstanding vs. attested inventory

**Phase 2 (Third-party audit):**
- Independent auditor (Caribbean accounting firm) performs quarterly physical inventory
- Audit report published on-chain with auditor's digital signature
- Discrepancies trigger automatic alerts

**Phase 3 (IoT + Satellite):**
- Weight sensors at GCNA warehouses feed directly to an on-chain oracle
- Satellite imagery of nutmeg drying stations provides visual verification
- AI model (built by Anansi — this is where the AI/ML expertise creates a genuine moat) analyzes sensor data for anomalies
- Fully automated, continuous proof of reserves

**Why this matters for trust:** Farmers trust GCNA because they've worked with them for decades. Global buyers don't have that history. The attestation chain — from GCNA's warehouse receipt to IPFS to on-chain hash to auditor verification to eventually IoT automation — builds institutional-grade trust incrementally.

---

## 9. Legal Architecture

### 9.1 The Regulatory Reality

NUTMG tokens represent a claim on surplus value from commodity sales. Holders receive USDC distributions proportional to their holdings. Under the Howey test, this looks like a security: there is an investment of money, in a common enterprise, with an expectation of profits, derived from the efforts of others (GCNA's sales efforts).

**This is not a problem to avoid. It is a design constraint to build around.**

The leading RWA platforms (Securitize, Ondo, RealT) all operate within securities frameworks. They succeed because they structure properly, not because they avoid classification.

### 9.2 Proposed Structure

**Per-pool SPV model (following RealT pattern):**

Each Spice asset pool is wrapped in its own legal entity — a Series LLC or SPV (Special Purpose Vehicle). Token holders own membership interests in the SPV. The SPV holds the contractual right to surplus from the commodity pool.

- **NUTMG Pool 001 LLC** — Series A of Anansi RWA Holdings LLC
- **COCO Pool 001 LLC** — Series B
- Each series is legally isolated (liability firewalled)

**Exemptions path:**

| Investor type | Exemption | Access |
|---|---|---|
| U.S. accredited investors | Reg D 506(c) | Full access after verification |
| Non-U.S. persons | Reg S | Full access after jurisdiction check |
| Caribbean residents | Local securities exemptions (varies by jurisdiction) | Designed with local counsel |
| U.S. non-accredited | Not available at launch (future: Reg A+ or Reg CF) | Waitlist |

**CaribCoin is structurally separate.** CaribCoin is a utility token (fee payment, staking, governance, access) — not a claim on any asset pool's surplus. It does not receive distributions. It does not represent ownership in any SPV. This separation is critical and must be maintained in all documentation and marketing.

### 9.3 Legal Budget and Timeline

- Engage crypto-securities attorney: Week 1 of Phase 0
- Entity structure design: Weeks 2-4
- SPV formation (first pool): Weeks 4-6
- Compliance module specification (informed by legal): Weeks 4-6
- Cost: $20,000-$35,000 for initial structuring

**This is not optional. It happens before code.**

---

## 10. The Multi-Asset Expansion

Spice's entire architecture is designed so that adding a new asset type is a configuration exercise, not a rebuild.

### 10.1 The Factory Pattern

Every asset on Spice follows the same template:

1. **Physical asset** → held by a custodian (GCNA, cocoa association, property developer)
2. **Legal wrapper** → SPV or Series LLC per pool
3. **On-chain pool** → `asset_pool.move` instantiated with asset-specific parameters
4. **Token** → fungible Coin representing claims on the pool
5. **Yield mechanism** → surplus/rent/revenue flows through `yield_engine.move`
6. **Compliance** → jurisdiction-specific rules in `compliance.move`
7. **Price oracle** → asset-specific valuation feed

Changing the asset type means changing the parameters, not the code.

### 10.2 The Expansion Roadmap

**Phase 1 — Agricultural commodities (Grenada)**

| Asset | Token | Custodian | Yield source |
|---|---|---|---|
| Nutmeg | NUTMG | GCNA | Export sale surplus |
| Mace | MACE | GCNA | Export sale surplus |
| Cocoa | COCO | Grenada Cocoa Association | Export sale surplus |

These share the same operational pattern, same island, and overlapping institutional relationships. They prove the model replicates.

**Phase 2 — Multi-island agriculture**

| Asset | Token | Island | Custodian |
|---|---|---|---|
| Cocoa | COCO-TT | Trinidad & Tobago | Cocoa Development Company |
| Coffee | COFFEE-JA | Jamaica | Jamaica Coffee Industry Board |
| Rum cash flows | RUM-BB | Barbados | Mount Gay Distillery (or similar) |

Same contracts. Different islands. Each pool has its own SPV. CaribCoin fees increase with every new pool.

**Phase 3 — Real estate and tourism**

| Asset | Token | Model | Yield source |
|---|---|---|---|
| Beachfront villa | VILLA-AG-001 | Fractional ownership via SPV | Rental income |
| Boutique hotel | HOTEL-GD-001 | Revenue-share token | Nightly revenue |
| Tourism experience packages | TOUR-LC-001 | Prepaid access token | Seasonal redemption |

Real estate uses the same `asset_pool.move` and `yield_engine.move` — the pool just tracks a different underlying asset and yield source.

**Phase 4 — Emerging asset classes**

| Asset | Token | Model |
|---|---|---|
| Carbon credits (Caribbean forests) | CARBON-CR | Verified carbon offsets → tokenized |
| Renewable energy (solar micro-grids) | SOLAR-BB | Energy revenue share |
| Government revenue streams | GOV-GD | Tax/fee revenue participation |
| Diaspora remittance pools | REMIT-XX | Pooled remittance yield optimization |

Each new asset class increases CaribCoin demand because every pool pays fees in CARIB. This is the flywheel: more assets → more protocol activity → more CARIB burned → more economic gravity.

### 10.3 The Network Effect Thesis

When Spice has 50 pools across 10 islands, something emergent happens: the Caribbean has a unified, transparent, liquid capital market for the first time in history.

A diaspora investor in Toronto can build a portfolio of: Grenadian nutmeg + Barbadian rum + Antiguan real estate + Jamaican coffee + Trinidadian carbon credits — all from one app, all settled in USDC, all governed by CaribCoin.

No broker. No opaque fund. No minimum $100,000 investment. Just $50 into the productive Caribbean economy, liquid and transparent.

That is the technological revolution. Not the blockchain. Not the token. The access.

---

## 11. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Blockchain | Sui mainnet | Sub-second finality, <$0.003 fees, native zkLogin, sponsored transactions, Move language safety, object-centric model perfect for RWAs |
| Smart contracts | Sui Move | Resource-oriented, formally verifiable, no re-entrancy vulnerabilities by design, upgradeable packages |
| Authentication | Sui zkLogin | Google/Apple login → invisible wallet creation. Zero onboarding friction. Independently audited. |
| Gas abstraction | Sui sponsored transactions + Shinami Gas Station | Users never pay or see gas fees. Anansi funds via platform revenue. |
| Stablecoin | USDC on Sui | Circle-backed, regulated, widely trusted, native Sui support |
| Frontend | React + @mysten/dapp-kit + Tailwind | Mobile-first PWA. Installable on phone without app store. |
| Document storage | IPFS (via Pinata or similar) | Immutable warehouse receipts, quality certs, audit reports |
| Indexing | Sui events + custom indexer | Real-time dashboards, portfolio tracking, audit trail |
| Off-ramp | Integrated fiat off-ramp provider | USDC → EC$ or local currency to bank/mobile money |
| Oracle (MVP) | Manual GCNA input | Price and inventory attestation. Upgrade to Chainlink/IoT in Phase 2-3. |
| KYC/AML | Third-party provider (e.g., Sumsub, Jumio) | Lightweight onboarding, jurisdiction-aware, integrated into Spice sign-up flow |
| Hosting | AWS (cloud-first) | Scalable, Caribbean-edge-friendly, standard DevOps |

---

## 12. MVP Scope — Exactly What Gets Built

### In scope:

- [ ] One nutmeg pool with GCNA (NUTMG token)
- [ ] GCNA admin dashboard (create pool, record delivery, mint tokens, view status)
- [ ] Farmer mobile view (see balance, see value, claim surplus, sell tokens)
- [ ] Global buyer view (browse pool, buy NUTMG with USDC, view yield)
- [ ] zkLogin for all users (Google OAuth)
- [ ] Sponsored transactions for all users (zero gas fees)
- [ ] USDC surplus distribution via yield engine
- [ ] CaribCoin fee collection (auto-conversion + burn)
- [ ] IPFS document storage for warehouse receipts
- [ ] Basic KYC for regulated actions (buy/sell above threshold)
- [ ] Whitelisted addresses for pilot participants
- [ ] Event emission for transparency and indexing
- [ ] Public dashboard showing pool status and proof of reserves

### Not in scope for MVP (deferred to Phase 2+):

- Multiple asset types (nutmeg only in MVP)
- Multiple islands (Grenada only in MVP)
- Complex governance or on-chain voting
- Automated IoT/satellite oracle
- Secondary market DEX (use existing Sui DEXs)
- Legal SPV formation (designed for, attorney engaged, but not incorporated in MVP)
- CaribCoin public launch (CARIB deployed and used internally for fees in MVP; public sale + DEX liquidity in Phase 2 after first surplus distribution proves the loop)
- SAFT token delivery (agreements signed in Phase 0-1; tokens delivered in Phase 2 after mainnet launch)
- Mobile native app (PWA only in MVP)
- Advanced analytics or AI features

### Success criteria:

- 1 live GCNA pool on Sui mainnet
- 10-50 farmers holding NUTMG with active balances
- At least 5 global test buyers holding NUTMG
- At least 1 real surplus distribution in USDC
- CaribCoin fee collection functioning
- Zero users asked to install a wallet or pay gas fees
- James can use it without help after one 10-minute walkthrough

---

## 13. Build Timeline (Solo Founder, Evenings/Weekends)

### Phase 0: Foundations (Weeks 1-8)

| Week | Focus | Deliverable |
|---|---|---|
| 1-2 | Legal + entity | FL LLC filed. Attorney engaged for RWA structure + SAFT. Domains registered. |
| 3-4 | GCNA relationship + fundraise prep | Fly to Grenada. Meet GCNA. Co-design flow. Secure MOU. Identify SAFT targets. Submit Sui Foundation grant. |
| 5-6 | Legal structure + SAFT | SPV design complete. Compliance requirements defined. SAFT term sheet drafted. Begin SAFT conversations. |
| 7-8 | Technical design + fundraise | Final contract architecture. Frontend wireframes. Testnet environment. First SAFT commitments. |

**Funding:** Amex salary. SAFT commitments begin.

### Phase 1: Build (Weeks 9-20)

| Week | Focus | Deliverable |
|---|---|---|
| 9-10 | Core contracts + close SAFT | `carib_coin.move` + `asset_pool.move` on testnet. Close SAFT round ($500K-$2M). |
| 11-12 | Yield + compliance | `yield_engine.move` + `compliance.move` on testnet |
| 13-14 | Frontend (admin) | GCNA dashboard functional on testnet |
| 15-16 | Frontend (farmer + buyer) | Mobile views functional on testnet |
| 17-18 | Integration | zkLogin, sponsored txns, IPFS, KYC provider connected |
| 19-20 | Testing + audit | Testnet pilot with GCNA. Self-audit. External Move audit ($5-8k from SAFT proceeds). |

**Funding:** Amex salary + SAFT proceeds + Sui Foundation grant (if awarded).

### Phase 2: Launch + Public Token Sale (Weeks 21-28)

| Week | Focus | Deliverable |
|---|---|---|
| 21 | Mainnet deploy | Contracts deployed. Admin trained. |
| 22 | Soft launch | First real NUTMG pool minted with GCNA |
| 23-24 | Prove the loop | First surplus distribution. Bug fixes. User feedback. |
| 25 | CaribCoin mainnet | CARIB deployed on mainnet. SAFT tokens delivered (vesting begins). Foundation entity incorporated. |
| 26-27 | Public token sale | Public Launch Liquidity (1B CARIB) deployed to DEX. Launch narrative + community materials published. |
| 28 | Ecosystem activation | Strategic Partner allocations distributed. CaribStone planning begins. Second asset type scoping. |

**Funding:** SAFT proceeds (deployed) + public token sale + Spice platform fees. Evaluate Amex transition.

**Total: ~7 months from decision to live product + public token launch.**

Keep your day job at minimum through Phase 1. The Amex salary is your self-funded runway — worth more than any seed round because it comes with zero dilution and zero pressure. Don't quit until the public token sale provides real capital or Spice revenue justifies full-time commitment.

---

## 14. What Makes This a Revolution, Not a Project

Most RWA tokenization today serves institutional investors accessing treasuries and private credit in developed markets. It's important, but it's optimization of existing financial infrastructure.

Spice does something different: it creates financial infrastructure where none exists.

There is no way for a farmer in Grenada to securitize his commodity surplus today. There is no way for a diaspora Grenadian in Miami to invest $100 in her island's nutmeg economy. There is no transparent, liquid market for Caribbean agricultural commodities at retail scale. There is no unified capital market connecting Caribbean islands.

Spice doesn't optimize. It creates.

And because the architecture is modular — one contract template, one token standard, one compliance framework, one yield engine — it compounds. Every island, every commodity, every asset class added to Spice strengthens the whole network. CaribCoin captures value from every addition. The web grows.

Anansi the spider weaves one thread. Then another. Then a web. Then a world.

That's the revolution.

---

*Anansi Technology Corporation — Weaving threads of intelligence.*
*CaribCoin does not promise returns. Participation is voluntary and involves risk.*
