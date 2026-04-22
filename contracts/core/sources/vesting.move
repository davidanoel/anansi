/// Vesting — Time-locked allocations for CARIB tokens.
///
/// Supports three use cases in one module:
///   1. Foundation self-lock (credibility / public proof of Charter commitments)
///   2. SAFT investor schedules (revocable = false)
///   3. Team/contributor grants (revocable = true — claws back on departure)
///
/// Design principles:
///   - Pull-based: beneficiary claims; creator/admin never pushes
///   - Revocability is a flag set at creation and IMMUTABLE thereafter
///   - All schedules are shared objects — publicly auditable
///   - u128 intermediates prevent u64 overflow on large token × time products
///   - Admin has a global pause; cannot alter or seize individual schedules
///
/// Math: linear vesting between start_ms and end_ms, with optional cliff.
///   vested(t) = 0                              if t < cliff_ms
///   vested(t) = total * (t - start) / (end - start)  if cliff_ms <= t < end_ms
///   vested(t) = total                          if t >= end_ms
module anansi::vesting;

use anansi::carib_coin::CARIB_COIN;
use sui::balance::{Self, Balance};
use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::event;

// ============ Objects ============

/// A single vesting schedule. Shared so both creator and beneficiary can reference it.
public struct VestingSchedule has key {
    id: UID,
    /// Address entitled to claim vested tokens. Can be changed via `transfer_schedule`
    /// by the current beneficiary.
    beneficiary: address,
    /// Address that funded the schedule. If revocable=true, this address can revoke.
    /// Immutable after creation.
    creator: address,
    /// Total tokens locked when the schedule was created. Immutable.
    total: u64,
    /// Cumulative amount claimed by the beneficiary so far.
    released: u64,
    /// Absolute timestamp (ms) when vesting begins.
    start_ms: u64,
    /// Absolute timestamp (ms). No tokens are claimable before this time.
    /// Set equal to `start_ms` for "no cliff" (pure linear from day zero).
    cliff_ms: u64,
    /// Absolute timestamp (ms) when vesting completes (all tokens vested).
    end_ms: u64,
    /// If true, `creator` can revoke unvested portion. Immutable after creation.
    revocable: bool,
    /// Flipped true on revocation. Vested freezes at `revoked_at_ms`.
    revoked: bool,
    /// Timestamp of revocation, 0 if not revoked.
    revoked_at_ms: u64,
    /// Locked balance. Decreases on claim and revoke.
    balance: Balance<CARIB_COIN>,
}

/// Global config. Shared object. Tracks aggregates and exposes a pause switch.
public struct VestingConfig has key {
    id: UID,
    /// Emergency pause — blocks `create_schedule` and `claim` when true.
    /// Deliberately does NOT block `revoke`, so a compromised-contract scenario
    /// can still be unwound by creators clawing back their funds.
    paused: bool,
    total_schedules: u64,
    total_locked: u64,     // cumulative, never decreases
    total_released: u64,   // cumulative claims across all schedules
    total_revoked: u64,    // cumulative tokens returned to creators via revoke
}

public struct VestingAdmin has key, store { id: UID }

// ============ Errors ============

const EZeroAmount: u64 = 800;
const EInvalidTimeRange: u64 = 801;
const ENotBeneficiary: u64 = 802;
const ENotCreator: u64 = 803;
const ENotRevocable: u64 = 804;
const EAlreadyRevoked: u64 = 805;
const ENothingToClaim: u64 = 806;
const EPaused: u64 = 807;

// ============ Events ============

public struct ScheduleCreated has copy, drop {
    schedule_id: ID,
    beneficiary: address,
    creator: address,
    total: u64,
    start_ms: u64,
    cliff_ms: u64,
    end_ms: u64,
    revocable: bool,
}

public struct TokensClaimed has copy, drop {
    schedule_id: ID,
    beneficiary: address,
    amount: u64,
    new_released_total: u64,
}

public struct ScheduleRevoked has copy, drop {
    schedule_id: ID,
    creator: address,
    returned_to_creator: u64,
    already_vested: u64,
    revoked_at_ms: u64,
}

public struct ScheduleTransferred has copy, drop {
    schedule_id: ID,
    old_beneficiary: address,
    new_beneficiary: address,
}

public struct PauseToggled has copy, drop {
    paused: bool,
}

// ============ Init ============

fun init(ctx: &mut TxContext) {
    transfer::share_object(VestingConfig {
        id: object::new(ctx),
        paused: false,
        total_schedules: 0,
        total_locked: 0,
        total_released: 0,
        total_revoked: 0,
    });
    transfer::transfer(VestingAdmin { id: object::new(ctx) }, ctx.sender());
}

