/// Fee Discount — shared module for stake-based fee reductions across Anansi products.
///
/// Design principles:
///
/// 1. Kill switch first. Discounts are disabled by default. Admin must explicitly enable.
///    This lets us ship the rails now, wire up products later, and flip on discounts
///    when the ecosystem is ready.
///
/// 2. Tier-keyed, not amount-keyed. Discounts map to staking tiers (1-4), not to raw
///    stake amounts. This means when staking thresholds change (via StakingConfig),
///    fee discounts automatically track. Single source of truth.
///
/// 3. Callers use DISCOUNTED entrypoints (separate functions), never Option<&StakePosition>.
///    This module provides the math and validation. Products expose two functions:
///    one that takes a stake position (discounted path) and one that does not (full fee path).
///
/// 4. Abort on structural invalids. If a caller passes a stake position that doesn't
///    meet the minimum tier threshold, this module aborts. Never silently charges
///    full fee on the discounted path — that would mask bugs and hide degraded UX.
///
/// 5. Fee-payer identity must match stake owner. When a product routes a fee through
///    this module, it must verify that `position_owner(position) == fee_payer`. This
///    module provides the helper; products enforce it at the call site.
///
/// Usage pattern from a product module:
///
///   // Full-fee path (no stake)
///   public fun some_action<T>(...) {
///       let fee_bps = PRODUCT_FEE_BPS;
///       ...charge fee at fee_bps...
///   }
///
///   // Discounted path (with stake)
///   public fun some_action_with_stake<T>(
///       ...,
///       stake: &StakePosition,
///       staking_config: &StakingConfig,
///       discount_config: &FeeDiscountConfig,
///       ctx: &mut TxContext,
///   ) {
///       fee_discount::assert_position_owned_by(stake, ctx.sender());
///       let discount_bps = fee_discount::compute_discount_bps(
///           stake, staking_config, discount_config
///       );
///       let effective_fee_bps = fee_discount::apply_discount(PRODUCT_FEE_BPS, discount_bps);
///       ...charge fee at effective_fee_bps...
///   }
module anansi::fee_discount;

use anansi::staking::{Self, StakePosition, StakingConfig};
use sui::event;
use sui::tx_context::{Self, TxContext};
use sui::transfer;

// ============ Structs ============

/// Shared config object. Governs all fee discounts across Anansi products.
///
/// `enabled`: global kill switch. When false, `compute_discount_bps` always returns 0
///            regardless of tier. This is the primary control — flip on when ready.
///
/// `tier_1_discount_bps` through `tier_4_discount_bps`: basis-point discount applied
///            to any fee for users meeting that tier. Per charter: Tier 3+ (fee_reduction
///            threshold) gets a discount; Tiers 1 & 2 get other benefits (governance,
///            premium features) that don't touch fees. Defaults reflect this.
///
/// `min_tier_for_discount`: enforces that callers of the discounted path must pass a
///            position meeting at least this tier. If a position below this tier is
///            passed, the discounted entrypoint aborts. Prevents the "thought I got a
///            discount, didn't" silent-failure mode.
///
/// `max_discount_bps`: safety cap. Even if a future admin sets tier bps > this, the
///            actual applied discount is capped. Hardcoded to 7500 (75%) to prevent
///            "accidentally made fees effectively zero" governance errors.
public struct FeeDiscountConfig has key {
    id: UID,
    /// Global kill switch — when false, all discounts return 0
    enabled: bool,
    /// Minimum tier (1-4) required to pass into a discounted entrypoint
    /// Tiers below this abort. Default: 3 (fee_reduction_threshold).
    min_tier_for_discount: u8,
    /// Per-tier discount in basis points (100 bps = 1%)
    tier_1_discount_bps: u16,
    tier_2_discount_bps: u16,
    tier_3_discount_bps: u16,
    tier_4_discount_bps: u16,
    /// Hard cap — no single discount can exceed this regardless of config
    max_discount_bps: u16,
}

/// Admin capability. Held by Foundation multi-sig in production.
public struct FeeDiscountAdmin has key, store {
    id: UID,
}

// ============ Constants ============

/// Basis points denominator — 10,000 bps = 100%
const BPS_DENOMINATOR: u64 = 10_000;

/// Hardcoded safety ceiling on discount basis points
/// Even governance cannot exceed this. Prevents "oops, made fees free" bugs.
const ABSOLUTE_MAX_DISCOUNT_BPS: u16 = 7_500; // 75%

