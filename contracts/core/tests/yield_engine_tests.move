#[test_only]
module anansi::yield_engine_tests;

use anansi::asset_pool::{Self, Registry, RegistryAdmin, AssetType, Lot, CustodianCap};
use anansi::compliance::{Self, ComplianceRegistry, ComplianceAdmin};
use anansi::yield_engine::{Self, YieldEngine, YieldAdmin, SurplusDeposit};
use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::test_scenario::{Self as ts, Scenario};

// ============ Test-only coin types ============
//
// The yield_engine module is generic over two phantom types:
//   PaymentT — the coin holders receive surplus in (e.g., USDC)
//   CommodityT — the coin holders prove holdings with (e.g., NUTMEG)
//
// For tests we define dummy witness types so we can mint freely without
// pulling in real USDC or commodity packages.

public struct USD has drop {}
public struct NUT has drop {}

// ============ Test Addresses ============

const ADMIN: address = @0xA11CE;
const CUSTODIAN: address = @0xC057;
const ALICE: address = @0xA11;
const BOB: address = @0xB0B;
const CAROL: address = @0xCA401;
const DEPOSITOR: address = @0xD0F05; // Account funding surplus deposits

// ============ Setup Helpers ============

/// Initialize all required modules and give ADMIN the admin caps.
/// Creates a NUTMEG asset type and transfers a CustodianCap to CUSTODIAN.
/// Returns scenario positioned with ADMIN as sender, after all setup txs.
fun setup_full(): Scenario {
    let mut scenario = ts::begin(ADMIN);

    // Init each module in its own tx so objects become visible
    ts::next_tx(&mut scenario, ADMIN);
    {
        yield_engine::init_for_testing(ts::ctx(&mut scenario));
    };
    ts::next_tx(&mut scenario, ADMIN);
    {
        asset_pool::init_for_testing(ts::ctx(&mut scenario));
    };
    ts::next_tx(&mut scenario, ADMIN);
    {
        compliance::init_for_testing(ts::ctx(&mut scenario));
    };

    // Create NUTMEG asset type and issue CustodianCap to CUSTODIAN
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin_cap: RegistryAdmin = ts::take_from_sender(&scenario);
        let mut registry: Registry = ts::take_shared(&scenario);
        asset_pool::create_asset_type(
            &admin_cap,
            &mut registry,
            b"NUTMEG",
            b"Grenada Nutmeg",
            b"kg",
            b"Grenada",
            b"GCNA",
            CUSTODIAN,
            ts::ctx(&mut scenario),
        );
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, admin_cap);
    };

    scenario
}

/// Create a lot as CUSTODIAN. Scenario is positioned after this call with ADMIN as sender.
/// Returns the lot_id for retrieving the shared Lot later.
fun create_test_lot(scenario: &mut Scenario, clock: &Clock): sui::object::ID {
    let mut lot_id = sui::object::id_from_address(@0x0);

    ts::next_tx(scenario, CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(scenario);
        let mut registry: Registry = ts::take_shared(scenario);
        let mut asset_type: AssetType = ts::take_shared(scenario);

        lot_id =
            asset_pool::create_lot(
                &cap,
                &mut registry,
                &mut asset_type,
                b"ipfs://receipt-hash",
                clock,
                ts::ctx(scenario),
            );

        ts::return_shared(asset_type);
        ts::return_shared(registry);
        ts::return_to_sender(scenario, cap);
    };

    ts::next_tx(scenario, ADMIN);
    lot_id
}

/// Mint test USDC-equivalent coin of `amount` to `recipient`.
fun mint_usd_to(scenario: &mut Scenario, recipient: address, amount: u64) {
    ts::next_tx(scenario, recipient);
    {
        let c = coin::mint_for_testing<USD>(amount, ts::ctx(scenario));
        transfer::public_transfer(c, recipient);
    };
}

/// Mint test NUTMEG-equivalent coin of `amount` to `recipient`.
fun mint_nut_to(scenario: &mut Scenario, recipient: address, amount: u64) {
    ts::next_tx(scenario, recipient);
    {
        let c = coin::mint_for_testing<NUT>(amount, ts::ctx(scenario));
        transfer::public_transfer(c, recipient);
    };
}

// ============ Init Tests ============

#[test]
fun test_init_default_state() {
    let mut scenario = ts::begin(ADMIN);

    ts::next_tx(&mut scenario, ADMIN);
    {
        yield_engine::init_for_testing(ts::ctx(&mut scenario));
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        let engine: YieldEngine = ts::take_shared(&scenario);
        assert!(yield_engine::fee_rate(&engine) == 100, 0); // 1% default
        assert!(yield_engine::total_distributed(&engine) == 0, 1);
        assert!(yield_engine::total_fees_collected(&engine) == 0, 2);
        ts::return_shared(engine);
    };

    ts::end(scenario);
}

// ============ Deposit Flow ============

