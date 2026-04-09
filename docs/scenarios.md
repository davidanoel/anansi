# Scenarios

**The core insight:** Your contracts are more generic than you think. A "lot" is just a container. A "delivery" is just a minting event. The code doesn't care what the physical asset is. The differences are in the business process and UX, not the smart contracts.

There are really two models:

---

**Model 1: Commodity Aggregation** — multiple producers, central custodian, bulk sale

This is what you built for nutmeg. Coffee, cocoa, and mace work identically.

**Example: Jamaica Blue Mountain Coffee**

| Step                                       | Who                   | Action                    | On-chain                                              |
| ------------------------------------------ | --------------------- | ------------------------- | ----------------------------------------------------- |
| Farmer brings 50kg coffee to CIB           | Farmer                | Physical delivery         | —                                                     |
| CIB weighs, grades (Blue Mountain Grade 1) | CIB staff (custodian) | Records delivery in Spice | `coffee::record_delivery` → mints 50 COFFEE to farmer |
| More farmers deliver, lot fills up         | Multiple farmers      | Multiple deliveries       | Lot accumulates units + tokens                        |
| CIB exports lot to Japanese buyer          | CIB                   | Marks lot as Selling      | `start_selling`                                       |
| Buyer pays $12/lb, surplus over advance    | CIB                   | Receives payment          | —                                                     |
| SPV deposits surplus USDC                  | Platform admin        | Deposits on-chain         | `deposit_surplus` for COFFEE                          |
| Farmers claim                              | Each farmer           | Taps "Claim"              | `claim_surplus` pro-rata                              |

**Verdict:** Identical to nutmeg. Copy the template, change 5 strings. Done.

---

**Model 2: Single Asset Tokenization** — one asset, one owner, periodic revenue

This is villas, hotels, rum distilleries. The flow is different.

**Example: Villa in Antigua**

A luxury villa worth $500,000. The owner wants to sell 40% to global investors while retaining 60% and managing the property.

| Step                                    | Who              | Action                                                | On-chain                                   |
| --------------------------------------- | ---------------- | ----------------------------------------------------- | ------------------------------------------ |
| SPV created for the villa               | Lawyer           | Legal entity wraps the property                       | —                                          |
| Property manager registers as custodian | Platform admin   | Creates VILLA asset type, assigns custodian           | `create_asset_type`                        |
| Villa tokenized: 1000 shares            | Custodian        | Creates lot "Villa Blue Horizon"                      | `create_lot`                               |
| 400 shares offered to investors         | Custodian        | Records one "delivery" of 400 units to the SPV wallet | `villa::record_delivery` → mints 400 VILLA |
| SPV lists VILLA on DEX                  | Admin            | Seeds Cetus pool with VILLA + USDC                    | Pool creation                              |
| Investor buys 50 VILLA tokens           | Investor         | Swaps USDC → VILLA on marketplace                     | Cetus swap                                 |
| Villa rents for $3,000/month            | Property manager | Collects rent in fiat                                 | —                                          |
| Monthly surplus deposited               | Platform admin   | Deposits rental USDC                                  | `deposit_surplus` for VILLA                |
| Token holders claim monthly             | Each holder      | Taps "Claim"                                          | `claim_surplus` pro-rata                   |

**What's different from nutmeg:**

- One lot, one property (not many farmers delivering)
- One big "delivery" upfront (not ongoing small ones)
- "Delivery" = initial tokenization, not a physical commodity handoff
- Surplus is periodic (monthly rent), not a one-time lot sale
- The lot stays open forever (or until the property is sold)
- Units = shares, not kg

**What works as-is in the contracts:** Everything. A "lot" holds the villa. A "delivery" mints the initial tokens. `deposit_surplus` handles monthly rent. `claim_surplus` distributes pro-rata. The contracts don't know or care that it's a villa instead of nutmeg.

**What needs UX changes:** The admin dashboard says "Record Delivery" and "Weight (kg)" — for a villa, this should say "Mint Tokens" and "Shares". This is a UI label issue, not a contract change.

---

**Example: Rum Distillery Revenue in Barbados**

Foursquare Distillery wants to tokenize a share of their export revenue. Not selling the distillery — selling rights to a percentage of revenue from a specific product line (e.g., their Exceptional Cask Series).

