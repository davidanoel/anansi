/// CaribCoin Staking — Participation, not passive yield.
///
/// Design principles (see charter):
///   - Stake any amount, any time, with no lock period
///   - Benefits activate immediately when staked
///   - Unstaking requires a 24-hour cooldown before withdrawal
///   - The protocol pays NO yield. Any returns come from external market activity
///     (DEX LP fees, Foundation-funded incentives, third-party staking services)
///   - No slashing. No penalties. Users remain in full control of their tokens.
///
/// The cooldown exists solely to prevent flash-loan attacks on governance and
/// priority access — an attacker cannot borrow CARIB, stake, vote/claim priority,
/// and unstake within a single transaction.
///
/// Staking grants:
///   - 1,000+ CARIB:  governance voting weight (1 CARIB = 1 vote)
///   - 5,000+ CARIB:  premium features (advanced analytics, API access)
///   - 10,000+ CARIB: up to 50% reduction on Spice and CaribStone platform fees
///   - 50,000+ CARIB: 24h priority access to new asset pools before public listing
///   - Any amount:    eligibility for ecosystem reward airdrops
///
/// These thresholds are stored on-chain as governable parameters.
module anansi::staking;

use anansi::carib_coin::CARIB_COIN;
use sui::balance::{Self, Balance};
use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::event;

// ============ Objects ============

/// Shared config object. One per deployment.
public struct StakingConfig has key {
    id: UID,
    /// Cooldown duration in milliseconds before unstake can complete
    cooldown_ms: u64,
    /// Thresholds for each benefit tier (in raw CARIB units, 9 decimals)
    governance_threshold: u64,
    premium_threshold: u64,
    fee_reduction_threshold: u64,
    priority_access_threshold: u64,
    /// Aggregate stats
    total_staked: u64,
    total_stakers: u64,
    /// Hard bounds on cooldown governance adjustments (12h–72h)
    min_cooldown_ms: u64,
    max_cooldown_ms: u64,
}

/// Admin capability for config changes.
/// Transferable — should be held by Foundation multi-sig in production.
public struct StakingAdmin has key, store {
    id: UID,
}

/// A user's stake position. One per user (reusable: new stakes merge in).
/// Owned object transferred to the staker.
///
/// Lifecycle:
///   created → stake() → [benefits active] → request_unstake() → wait cooldown_ms → withdraw()
///
/// During cooldown:
///   - `cooldown_ends_at` is set
///   - Benefits are deactivated (see `is_active` view function)
///   - User can cancel via `cancel_unstake()` to re-activate immediately
public struct StakePosition has key {
    id: UID,
    /// The CARIB tokens held by this position
    balance: Balance<CARIB_COIN>,
    /// Address that owns this position (redundant with object ownership but useful for events)
    owner: address,
    /// When this position was first created (ms)
    created_at: u64,
    /// When staked last (most recent stake action; ms)
    last_staked_at: u64,
    /// If cooldown active: ms when withdraw becomes possible. 0 = no pending unstake.
    cooldown_ends_at: u64,
    /// Amount queued for unstaking. 0 if no pending unstake.
    /// When cooldown ends, exactly this amount becomes withdrawable.
    pending_unstake_amount: u64,
}

// ============ Constants ============

/// Default cooldown: 24 hours
const DEFAULT_COOLDOWN_MS: u64 = 86_400_000;

/// Bounds for governance-adjustable cooldown
const MIN_COOLDOWN_MS: u64 = 43_200_000; // 12 hours
const MAX_COOLDOWN_MS: u64 = 259_200_000; // 72 hours

/// Default tier thresholds (in raw units with 9 decimals)
const DEFAULT_GOVERNANCE_THRESHOLD: u64 = 1_000_000_000_000; // 1,000 CARIB
const DEFAULT_PREMIUM_THRESHOLD: u64 = 5_000_000_000_000; // 5,000 CARIB
const DEFAULT_FEE_REDUCTION_THRESHOLD: u64 = 10_000_000_000_000; // 10,000 CARIB
const DEFAULT_PRIORITY_ACCESS_THRESHOLD: u64 = 50_000_000_000_000; // 50,000 CARIB

// ============ Errors ============

