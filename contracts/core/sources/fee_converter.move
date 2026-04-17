/// Fee Converter — Central fee routing for all Anansi products.
/// Takes CARIB fee coins (already swapped from source currency via DEX),
/// splits them according to burn/treasury ratio, and routes accordingly.
///
/// Design principles:
/// - DEX-agnostic: the swap happens in the PTB before this is called
/// - Source-agnostic: Spice, CaribStone, DollarBank, SaaS all route here
/// - Burn ratio is governable but bounded (0-100%)
/// - All routing is transparent via events
///
/// Flow:
///   [off-chain PTB builds this]
///   1. Source contract (e.g., yield_engine) extracts fee as Coin<USDC>
///   2. Cetus swap converts Coin<USDC> → Coin<CARIB>
///   3. fee_converter::process_fee splits the CARIB:
///      - burn_bps portion → permanently burned
///      - remainder → treasury address
module anansi::fee_converter;

use anansi::carib_coin::{Self, CARIB_COIN, Treasury};
use std::string::{Self, String};
use sui::coin::{Self, Coin};
use sui::event;

// ============ Objects ============

/// Shared configuration for fee routing. One per deployment.
public struct FeeConverter has key {
    id: UID,
    /// Portion of each fee that gets burned, in basis points (0-10000).
    /// e.g., 5000 = 50% burned, 50% to treasury.
    burn_bps: u64,
    /// Address receiving the non-burned portion.
    /// Should be Foundation multi-sig in production.
    treasury_address: address,
    /// Total CARIB burned through this converter (cumulative)
    total_burned: u64,
    /// Total CARIB routed to treasury (cumulative)
    total_to_treasury: u64,
    /// Total fee events processed
    fee_event_count: u64,
}

/// Admin capability for fee converter configuration.
/// Transferable — should be held by Foundation multi-sig.
public struct FeeConverterAdmin has key, store {
    id: UID,
}

// ============ Constants ============

const BPS_DENOMINATOR: u64 = 10000;
const DEFAULT_BURN_BPS: u64 = 5000; // 50% burn, 50% treasury
const MAX_BURN_BPS: u64 = 10000; // 100% max (all burn)

// ============ Errors ============

const EInvalidBurnRate: u64 = 600;
const EZeroFee: u64 = 601;

// ============ Events ============

/// Emitted when a fee is processed — the single source of truth for all fee routing.
public struct FeeProcessed has copy, drop {
    /// Tag describing the fee source (e.g., "spice_surplus", "carib_mint", "dollar_yield")
    source: String,
    /// Total fee amount in CARIB (before split)
    total_fee: u64,
    /// Amount burned
    burned: u64,
    /// Amount sent to treasury
    to_treasury: u64,
    /// Cumulative burn count after this event
    cumulative_burned: u64,
    /// Caller that processed the fee
    processor: address,
}

public struct BurnRateUpdated has copy, drop {
    old_bps: u64,
    new_bps: u64,
}

public struct TreasuryAddressUpdated has copy, drop {
    old_address: address,
    new_address: address,
}

// ============ Init ============

fun init(ctx: &mut TxContext) {
    let converter = FeeConverter {
        id: object::new(ctx),
        burn_bps: DEFAULT_BURN_BPS,
        treasury_address: ctx.sender(),
        total_burned: 0,
        total_to_treasury: 0,
        fee_event_count: 0,
    };

    let admin = FeeConverterAdmin {
        id: object::new(ctx),
    };

    transfer::share_object(converter);
    transfer::transfer(admin, ctx.sender());
}

// ============ Core Function ============

/// Process a CARIB fee. Splits by burn_bps, burns the burn portion,
/// sends the remainder to treasury. Emits event for transparency.
///
/// This is the single entry point for all fee routing across all Anansi products.
/// Any product that generates a CARIB fee ends its PTB with a call here.
///
/// Parameters:
/// - converter: shared FeeConverter config
/// - carib_treasury: CARIB Treasury object (for burn operation)
/// - fee_coin: the CARIB coins to process
/// - source: tag identifying what generated this fee (for analytics)
public fun process_fee(
    converter: &mut FeeConverter,
    carib_treasury: &mut Treasury,
    mut fee_coin: Coin<CARIB_COIN>,
    source: vector<u8>,
    ctx: &mut TxContext,
) {
    let total_fee = coin::value(&fee_coin);
    assert!(total_fee > 0, EZeroFee);

    // Calculate split
    let burn_amount = (total_fee * converter.burn_bps) / BPS_DENOMINATOR;
    let treasury_amount = total_fee - burn_amount;

    // Burn the burn portion (if any)
    if (burn_amount > 0) {
        let burn_coins = coin::split(&mut fee_coin, burn_amount, ctx);
        carib_coin::burn(carib_treasury, burn_coins, ctx);
        converter.total_burned = converter.total_burned + burn_amount;
    };

    // Send remainder to treasury (if any)
    if (treasury_amount > 0) {
        transfer::public_transfer(fee_coin, converter.treasury_address);
        converter.total_to_treasury = converter.total_to_treasury + treasury_amount;
    } else {
        // Edge case: burn_bps == 10000 (100% burn). Destroy the zero-value coin.
        coin::destroy_zero(fee_coin);
    };

    converter.fee_event_count = converter.fee_event_count + 1;

    event::emit(FeeProcessed {
        source: string::utf8(source),
        total_fee,
        burned: burn_amount,
        to_treasury: treasury_amount,
        cumulative_burned: converter.total_burned,
        processor: ctx.sender(),
    });
}

// ============ Admin Functions ============

/// Update the burn-to-treasury ratio. Must be 0-10000 bps.
/// Governable parameter — Foundation can adjust based on economic conditions.
public fun update_burn_rate(
    _admin: &FeeConverterAdmin,
    converter: &mut FeeConverter,
    new_burn_bps: u64,
) {
    assert!(new_burn_bps <= MAX_BURN_BPS, EInvalidBurnRate);
    let old_bps = converter.burn_bps;
    converter.burn_bps = new_burn_bps;

    event::emit(BurnRateUpdated {
        old_bps,
        new_bps: new_burn_bps,
    });
}

/// Update the treasury receiving address (e.g., when migrating to multi-sig).
public fun update_treasury_address(
    _admin: &FeeConverterAdmin,
    converter: &mut FeeConverter,
    new_address: address,
) {
    let old_address = converter.treasury_address;
    converter.treasury_address = new_address;

    event::emit(TreasuryAddressUpdated {
        old_address,
        new_address,
    });
}

/// Transfer admin cap to a new holder (e.g., multi-sig).
public fun transfer_admin(cap: FeeConverterAdmin, recipient: address) {
    transfer::transfer(cap, recipient);
}

// ============ View Functions ============

public fun burn_bps(converter: &FeeConverter): u64 { converter.burn_bps }

public fun treasury_address(converter: &FeeConverter): address {
    converter.treasury_address
}

public fun total_burned(converter: &FeeConverter): u64 { converter.total_burned }

public fun total_to_treasury(converter: &FeeConverter): u64 {
    converter.total_to_treasury
}

public fun fee_event_count(converter: &FeeConverter): u64 { converter.fee_event_count }

// ============ Test Helpers ============

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
