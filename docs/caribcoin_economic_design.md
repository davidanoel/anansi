# CaribCoin — Economic Design

**Token Mechanics, Fee Architecture, and Supply Dynamics**
**Version 0.1 — Internal Planning Document**

---

## 0. Design Philosophy

CaribCoin has two jobs:

1. **Power the ecosystem.** Every Anansi product generates economic activity. CaribCoin captures a fraction of that activity through fees, creating sustainable demand.

2. **Fund the mission.** CaribCoin's initial distribution (SAFT pre-sale, public sale) capitalizes Anansi's development. After launch, the fee-and-burn mechanism creates deflationary pressure that rewards long-term holders.

The design must satisfy a tension: CaribCoin needs to be useful enough that people want to hold and use it, but not so embedded that it creates friction for users who just want to sell nutmeg or buy commodity exposure. James the farmer should never be forced to think about CaribCoin. A global investor should be rewarded for choosing to.

**The UNI analogy holds:** You can use Uniswap without holding UNI. But UNI holders govern the protocol, earn from fee switches, and benefit from ecosystem growth. CaribCoin works the same way — an optional power layer on top of a functional product.

---

## 1. Token Fundamentals

| Parameter | Value |
|---|---|
| Name | CaribCoin |
| Symbol | CARIB |
| Blockchain | Sui (v0, chain-agnostic by design) |
| Standard | Sui Coin framework (`Coin<CARIB>`) |
| Total supply | 10,000,000,000 (10 billion) |
| Inflation | None. Supply is permanently fixed at genesis. |
| Decimals | 9 (standard Sui precision) |
| Minting | All tokens minted at genesis. Treasury cap transferred to Foundation multi-sig. No function to mint additional tokens exists. |
| Burning | Yes. Fees collected by the protocol are partially burned, permanently reducing circulating supply. |

---

## 2. Supply Allocation — Detailed Breakdown

### 2.1 Allocation Table

| Category | % | Tokens | Vesting | Fundraising Role |
|---|---|---|---|---|
| Community & Ecosystem | 40% | 4,000,000,000 | Gradual emission over 5-10 years | Never sold. Distributed through participation. |
| Foundation Treasury | 20% | 2,000,000,000 | Locked. Released by Foundation governance. | Never sold. Long-term stewardship. |
| Contributors / Core Team | 15% | 1,500,000,000 | 1-year cliff, 4-year linear vest | Founder + future team. Not liquid at launch. |
| Early Backers (SAFT) | 10% | 1,000,000,000 | 6-12 month cliff, 2-3 year linear vest | SAFT pre-sale. Target: $500K–$2M. |
| Public Launch Liquidity | 10% | 1,000,000,000 | No cliff. Released at public launch. | Public sale + DEX liquidity. Post-MVP only. |
| Strategic Partners | 5% | 500,000,000 | Case-by-case, typically 1-2 year vest | Ecosystem leverage. Not sold. |

### 2.2 Emission Schedule — What's Liquid When

**At CaribCoin mainnet launch (Phase 2, ~month 7):**

| Source | Tokens entering circulation | Notes |
|---|---|---|
| Public Launch Liquidity (DEX pool) | ~500M initially | Remainder released over 3-6 months as liquidity deepens |
| Early Backers (post-cliff) | 0 | Cliff hasn't ended yet (6-12 months from token delivery) |
| Community & Ecosystem | Small initial tranche (~100-200M) | Farmer onboarding rewards, early participation incentives |
| Contributors | 0 | 1-year cliff hasn't ended |
| Foundation | 0 | Locked |
| Strategic Partners | Small allocations as needed | GCNA partnership, Sui Foundation |

**Initial circulating supply at launch: ~600M-700M CARIB (6-7% of total supply)**

This is deliberately conservative. Low initial float means:
- Less sell pressure at launch
- Price discovery happens with limited supply
- Early Backers can't dump (cliff hasn't ended)
- Team can't dump (cliff hasn't ended)
- Community tokens are earned, not given

**At month 12 (post-launch):**

Early Backer vesting begins (linear release over 2-3 years). Team vesting begins (linear release over 4 years). Community emissions continue gradually. Estimated circulating supply: ~1.5-2B CARIB (15-20% of total).

**At month 24:**

Early Backer vesting ~50-75% complete. Team vesting ~25% complete. Community emissions ongoing. Estimated circulating supply: ~3-3.5B CARIB (30-35% of total).

**At month 48 (year 4):**

Early Backers fully vested. Team fully vested. Community emissions ongoing. Foundation may begin selective releases for major ecosystem initiatives. Estimated circulating supply: ~5-6B CARIB (50-60% of total).

