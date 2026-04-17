/// Yield Engine — Surplus distribution for Spice platform.
/// When a commodity lot sells, surplus USDC is deposited here.
/// Token holders (Coin<NUTMEG>, Coin<COCOA>, etc.) claim pro-rata.
///
/// Fee handling:
/// - A percentage of the deposited surplus is extracted as fee
/// - The fee is RETURNED to the caller as Coin<PaymentT>
/// - The caller's PTB is responsible for:
///   1. Swapping the fee (USDC) → CARIB via Cetus
///   2. Calling fee_converter::process_fee to split burn/treasury
/// - This keeps yield_engine DEX-agnostic and upgrade-friendly
///
/// Two type parameters:
///   PaymentT — the payment coin (USDC)
///   CommodityT — the commodity coin (NUTMEG, COCOA) used to prove holdings
module anansi::yield_engine;

use anansi::asset_pool::{Self, Lot};
use anansi::compliance::{Self, ComplianceRegistry};
use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::event;
use sui::table::{Self, Table};

// ============ Objects ============

public struct YieldEngine has key {
    id: UID,
    /// Fee rate in basis points (e.g., 100 = 1%)
    fee_rate_bps: u64,
    /// Cumulative distributed (net, after fee)
    total_distributed: u64,
    /// Cumulative fees extracted (in PaymentT units, pre-swap)
    total_fees_collected: u64,
}

/// Surplus deposit holding payment coins (USDC) for token holders to claim.
/// Shared object. Farmers call claim_surplus with their commodity coin as proof.
public struct SurplusDeposit<phantom PaymentT, phantom CommodityT> has key {
    id: UID,
    lot_id: ID,
    balance: Balance<PaymentT>,
    total_amount: u64,
    total_tokens_at_snapshot: u64,
    claims: Table<address, u64>,
    deposited_at: u64,
}

public struct YieldAdmin has key, store { id: UID }

// ============ Constants ============

const DEFAULT_FEE_BPS: u64 = 100; // 1%
const BPS_DENOMINATOR: u64 = 10000;
const MAX_FEE_BPS: u64 = 1000; // 10% max fee (safety bound)

// ============ Errors ============

const EInvalidFeeRate: u64 = 200;
const EInsufficientDeposit: u64 = 201;
const ENoTokensToRedeem: u64 = 202;
const EAlreadyClaimed: u64 = 204;
const EInsufficientBalance: u64 = 205;

// ============ Events ============

public struct SurplusReceived has copy, drop {
    deposit_id: ID,
    lot_id: ID,
    gross_amount: u64,
    fee_amount: u64,
    net_amount: u64,
    tokens_snapshot: u64,
}

public struct SurplusClaimed has copy, drop {
    deposit_id: ID,
    lot_id: ID,
    claimant: address,
    tokens_held: u64,
    amount_received: u64,
}

public struct FeeConfigUpdated has copy, drop {
    new_fee_rate_bps: u64,
}

// ============ Init ============

fun init(ctx: &mut TxContext) {
    transfer::share_object(YieldEngine {
        id: object::new(ctx),
        fee_rate_bps: DEFAULT_FEE_BPS,
        total_distributed: 0,
        total_fees_collected: 0,
    });
    transfer::transfer(YieldAdmin { id: object::new(ctx) }, ctx.sender());
}

// ============ Core Functions ============

