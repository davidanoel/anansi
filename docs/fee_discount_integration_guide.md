# Fee Discount Integration Guide

This document describes how Anansi products should integrate with the `fee_discount` module when they need stake-based fee discounts. Written for future-you, for when Dollar Bank / a new product / a new Spice flow is ready to wire this up.

**Current status:** Rails shipped, no callers yet. Kill switch default = **disabled**.

---

## When to use `fee_discount`

Use it when:
- A user directly initiates a transaction they pay fees for
- The user's identity on-chain = the fee payer = the stake owner (all three must match)
- You want to reward high-tier CARIB stakers with reduced fees

Do NOT use it when:
- Fees are collected via admin-signed transactions where the signer isn't the economic fee payer (e.g., Spice's `yield_engine::deposit_surplus` which is called by the admin wallet on behalf of farmers)
- Multiple economic beneficiaries share a single transaction (batch operations)
- Fees come out of a pool, not a specific user wallet

## The pattern: separate entrypoints, not Option<&StakePosition>

**Correct pattern** — two explicit functions:

```move
/// Full-fee path — no stake required
public fun withdraw<T>(
    vault: &mut Vault<T>,
    amount: u64,
    ctx: &mut TxContext,
): Coin<T> {
    let fee_bps = WITHDRAW_FEE_BPS;
    // ... charge fee at fee_bps, return net coin ...
}

/// Discounted path — requires stake position
public fun withdraw_with_stake<T>(
    vault: &mut Vault<T>,
    amount: u64,
    stake: &StakePosition,
    staking_config: &StakingConfig,
    discount_config: &FeeDiscountConfig,
    ctx: &mut TxContext,
): Coin<T> {
    // 1. Verify stake owner matches caller
    fee_discount::assert_position_owned_by(stake, ctx.sender());

    // 2. Verify stake meets minimum tier (aborts if it doesn't)
    fee_discount::assert_meets_min_tier(stake, staking_config, discount_config);

    // 3. Compute effective fee
    let effective_fee_bps = fee_discount::compute_effective_fee_bps(
        WITHDRAW_FEE_BPS, stake, staking_config, discount_config
    );

    // 4. Optionally emit an event so the frontend can show "you saved X"
    fee_discount::emit_discount_applied(
        ctx.sender(),
        staking::tier(stake, staking_config),
        WITHDRAW_FEE_BPS,
        WITHDRAW_FEE_BPS - effective_fee_bps,
        effective_fee_bps,
    );

    // 5. Use effective_fee_bps for the actual charge
    // ... charge fee at effective_fee_bps, return net coin ...
}
```

**Why not `Option<&StakePosition>`:**
- PTB ergonomics: Move's `Option` wrapping is awkward in PTBs
- Type system can't help: a buggy client passing `None` when it means `Some` silently loses the discount
- Call-site clarity: two function names make intent obvious

## Required validation on discounted entrypoints

Every discounted entrypoint MUST:

1. **Assert owner match.** `fee_discount::assert_position_owned_by(stake, ctx.sender())` — prevents an attacker from borrowing a high-tier position via PTB.
2. **Assert minimum tier.** `fee_discount::assert_meets_min_tier(...)` — aborts if user doesn't qualify. Never silently charge full fee on the discounted path.
3. **Use computed bps, not a hardcoded discount.** Always call `compute_discount_bps` or `compute_effective_fee_bps` so the kill switch is respected and tier mapping stays centralized.

## Fee amount computation

For fees expressed as basis points of some amount:

```move
let fee_amount_full = (amount as u128) * (WITHDRAW_FEE_BPS as u128) / 10_000;
let fee_amount_discounted = fee_discount::apply_discount_to_amount(
    fee_amount_full as u64, discount_bps
);
```

`apply_discount_to_amount` uses u128 internally — prevents the u64 overflow bug that hit `fee_converter` earlier.

## Governance flags and operational guidance

| Flag | Default | When to flip |
|---|---|---|
| `enabled` | `false` | Flip to `true` once: staking UI is live, enough users have staked, and at least one discounted product is deployed. Until then, discounted entrypoints (if deployed) will return 0 discount. |
| `min_tier_for_discount` | `3` | Keep at 3 unless charter changes. Tiers 1-2 are about governance/premium, not fees. |
| `tier_3_discount_bps`, `tier_4_discount_bps` | `5000` (50%) | Match charter. Can lower if fee revenue needs protection; can raise (up to max) for special events. |
| `max_discount_bps` | `5000` (50%) | Governance soft cap. Raise up to `ABSOLUTE_MAX_DISCOUNT_BPS` (7500) if needed. |
| `ABSOLUTE_MAX_DISCOUNT_BPS` | `7500` (75%), hardcoded | Not adjustable. Protects against "oops, made fees free" governance errors. |

## Operational runbook: enabling discounts for the first time

1. Deploy the product with discounted entrypoint(s) wired up
2. Verify staking UI is live and users can self-stake
3. Verify FeeDiscountConfig is in env: `NEXT_PUBLIC_FEE_DISCOUNT_CONFIG_ID=0x...`
4. From `/platform` (admin UI), call `fee_discount::set_enabled(admin, config, true)` — ideally via a dedicated admin tab when we build one
5. Front-end: surface "Stake X CARIB for 50% fee reduction" CTAs on discounted flows
6. Monitor: watch `DiscountApplied` events in indexer. Verify fee flows still route correctly to treasury/burn via `fee_converter`.

## Required Move.toml additions

No changes needed — `fee_discount.move` is internal to the `anansi` package, same as `staking.move` and `fee_converter.move`. It compiles as part of the core package build.

## Deployment notes

On fresh republish of core:
- A new `FeeDiscountConfig` shared object is created at genesis (default disabled)
- A new `FeeDiscountAdmin` capability is transferred to the publisher address
- Save both IDs to env:
  - `NEXT_PUBLIC_FEE_DISCOUNT_CONFIG_ID` — shared object
  - `FEE_DISCOUNT_ADMIN_ID` — admin capability (private, server-side only)

## Not yet wired (deferred decisions)

1. **Which product gets discounts first?** Current plan: no Spice flow fits cleanly (admin-signed deposits). Candidates for later: Dollar Bank withdrawal fees, future API credit purchases, Spice early-exit fees (if we add them), premium Academy cohort pricing.

2. **Frontend integration.** Staking UI already exists at `/stake`. When a discounted product ships, its UI should detect user's tier and show "Your discount: X%" next to fee amounts.

3. **Admin UI.** Currently set_enabled etc. are only callable via direct tx. Should add a "Fee Discount" tab to `/platform` when first product goes live.