The remaining 40-50% is Foundation Treasury + unissued Community & Ecosystem tokens — long-term reserves that may never fully enter circulation.

### 2.3 Anti-Dump Protections

- **Cliffs and vesting** prevent early sell pressure from insiders
- **Burn mechanics** continuously reduce circulating supply, counteracting emission
- **Staking incentives** lock tokens voluntarily (reduced fees, governance, priority access)
- **Gradual community emission** avoids large unlock shocks
- **Low initial float** means price discovery happens with disciplined supply

---

## 3. Fee Architecture — How Value Flows

### 3.1 The Fee Stack

Every Anansi product generates fees. All fees are denominated in or auto-converted to CaribCoin. This is the mechanism that creates persistent demand regardless of speculation.

**Spice (RWA Platform) — Primary fee source at launch:**

| Action | Fee rate | Paid by | Mechanism | Destination |
|---|---|---|---|---|
| Pool creation | 100 CARIB (fixed) | Pool creator (GCNA or equivalent) | Direct CARIB payment or auto-converted from USDC | 100% Treasury |
| Token minting (e.g., NUTMG issuance) | 0.1% of minted value | Embedded in mint transaction | Auto-convert from USDC → CARIB via DEX | 50% burn / 50% Treasury |
| Surplus distribution | 1.0% of distributed USDC | Deducted from yield before distribution | Auto-convert from USDC → CARIB via DEX | 50% burn / 50% Ecosystem Fund |
| Fiat off-ramp | Pass-through | User | Paid to third-party off-ramp provider | Third-party (not CARIB) |
| Secondary market trades | Standard DEX fees | Trader | Paid in SUI to Sui validators | Sui network (not CARIB) |

**CaribStone (NFT Platform) — Phase 2:**

| Action | Fee rate | Mechanism | Destination |
|---|---|---|---|
| NFT minting | 10 CARIB (fixed) or 1% of mint price | Direct or auto-converted | 50% burn / 50% Treasury |
| Marketplace sale | 2.5% of sale price | Auto-converted to CARIB | 50% burn / 25% artist royalty pool / 25% Treasury |
| Collection launch | 500 CARIB (fixed) | Direct payment | 100% Treasury |

**Future Products (AI/SaaS, Academy, DollarBank):**

| Product | Fee mechanism | Rate | Destination |
|---|---|---|---|
| IslandPulse premium API | Subscription in CARIB (discount) or USDC | $20-100/mo equiv | Treasury |
| Anansi Academy completion | Reward in CARIB from ecosystem allocation | 50-500 CARIB per course | From Community allocation |
| DollarBank protocol fee | % of yield auto-converted to CARIB | 0.5% of yield | 50% burn / 50% Treasury |

### 3.2 The Auto-Conversion Engine

Most users interact with Spice using USDC. They never hold, buy, or think about CaribCoin. But every fee-generating action creates CaribCoin demand behind the scenes.

**How auto-conversion works (one atomic PTB transaction):**

1. A fee-generating event occurs (e.g., surplus distribution of $10,000 USDC)
2. The protocol calculates the fee (1% = $100 USDC)
3. Within the same Sui Programmable Transaction Block (PTB):
   - $100 USDC is swapped for CARIB on the CARIB/USDC DEX pool
   - $50 worth of CARIB is sent to the burn address (permanently destroyed)
   - $50 worth of CARIB is sent to the Ecosystem Fund
   - The remaining $9,900 USDC is distributed to NUTMG holders
4. The user sees: "Surplus received: $9,900 USDC" (the fee is invisible)

**Why this matters economically:**
- Every fee-generating action creates buy pressure on CARIB (the DEX swap)
- Every burn permanently reduces supply
- The user never touches CARIB but still contributes to CARIB demand
- As Spice grows (more pools, more surplus, more islands), fee volume grows, and CARIB demand grows proportionally

### 3.3 Fee Revenue Modeling

**Conservative scenario — Year 1 (1 GCNA pool, 50 farmers):**

| Fee source | Estimated annual volume | Fee rate | Annual CARIB demand |
|---|---|---|---|
| Pool creation | 3 pools | 100 CARIB each | 300 CARIB |
| Minting | $500K minted | 0.1% | $500 → ~X CARIB |
| Surplus distribution | $200K distributed | 1.0% | $2,000 → ~X CARIB |
| **Total** | | | **~$2,500 in CARIB demand** |

This is tiny. That's honest. Year 1 is about proving the model, not generating meaningful fee revenue.

**Growth scenario — Year 3 (20 pools, 5 islands, 500+ farmers, real estate added):**