// ============ Core Functions ============

/// Create a new vesting schedule. The full value of `coin` becomes the locked total.
/// The schedule is shared — both creator and beneficiary can reference it.
///
/// Time parameters are absolute millisecond timestamps (not durations).
/// Constraints: start_ms <= cliff_ms <= end_ms, and end_ms > start_ms.
/// For "no cliff", pass cliff_ms == start_ms. For "cliff only" (all unlocks at cliff),
/// pass cliff_ms == end_ms.
///
/// `revocable` is IMMUTABLE after creation. Choose carefully:
///   - SAFT investors: revocable=false (creator can never claw back)
///   - Team/contributors: revocable=true (claws back unvested if they leave)
///   - Foundation self-lock: revocable=false (credibility)
public fun create_schedule(
    config: &mut VestingConfig,
    coin: Coin<CARIB_COIN>,
    beneficiary: address,
    start_ms: u64,
    cliff_ms: u64,
    end_ms: u64,
    revocable: bool,
    ctx: &mut TxContext,
) {
    assert!(!config.paused, EPaused);

    let total = coin::value(&coin);
    assert!(total > 0, EZeroAmount);

    // Time ordering: start <= cliff <= end, and duration is positive.
    assert!(start_ms <= cliff_ms, EInvalidTimeRange);
    assert!(cliff_ms <= end_ms, EInvalidTimeRange);
    assert!(end_ms > start_ms, EInvalidTimeRange);

    let creator = ctx.sender();
    let schedule = VestingSchedule {
        id: object::new(ctx),
        beneficiary,
        creator,
        total,
        released: 0,
        start_ms,
        cliff_ms,
        end_ms,
        revocable,
        revoked: false,
        revoked_at_ms: 0,
        balance: coin::into_balance(coin),
    };

    let schedule_id = object::id(&schedule);

    config.total_schedules = config.total_schedules + 1;
    config.total_locked = config.total_locked + total;

    event::emit(ScheduleCreated {
        schedule_id,
        beneficiary,
        creator,
        total,
        start_ms,
        cliff_ms,
        end_ms,
        revocable,
    });

    transfer::share_object(schedule);
}

/// Beneficiary claims all currently-vested-but-unreleased tokens.
/// Aborts if claimable == 0 to prevent gas-wasting no-op calls.
///
/// After revocation, this still works — beneficiary claims whatever was vested
/// at the moment of revocation minus what they've already released.
public fun claim(
    config: &mut VestingConfig,
    schedule: &mut VestingSchedule,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(!config.paused, EPaused);
    assert!(ctx.sender() == schedule.beneficiary, ENotBeneficiary);

    let now = clock::timestamp_ms(clock);
    let vested = vested_amount_internal(schedule, now);
    let claimable_amount = vested - schedule.released;
    assert!(claimable_amount > 0, ENothingToClaim);

    schedule.released = schedule.released + claimable_amount;
    config.total_released = config.total_released + claimable_amount;

    let payout = coin::from_balance(
        balance::split(&mut schedule.balance, claimable_amount),
        ctx,
    );

    event::emit(TokensClaimed {
        schedule_id: object::id(schedule),
        beneficiary: schedule.beneficiary,
        amount: claimable_amount,
        new_released_total: schedule.released,
    });

    transfer::public_transfer(payout, schedule.beneficiary);
}

/// Creator revokes the unvested portion. Only works if revocable=true at creation.
/// The unvested remainder is returned to the creator as a Coin.
/// Already-vested tokens remain claimable by the beneficiary.
///
/// NOTE: Unlike pause, revoke intentionally works even when `config.paused`.
/// Reason: revocation is a safety valve (bad-actor unwind, bug recovery).
public fun revoke(
    config: &mut VestingConfig,
    schedule: &mut VestingSchedule,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(ctx.sender() == schedule.creator, ENotCreator);
    assert!(schedule.revocable, ENotRevocable);
    assert!(!schedule.revoked, EAlreadyRevoked);

    let now = clock::timestamp_ms(clock);
    let vested = vested_amount_internal(schedule, now);

    // Everything not yet vested returns to creator.
    // Already-vested but unclaimed stays in the schedule for beneficiary to claim.
    let unvested = schedule.total - vested;

    schedule.revoked = true;
    schedule.revoked_at_ms = now;

    config.total_revoked = config.total_revoked + unvested;

    if (unvested > 0) {
        let return_coin = coin::from_balance(
            balance::split(&mut schedule.balance, unvested),
            ctx,
        );
        transfer::public_transfer(return_coin, schedule.creator);
    };

    event::emit(ScheduleRevoked {
        schedule_id: object::id(schedule),
        creator: schedule.creator,
        returned_to_creator: unvested,
        already_vested: vested,
        revoked_at_ms: now,
    });
}

