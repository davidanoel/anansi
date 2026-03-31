/// Yield Engine — Handles surplus distribution from asset sales.
/// When GCNA sells nutmeg overseas, surplus USDC flows here and gets
/// distributed pro-rata to SpiceToken holders.
/// Fees are collected and routed to burn + treasury.
module anansi::yield_engine {
    use sui::coin::{Self, Coin};
    use sui::event;
    use sui::clock::Clock;
    use sui::table::{Self, Table};
    use std::string::String;
    use anansi::asset_pool::{Self, Lot, SpiceToken};
    use anansi::carib_coin::{Self, CARIB_COIN, Treasury};

    // ============ Objects ============

    /// Global yield engine configuration. Shared object.
    public struct YieldEngine has key {
        id: UID,
        /// Fee rate in basis points (100 = 1%)
        fee_rate_bps: u64,
        /// Percentage of fee that gets burned (rest goes to treasury). In bps.
        burn_rate_bps: u64,
        /// Total USDC distributed across all lots (cumulative)
        total_distributed: u64,
        /// Total CARIB fees collected (cumulative)
        total_fees_collected: u64,
        /// Total CARIB burned through fees (cumulative)
        total_fees_burned: u64,
        /// Treasury address for fee routing
        treasury_address: address,
    }

    /// A surplus deposit waiting to be claimed by token holders.
    public struct SurplusDeposit has key, store {
        id: UID,
        /// Which lot this surplus belongs to
        lot_id: ID,
        /// Total USDC deposited (after fees)
        total_usdc: u64,
        /// Total tokens outstanding at time of deposit (for pro-rata calc)
        total_tokens_at_snapshot: u64,
        /// USDC remaining to be claimed
        remaining_usdc: u64,
        /// Timestamp
        deposited_at: u64,
    }

    /// Admin capability for yield engine configuration.
    public struct YieldAdmin has key, store {
        id: UID,
    }

    // ============ Constants ============

    /// Default fee: 1% (100 basis points)
    const DEFAULT_FEE_BPS: u64 = 100;
    /// Default burn rate: 50% of fees (5000 basis points = 50%)
    const DEFAULT_BURN_BPS: u64 = 5000;
    /// Basis points denominator
    const BPS_DENOMINATOR: u64 = 10000;

    // ============ Errors ============

    const EInvalidFeeRate: u64 = 200;
    const EInsufficientDeposit: u64 = 201;
    const ENoTokensToRedeem: u64 = 202;
    const ELotMismatch: u64 = 203;

    // ============ Events ============

    public struct SurplusReceived has copy, drop {
        lot_id: ID,
        gross_amount: u64,
        fee_amount: u64,
        net_amount: u64,
        tokens_snapshot: u64,
    }

    public struct SurplusClaimed has copy, drop {
        lot_id: ID,
        claimant: address,
        tokens_redeemed: u64,
        usdc_received: u64,
    }

    public struct FeesCollected has copy, drop {
        lot_id: ID,
        total_fee: u64,
        burned: u64,
        to_treasury: u64,
    }

    public struct FeeConfigUpdated has copy, drop {
        new_fee_rate_bps: u64,
        new_burn_rate_bps: u64,
    }

    // ============ Init ============

    fun init(ctx: &mut TxContext) {
        let engine = YieldEngine {
            id: object::new(ctx),
            fee_rate_bps: DEFAULT_FEE_BPS,
            burn_rate_bps: DEFAULT_BURN_BPS,
            total_distributed: 0,
            total_fees_collected: 0,
            total_fees_burned: 0,
            treasury_address: ctx.sender(),
        };

        let admin = YieldAdmin {
            id: object::new(ctx),
        };

        transfer::share_object(engine);
        transfer::transfer(admin, ctx.sender());
    }

    // ============ Core Functions ============

    /// Deposit surplus USDC for a lot.
    /// Called by the custodian (e.g., GCNA) after selling the physical commodity.
    /// 
    /// In the full version, this would also auto-convert the fee portion to CARIB
    /// via a DEX swap within the same PTB. For MVP, fees are tracked in USDC
    /// and CARIB burns happen in a separate transaction.
    ///
    /// Note: This uses a generic Coin<T> to allow USDC or any stablecoin.
    /// In production, T would be constrained to an approved stablecoin type.
    public fun deposit_surplus<T>(
        engine: &mut YieldEngine,
        lot: &mut Lot,
        mut payment: Coin<T>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let gross_amount = coin::value(&payment);
        assert!(gross_amount > 0, EInsufficientDeposit);

        // Calculate fee
        let fee_amount = (gross_amount * engine.fee_rate_bps) / BPS_DENOMINATOR;
        let net_amount = gross_amount - fee_amount;

        // Split the fee portion
        let fee_coin = coin::split(&mut payment, fee_amount, ctx);

        // Record in lot
        asset_pool::record_surplus_deposit(lot, gross_amount);

        // Get token snapshot for pro-rata calculation
        let tokens_snapshot = asset_pool::lot_total_tokens(lot);
        let lot_id = object::id(lot);

        // Create surplus deposit for claiming
        let deposit = SurplusDeposit {
            id: object::new(ctx),
            lot_id,
            total_usdc: net_amount,
            total_tokens_at_snapshot: tokens_snapshot,
            remaining_usdc: net_amount,
            deposited_at: sui::clock::timestamp_ms(clock),
        };

        // Update engine stats
        engine.total_distributed = engine.total_distributed + net_amount;
        engine.total_fees_collected = engine.total_fees_collected + fee_amount;

        event::emit(SurplusReceived {
            lot_id,
            gross_amount,
            fee_amount,
            net_amount,
            tokens_snapshot,
        });

        // Transfer fee to treasury address (in MVP, converted to CARIB externally)
        transfer::public_transfer(fee_coin, engine.treasury_address);
        
        // Share the net payment and surplus deposit for claiming
        transfer::public_transfer(payment, engine.treasury_address); // temporary: hold net for claiming
        transfer::share_object(deposit);
    }