/// Default: discounts disabled until admin flips the switch
const DEFAULT_ENABLED: bool = false;

/// Default minimum tier to use discount paths: tier 3 (fee_reduction threshold)
/// Tiers 1 and 2 are about governance/premium features, not fees.
const DEFAULT_MIN_TIER_FOR_DISCOUNT: u8 = 3;

/// Default per-tier discounts. Aligned with charter:
///   Tier 1 (1K CARIB)  — governance voting (no fee benefit) → 0%
///   Tier 2 (5K CARIB)  — premium features (no fee benefit) → 0%
///   Tier 3 (10K CARIB) — "Up to 50% platform fee reduction" → 5000 bps (50%)
///   Tier 4 (50K CARIB) — priority access + max fee reduction → 5000 bps (50%)
///
/// Tier 4 doesn't stack on top of tier 3 — it's the maximum. We set both at 50%
/// so that a tier-4 user gets the same fee reduction as tier 3 (their benefit
/// over tier 3 is priority pool access, not extra discount).
const DEFAULT_TIER_1_DISCOUNT_BPS: u16 = 0;
const DEFAULT_TIER_2_DISCOUNT_BPS: u16 = 0;
const DEFAULT_TIER_3_DISCOUNT_BPS: u16 = 5_000; // 50%
const DEFAULT_TIER_4_DISCOUNT_BPS: u16 = 5_000; // 50%

/// Default max discount: 50% (same as tier 3/4 defaults).
/// Raised via admin up to ABSOLUTE_MAX_DISCOUNT_BPS if needed.
const DEFAULT_MAX_DISCOUNT_BPS: u16 = 5_000;

// ============ Errors ============

/// Position holder does not match the expected fee payer
const EWrongOwner: u64 = 800;
/// Position does not meet minimum tier for discount entrypoint
const EInsufficientTier: u64 = 801;
/// Discount bps exceeds allowed maximum
const EDiscountTooLarge: u64 = 802;
/// Tier value is out of valid range (must be 1-4)
const EInvalidTier: u64 = 803;
/// Min tier must be in 1-4 range
const EInvalidMinTier: u64 = 804;
/// Max discount cannot exceed absolute ceiling
const EMaxDiscountTooLarge: u64 = 805;

// ============ Events ============

public struct DiscountConfigUpdated has copy, drop {
    enabled: bool,
    min_tier_for_discount: u8,
    max_discount_bps: u16,
    timestamp_ms: u64,
}

public struct TierDiscountUpdated has copy, drop {
    tier: u8,
    old_bps: u16,
    new_bps: u16,
    timestamp_ms: u64,
}

public struct DiscountApplied has copy, drop {
    staker: address,
    tier: u8,
    original_fee_bps: u16,
    discount_bps: u16,
    effective_fee_bps: u16,
}

// ============ Init ============

fun init(ctx: &mut TxContext) {
    let config = FeeDiscountConfig {
        id: object::new(ctx),
        enabled: DEFAULT_ENABLED,
        min_tier_for_discount: DEFAULT_MIN_TIER_FOR_DISCOUNT,
        tier_1_discount_bps: DEFAULT_TIER_1_DISCOUNT_BPS,
        tier_2_discount_bps: DEFAULT_TIER_2_DISCOUNT_BPS,
        tier_3_discount_bps: DEFAULT_TIER_3_DISCOUNT_BPS,
        tier_4_discount_bps: DEFAULT_TIER_4_DISCOUNT_BPS,
        max_discount_bps: DEFAULT_MAX_DISCOUNT_BPS,
    };
    transfer::share_object(config);

    let admin = FeeDiscountAdmin { id: object::new(ctx) };
    transfer::transfer(admin, ctx.sender());
}

// ============ Validation Helpers ============

/// Assert that a stake position is owned by `expected_owner`.
/// Products MUST call this at the start of any discounted entrypoint to prevent
/// a user from borrowing someone else's (higher-tier) stake position to get a discount.
/// On-chain ownership of the object is a weaker check than this — object references
/// can be passed in via PTBs even without ownership in some contexts.
public fun assert_position_owned_by(position: &StakePosition, expected_owner: address) {
    assert!(staking::position_owner(position) == expected_owner, EWrongOwner);
}

/// Assert that a stake position meets the minimum tier threshold set on the discount
/// config. Callers of the discounted entrypoint should use this so that passing a
/// stake position that doesn't qualify aborts clearly instead of silently returning
/// a zero discount.
public fun assert_meets_min_tier(
    position: &StakePosition,
    staking_config: &StakingConfig,
    discount_config: &FeeDiscountConfig,
) {
    let user_tier = staking::tier(position, staking_config);
    assert!(user_tier >= discount_config.min_tier_for_discount, EInsufficientTier);
}