| Fee source | Estimated annual volume | Fee rate | Annual CARIB demand |
|---|---|---|---|
| Pool creation | 50 pools | 100 CARIB each | 5,000 CARIB |
| Minting | $50M minted | 0.1% | $50,000 → CARIB |
| Surplus distribution | $20M distributed | 1.0% | $200,000 → CARIB |
| CaribStone NFT fees | $2M volume | 2.5% | $50,000 → CARIB |
| SaaS subscriptions | $500K revenue | 10% CARIB discount usage | $50,000 → CARIB |
| **Total** | | | **~$350,000 in annual CARIB demand** |

Half of this is burned. Permanently. Every year.

**Scale scenario — Year 5 (100+ pools, 10+ islands, full product suite):**

Fee revenue in the millions. Burn rate creating meaningful deflation. CaribCoin demand driven by real economic activity, not speculation.

This is the flywheel the entire architecture is designed to create.

---

## 4. Burn Mechanics — Deflationary by Design

### 4.1 How Burning Works

When CARIB is burned, it is sent to a null address from which it can never be recovered. The circulating supply permanently decreases.

**Burn sources:**

| Source | Burn rate | Trigger |
|---|---|---|
| Minting fees | 50% of fee | Every time asset tokens are minted on Spice |
| Surplus distribution fees | 50% of fee | Every time yield is distributed to holders |
| NFT marketplace fees | 50% of fee | Every CaribStone sale |
| DollarBank protocol fees | 50% of fee | Every yield event |

**Why 50% burn / 50% treasury (not 100% burn):**

- 100% burn sounds aggressive but starves the ecosystem of operating capital
- The treasury portion funds grants, development, infrastructure, and ecosystem growth
- The burn portion creates deflationary pressure that rewards holders
- The balance can be adjusted by governance as the ecosystem matures

### 4.2 Long-Term Supply Trajectory

If the protocol burns $175,000 worth of CARIB annually (50% of $350K in Year 3 fees), and this grows proportionally with ecosystem activity, the cumulative burn over 10 years could remove 5-15% of total supply from circulation permanently.

Combined with large allocations that may never fully enter circulation (Foundation Treasury, unissued Community tokens), the effective float could remain well below 50% of total supply even at full vesting maturity.

This creates a supply dynamic where: tokens are continuously being removed from circulation (burn), while demand grows with each new pool, product, and island. Price is not promised — but the economic mechanics are designed so that usage creates scarcity.

---

## 5. Staking Mechanics

### 5.1 What Staking Does

Staking CARIB is voluntary. It locks tokens for a chosen duration in exchange for protocol-level benefits.

| Benefit | Requirement | How it works |
|---|---|---|
| Reduced platform fees | Stake ≥ 10,000 CARIB | 50% reduction on all Spice and CaribStone fees |
| Priority pool access | Stake ≥ 50,000 CARIB | 24-hour early access to new asset pools before public |
| Governance voting | Stake ≥ 1,000 CARIB | 1 CARIB staked = 1 vote on protocol proposals |
| Ecosystem rewards eligibility | Stake any amount | Proportional share of periodic airdrops from Community allocation |
| Premium features | Stake ≥ 5,000 CARIB | Access to advanced analytics, portfolio tools, API |

### 5.2 What Staking Does NOT Do

- Generate guaranteed yield or APY
- Distribute revenue or dividends
- Promise returns of any kind
- Create an obligation from Anansi or the Foundation

Staking is participation. Not investment. This distinction is critical for regulatory positioning and for the charter's integrity.

### 5.3 Staking Mechanics (On-Chain)

- **Lock periods:** 30 days, 90 days, 180 days, 365 days
- **Longer locks = stronger benefits:** 365-day stakers get maximum fee reduction and highest governance weight
- **Unstaking:** Available after lock period. No penalty for unstaking at maturity. Early unstaking incurs a 10% slash (slashed tokens are burned).
- **Compounding:** Ecosystem rewards received while staking can be restaked without resetting the lock period.

### 5.4 Staking as Supply Sink

Staking removes CARIB from active circulation. If 20% of circulating supply is staked at any given time, that's an additional supply reduction on top of burns.

Combined effect: burns permanently reduce total supply, staking temporarily reduces circulating supply. Both create scarcity. Both are driven by real utility, not artificial lockups.

---

## 6. Governance

### 6.1 What's Governed

Governance voting (by CARIB stakers) can modify:

- Fee rates across all products (within bounds set by the Foundation)
- Burn-to-treasury ratio (e.g., change from 50/50 to 60/40)
- New asset type approvals on Spice
- Community & Ecosystem allocation spending priorities
- Protocol upgrade approvals
- Addition of new products to the fee stack