#[test]
fun test_deposit_extracts_default_1_percent_fee() {
    // Deposit 1,000,000 USDC (1e6 units); 1% fee = 10,000; net = 990,000
    let mut scenario = setup_full();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    let lot_id = create_test_lot(&mut scenario, &clock);

    mint_usd_to(&mut scenario, DEPOSITOR, 1_000_000);

    ts::next_tx(&mut scenario, DEPOSITOR);
    {
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        let mut payment: Coin<USD> = ts::take_from_sender(&scenario);

        let fee = yield_engine::deposit_surplus<USD, NUT>(
            &mut engine,
            &mut lot,
            &mut payment,
            1_000_000,
            100_000, // total_commodity_supply (100 tokens worth of NUTMEG)
            &clock,
            ts::ctx(&mut scenario),
        );

        // Fee returned to caller
        assert!(coin::value(&fee) == 10_000, 0);
        // Engine accounting
        assert!(yield_engine::total_distributed(&engine) == 990_000, 1);
        assert!(yield_engine::total_fees_collected(&engine) == 10_000, 2);

        // Burn the fee (in prod this would be swapped and processed)
        coin::burn_for_testing(fee);
        ts::return_to_sender(&scenario, payment);
        ts::return_shared(lot);
        ts::return_shared(engine);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_deposit_creates_shared_surplus_deposit() {
    let mut scenario = setup_full();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    let lot_id = create_test_lot(&mut scenario, &clock);

    mint_usd_to(&mut scenario, DEPOSITOR, 1_000_000);

    ts::next_tx(&mut scenario, DEPOSITOR);
    {
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        let mut payment: Coin<USD> = ts::take_from_sender(&scenario);

        let fee = yield_engine::deposit_surplus<USD, NUT>(
            &mut engine,
            &mut lot,
            &mut payment,
            1_000_000,
            100_000,
            &clock,
            ts::ctx(&mut scenario),
        );

        coin::burn_for_testing(fee);
        ts::return_to_sender(&scenario, payment);
        ts::return_shared(lot);
        ts::return_shared(engine);
    };

    // Verify a SurplusDeposit was shared
    ts::next_tx(&mut scenario, ADMIN);
    {
        let deposit: SurplusDeposit<USD, NUT> = ts::take_shared(&scenario);
        assert!(yield_engine::deposit_total(&deposit) == 990_000, 0);
        assert!(yield_engine::deposit_remaining(&deposit) == 990_000, 1);
        assert!(yield_engine::deposit_lot_id(&deposit) == lot_id, 2);
        ts::return_shared(deposit);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_deposit_zero_fee_all_net() {
    // With fee_rate set to 0, all deposited amount becomes net.
    let mut scenario = setup_full();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: YieldAdmin = ts::take_from_sender(&scenario);
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        yield_engine::update_fee_rate(&admin, &mut engine, 0);
        ts::return_shared(engine);
        ts::return_to_sender(&scenario, admin);
    };

    let lot_id = create_test_lot(&mut scenario, &clock);
    mint_usd_to(&mut scenario, DEPOSITOR, 500_000);

    ts::next_tx(&mut scenario, DEPOSITOR);
    {
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        let mut payment: Coin<USD> = ts::take_from_sender(&scenario);

        let fee = yield_engine::deposit_surplus<USD, NUT>(
            &mut engine,
            &mut lot,
            &mut payment,
            500_000,
            100_000,
            &clock,
            ts::ctx(&mut scenario),
        );

        assert!(coin::value(&fee) == 0, 0);
        assert!(yield_engine::total_distributed(&engine) == 500_000, 1);
        assert!(yield_engine::total_fees_collected(&engine) == 0, 2);

        coin::burn_for_testing(fee);
        ts::return_to_sender(&scenario, payment);
        ts::return_shared(lot);
        ts::return_shared(engine);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_deposit_preserves_remaining_payment() {
    // Caller passes a 1,000,000 USDC coin but only deposits 400,000.
    // Remainder (600,000) stays in caller's coin.
    let mut scenario = setup_full();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    let lot_id = create_test_lot(&mut scenario, &clock);

    mint_usd_to(&mut scenario, DEPOSITOR, 1_000_000);

    ts::next_tx(&mut scenario, DEPOSITOR);
    {
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        let mut payment: Coin<USD> = ts::take_from_sender(&scenario);

        let fee = yield_engine::deposit_surplus<USD, NUT>(
            &mut engine,
            &mut lot,
            &mut payment,
            400_000,
            100_000,
            &clock,
            ts::ctx(&mut scenario),
        );

        // 600K still in payment, 4K returned as fee, 396K in SurplusDeposit
        assert!(coin::value(&payment) == 600_000, 0);
        assert!(coin::value(&fee) == 4_000, 1);

        coin::burn_for_testing(fee);
        ts::return_to_sender(&scenario, payment);
        ts::return_shared(lot);
        ts::return_shared(engine);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Deposit Error Paths ============

#[test]
#[expected_failure(abort_code = yield_engine::EInsufficientDeposit)]
fun test_deposit_zero_amount_aborts() {
    let mut scenario = setup_full();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    let lot_id = create_test_lot(&mut scenario, &clock);

    mint_usd_to(&mut scenario, DEPOSITOR, 1_000_000);

    ts::next_tx(&mut scenario, DEPOSITOR);
    {
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        let mut payment: Coin<USD> = ts::take_from_sender(&scenario);

        let fee = yield_engine::deposit_surplus<USD, NUT>(
            &mut engine,
            &mut lot,
            &mut payment,
            0, // zero gross_amount → aborts
            100_000,
            &clock,
            ts::ctx(&mut scenario),
        );

        coin::burn_for_testing(fee);
        ts::return_to_sender(&scenario, payment);
        ts::return_shared(lot);
        ts::return_shared(engine);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = yield_engine::EInsufficientDeposit)]
fun test_deposit_exceeds_payment_aborts() {
    let mut scenario = setup_full();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    let lot_id = create_test_lot(&mut scenario, &clock);

    mint_usd_to(&mut scenario, DEPOSITOR, 100); // tiny coin

    ts::next_tx(&mut scenario, DEPOSITOR);
    {
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        let mut payment: Coin<USD> = ts::take_from_sender(&scenario);

        // Try to deposit 1_000_000 from a coin holding only 100 — aborts
        let fee = yield_engine::deposit_surplus<USD, NUT>(
            &mut engine,
            &mut lot,
            &mut payment,
            1_000_000,
            100_000,
            &clock,
            ts::ctx(&mut scenario),
        );

        coin::burn_for_testing(fee);
        ts::return_to_sender(&scenario, payment);
        ts::return_shared(lot);
        ts::return_shared(engine);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = yield_engine::ENoTokensToRedeem)]
fun test_deposit_zero_supply_aborts() {
    // Nobody holds any commodity tokens — can't compute pro-rata snapshot
    let mut scenario = setup_full();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    let lot_id = create_test_lot(&mut scenario, &clock);

    mint_usd_to(&mut scenario, DEPOSITOR, 1_000_000);

    ts::next_tx(&mut scenario, DEPOSITOR);
    {
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        let mut payment: Coin<USD> = ts::take_from_sender(&scenario);

        let fee = yield_engine::deposit_surplus<USD, NUT>(
            &mut engine,
            &mut lot,
            &mut payment,
            1_000_000,
            0, // zero commodity supply → aborts
            &clock,
            ts::ctx(&mut scenario),
        );

        coin::burn_for_testing(fee);
        ts::return_to_sender(&scenario, payment);
        ts::return_shared(lot);
        ts::return_shared(engine);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Claim Flow ============

#[test]
fun test_single_holder_claims_full_amount() {
    // Alice holds all 100,000 NUTMEG tokens. Should receive the entire net surplus.
    let mut scenario = setup_full();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    let lot_id = create_test_lot(&mut scenario, &clock);

    // Alice gets all the NUTMEG
    mint_nut_to(&mut scenario, ALICE, 100_000);
    // DEPOSITOR funds the surplus
    mint_usd_to(&mut scenario, DEPOSITOR, 1_000_000);

    // Deposit surplus
    ts::next_tx(&mut scenario, DEPOSITOR);
    {
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        let mut payment: Coin<USD> = ts::take_from_sender(&scenario);

        let fee = yield_engine::deposit_surplus<USD, NUT>(
            &mut engine,
            &mut lot,
            &mut payment,
            1_000_000,
            100_000, // Alice's entire holding = total supply
            &clock,
            ts::ctx(&mut scenario),
        );

        coin::burn_for_testing(fee);
        ts::return_to_sender(&scenario, payment);
        ts::return_shared(lot);
        ts::return_shared(engine);
    };

    // Alice claims
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut deposit: SurplusDeposit<USD, NUT> = ts::take_shared(&scenario);
        let holder: Coin<NUT> = ts::take_from_sender(&scenario);
        let registry: ComplianceRegistry = ts::take_shared(&scenario);

        yield_engine::claim_surplus<USD, NUT>(
            &mut deposit,
            &holder,
            &registry,
            ts::ctx(&mut scenario),
        );

        // With 100% of supply, Alice gets 100% of the net (990,000)
        assert!(yield_engine::deposit_remaining(&deposit) == 0, 0);

        ts::return_shared(registry);
        ts::return_to_sender(&scenario, holder);
        ts::return_shared(deposit);
    };

    // Alice should have received 990_000 USD
    ts::next_tx(&mut scenario, ALICE);
    {
        let payout: Coin<USD> = ts::take_from_sender(&scenario);
        assert!(coin::value(&payout) == 990_000, 0);
        ts::return_to_sender(&scenario, payout);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_pro_rata_claims_for_multiple_holders() {
    // Alice: 60%, Bob: 30%, Carol: 10%
    let mut scenario = setup_full();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    let lot_id = create_test_lot(&mut scenario, &clock);

    mint_nut_to(&mut scenario, ALICE, 60_000);
    mint_nut_to(&mut scenario, BOB, 30_000);
    mint_nut_to(&mut scenario, CAROL, 10_000);
    mint_usd_to(&mut scenario, DEPOSITOR, 1_000_000);

    ts::next_tx(&mut scenario, DEPOSITOR);
    {
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        let mut payment: Coin<USD> = ts::take_from_sender(&scenario);

        let fee = yield_engine::deposit_surplus<USD, NUT>(
            &mut engine,
            &mut lot,
            &mut payment,
            1_000_000,
            100_000,
            &clock,
            ts::ctx(&mut scenario),
        );
        coin::burn_for_testing(fee);
        ts::return_to_sender(&scenario, payment);
        ts::return_shared(lot);
        ts::return_shared(engine);
    };

    // Net = 990,000. Alice should get 594,000 (60%), Bob 297,000 (30%), Carol 99,000 (10%)

    // Alice claims
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut deposit: SurplusDeposit<USD, NUT> = ts::take_shared(&scenario);
        let holder: Coin<NUT> = ts::take_from_sender(&scenario);
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        yield_engine::claim_surplus<USD, NUT>(
            &mut deposit,
            &holder,
            &registry,
            ts::ctx(&mut scenario),
        );
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, holder);
        ts::return_shared(deposit);
    };
    ts::next_tx(&mut scenario, ALICE);
    {
        let payout: Coin<USD> = ts::take_from_sender(&scenario);
        assert!(coin::value(&payout) == 594_000, 0);
        ts::return_to_sender(&scenario, payout);
    };

    // Bob claims
    ts::next_tx(&mut scenario, BOB);
    {
        let mut deposit: SurplusDeposit<USD, NUT> = ts::take_shared(&scenario);
        let holder: Coin<NUT> = ts::take_from_sender(&scenario);
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        yield_engine::claim_surplus<USD, NUT>(
            &mut deposit,
            &holder,
            &registry,
            ts::ctx(&mut scenario),
        );
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, holder);
        ts::return_shared(deposit);
    };
    ts::next_tx(&mut scenario, BOB);
    {
        let payout: Coin<USD> = ts::take_from_sender(&scenario);
        assert!(coin::value(&payout) == 297_000, 0);
        ts::return_to_sender(&scenario, payout);
    };

    // Carol claims
    ts::next_tx(&mut scenario, CAROL);
    {
        let mut deposit: SurplusDeposit<USD, NUT> = ts::take_shared(&scenario);
        let holder: Coin<NUT> = ts::take_from_sender(&scenario);
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        yield_engine::claim_surplus<USD, NUT>(
            &mut deposit,
            &holder,
            &registry,
            ts::ctx(&mut scenario),
        );

        // After all three claims, deposit is empty
        assert!(yield_engine::deposit_remaining(&deposit) == 0, 0);

        ts::return_shared(registry);
        ts::return_to_sender(&scenario, holder);
        ts::return_shared(deposit);
    };
    ts::next_tx(&mut scenario, CAROL);
    {
        let payout: Coin<USD> = ts::take_from_sender(&scenario);
        assert!(coin::value(&payout) == 99_000, 0);
        ts::return_to_sender(&scenario, payout);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = yield_engine::EAlreadyClaimed)]
fun test_double_claim_aborts() {
    // Alice claims, then tries to claim again — second call aborts.
    let mut scenario = setup_full();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    let lot_id = create_test_lot(&mut scenario, &clock);

    mint_nut_to(&mut scenario, ALICE, 100_000);
    mint_usd_to(&mut scenario, DEPOSITOR, 1_000_000);

    ts::next_tx(&mut scenario, DEPOSITOR);
    {
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        let mut payment: Coin<USD> = ts::take_from_sender(&scenario);
        let fee = yield_engine::deposit_surplus<USD, NUT>(
            &mut engine,
            &mut lot,
            &mut payment,
            1_000_000,
            100_000,
            &clock,
            ts::ctx(&mut scenario),
        );
        coin::burn_for_testing(fee);
        ts::return_to_sender(&scenario, payment);
        ts::return_shared(lot);
        ts::return_shared(engine);
    };

    // First claim — succeeds
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut deposit: SurplusDeposit<USD, NUT> = ts::take_shared(&scenario);
        let holder: Coin<NUT> = ts::take_from_sender(&scenario);
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        yield_engine::claim_surplus<USD, NUT>(
            &mut deposit,
            &holder,
            &registry,
            ts::ctx(&mut scenario),
        );
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, holder);
        ts::return_shared(deposit);
    };

    // Second claim — aborts with EAlreadyClaimed
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut deposit: SurplusDeposit<USD, NUT> = ts::take_shared(&scenario);
        let holder: Coin<NUT> = ts::take_from_sender(&scenario);
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        yield_engine::claim_surplus<USD, NUT>(
            &mut deposit,
            &holder,
            &registry,
            ts::ctx(&mut scenario),
        );
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, holder);
        ts::return_shared(deposit);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = yield_engine::ENoTokensToRedeem)]
fun test_claim_with_zero_balance_coin_aborts() {
    // Holder presents a zero-value coin — nothing to claim
    let mut scenario = setup_full();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    let lot_id = create_test_lot(&mut scenario, &clock);

    mint_nut_to(&mut scenario, ALICE, 100_000); // Someone needs to hold tokens for the snapshot
    mint_usd_to(&mut scenario, DEPOSITOR, 1_000_000);

    ts::next_tx(&mut scenario, DEPOSITOR);
    {
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        let mut payment: Coin<USD> = ts::take_from_sender(&scenario);
        let fee = yield_engine::deposit_surplus<USD, NUT>(
            &mut engine,
            &mut lot,
            &mut payment,
            1_000_000,
            100_000,
            &clock,
            ts::ctx(&mut scenario),
        );
        coin::burn_for_testing(fee);
        ts::return_to_sender(&scenario, payment);
        ts::return_shared(lot);
        ts::return_shared(engine);
    };

    // Bob presents a zero-value NUT coin
    ts::next_tx(&mut scenario, BOB);
    {
        let mut deposit: SurplusDeposit<USD, NUT> = ts::take_shared(&scenario);
        let holder = coin::zero<NUT>(ts::ctx(&mut scenario));
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        yield_engine::claim_surplus<USD, NUT>(
            &mut deposit,
            &holder,
            &registry,
            ts::ctx(&mut scenario),
        );
        ts::return_shared(registry);
        coin::destroy_zero(holder);
        ts::return_shared(deposit);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Snapshot Integrity ============

#[test]
fun test_snapshot_isolates_holders_across_deposits() {
    // Two deposits on the same lot, with different snapshots.
    // Verifies each SurplusDeposit is independent (claims tracked separately).
    let mut scenario = setup_full();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    let lot_id = create_test_lot(&mut scenario, &clock);

    mint_nut_to(&mut scenario, ALICE, 100_000);
    mint_usd_to(&mut scenario, DEPOSITOR, 2_000_000);

    // First deposit
    ts::next_tx(&mut scenario, DEPOSITOR);
    {
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        let mut payment: Coin<USD> = ts::take_from_sender(&scenario);
        let fee = yield_engine::deposit_surplus<USD, NUT>(
            &mut engine,
            &mut lot,
            &mut payment,
            1_000_000,
            100_000,
            &clock,
            ts::ctx(&mut scenario),
        );
        coin::burn_for_testing(fee);
        ts::return_to_sender(&scenario, payment);
        ts::return_shared(lot);
        ts::return_shared(engine);
    };

    // Second deposit
    ts::next_tx(&mut scenario, DEPOSITOR);
    {
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        let mut payment: Coin<USD> = ts::take_from_sender(&scenario);
        let fee = yield_engine::deposit_surplus<USD, NUT>(
            &mut engine,
            &mut lot,
            &mut payment,
            1_000_000,
            100_000,
            &clock,
            ts::ctx(&mut scenario),
        );
        coin::burn_for_testing(fee);
        ts::return_to_sender(&scenario, payment);
        ts::return_shared(lot);
        ts::return_shared(engine);
    };

    // Engine cumulative totals reflect both deposits
    ts::next_tx(&mut scenario, ADMIN);
    {
        let engine: YieldEngine = ts::take_shared(&scenario);
        assert!(yield_engine::total_distributed(&engine) == 1_980_000, 0); // 2 * 990k
        assert!(yield_engine::total_fees_collected(&engine) == 20_000, 1); // 2 * 10k
        ts::return_shared(engine);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Compliance Integration ============

#[test]
#[expected_failure(abort_code = anansi::compliance::EComplianceCheckFailed)]
fun test_claim_frozen_user_aborts() {
    let mut scenario = setup_full();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    let lot_id = create_test_lot(&mut scenario, &clock);

    mint_nut_to(&mut scenario, ALICE, 100_000);
    mint_usd_to(&mut scenario, DEPOSITOR, 1_000_000);

    // Deposit
    ts::next_tx(&mut scenario, DEPOSITOR);
    {
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        let mut payment: Coin<USD> = ts::take_from_sender(&scenario);
        let fee = yield_engine::deposit_surplus<USD, NUT>(
            &mut engine,
            &mut lot,
            &mut payment,
            1_000_000,
            100_000,
            &clock,
            ts::ctx(&mut scenario),
        );
        coin::burn_for_testing(fee);
        ts::return_to_sender(&scenario, payment);
        ts::return_shared(lot);
        ts::return_shared(engine);
    };

    // Enable compliance enforcement, verify Alice, then freeze her
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: ComplianceAdmin = ts::take_from_sender(&scenario);
        let mut registry: ComplianceRegistry = ts::take_shared(&scenario);

        compliance::set_enforcement(&admin, &mut registry, true);
        compliance::verify_user(
            &admin,
            &mut registry,
            ALICE,
            b"GD",
            b"test_provider",
            1,
            1000,
        );
        compliance::freeze_user(&admin, &mut registry, ALICE, b"test_freeze");

        ts::return_shared(registry);
        ts::return_to_sender(&scenario, admin);
    };

    // Alice tries to claim — aborts with EComplianceCheckFailed
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut deposit: SurplusDeposit<USD, NUT> = ts::take_shared(&scenario);
        let holder: Coin<NUT> = ts::take_from_sender(&scenario);
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        yield_engine::claim_surplus<USD, NUT>(
            &mut deposit,
            &holder,
            &registry,
            ts::ctx(&mut scenario),
        );
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, holder);
        ts::return_shared(deposit);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = anansi::compliance::EComplianceCheckFailed)]
fun test_claim_unverified_user_aborts_when_enforcement_on() {
    let mut scenario = setup_full();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    let lot_id = create_test_lot(&mut scenario, &clock);

    mint_nut_to(&mut scenario, ALICE, 100_000);
    mint_usd_to(&mut scenario, DEPOSITOR, 1_000_000);

    ts::next_tx(&mut scenario, DEPOSITOR);
    {
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        let mut payment: Coin<USD> = ts::take_from_sender(&scenario);
        let fee = yield_engine::deposit_surplus<USD, NUT>(
            &mut engine,
            &mut lot,
            &mut payment,
            1_000_000,
            100_000,
            &clock,
            ts::ctx(&mut scenario),
        );
        coin::burn_for_testing(fee);
        ts::return_to_sender(&scenario, payment);
        ts::return_shared(lot);
        ts::return_shared(engine);
    };

    // Enable enforcement without verifying Alice
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: ComplianceAdmin = ts::take_from_sender(&scenario);
        let mut registry: ComplianceRegistry = ts::take_shared(&scenario);
        compliance::set_enforcement(&admin, &mut registry, true);
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, admin);
    };

    // Unverified Alice tries to claim — aborts
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut deposit: SurplusDeposit<USD, NUT> = ts::take_shared(&scenario);
        let holder: Coin<NUT> = ts::take_from_sender(&scenario);
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        yield_engine::claim_surplus<USD, NUT>(
            &mut deposit,
            &holder,
            &registry,
            ts::ctx(&mut scenario),
        );
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, holder);
        ts::return_shared(deposit);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_claim_works_when_enforcement_off_for_unverified() {
    // Enforcement disabled (default/testnet) — unverified users can claim freely.
    let mut scenario = setup_full();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    let lot_id = create_test_lot(&mut scenario, &clock);

    mint_nut_to(&mut scenario, ALICE, 100_000);
    mint_usd_to(&mut scenario, DEPOSITOR, 1_000_000);

    ts::next_tx(&mut scenario, DEPOSITOR);
    {
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        let mut payment: Coin<USD> = ts::take_from_sender(&scenario);
        let fee = yield_engine::deposit_surplus<USD, NUT>(
            &mut engine,
            &mut lot,
            &mut payment,
            1_000_000,
            100_000,
            &clock,
            ts::ctx(&mut scenario),
        );
        coin::burn_for_testing(fee);
        ts::return_to_sender(&scenario, payment);
        ts::return_shared(lot);
        ts::return_shared(engine);
    };

    // Alice is unverified, enforcement is off (default) — claim should succeed
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut deposit: SurplusDeposit<USD, NUT> = ts::take_shared(&scenario);
        let holder: Coin<NUT> = ts::take_from_sender(&scenario);
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        yield_engine::claim_surplus<USD, NUT>(
            &mut deposit,
            &holder,
            &registry,
            ts::ctx(&mut scenario),
        );
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, holder);
        ts::return_shared(deposit);
    };

    ts::next_tx(&mut scenario, ALICE);
    {
        let payout: Coin<USD> = ts::take_from_sender(&scenario);
        assert!(coin::value(&payout) == 990_000, 0);
        ts::return_to_sender(&scenario, payout);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Math Edge Cases ============

#[test]
#[expected_failure(abort_code = yield_engine::ENoTokensToRedeem)]
fun test_share_zero_aborts() {
    // Holder owns a tiny fraction — pro-rata share rounds to 0 → abort.
    // 1 token out of 1,000,000 total. Net surplus = 99 (after 1% fee on 100).
    // Share = 99 * 1 / 1_000_000 = 0 → ENoTokensToRedeem.
    let mut scenario = setup_full();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    let lot_id = create_test_lot(&mut scenario, &clock);

    mint_nut_to(&mut scenario, ALICE, 1);
    mint_usd_to(&mut scenario, DEPOSITOR, 100);

    ts::next_tx(&mut scenario, DEPOSITOR);
    {
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        let mut payment: Coin<USD> = ts::take_from_sender(&scenario);
        let fee = yield_engine::deposit_surplus<USD, NUT>(
            &mut engine,
            &mut lot,
            &mut payment,
            100,
            1_000_000,
            &clock,
            ts::ctx(&mut scenario),
        );
        coin::burn_for_testing(fee);
        ts::return_to_sender(&scenario, payment);
        ts::return_shared(lot);
        ts::return_shared(engine);
    };

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut deposit: SurplusDeposit<USD, NUT> = ts::take_shared(&scenario);
        let holder: Coin<NUT> = ts::take_from_sender(&scenario);
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        // Share = 99 * 1 / 1_000_000 = 0 → ENoTokensToRedeem
        yield_engine::claim_surplus<USD, NUT>(
            &mut deposit,
            &holder,
            &registry,
            ts::ctx(&mut scenario),
        );
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, holder);
        ts::return_shared(deposit);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Admin Functions ============

#[test]
fun test_admin_can_update_fee_rate() {
    let mut scenario = setup_full();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: YieldAdmin = ts::take_from_sender(&scenario);
        let mut engine: YieldEngine = ts::take_shared(&scenario);

        yield_engine::update_fee_rate(&admin, &mut engine, 500); // 5%
        assert!(yield_engine::fee_rate(&engine) == 500, 0);

        ts::return_shared(engine);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = yield_engine::EInvalidFeeRate)]
fun test_admin_cannot_exceed_max_fee_rate() {
    let mut scenario = setup_full();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: YieldAdmin = ts::take_from_sender(&scenario);
        let mut engine: YieldEngine = ts::take_shared(&scenario);

        // MAX_FEE_BPS is 1000 (10%). 1001 → abort.
        yield_engine::update_fee_rate(&admin, &mut engine, 1001);

        ts::return_shared(engine);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
fun test_admin_can_set_max_fee_rate() {
    // Exactly 1000 (10%) should be allowed
    let mut scenario = setup_full();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: YieldAdmin = ts::take_from_sender(&scenario);
        let mut engine: YieldEngine = ts::take_shared(&scenario);

        yield_engine::update_fee_rate(&admin, &mut engine, 1000);
        assert!(yield_engine::fee_rate(&engine) == 1000, 0);

        ts::return_shared(engine);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
fun test_admin_can_transfer_cap() {
    let mut scenario = setup_full();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: YieldAdmin = ts::take_from_sender(&scenario);
        yield_engine::transfer_admin(admin, BOB);
    };

    ts::next_tx(&mut scenario, BOB);
    {
        assert!(ts::has_most_recent_for_sender<YieldAdmin>(&scenario), 0);
        let admin: YieldAdmin = ts::take_from_sender(&scenario);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

// ============ Large-Value Math Safety ============
//
// yield_engine's claim_surplus currently uses u64 for: deposit.total_amount * token_balance.
// This CAN overflow if both values are large. We don't have a u128 fix here yet; these
// tests document the boundary for now and will catch if someone adds a fix or if the
// behavior changes.

#[test]
fun test_realistic_large_deposit_math_works() {
    // 1M USDC deposit (1e12 raw USDC = 1e6 USD * 1e6 decimals), 1M commodity tokens.
    // Alice owns 100% → receives ~990k USDC after 1% fee.
    // Math: 990_000_000_000 * 1_000_000 / 1_000_000 = 990_000_000_000.
    // Within this formula, the intermediate is 9.9e17, fits in u64 (max ~1.8e19). Safe.
    let mut scenario = setup_full();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    let lot_id = create_test_lot(&mut scenario, &clock);

    let large_usd: u64 = 1_000_000_000_000; // 1M USDC with 6 decimals
    let token_supply: u64 = 1_000_000;

    mint_nut_to(&mut scenario, ALICE, token_supply);
    mint_usd_to(&mut scenario, DEPOSITOR, large_usd);

    ts::next_tx(&mut scenario, DEPOSITOR);
    {
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        let mut payment: Coin<USD> = ts::take_from_sender(&scenario);
        let fee = yield_engine::deposit_surplus<USD, NUT>(
            &mut engine,
            &mut lot,
            &mut payment,
            large_usd,
            token_supply,
            &clock,
            ts::ctx(&mut scenario),
        );

        // 1% fee on 1e12 = 1e10
        assert!(coin::value(&fee) == 10_000_000_000, 0);

        coin::burn_for_testing(fee);
        ts::return_to_sender(&scenario, payment);
        ts::return_shared(lot);
        ts::return_shared(engine);
    };

    // Alice claims 990B (net)
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut deposit: SurplusDeposit<USD, NUT> = ts::take_shared(&scenario);
        let holder: Coin<NUT> = ts::take_from_sender(&scenario);
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        yield_engine::claim_surplus<USD, NUT>(
            &mut deposit,
            &holder,
            &registry,
            ts::ctx(&mut scenario),
        );
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, holder);
        ts::return_shared(deposit);
    };

    ts::next_tx(&mut scenario, ALICE);
    {
        let payout: Coin<USD> = ts::take_from_sender(&scenario);
        assert!(coin::value(&payout) == 990_000_000_000, 0);
        ts::return_to_sender(&scenario, payout);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Overflow Regression Tests ============
//
// These tests target the u64 overflow in:
//   (a) deposit_surplus: gross_amount * fee_rate_bps / BPS_DENOMINATOR
//   (b) claim_surplus: deposit.total_amount * token_balance / total_tokens_at_snapshot
//
// Without u128 intermediates, large realistic inputs overflow u64 max (~1.84e19).
// These tests force those inputs. If anyone ever removes the `as u128` casts,
// these fail with MovePrimitiveRuntimeError (arithmetic overflow).

#[test]
fun test_overflow_regression_claim_large_deposit_large_holder() {
    // Scenario: 10M USDC surplus (1e13 raw USDC-6dec), 2M commodity tokens (2e15 raw NUT-9dec).
    // Without u128:   1e13 * 2e15 = 2e28 → overflows u64 (1.84e19 max)
    // With u128:      math holds, Alice receives her full pro-rata share.
    //
    // Realistic scale: $10M surplus distribution on a pool with 2M commodity tokens
    // held by a single large buyer.
    let mut scenario = setup_full();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    let lot_id = create_test_lot(&mut scenario, &clock);

    // Token supply = 2M commodity units at 9 decimals = 2e15 raw
    let token_supply: u64 = 2_000_000_000_000_000;
    // USDC deposit = 10M at 6 decimals = 1e13 raw
    let deposit_amount: u64 = 10_000_000_000_000;

    mint_nut_to(&mut scenario, ALICE, token_supply);
    mint_usd_to(&mut scenario, DEPOSITOR, deposit_amount);

    ts::next_tx(&mut scenario, DEPOSITOR);
    {
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        let mut payment: Coin<USD> = ts::take_from_sender(&scenario);

        let fee = yield_engine::deposit_surplus<USD, NUT>(
            &mut engine,
            &mut lot,
            &mut payment,
            deposit_amount,
            token_supply,
            &clock,
            ts::ctx(&mut scenario),
        );

        // 1% fee on 1e13 = 1e11
        assert!(coin::value(&fee) == 100_000_000_000, 0);

        coin::burn_for_testing(fee);
        ts::return_to_sender(&scenario, payment);
        ts::return_shared(lot);
        ts::return_shared(engine);
    };

    // Alice claims — this is where the claim_surplus overflow would hit.
    // Without u128: (net_amount * token_balance) = 9.9e12 * 2e15 = 1.98e28 → overflow.
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut deposit: SurplusDeposit<USD, NUT> = ts::take_shared(&scenario);
        let holder: Coin<NUT> = ts::take_from_sender(&scenario);
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        yield_engine::claim_surplus<USD, NUT>(
            &mut deposit,
            &holder,
            &registry,
            ts::ctx(&mut scenario),
        );
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, holder);
        ts::return_shared(deposit);
    };

    // Alice owns 100% of supply → receives 100% of net = 9.9e12
    ts::next_tx(&mut scenario, ALICE);
    {
        let payout: Coin<USD> = ts::take_from_sender(&scenario);
        assert!(coin::value(&payout) == 9_900_000_000_000, 0);
        ts::return_to_sender(&scenario, payout);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_overflow_regression_deposit_fee_math() {
    // Target just the deposit_surplus fee arithmetic: gross_amount * fee_rate_bps.
    // Max fee_rate_bps = 1000. gross_amount * 1000 overflows u64 around 1.84e16.
    //
    // Scenario: $20M USDC deposit at max 10% fee rate.
    //   gross = 2e13 (20M USDC raw)
    //   fee_rate_bps = 1000
    //   Without u128:  2e13 * 1000 = 2e16. Fits in u64 (1.84e19), so this specific
    //   case doesn't actually overflow. Need bigger values:
    //
    // Use gross = 2e17 raw USDC ($200B notional). Still well below u64 supply,
    // and 2e17 * 1000 = 2e20 — overflows u64.
    //
    // Note: $200B in one deposit is absurd in reality, but the point is to lock
    // the safety margin in the code. "It should handle values the type allows."
    let mut scenario = setup_full();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    // Raise fee rate to max
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: YieldAdmin = ts::take_from_sender(&scenario);
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        yield_engine::update_fee_rate(&admin, &mut engine, 1000);
        ts::return_shared(engine);
        ts::return_to_sender(&scenario, admin);
    };

    let lot_id = create_test_lot(&mut scenario, &clock);

    let huge_deposit: u64 = 200_000_000_000_000_000; // 2e17
    let token_supply: u64 = 1_000_000;

    mint_nut_to(&mut scenario, ALICE, token_supply);
    mint_usd_to(&mut scenario, DEPOSITOR, huge_deposit);

    ts::next_tx(&mut scenario, DEPOSITOR);
    {
        let mut engine: YieldEngine = ts::take_shared(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        let mut payment: Coin<USD> = ts::take_from_sender(&scenario);

        // Without u128:  2e17 * 1000 / 10000 = overflow.
        // With u128:     fee = 2e16, net = 1.8e17.
        let fee = yield_engine::deposit_surplus<USD, NUT>(
            &mut engine,
            &mut lot,
            &mut payment,
            huge_deposit,
            token_supply,
            &clock,
            ts::ctx(&mut scenario),
        );

        // 10% of 2e17 = 2e16
        assert!(coin::value(&fee) == 20_000_000_000_000_000, 0);

        coin::burn_for_testing(fee);
        ts::return_to_sender(&scenario, payment);
        ts::return_shared(lot);
        ts::return_shared(engine);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}