| Step                                     | Who            | Action                           | On-chain                                 |
| ---------------------------------------- | -------------- | -------------------------------- | ---------------------------------------- |
| SPV created for the revenue stream       | Lawyer         | Legal agreement with distillery  | —                                        |
| Distillery CFO registered as custodian   | Platform admin | Creates RUM asset type           | `create_asset_type`                      |
| Revenue pool created for Q1 2026         | Custodian      | Creates lot "ECS Q1 2026"        | `create_lot`                             |
| 10,000 revenue shares issued             | Custodian      | Records "delivery" to SPV wallet | `rum::record_delivery` → mints 10000 RUM |
| Shares sold to investors via DEX         | Investors      | Buy RUM with USDC                | Cetus swap                               |
| Quarter ends, distillery reports revenue | CFO            | Confirms revenue figures         | —                                        |
| Revenue surplus deposited                | Platform admin | Deposits quarterly USDC          | `deposit_surplus` for RUM                |
| Holders claim quarterly                  | Each holder    | Taps "Claim"                     | `claim_surplus` pro-rata                 |
| New quarter starts                       | Custodian      | Creates new lot "ECS Q2 2026"    | New `create_lot`                         |

**What's different:** Lots represent time periods, not physical batches. Each quarter is a new lot. The "delivery" is a one-time issuance per period. Surplus is the revenue share, not commodity sale proceeds.

**What works as-is:** Everything. Lot = revenue period. Delivery = token issuance. Surplus = revenue distribution. Same contracts.

---

**Example: Indonesian Nutmeg**

Same commodity as Grenada, different country. A local cooperative in North Sulawesi partners with Anansi.

| Step                               | Who            | Action                                                                  | On-chain                 |
| ---------------------------------- | -------------- | ----------------------------------------------------------------------- | ------------------------ |
| Indonesian partner registered      | Platform admin | Creates IDNUT asset type, region: Indonesia, custodian: "Sulawesi Coop" | `create_asset_type`      |
| Coop staff registered as custodian | Platform admin | Issues CustodianCap to their zkLogin address                            | `issue_custodian_cap`    |
| Farmers deliver to coop            | Local process  | Unchanged from their current workflow                                   | —                        |
| Coop records deliveries            | Coop staff     | Uses `/admin` dashboard (same UI as GCNA)                               | `idnut::record_delivery` |
| Everything else identical          | —              | Same lot lifecycle, surplus, claims                                     | Same contracts           |

**What's different:** Only the custodian organization and the token symbol. The IDNUT token trades independently from NUTMEG — different prices, different pools, different surplus. Grenada nutmeg commands a premium ($0.55/unit), Indonesian nutmeg trades lower ($0.38/unit). Separate tokens reflect that economic reality.

---

**Summary: What handles what**

| Asset type                            | Lot =                      | Delivery =                 | Surplus =                   | Contract changes? |
| ------------------------------------- | -------------------------- | -------------------------- | --------------------------- | ----------------- |
| Nutmeg, Cocoa, Coffee, Mace           | Physical batch             | Farmer drops off commodity | Sale proceeds minus advance | None              |
| Villa, Hotel                          | The property               | Initial token minting      | Rental income               | None              |
| Rum revenue, Tourism revenue          | Revenue period (quarterly) | Token issuance per period  | Revenue share               | None              |
| Foreign commodity (Indonesian nutmeg) | Physical batch             | Same as local commodity    | Same                        | None              |

**The contracts handle all of these today.** The only thing that changes per asset category is UI labels. And even that's optional — "Record Delivery" works conceptually for all of them if you squint.

**What I'd recommend building (not now, but eventually):** A small UI config per asset type that controls the labels:

```json
{
  "NUTMEG": {
    "lotLabel": "Lot",
    "deliveryLabel": "Delivery",
    "unitLabel": "kg",
    "surplusLabel": "Sale surplus"
  },
  "VILLA": {
    "lotLabel": "Property",
    "deliveryLabel": "Token issuance",
    "unitLabel": "shares",
    "surplusLabel": "Rental income"
  },
  "RUM": {
    "lotLabel": "Revenue period",
    "deliveryLabel": "Revenue issuance",
    "unitLabel": "shares",
    "surplusLabel": "Revenue share"
  }
}
```

This could live in `NEXT_PUBLIC_TOKEN_CONFIG` as additional fields. No contract changes, no new pages — just the right words in the right places. But that's a polish item, not a blocker. The platform works for all these assets right now.