### 6.2 What's NOT Governed

Governance cannot:

- Mint new CARIB (supply is permanently fixed in the contract — no function exists)
- Override Foundation multi-sig on Treasury
- Force GCNA or any custodian to act
- Change the charter's core principles
- Intervene in market pricing

### 6.3 Governance Evolution

**Phase 1 (MVP):** No on-chain governance. Decisions made transparently by the founder with community input. This avoids governance theater before there's a real community.

**Phase 2 (post-launch):** Soft governance — snapshot voting by CARIB stakers on key parameters. Results are advisory. Foundation implements if reasonable.

**Phase 3 (maturity):** Binding on-chain governance for defined protocol parameters. Foundation retains veto only for existential threats (security vulnerabilities, legal compliance).

This gradual path avoids two failure modes: premature decentralization (governance by 12 whales who bought at launch) and permanent centralization (founder controls everything forever).

---

## 7. Token Flow Diagrams

### 7.1 Spice — Surplus Distribution Flow

```
GCNA sells pooled nutmeg overseas
         │
         ▼
GCNA deposits surplus USDC into yield_engine contract
         │
         ▼
yield_engine calculates:
  ├── Total surplus: $10,000 USDC
  ├── Fee: 1% = $100 USDC
  └── Net to holders: $9,900 USDC
         │
         ▼
Within one atomic PTB:
  ├── $100 USDC → swapped to CARIB on DEX
  │     ├── 50% CARIB → BURN (permanent supply reduction)
  │     └── 50% CARIB → Ecosystem Fund
  │
  └── $9,900 USDC → distributed pro-rata to NUTMG holders
         │
         ▼
James receives: $X USDC based on his NUTMG balance
         │
         ▼
James taps "Withdraw" → USDC → off-ramp → EC$ in bank account
```

### 7.2 Spice — Token Minting Flow

```
GCNA admin records delivery in Spice dashboard
         │
         ▼
admin clicks "Add to Pool"
         │
         ▼
asset_pool.move mints NUTMG tokens
         │
         ▼
Minting fee calculated:
  ├── 0.1% of minted value
  ├── Auto-converted: USDC → CARIB via DEX
  ├── 50% CARIB → BURN
  └── 50% CARIB → Treasury
         │
         ▼
NUTMG tokens deposited to farmer's Spice address
         │
         ▼
Farmer receives notification: "You received X NUTMG"
```

### 7.3 CaribCoin — Aggregate Value Flow

```
                    ┌─────────────────────────────────┐
                    │     ANANSI PRODUCT ECOSYSTEM     │
                    │                                   │
                    │  Spice ─── CaribStone ─── AI/SaaS │
                    │    │           │            │      │
                    │    └───────────┴────────────┘      │
                    │              │                     │
                    │         All fees                   │
                    │              │                     │
                    │              ▼                     │
                    │     Auto-convert to CARIB          │
                    │         │          │               │
                    │         ▼          ▼               │
                    │      50% BURN   50% TREASURY       │
                    │         │          │               │
                    │         ▼          ▼               │
                    │    Supply ↓    Ecosystem           │
                    │    (forever)   Growth Fund         │
                    └─────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
              Stakers get     Governors vote    Holders benefit
              reduced fees    on parameters     from supply
              + priority      + spending        reduction
```

---

## 8. SAFT Pre-Sale Economics

### 8.1 Valuation Framework

The SAFT pre-sale prices CARIB at a discount to the anticipated public sale price, reflecting the risk early backers take by committing capital before the product is live.

**Valuation approach:**

Fully Diluted Valuation (FDV) at SAFT = Total Supply × Price per CARIB

| Scenario | Price per CARIB | FDV | SAFT raise (1B tokens at this price) |
|---|---|---|---|
| Conservative | $0.0005 | $5M | $500K |
| Base | $0.001 | $10M | $1M |
| Optimistic | $0.002 | $20M | $2M |

**SAFT discount to public price:** 40-60% below projected public launch price. If the public sale targets $0.002/CARIB, the SAFT prices at $0.0008-$0.0012/CARIB.

This rewards early backers for risk while maintaining upside for public participants.

### 8.2 SAFT Terms Summary

| Term | Value |
|---|---|
| Instrument | Simple Agreement for Future Tokens (SAFT) |
| Regulatory filing | Reg D 506(c) (U.S. accredited investors) + Reg S (non-U.S.) |
| Token allocation | From Early Backers pool (10% / 1B CARIB) |
| Cliff | 6-12 months after token delivery |
| Vesting | 2-3 year linear vest after cliff |
| Token delivery trigger | CaribCoin mainnet launch + Spice MVP live |
| Minimum investment | $10,000 (keeps the round manageable at 15-30 participants) |
| Maximum raise | $2M (selling up to 1B CARIB from Early Backers allocation) |
| Use of funds | Legal ($20-35K), audits ($5-8K), infrastructure, gas station, Grenada ops, runway |

