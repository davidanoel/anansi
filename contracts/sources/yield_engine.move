/// Yield Engine — Surplus distribution for Spice platform.
/// When a commodity lot sells, surplus USDC is deposited here.
/// Token holders (Coin<NUTMEG>, Coin<COCOA>, etc.) claim pro-rata.
///
/// Two type parameters:
///   PaymentT — the payment coin (USDC)
///   CommodityT — the commodity coin (NUTMEG, COCOA) used to prove holdings
module anansi::yield_engine {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::event;
    use sui::clock::Clock;
    use sui::table::{Self, Table};
    use anansi::asset_pool::{Self, Lot};
    use anansi::carib_coin::{Self, CARIB_COIN, Treasury};

    // ============ Objects ============

    public struct YieldEngine has key {
        id: UID,
        fee_rate_bps: u64,
        burn_rate_bps: u64,
        total_distributed: u64,
        total_fees_collected: u64,
        total_fees_burned: u64,
        treasury_address: address,
    }

    /// Surplus deposit holding payment coins (USDC) for token holders to claim.
    /// Shared object. Farmers call claim_surplus with their commodity coin as proof.
    public struct SurplusDeposit<phantom PaymentT> has key {
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

    const DEFAULT_FEE_BPS: u64 = 100;
    const DEFAULT_BURN_BPS: u64 = 5000;
    const BPS_DENOMINATOR: u64 = 10000;

    // ============ Errors ============

    const EInvalidFeeRate: u64 = 200;
    const EInsufficientDeposit: u64 = 201;
    const ENoTokensToRedeem: u64 = 202;
    const EAlreadyClaimed: u64 = 204;
    const EInsufficientBalance: u64 = 205;

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
        tokens_held: u64,
        amount_received: u64,
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
        transfer::share_object(YieldEngine {
            id: object::new(ctx),
            fee_rate_bps: DEFAULT_FEE_BPS,
            burn_rate_bps: DEFAULT_BURN_BPS,
            total_distributed: 0,
            total_fees_collected: 0,
            total_fees_burned: 0,
            treasury_address: ctx.sender(),
        });
        transfer::transfer(YieldAdmin { id: object::new(ctx) }, ctx.sender());
    }

    // ============ Core Functions ============

    /// Deposit surplus for a lot. Takes &mut Coin (the contract splits internally).
    /// total_commodity_supply: total Coin<COMMODITY> supply at this moment (read from MintVault).
    /// This is used for pro-rata snapshot so all holders claim fairly with fungible coins.
    public fun deposit_surplus<PaymentT>(
        engine: &mut YieldEngine,
        lot: &mut Lot,
        payment: &mut Coin<PaymentT>,
        gross_amount: u64,
        total_commodity_supply: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(gross_amount > 0, EInsufficientDeposit);
        assert!(coin::value(payment) >= gross_amount, EInsufficientDeposit);
        assert!(total_commodity_supply > 0, ENoTokensToRedeem);

        // Split the deposit amount from the payment coin
        let mut deposit_coin = coin::split(payment, gross_amount, ctx);

        // Calculate and extract fee
        let fee_amount = (gross_amount * engine.fee_rate_bps) / BPS_DENOMINATOR;
        let net_amount = gross_amount - fee_amount;

        let fee_coin = coin::split(&mut deposit_coin, fee_amount, ctx);
        transfer::public_transfer(fee_coin, engine.treasury_address);

        // Record in lot
        asset_pool::record_surplus_deposit(lot, gross_amount);

        // Use passed total supply for snapshot (not per-lot, since coins are fungible)
        let tokens_snapshot = total_commodity_supply;
        let lot_id = object::id(lot);

        // Hold net amount in shared deposit for claims
        transfer::share_object(SurplusDeposit<PaymentT> {
            id: object::new(ctx),
            lot_id,
            balance: coin::into_balance(deposit_coin),
            total_amount: net_amount,
            total_tokens_at_snapshot: tokens_snapshot,
            claims: table::new(ctx),
            deposited_at: sui::clock::timestamp_ms(clock),
        });

        engine.total_distributed = engine.total_distributed + net_amount;
        engine.total_fees_collected = engine.total_fees_collected + fee_amount;

        event::emit(SurplusReceived {
            lot_id, gross_amount, fee_amount, net_amount, tokens_snapshot,
        });
    }

    /// Claim surplus. Farmer presents their commodity coin as proof of holdings.
    /// Pro-rata: (holder_balance / total_tokens_at_snapshot) * total_amount
    ///
    /// PaymentT = the payout coin type (USDC)
    /// CommodityT = the commodity coin type (NUTMEG) — farmer holds this
    public fun claim_surplus<PaymentT, CommodityT>(
        deposit: &mut SurplusDeposit<PaymentT>,
        holder_coin: &Coin<CommodityT>,
        ctx: &mut TxContext,
    ) {
        let claimant = ctx.sender();

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
            lot_id: deposit.lot_id,
            claimant,
            tokens_held: token_balance,
            amount_received: share,
        });

        transfer::public_transfer(payout, claimant);
    }

    // ============ Fee Management ============

    public fun process_carib_fee(
        engine: &mut YieldEngine,
        carib_treasury: &mut Treasury,
        mut fee_coins: Coin<CARIB_COIN>,
        lot_id: ID,
        ctx: &mut TxContext,
    ) {
        let total_fee = coin::value(&fee_coins);
        let burn_amount = (total_fee * engine.burn_rate_bps) / BPS_DENOMINATOR;
        let treasury_amount = total_fee - burn_amount;

        let burn_coins = coin::split(&mut fee_coins, burn_amount, ctx);
        carib_coin::burn(carib_treasury, burn_coins, ctx);
        engine.total_fees_burned = engine.total_fees_burned + burn_amount;

        event::emit(FeesCollected {
            lot_id, total_fee, burned: burn_amount, to_treasury: treasury_amount,
        });

        transfer::public_transfer(fee_coins, engine.treasury_address);
    }

    // ============ Admin Functions ============

    public fun update_fees(
        _admin: &YieldAdmin, engine: &mut YieldEngine,
        new_fee_rate_bps: u64, new_burn_rate_bps: u64,
    ) {
        assert!(new_fee_rate_bps <= 1000, EInvalidFeeRate);
        assert!(new_burn_rate_bps <= BPS_DENOMINATOR, EInvalidFeeRate);
        engine.fee_rate_bps = new_fee_rate_bps;
        engine.burn_rate_bps = new_burn_rate_bps;
        event::emit(FeeConfigUpdated { new_fee_rate_bps, new_burn_rate_bps });
    }

    public fun update_treasury_address(_admin: &YieldAdmin, engine: &mut YieldEngine, new_address: address) {
        engine.treasury_address = new_address;
    }

    // ============ View Functions ============

    public fun fee_rate(engine: &YieldEngine): u64 { engine.fee_rate_bps }
    public fun total_distributed(engine: &YieldEngine): u64 { engine.total_distributed }
    public fun total_fees_burned(engine: &YieldEngine): u64 { engine.total_fees_burned }
    public fun deposit_remaining<T>(deposit: &SurplusDeposit<T>): u64 { balance::value(&deposit.balance) }
    public fun deposit_total<T>(deposit: &SurplusDeposit<T>): u64 { deposit.total_amount }
    public fun deposit_lot_id<T>(deposit: &SurplusDeposit<T>): ID { deposit.lot_id }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) { init(ctx); }
}