const EZeroStake: u64 = 700;
const ECooldownAlreadyActive: u64 = 701;
const ENoPendingUnstake: u64 = 702;
const ECooldownNotComplete: u64 = 703;
const EInvalidCooldown: u64 = 704;
const EInsufficientStake: u64 = 705;
const ENotOwner: u64 = 706;
const EPendingUnstakeExists: u64 = 707;

// ============ Events ============

public struct Staked has copy, drop {
    staker: address,
    position_id: ID,
    amount: u64,
    new_total: u64,
    timestamp: u64,
}

public struct UnstakeRequested has copy, drop {
    staker: address,
    position_id: ID,
    amount: u64,
    cooldown_ends_at: u64,
    timestamp: u64,
}

public struct UnstakeCancelled has copy, drop {
    staker: address,
    position_id: ID,
    restored_amount: u64,
    timestamp: u64,
}

public struct UnstakeCompleted has copy, drop {
    staker: address,
    position_id: ID,
    amount: u64,
    timestamp: u64,
}

public struct CooldownUpdated has copy, drop {
    old_ms: u64,
    new_ms: u64,
}

public struct ThresholdsUpdated has copy, drop {
    governance: u64,
    premium: u64,
    fee_reduction: u64,
    priority_access: u64,
}

// ============ Init ============

fun init(ctx: &mut TxContext) {
    let config = StakingConfig {
        id: object::new(ctx),
        cooldown_ms: DEFAULT_COOLDOWN_MS,
        governance_threshold: DEFAULT_GOVERNANCE_THRESHOLD,
        premium_threshold: DEFAULT_PREMIUM_THRESHOLD,
        fee_reduction_threshold: DEFAULT_FEE_REDUCTION_THRESHOLD,
        priority_access_threshold: DEFAULT_PRIORITY_ACCESS_THRESHOLD,
        total_staked: 0,
        total_stakers: 0,
        min_cooldown_ms: MIN_COOLDOWN_MS,
        max_cooldown_ms: MAX_COOLDOWN_MS,
    };

    let admin = StakingAdmin { id: object::new(ctx) };

    transfer::share_object(config);
    transfer::transfer(admin, ctx.sender());
}

// ============ Core Actions ============

/// Create a new stake position. Use `stake_into` to add to an existing one.
///
/// Returns the position to the staker. They own it — it's not a shared object.
/// One position per user is the intended model, but the module doesn't enforce this;
/// users can hold multiple positions if they want.
public fun stake(
    config: &mut StakingConfig,
    stake_coin: Coin<CARIB_COIN>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let amount = coin::value(&stake_coin);
    assert!(amount > 0, EZeroStake);

    let now = clock::timestamp_ms(clock);
    let staker = ctx.sender();

    let position = StakePosition {
        id: object::new(ctx),
        balance: coin::into_balance(stake_coin),
        owner: staker,
        created_at: now,
        last_staked_at: now,
        cooldown_ends_at: 0,
        pending_unstake_amount: 0,
    };

    config.total_staked = config.total_staked + amount;
    config.total_stakers = config.total_stakers + 1;

    event::emit(Staked {
        staker,
        position_id: object::id(&position),
        amount,
        new_total: amount,
        timestamp: now,
    });

    transfer::transfer(position, staker);
}

/// Add CARIB to an existing stake position.
///
/// If the position has a pending unstake, this fails — users must cancel or
/// complete the unstake before adding more. This keeps accounting simple and
/// prevents partial-cooldown edge cases.
public fun stake_into(
    config: &mut StakingConfig,
    position: &mut StakePosition,
    stake_coin: Coin<CARIB_COIN>,
    clock: &Clock,
    ctx: &TxContext,
) {
    let amount = coin::value(&stake_coin);
    assert!(amount > 0, EZeroStake);
    assert!(position.owner == ctx.sender(), ENotOwner);
    assert!(position.pending_unstake_amount == 0, EPendingUnstakeExists);

    balance::join(&mut position.balance, coin::into_balance(stake_coin));
    position.last_staked_at = clock::timestamp_ms(clock);

    config.total_staked = config.total_staked + amount;

    event::emit(Staked {
        staker: position.owner,
        position_id: object::id(position),
        amount,
        new_total: balance::value(&position.balance),
        timestamp: position.last_staked_at,
    });
}