// ============ Core Logic ============

/// Returns the applicable discount in basis points for a given stake position.
///
/// Kill switch semantics:
///   - If `discount_config.enabled == false`, returns 0 regardless of tier.
///
/// Tier semantics:
///   - Reads the user's tier from `staking::tier()` (0-4).
///   - Looks up the discount for that tier from config.
///   - Tier 0 (no qualifying stake) → 0 bps.
///
/// Safety clamp:
///   - Returned value is clamped to `min(tier_bps, max_discount_bps, ABSOLUTE_MAX_DISCOUNT_BPS)`.
///
/// This function does NOT abort on low tiers. It just returns 0. Callers that want
/// to enforce "must be tier N or higher" should call `assert_meets_min_tier` first.
public fun compute_discount_bps(
    position: &StakePosition,
    staking_config: &StakingConfig,
    discount_config: &FeeDiscountConfig,
): u16 {
    if (!discount_config.enabled) return 0;

    let user_tier = staking::tier(position, staking_config);
    let raw_bps = if (user_tier == 4) discount_config.tier_4_discount_bps
        else if (user_tier == 3) discount_config.tier_3_discount_bps
        else if (user_tier == 2) discount_config.tier_2_discount_bps
        else if (user_tier == 1) discount_config.tier_1_discount_bps
        else 0;

    // Clamp to the smaller of: configured max, absolute max
    let configured_max = discount_config.max_discount_bps;
    let absolute_max = ABSOLUTE_MAX_DISCOUNT_BPS;
    let effective_max = if (configured_max < absolute_max) configured_max else absolute_max;

    if (raw_bps > effective_max) effective_max else raw_bps
}

/// Apply a discount to a fee, returning the effective fee in basis points.
///
/// Uses u128 intermediate math to prevent overflow on large fees (same pattern
/// used in fee_converter after the overflow bug earlier in the project).
///
/// Saturates at 0 — discount >= 100% produces 0 fee, never underflow.
public fun apply_discount(fee_bps: u16, discount_bps: u16): u16 {
    if (discount_bps >= (BPS_DENOMINATOR as u16)) return 0;
    if (discount_bps == 0) return fee_bps;

    // effective = fee * (10_000 - discount) / 10_000
    let numerator = (fee_bps as u128) * ((BPS_DENOMINATOR as u128) - (discount_bps as u128));
    let effective = numerator / (BPS_DENOMINATOR as u128);
    (effective as u16)
}

/// Convenience: compute discount bps and apply in one call. Returns effective fee bps.
/// Does NOT assert anything — callers that want strict min-tier enforcement must call
/// `assert_meets_min_tier` explicitly.
public fun compute_effective_fee_bps(
    fee_bps: u16,
    position: &StakePosition,
    staking_config: &StakingConfig,
    discount_config: &FeeDiscountConfig,
): u16 {
    let discount_bps = compute_discount_bps(position, staking_config, discount_config);
    apply_discount(fee_bps, discount_bps)
}

/// Compute effective fee amount in raw token units (not bps).
/// Usage: you have a fee amount of X tokens; this returns the discounted amount.
/// Uses u128 throughout to prevent overflow on large token amounts.
public fun apply_discount_to_amount(
    fee_amount: u64,
    discount_bps: u16,
): u64 {
    if (discount_bps == 0) return fee_amount;
    if (discount_bps >= (BPS_DENOMINATOR as u16)) return 0;

    let numerator = (fee_amount as u128) * ((BPS_DENOMINATOR as u128) - (discount_bps as u128));
    let reduced = numerator / (BPS_DENOMINATOR as u128);
    (reduced as u64)
}

// ============ Emit helper (optional for products) ============

/// Products may call this after applying a discount to emit an observable event.
/// This is optional — products can skip it if they emit their own richer event that
/// includes discount info.
public fun emit_discount_applied(
    staker: address,
    tier: u8,
    original_fee_bps: u16,
    discount_bps: u16,
    effective_fee_bps: u16,
) {
    event::emit(DiscountApplied {
        staker,
        tier,
        original_fee_bps,
        discount_bps,
        effective_fee_bps,
    });
}

// ============ Admin Functions ============