/// Deposit surplus for a lot.
///
/// Returns the fee as Coin<PaymentT> for the caller's PTB to swap to CARIB
/// and route through fee_converter. This keeps the module DEX-agnostic.
///
/// PTB pattern:
///   let fee_usdc = yield_engine::deposit_surplus(...);
///   let fee_carib = <cetus swap fee_usdc → CARIB>;
///   fee_converter::process_fee(converter, carib_treasury, fee_carib, b"spice_surplus", ctx);
///
/// Parameters:
/// - engine: shared YieldEngine
/// - lot: the Lot being distributed
/// - payment: user's USDC coin (will be split, original returned with remainder)
/// - gross_amount: total surplus to deposit (including fee)
/// - total_commodity_supply: current total supply of the commodity coin (for pro-rata snapshot)
///
/// Returns: Coin<PaymentT> — the extracted fee, for downstream swap + burn
public fun deposit_surplus<PaymentT, CommodityT>(
    engine: &mut YieldEngine,
    lot: &mut Lot,
    payment: &mut Coin<PaymentT>,
    gross_amount: u64,
    total_commodity_supply: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): Coin<PaymentT> {
    assert!(gross_amount > 0, EInsufficientDeposit);
    assert!(coin::value(payment) >= gross_amount, EInsufficientDeposit);
    assert!(total_commodity_supply > 0, ENoTokensToRedeem);

    // Split the deposit amount from the payment coin
    let mut deposit_coin = coin::split(payment, gross_amount, ctx);

    // Calculate and extract fee
    let fee_amount = (gross_amount * engine.fee_rate_bps) / BPS_DENOMINATOR;
    let net_amount = gross_amount - fee_amount;

    // Extract fee coin — returned to caller for PTB to swap + burn
    let fee_coin = coin::split(&mut deposit_coin, fee_amount, ctx);

    // Record in lot
    asset_pool::record_surplus_deposit(lot, gross_amount);

    // Use passed total supply for snapshot (not per-lot, since coins are fungible)
    let tokens_snapshot = total_commodity_supply;
    let lot_id = object::id(lot);

    // Hold net amount in shared deposit for claims
    let deposit = SurplusDeposit<PaymentT, CommodityT> {
        id: object::new(ctx),
        lot_id,
        balance: coin::into_balance(deposit_coin),
        total_amount: net_amount,
        total_tokens_at_snapshot: tokens_snapshot,
        claims: table::new(ctx),
        deposited_at: sui::clock::timestamp_ms(clock),
    };

    engine.total_distributed = engine.total_distributed + net_amount;
    engine.total_fees_collected = engine.total_fees_collected + fee_amount;

    event::emit(SurplusReceived {
        deposit_id: object::id(&deposit),
        lot_id,
        gross_amount,
        fee_amount,
        net_amount,
        tokens_snapshot,
    });
    transfer::share_object(deposit);

    // Return the fee coin for the caller's PTB to swap → burn
    fee_coin
}

/// Claim surplus. Farmer presents their commodity coin as proof of holdings.
/// Pro-rata: (holder_balance / total_tokens_at_snapshot) * total_amount
///
/// PaymentT = the payout coin type (USDC)
/// CommodityT = the commodity coin type (NUTMEG) — farmer holds this
public fun claim_surplus<PaymentT, CommodityT>(
    deposit: &mut SurplusDeposit<PaymentT, CommodityT>,
    holder_coin: &Coin<CommodityT>,
    registry: &ComplianceRegistry,
    ctx: &mut TxContext,
) {
    let claimant = ctx.sender();

    // Compliance check — claimant must be verified and not frozen
    compliance::assert_can_participate(registry, claimant);

    // Check not already claimed
    assert!(!table::contains(&deposit.claims, claimant), EAlreadyClaimed);

    let token_balance = coin::value(holder_coin);
    assert!(token_balance > 0, ENoTokensToRedeem);

    // Pro-rata calculation
    let share = (deposit.total_amount * token_balance) / deposit.total_tokens_at_snapshot;
    assert!(share > 0, ENoTokensToRedeem);
    assert!(balance::value(&deposit.balance) >= share, EInsufficientBalance);

    // Record claim
    table::add(&mut deposit.claims, claimant, share);

    // Pay the claimant
    let payout = coin::from_balance(balance::split(&mut deposit.balance, share), ctx);

    event::emit(SurplusClaimed {
        deposit_id: object::id(deposit),
        lot_id: deposit.lot_id,
        claimant,
        tokens_held: token_balance,
        amount_received: share,
    });

    transfer::public_transfer(payout, claimant);
}

// ============ Admin Functions ============

/// Update the surplus fee rate. Bounded to 0-1000 bps (0-10%) as a safety rail.
public fun update_fee_rate(
    _admin: &YieldAdmin,
    engine: &mut YieldEngine,
    new_fee_rate_bps: u64,
) {
    assert!(new_fee_rate_bps <= MAX_FEE_BPS, EInvalidFeeRate);
    engine.fee_rate_bps = new_fee_rate_bps;
    event::emit(FeeConfigUpdated { new_fee_rate_bps });
}

/// Transfer admin cap to a new holder.
public fun transfer_admin(cap: YieldAdmin, recipient: address) {
    transfer::transfer(cap, recipient);
}

// ============ View Functions ============

public fun fee_rate(engine: &YieldEngine): u64 { engine.fee_rate_bps }

public fun total_distributed(engine: &YieldEngine): u64 { engine.total_distributed }

public fun total_fees_collected(engine: &YieldEngine): u64 { engine.total_fees_collected }

public fun deposit_remaining<PaymentT, CommodityT>(
    deposit: &SurplusDeposit<PaymentT, CommodityT>,
): u64 { balance::value(&deposit.balance) }

public fun deposit_total<PaymentT, CommodityT>(
    deposit: &SurplusDeposit<PaymentT, CommodityT>,
): u64 { deposit.total_amount }

public fun deposit_lot_id<PaymentT, CommodityT>(
    deposit: &SurplusDeposit<PaymentT, CommodityT>,
): ID { deposit.lot_id }

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) { init(ctx); }