/// Request to unstake a specific amount. Starts the cooldown.
///
/// During cooldown:
///   - The amount is earmarked but still held by the position
///   - Benefits are deactivated (see `is_active`)
///   - User can cancel via `cancel_unstake` to re-activate
///   - Cannot stake more into this position until cooldown resolves
///
/// Amount must be ≤ current balance. Cannot request a second unstake while
/// one is pending — must cancel or complete first.
public fun request_unstake(
    position: &mut StakePosition,
    amount: u64,
    config: &StakingConfig,
    clock: &Clock,
    ctx: &TxContext,
) {
    assert!(position.owner == ctx.sender(), ENotOwner);
    assert!(position.pending_unstake_amount == 0, ECooldownAlreadyActive);
    assert!(amount > 0, EZeroStake);
    assert!(balance::value(&position.balance) >= amount, EInsufficientStake);

    let now = clock::timestamp_ms(clock);
    let ends_at = now + config.cooldown_ms;

    position.pending_unstake_amount = amount;
    position.cooldown_ends_at = ends_at;

    event::emit(UnstakeRequested {
        staker: position.owner,
        position_id: object::id(position),
        amount,
        cooldown_ends_at: ends_at,
        timestamp: now,
    });
}

/// Cancel a pending unstake. Re-activates benefits immediately.
/// Always allowed while cooldown is active — users retain full control.
public fun cancel_unstake(
    position: &mut StakePosition,
    clock: &Clock,
    ctx: &TxContext,
) {
    assert!(position.owner == ctx.sender(), ENotOwner);
    assert!(position.pending_unstake_amount > 0, ENoPendingUnstake);

    let restored = position.pending_unstake_amount;
    position.pending_unstake_amount = 0;
    position.cooldown_ends_at = 0;

    event::emit(UnstakeCancelled {
        staker: position.owner,
        position_id: object::id(position),
        restored_amount: restored,
        timestamp: clock::timestamp_ms(clock),
    });
}

/// Complete the unstake after the cooldown has elapsed. Returns the CARIB coin
/// to the caller.
///
/// Aborts if called before cooldown_ends_at.
public fun withdraw_unstaked(
    config: &mut StakingConfig,
    position: &mut StakePosition,
    clock: &Clock,
    ctx: &mut TxContext,
): Coin<CARIB_COIN> {
    assert!(position.owner == ctx.sender(), ENotOwner);
    assert!(position.pending_unstake_amount > 0, ENoPendingUnstake);

    let now = clock::timestamp_ms(clock);
    assert!(now >= position.cooldown_ends_at, ECooldownNotComplete);

    let amount = position.pending_unstake_amount;
    position.pending_unstake_amount = 0;
    position.cooldown_ends_at = 0;

    config.total_staked = config.total_staked - amount;

    let withdrawn = balance::split(&mut position.balance, amount);

    event::emit(UnstakeCompleted {
        staker: position.owner,
        position_id: object::id(position),
        amount,
        timestamp: now,
    });

    coin::from_balance(withdrawn, ctx)
}

/// Close an empty position. Destroys the object.
/// Only allowed when balance is zero and no pending unstake.
public fun close_position(position: StakePosition, config: &mut StakingConfig) {
    assert!(balance::value(&position.balance) == 0, EInsufficientStake);
    assert!(position.pending_unstake_amount == 0, EPendingUnstakeExists);

    let StakePosition {
        id,
        balance,
        owner: _,
        created_at: _,
        last_staked_at: _,
        cooldown_ends_at: _,
        pending_unstake_amount: _,
    } = position;

    balance::destroy_zero(balance);
    object::delete(id);

    // If the staker has fully exited, decrement the unique-stakers count.
    // This is an approximation — a staker could hold multiple positions —
    // but for the common case of one-position-per-user it's accurate.
    if (config.total_stakers > 0) {
        config.total_stakers = config.total_stakers - 1;
    };
}

// ============ Admin Functions ============