### 8.3 Use of SAFT Proceeds

| Category | Amount | Purpose |
|---|---|---|
| Legal structuring | $20,000–$35,000 | RWA token structure, SAFT agreements, SPV formation, Foundation incorporation |
| Move security audit | $5,000–$8,000 | External audit of all smart contracts before mainnet |
| Infrastructure | $5,000–$10,000/yr | AWS hosting, IPFS pinning, Shinami Gas Station, KYC provider |
| GCNA partnership development | $5,000–$10,000 | Grenada travel, equipment for receiving station, farmer onboarding |
| Gas station funding | $5,000–$10,000 | SUI tokens for sponsored transactions (lasts years at current gas prices) |
| Runway supplement | Remainder | Reduces dependence on Amex salary; enables more development time |

---

## 9. Public Token Sale Economics

### 9.1 Structure

The public sale uses the Public Launch Liquidity allocation (10% / 1B CARIB) and occurs only after Spice MVP is live with real activity.

**Two components:**

1. **DEX Liquidity Pool:** ~500M CARIB paired with USDC in a CARIB/USDC pool on a Sui DEX (Cetus, Turbos, or equivalent). This provides immediate trading liquidity. The pool is seeded by Anansi/Foundation and the LP tokens are locked for 12+ months.

2. **Direct Public Sale:** ~500M CARIB sold via a launchpad or direct sale mechanism at a set price (above SAFT price). Proceeds fund ecosystem growth, Foundation capitalization, and team expansion.

### 9.2 Pricing

Public sale price is set above the SAFT price to reward early backers:

| If SAFT price was | Public sale price range | Implied FDV at public sale |
|---|---|---|
| $0.0005 | $0.001–$0.0015 | $10–15M |
| $0.001 | $0.002–$0.003 | $20–30M |
| $0.002 | $0.004–$0.005 | $40–50M |

The exact price is set based on market conditions, Spice traction metrics, and community demand at the time of the public sale.

---

## 10. Key Economic Invariants

These are the rules that never change, regardless of governance votes or market conditions:

1. **Total supply is fixed at 10B CARIB.** No function exists to mint more. Ever.
2. **Burns are permanent.** Burned tokens cannot be recovered.
3. **Staking never promises yield.** Benefits are fee reductions and access, not returns.
4. **Fees are always a percentage, never a flat tax that scales badly.** (Exception: pool creation, which is a small fixed amount to prevent spam.)
5. **USDC is always accepted.** CaribCoin is never the only payment method. Coercion kills adoption.
6. **Auto-conversion is transparent.** Every fee conversion is visible as a Sui event. Anyone can audit the burn rate, treasury inflows, and fee volumes in real time.
7. **The charter governs.** No economic design change can contradict the CaribCoin Charter's core principles: no promises, voluntary participation, free markets.

---

## 11. Summary — The Economic Thesis in One Page

CaribCoin is a fixed-supply, deflationary utility token that powers every product Anansi builds.

**Supply side:** 10B tokens, never more. Gradual emission over years. Conservative initial float (~7%). Burns permanently reduce supply with every fee-generating event.

**Demand side:** Every Spice pool, every surplus distribution, every NFT mint, every SaaS subscription generates automatic CARIB demand through the auto-conversion engine. Users don't need to buy CARIB — the protocol buys it behind the scenes with every transaction.

**Staking:** Voluntary lockup for fee reductions, governance, and priority access. Creates additional supply sink without promising yield.

**Fundraising:** SAFT pre-sale ($500K-$2M) funds the build. Public sale (post-MVP) funds growth. Token economics are designed so that early backers are rewarded for risk through vesting discounts, not through promises of returns.

**The flywheel:** More products → more fees → more CARIB demand → more burns → less supply → stronger economic gravity. Each island added to Spice, each artist on CaribStone, each student completing an Anansi Academy course contributes to this cycle.

**What we do NOT claim:** We do not promise price appreciation. We do not guarantee returns. We do not predict market outcomes. The economic design creates conditions where usage drives demand and burns reduce supply. What the market does with that information is the market's business.

**That is the point.** Participation, not permission. Usage, not promises. The market decides what CaribCoin becomes.

---

*CaribCoin does not promise returns. Participation is voluntary and involves risk.*
*Anansi Technology Corporation — Weaving threads of intelligence.*