/// Flip the kill switch. When disabled, all discounts return 0 regardless of tier.
public entry fun set_enabled(
    _admin: &FeeDiscountAdmin,
    config: &mut FeeDiscountConfig,
    enabled: bool,
    ctx: &TxContext,
) {
    config.enabled = enabled;
    event::emit(DiscountConfigUpdated {
        enabled,
        min_tier_for_discount: config.min_tier_for_discount,
        max_discount_bps: config.max_discount_bps,
        timestamp_ms: tx_context::epoch_timestamp_ms(ctx),
    });
}

/// Update the discount bps for a single tier.
/// Validates that new_bps <= max_discount_bps (and max itself is <= ABSOLUTE_MAX).
public entry fun set_tier_discount(
    _admin: &FeeDiscountAdmin,
    config: &mut FeeDiscountConfig,
    tier: u8,
    new_bps: u16,
    ctx: &TxContext,
) {
    assert!(tier >= 1 && tier <= 4, EInvalidTier);
    assert!(new_bps <= config.max_discount_bps, EDiscountTooLarge);
    assert!(new_bps <= ABSOLUTE_MAX_DISCOUNT_BPS, EDiscountTooLarge);

    let old_bps = if (tier == 1) {
        let o = config.tier_1_discount_bps;
        config.tier_1_discount_bps = new_bps;
        o
    } else if (tier == 2) {
        let o = config.tier_2_discount_bps;
        config.tier_2_discount_bps = new_bps;
        o
    } else if (tier == 3) {
        let o = config.tier_3_discount_bps;
        config.tier_3_discount_bps = new_bps;
        o
    } else {
        let o = config.tier_4_discount_bps;
        config.tier_4_discount_bps = new_bps;
        o
    };

    event::emit(TierDiscountUpdated {
        tier,
        old_bps,
        new_bps,
        timestamp_ms: tx_context::epoch_timestamp_ms(ctx),
    });
}

/// Update the global maximum discount bps. Cannot exceed ABSOLUTE_MAX_DISCOUNT_BPS.
/// Note: this does NOT automatically reduce tier discounts if they exceed the new max.
/// The effective discount is clamped at read time. To actually reduce tier discounts,
/// call set_tier_discount for each affected tier.
public entry fun set_max_discount_bps(
    _admin: &FeeDiscountAdmin,
    config: &mut FeeDiscountConfig,
    new_max_bps: u16,
    ctx: &TxContext,
) {
    assert!(new_max_bps <= ABSOLUTE_MAX_DISCOUNT_BPS, EMaxDiscountTooLarge);
    config.max_discount_bps = new_max_bps;

    event::emit(DiscountConfigUpdated {
        enabled: config.enabled,
        min_tier_for_discount: config.min_tier_for_discount,
        max_discount_bps: new_max_bps,
        timestamp_ms: tx_context::epoch_timestamp_ms(ctx),
    });
}

/// Update the minimum tier required to use discount entrypoints.
public entry fun set_min_tier(
    _admin: &FeeDiscountAdmin,
    config: &mut FeeDiscountConfig,
    new_min_tier: u8,
    ctx: &TxContext,
) {
    assert!(new_min_tier >= 1 && new_min_tier <= 4, EInvalidMinTier);
    config.min_tier_for_discount = new_min_tier;

    event::emit(DiscountConfigUpdated {
        enabled: config.enabled,
        min_tier_for_discount: new_min_tier,
        max_discount_bps: config.max_discount_bps,
        timestamp_ms: tx_context::epoch_timestamp_ms(ctx),
    });
}

/// Transfer admin capability. Use to hand off to Foundation multi-sig.
public entry fun transfer_admin(admin: FeeDiscountAdmin, recipient: address) {
    transfer::public_transfer(admin, recipient);
}

// ============ View Functions ============

public fun is_enabled(config: &FeeDiscountConfig): bool { config.enabled }

public fun min_tier_for_discount(config: &FeeDiscountConfig): u8 {
    config.min_tier_for_discount
}

public fun max_discount_bps(config: &FeeDiscountConfig): u16 {
    config.max_discount_bps
}

public fun tier_discounts(config: &FeeDiscountConfig): (u16, u16, u16, u16) {
    (
        config.tier_1_discount_bps,
        config.tier_2_discount_bps,
        config.tier_3_discount_bps,
        config.tier_4_discount_bps,
    )
}

public fun absolute_max_discount_bps(): u16 { ABSOLUTE_MAX_DISCOUNT_BPS }

// ============ Test Helpers ============

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