/// Current beneficiary transfers their claim rights to a new address.
/// Useful for M&A events, wallet rotation, or estate planning.
/// Does NOT reset any vesting state — only the beneficiary address changes.
public fun transfer_schedule(
    schedule: &mut VestingSchedule,
    new_beneficiary: address,
    ctx: &TxContext,
) {
    assert!(ctx.sender() == schedule.beneficiary, ENotBeneficiary);

    let old_beneficiary = schedule.beneficiary;
    schedule.beneficiary = new_beneficiary;

    event::emit(ScheduleTransferred {
        schedule_id: object::id(schedule),
        old_beneficiary,
        new_beneficiary,
    });
}

// ============ Admin ============

public fun set_paused(_admin: &VestingAdmin, config: &mut VestingConfig, paused: bool) {
    config.paused = paused;
    event::emit(PauseToggled { paused });
}

public fun transfer_admin(cap: VestingAdmin, recipient: address) {
    transfer::transfer(cap, recipient);
}

// ============ View Functions ============

/// Total vested at `now`. If revoked, freezes at `revoked_at_ms`.
/// Does NOT subtract already-released — use `claimable()` for that.
public fun vested_amount(schedule: &VestingSchedule, clock: &Clock): u64 {
    vested_amount_internal(schedule, clock::timestamp_ms(clock))
}

/// Amount the beneficiary can claim right now (vested minus released).
public fun claimable(schedule: &VestingSchedule, clock: &Clock): u64 {
    let vested = vested_amount(schedule, clock);
    if (vested > schedule.released) vested - schedule.released else 0
}

public fun cliff_reached(schedule: &VestingSchedule, clock: &Clock): bool {
    clock::timestamp_ms(clock) >= schedule.cliff_ms
}

public fun is_fully_vested(schedule: &VestingSchedule, clock: &Clock): bool {
    let effective = if (schedule.revoked) schedule.revoked_at_ms
                    else clock::timestamp_ms(clock);
    effective >= schedule.end_ms
}

// --- Schedule getters ---
public fun beneficiary(schedule: &VestingSchedule): address { schedule.beneficiary }
public fun creator(schedule: &VestingSchedule): address { schedule.creator }
public fun total(schedule: &VestingSchedule): u64 { schedule.total }
public fun released(schedule: &VestingSchedule): u64 { schedule.released }
public fun remaining(schedule: &VestingSchedule): u64 { balance::value(&schedule.balance) }
public fun start_ms(schedule: &VestingSchedule): u64 { schedule.start_ms }
public fun cliff_ms(schedule: &VestingSchedule): u64 { schedule.cliff_ms }
public fun end_ms(schedule: &VestingSchedule): u64 { schedule.end_ms }
public fun is_revocable(schedule: &VestingSchedule): bool { schedule.revocable }
public fun is_revoked(schedule: &VestingSchedule): bool { schedule.revoked }
public fun revoked_at_ms(schedule: &VestingSchedule): u64 { schedule.revoked_at_ms }

// --- Config getters ---
public fun total_schedules(config: &VestingConfig): u64 { config.total_schedules }
public fun total_locked(config: &VestingConfig): u64 { config.total_locked }
public fun total_released_global(config: &VestingConfig): u64 { config.total_released }
public fun total_revoked_global(config: &VestingConfig): u64 { config.total_revoked }
public fun is_paused(config: &VestingConfig): bool { config.paused }

// ============ Internal Math ============

/// Compute vested amount at time `now`, accounting for cliff and revocation.
///
/// Uses u128 intermediate for the linear-vesting multiplication. Without u128:
///   total (up to ~6e18 raw CARIB at 9 decimals) × elapsed (years in ms, up to ~1e11)
///   easily exceeds u64::MAX (~1.84e19). u128 math gives headroom up to ~3.4e38.
fun vested_amount_internal(schedule: &VestingSchedule, now: u64): u64 {
    let effective_now = if (schedule.revoked) schedule.revoked_at_ms else now;

    // Before cliff: nothing vested
    if (effective_now < schedule.cliff_ms) return 0;

    // After end: fully vested
    if (effective_now >= schedule.end_ms) return schedule.total;

    // Linear between start and end. cliff_ms in [start_ms, end_ms] means we're
    // guaranteed effective_now >= start_ms here (already passed cliff).
    let elapsed = (effective_now - schedule.start_ms) as u128;
    let duration = (schedule.end_ms - schedule.start_ms) as u128;
    let total_u128 = schedule.total as u128;

    ((total_u128 * elapsed) / duration) as u64
}

// ============ Test Helpers ============

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) { init(ctx); }