    /// Claim surplus for a SpiceToken holding.
    /// The token holder presents their tokens and receives proportional USDC.
    /// Tokens are NOT consumed — they can receive future surplus distributions too.
    /// 
    /// Pro-rata calculation: (token_balance / total_tokens_at_snapshot) * total_usdc
    public fun claim_surplus<T>(
        deposit: &mut SurplusDeposit,
        token: &SpiceToken,
        payment_pool: &mut Coin<T>,
        ctx: &mut TxContext,
    ) {
        assert!(asset_pool::token_lot_id(token) == deposit.lot_id, ELotMismatch);

        let token_balance = asset_pool::token_balance(token);
        assert!(token_balance > 0, ENoTokensToRedeem);

        // Pro-rata calculation
        let share = (deposit.total_usdc * token_balance) / deposit.total_tokens_at_snapshot;
        assert!(share <= deposit.remaining_usdc, EInsufficientDeposit);

        deposit.remaining_usdc = deposit.remaining_usdc - share;

        // Split the share from the payment pool and send to claimant
        let payout = coin::split(payment_pool, share, ctx);

        event::emit(SurplusClaimed {
            lot_id: deposit.lot_id,
            claimant: ctx.sender(),
            tokens_redeemed: token_balance,
            usdc_received: share,
        });

        transfer::public_transfer(payout, ctx.sender());
    }

    // ============ Fee Management (with CARIB burn) ============

    /// Burn CARIB tokens as protocol fee.
    /// Called after fees have been converted to CARIB (via DEX swap in PTB).
    /// Burns the configured percentage and sends the rest to treasury.
    public fun process_carib_fee(
        engine: &mut YieldEngine,
        carib_treasury: &mut Treasury,
        mut fee_coins: Coin<CARIB_COIN>,
        lot_id: ID,
        ctx: &mut TxContext,
    ) {
        let total_fee = coin::value(&fee_coins);

        // Calculate burn portion
        let burn_amount = (total_fee * engine.burn_rate_bps) / BPS_DENOMINATOR;
        let treasury_amount = total_fee - burn_amount;

        // Split and burn
        let burn_coins = coin::split(&mut fee_coins, burn_amount, ctx);
        carib_coin::burn(carib_treasury, burn_coins, ctx);

        engine.total_fees_burned = engine.total_fees_burned + burn_amount;

        event::emit(FeesCollected {
            lot_id,
            total_fee,
            burned: burn_amount,
            to_treasury: treasury_amount,
        });

        // Send remainder to treasury
        transfer::public_transfer(fee_coins, engine.treasury_address);
    }

    // ============ Admin Functions ============

    /// Update fee configuration. Only callable by yield admin.
    public fun update_fees(
        _admin: &YieldAdmin,
        engine: &mut YieldEngine,
        new_fee_rate_bps: u64,
        new_burn_rate_bps: u64,
    ) {
        assert!(new_fee_rate_bps <= 1000, EInvalidFeeRate); // Max 10%
        assert!(new_burn_rate_bps <= BPS_DENOMINATOR, EInvalidFeeRate);

        engine.fee_rate_bps = new_fee_rate_bps;
        engine.burn_rate_bps = new_burn_rate_bps;

        event::emit(FeeConfigUpdated {
            new_fee_rate_bps,
            new_burn_rate_bps,
        });
    }

    /// Update the treasury address for fee routing.
    public fun update_treasury_address(
        _admin: &YieldAdmin,
        engine: &mut YieldEngine,
        new_address: address,
    ) {
        engine.treasury_address = new_address;
    }

    // ============ View Functions ============

    public fun fee_rate(engine: &YieldEngine): u64 { engine.fee_rate_bps }
    public fun burn_rate(engine: &YieldEngine): u64 { engine.burn_rate_bps }
    public fun total_distributed(engine: &YieldEngine): u64 { engine.total_distributed }
    public fun total_fees_burned(engine: &YieldEngine): u64 { engine.total_fees_burned }

    public fun deposit_remaining(deposit: &SurplusDeposit): u64 { deposit.remaining_usdc }
    public fun deposit_total(deposit: &SurplusDeposit): u64 { deposit.total_usdc }
    public fun deposit_lot_id(deposit: &SurplusDeposit): ID { deposit.lot_id }

    // ============ Test Helpers ============

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