/// Update the cooldown duration. Must be within [min_cooldown_ms, max_cooldown_ms].
public fun update_cooldown(
    _admin: &StakingAdmin,
    config: &mut StakingConfig,
    new_cooldown_ms: u64,
) {
    assert!(
        new_cooldown_ms >= config.min_cooldown_ms
            && new_cooldown_ms <= config.max_cooldown_ms,
        EInvalidCooldown,
    );
    let old_ms = config.cooldown_ms;
    config.cooldown_ms = new_cooldown_ms;

    event::emit(CooldownUpdated {
        old_ms,
        new_ms: new_cooldown_ms,
    });
}

/// Update tier thresholds. Governance can adjust as the token price evolves
/// (e.g., if CARIB appreciates significantly, thresholds may be lowered).
public fun update_thresholds(
    _admin: &StakingAdmin,
    config: &mut StakingConfig,
    governance: u64,
    premium: u64,
    fee_reduction: u64,
    priority_access: u64,
) {
    config.governance_threshold = governance;
    config.premium_threshold = premium;
    config.fee_reduction_threshold = fee_reduction;
    config.priority_access_threshold = priority_access;

    event::emit(ThresholdsUpdated {
        governance,
        premium,
        fee_reduction,
        priority_access,
    });
}

/// Transfer admin cap to a new holder (e.g., Foundation multi-sig).
public fun transfer_admin(cap: StakingAdmin, recipient: address) {
    transfer::transfer(cap, recipient);
}

// ============ View Functions ============

/// Current staked amount in this position (includes pending unstake).
public fun staked_amount(position: &StakePosition): u64 {
    balance::value(&position.balance)
}

/// Amount currently eligible for benefits.
/// During cooldown, the pending unstake amount is deducted because those
/// tokens are on their way out — they shouldn't count toward benefits.
public fun active_amount(position: &StakePosition): u64 {
    let total = balance::value(&position.balance);
    if (position.pending_unstake_amount >= total) {
        0
    } else {
        total - position.pending_unstake_amount
    }
}

/// True if the position is currently in cooldown.
public fun is_cooling_down(position: &StakePosition): bool {
    position.pending_unstake_amount > 0
}

/// Time until cooldown ends (ms). 0 if no cooldown active or already elapsed.
public fun cooldown_remaining(position: &StakePosition, clock: &Clock): u64 {
    if (position.cooldown_ends_at == 0) return 0;
    let now = clock::timestamp_ms(clock);
    if (now >= position.cooldown_ends_at) 0
    else position.cooldown_ends_at - now
}

/// True if the user has governance voting rights.
public fun has_governance(position: &StakePosition, config: &StakingConfig): bool {
    active_amount(position) >= config.governance_threshold
}

/// True if the user has premium feature access.
public fun has_premium(position: &StakePosition, config: &StakingConfig): bool {
    active_amount(position) >= config.premium_threshold
}

/// True if the user qualifies for platform fee reduction.
public fun has_fee_reduction(position: &StakePosition, config: &StakingConfig): bool {
    active_amount(position) >= config.fee_reduction_threshold
}

/// True if the user has priority access to new pools.
public fun has_priority_access(position: &StakePosition, config: &StakingConfig): bool {
    active_amount(position) >= config.priority_access_threshold
}

/// Returns the highest tier the user qualifies for. 0 = none, 1-4 = tier.
/// Useful for frontend display.
public fun tier(position: &StakePosition, config: &StakingConfig): u8 {
    let active = active_amount(position);
    if (active >= config.priority_access_threshold) 4
    else if (active >= config.fee_reduction_threshold) 3
    else if (active >= config.premium_threshold) 2
    else if (active >= config.governance_threshold) 1
    else 0
}

public fun position_owner(position: &StakePosition): address { position.owner }

public fun cooldown_ends_at(position: &StakePosition): u64 { position.cooldown_ends_at }

public fun pending_unstake(position: &StakePosition): u64 {
    position.pending_unstake_amount
}

public fun cooldown_ms(config: &StakingConfig): u64 { config.cooldown_ms }

public fun total_staked(config: &StakingConfig): u64 { config.total_staked }

public fun total_stakers(config: &StakingConfig): u64 { config.total_stakers }

public fun thresholds(config: &StakingConfig): (u64, u64, u64, u64) {
    (
        config.governance_threshold,
        config.premium_threshold,
        config.fee_reduction_threshold,
        config.priority_access_threshold,
    )
}

// ============ Test Helpers ============

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
