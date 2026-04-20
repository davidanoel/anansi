#[test_only]
module anansi::fee_converter_tests;

use anansi::fee_converter::{Self, FeeConverter, FeeConverterAdmin};
use anansi::carib_coin::{Self, CARIB_COIN, Treasury};
use sui::test_scenario::{Self as ts, Scenario};
use sui::coin::{Self, Coin};

// ============ Test Constants ============

const ADMIN: address = @0xA11CE;
const TREASURY: address = @0x7FEA5;
const NEW_TREASURY: address = @0xFEE;

// CARIB has 9 decimals. Use raw units throughout.
const ONE_CARIB: u64 = 1_000_000_000;
const THOUSAND_CARIB: u64 = 1_000 * 1_000_000_000;
const MILLION_CARIB: u64 = 1_000_000 * 1_000_000_000;

// ============ Setup ============

/// Initializes carib_coin + fee_converter, points treasury address at TREASURY.
/// Returns a scenario positioned with ADMIN as sender, ready for test actions.
fun setup(): Scenario {
    let mut scenario = ts::begin(ADMIN);

    ts::next_tx(&mut scenario, ADMIN);
    {
        carib_coin::init_for_testing(ts::ctx(&mut scenario));
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        fee_converter::init_for_testing(ts::ctx(&mut scenario));
    };

    // Point treasury at TREASURY address (init sets it to sender = ADMIN)
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: FeeConverterAdmin = ts::take_from_sender(&scenario);
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        fee_converter::update_treasury_address(&admin, &mut converter, TREASURY);
        ts::return_shared(converter);
        ts::return_to_sender(&scenario, admin);
    };

    scenario
}

/// Split `amount` CARIB from the admin's genesis supply and return as a fresh coin.
/// Must be called within a tx where ADMIN is the sender.
fun take_carib(scenario: &mut Scenario, amount: u64): Coin<CARIB_COIN> {
    let mut genesis: Coin<CARIB_COIN> = ts::take_from_sender(scenario);
    let chunk = coin::split(&mut genesis, amount, ts::ctx(scenario));
    ts::return_to_sender(scenario, genesis);
    chunk
}

// ============ Core Logic Tests ============

#[test]
fun test_init_default_state() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let converter: FeeConverter = ts::take_shared(&scenario);
        assert!(fee_converter::burn_bps(&converter) == 5000, 0);
        assert!(fee_converter::treasury_address(&converter) == TREASURY, 1);
        assert!(fee_converter::total_burned(&converter) == 0, 2);
        assert!(fee_converter::total_to_treasury(&converter) == 0, 3);
        assert!(fee_converter::fee_event_count(&converter) == 0, 4);
        ts::return_shared(converter);
    };

    ts::end(scenario);
}

#[test]
fun test_process_fee_default_split() {
    let mut scenario = setup();

    // Process 1000 CARIB at default 50/50 split → 500 burn, 500 treasury
    ts::next_tx(&mut scenario, ADMIN);
    {
        let fee = take_carib(&mut scenario, THOUSAND_CARIB);
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        let mut carib_treasury: Treasury = ts::take_from_sender(&scenario);

        fee_converter::process_fee(
            &mut converter,
            &mut carib_treasury,
            fee,
            b"test_source",
            ts::ctx(&mut scenario),
        );

        assert!(fee_converter::total_burned(&converter) == THOUSAND_CARIB / 2, 0);
        assert!(fee_converter::total_to_treasury(&converter) == THOUSAND_CARIB / 2, 1);
        assert!(fee_converter::fee_event_count(&converter) == 1, 2);

        ts::return_to_sender(&scenario, carib_treasury);
        ts::return_shared(converter);
    };

    // Verify treasury address received the half
    ts::next_tx(&mut scenario, TREASURY);
    {
        let received: Coin<CARIB_COIN> = ts::take_from_sender(&scenario);
        assert!(coin::value(&received) == THOUSAND_CARIB / 2, 0);
        ts::return_to_sender(&scenario, received);
    };

    ts::end(scenario);
}

#[test]
fun test_process_fee_100_percent_burn() {
    // burn_bps = 10000 → 100% burn, nothing to treasury, zero-value coin destroyed
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: FeeConverterAdmin = ts::take_from_sender(&scenario);
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        fee_converter::update_burn_rate(&admin, &mut converter, 10000);
        ts::return_shared(converter);
        ts::return_to_sender(&scenario, admin);
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        let fee = take_carib(&mut scenario, THOUSAND_CARIB);
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        let mut carib_treasury: Treasury = ts::take_from_sender(&scenario);

        fee_converter::process_fee(
            &mut converter,
            &mut carib_treasury,
            fee,
            b"test_full_burn",
            ts::ctx(&mut scenario),
        );

        assert!(fee_converter::total_burned(&converter) == THOUSAND_CARIB, 0);
        assert!(fee_converter::total_to_treasury(&converter) == 0, 1);

        ts::return_to_sender(&scenario, carib_treasury);
        ts::return_shared(converter);
    };

    // Verify treasury address got nothing
    ts::next_tx(&mut scenario, TREASURY);
    {
        assert!(!ts::has_most_recent_for_sender<Coin<CARIB_COIN>>(&scenario), 0);
    };

    ts::end(scenario);
}

#[test]
fun test_process_fee_zero_burn_all_to_treasury() {
    // burn_bps = 0 → 100% treasury, no burn
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: FeeConverterAdmin = ts::take_from_sender(&scenario);
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        fee_converter::update_burn_rate(&admin, &mut converter, 0);
        ts::return_shared(converter);
        ts::return_to_sender(&scenario, admin);
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        let fee = take_carib(&mut scenario, THOUSAND_CARIB);
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        let mut carib_treasury: Treasury = ts::take_from_sender(&scenario);

        fee_converter::process_fee(
            &mut converter,
            &mut carib_treasury,
            fee,
            b"test_no_burn",
            ts::ctx(&mut scenario),
        );

        assert!(fee_converter::total_burned(&converter) == 0, 0);
        assert!(fee_converter::total_to_treasury(&converter) == THOUSAND_CARIB, 1);

        ts::return_to_sender(&scenario, carib_treasury);
        ts::return_shared(converter);
    };

    // Verify treasury received full amount
    ts::next_tx(&mut scenario, TREASURY);
    {
        let received: Coin<CARIB_COIN> = ts::take_from_sender(&scenario);
        assert!(coin::value(&received) == THOUSAND_CARIB, 0);
        ts::return_to_sender(&scenario, received);
    };

    ts::end(scenario);
}

#[test]
fun test_process_fee_custom_split() {
    // 70% burn, 30% treasury
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: FeeConverterAdmin = ts::take_from_sender(&scenario);
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        fee_converter::update_burn_rate(&admin, &mut converter, 7000);
        ts::return_shared(converter);
        ts::return_to_sender(&scenario, admin);
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        let fee = take_carib(&mut scenario, THOUSAND_CARIB);
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        let mut carib_treasury: Treasury = ts::take_from_sender(&scenario);

        fee_converter::process_fee(
            &mut converter,
            &mut carib_treasury,
            fee,
            b"test_70_30",
            ts::ctx(&mut scenario),
        );

        let expected_burn = (THOUSAND_CARIB * 7) / 10;
        let expected_treasury = THOUSAND_CARIB - expected_burn;

        assert!(fee_converter::total_burned(&converter) == expected_burn, 0);
        assert!(fee_converter::total_to_treasury(&converter) == expected_treasury, 1);

        ts::return_to_sender(&scenario, carib_treasury);
        ts::return_shared(converter);
    };

    ts::end(scenario);
}

// ============ Overflow Regression Tests ============
//
// These are the tests that would have caught the u64 overflow bug the fee_converter
// hit earlier. Production bug: process_fee computed total_fee * burn_bps in u64.
// With ~49B CARIB raw units (49_000 * 1e9) * 5000 bps, the multiplication
// overflowed u64 max (~1.8e19) and aborted with MovePrimitiveRuntimeError.
// The fix was u128 intermediate math. These tests lock that fix in.

#[test]
fun test_overflow_regression_49B_carib_50_percent_burn() {
    // Replays the original production bug: 49B raw CARIB units (49_000_000 CARIB
    // displayed * 1e9 decimals) at 50/50 split. Without u128, this would abort.
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        // 49,000,000 CARIB in raw units — same magnitude as the original bug
        let huge_amount: u64 = 49_000_000 * ONE_CARIB;
        let fee = take_carib(&mut scenario, huge_amount);

        let mut converter: FeeConverter = ts::take_shared(&scenario);
        let mut carib_treasury: Treasury = ts::take_from_sender(&scenario);

        // This call is the regression target. Without u128 intermediate math,
        // the total_fee * burn_bps multiplication overflows u64 and aborts.
        fee_converter::process_fee(
            &mut converter,
            &mut carib_treasury,
            fee,
            b"overflow_regression",
            ts::ctx(&mut scenario),
        );

        let expected_burn = huge_amount / 2;
        let expected_treasury = huge_amount - expected_burn;

        assert!(fee_converter::total_burned(&converter) == expected_burn, 0);
        assert!(fee_converter::total_to_treasury(&converter) == expected_treasury, 1);

        ts::return_to_sender(&scenario, carib_treasury);
        ts::return_shared(converter);
    };

    ts::end(scenario);
}

#[test]
fun test_overflow_regression_near_u64_max() {
    // More aggressive: use a fee amount large enough that total_fee * 10000
    // would definitely overflow u64 in the old code path.
    // u64 max is ~1.8e19. We want total_fee > 1.8e15 so that * 10000 overflows.
    //
    // Genesis supply is 10B CARIB = 1e10 * 1e9 = 1e19 raw units.
    // Use 5B CARIB raw = 5e18 as the fee. At burn_bps=10000 (100% burn),
    // old code: 5e18 * 10000 = 5e22, which overflows u64.
    let mut scenario = setup();

    // Set to 100% burn to maximize the multiplier in the math
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: FeeConverterAdmin = ts::take_from_sender(&scenario);
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        fee_converter::update_burn_rate(&admin, &mut converter, 10000);
        ts::return_shared(converter);
        ts::return_to_sender(&scenario, admin);
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        // 5B CARIB raw units — 50% of genesis supply
        let massive: u64 = 5_000_000_000 * ONE_CARIB; // 5e18
        let fee = take_carib(&mut scenario, massive);

        let mut converter: FeeConverter = ts::take_shared(&scenario);
        let mut carib_treasury: Treasury = ts::take_from_sender(&scenario);

        // Without u128: 5e18 * 10000 overflows u64. With u128: handled cleanly.
        fee_converter::process_fee(
            &mut converter,
            &mut carib_treasury,
            fee,
            b"near_max_regression",
            ts::ctx(&mut scenario),
        );

        assert!(fee_converter::total_burned(&converter) == massive, 0);
        assert!(fee_converter::total_to_treasury(&converter) == 0, 1);

        ts::return_to_sender(&scenario, carib_treasury);
        ts::return_shared(converter);
    };

    ts::end(scenario);
}

#[test]
fun test_overflow_regression_genesis_supply() {
    // Absolute worst case: process the entire 10B CARIB genesis supply at 50/50.
    // Without u128, this would multiply 1e19 * 5000 and abort.
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        // Take the entire genesis supply
        let genesis: Coin<CARIB_COIN> = ts::take_from_sender(&scenario);
        let genesis_value = coin::value(&genesis);
        // Genesis should be exactly 10B CARIB
        assert!(genesis_value == 10_000_000_000 * ONE_CARIB, 0);

        let mut converter: FeeConverter = ts::take_shared(&scenario);
        let mut carib_treasury: Treasury = ts::take_from_sender(&scenario);

        fee_converter::process_fee(
            &mut converter,
            &mut carib_treasury,
            genesis,
            b"full_supply_regression",
            ts::ctx(&mut scenario),
        );

        let expected_burn = genesis_value / 2;
        let expected_treasury = genesis_value - expected_burn;

        assert!(fee_converter::total_burned(&converter) == expected_burn, 1);
        assert!(fee_converter::total_to_treasury(&converter) == expected_treasury, 2);

        ts::return_to_sender(&scenario, carib_treasury);
        ts::return_shared(converter);
    };

    ts::end(scenario);
}

// ============ Rounding / Math Edge Cases ============

#[test]
fun test_odd_amount_rounds_down() {
    // 3 raw units at 50% burn = 1 burn, 2 treasury (integer division rounds down)
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let fee = take_carib(&mut scenario, 3);
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        let mut carib_treasury: Treasury = ts::take_from_sender(&scenario);

        fee_converter::process_fee(
            &mut converter,
            &mut carib_treasury,
            fee,
            b"odd_amount",
            ts::ctx(&mut scenario),
        );

        // 3 * 5000 / 10000 = 15000 / 10000 = 1 (integer division)
        assert!(fee_converter::total_burned(&converter) == 1, 0);
        // remainder = 3 - 1 = 2
        assert!(fee_converter::total_to_treasury(&converter) == 2, 1);

        ts::return_to_sender(&scenario, carib_treasury);
        ts::return_shared(converter);
    };

    ts::end(scenario);
}

#[test]
fun test_one_raw_unit_with_burn() {
    // 1 raw unit at 50% burn: 1 * 5000 / 10000 = 0 burn, 1 to treasury
    // Verifies the "if burn_amount > 0" guard works.
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let fee = take_carib(&mut scenario, 1);
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        let mut carib_treasury: Treasury = ts::take_from_sender(&scenario);

        fee_converter::process_fee(
            &mut converter,
            &mut carib_treasury,
            fee,
            b"single_unit",
            ts::ctx(&mut scenario),
        );

        assert!(fee_converter::total_burned(&converter) == 0, 0);
        assert!(fee_converter::total_to_treasury(&converter) == 1, 1);

        ts::return_to_sender(&scenario, carib_treasury);
        ts::return_shared(converter);
    };

    // Verify treasury received the 1 unit
    ts::next_tx(&mut scenario, TREASURY);
    {
        let received: Coin<CARIB_COIN> = ts::take_from_sender(&scenario);
        assert!(coin::value(&received) == 1, 0);
        ts::return_to_sender(&scenario, received);
    };

    ts::end(scenario);
}

// ============ Error Path Tests ============

#[test]
#[expected_failure(abort_code = fee_converter::EZeroFee)]
fun test_zero_fee_aborts() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        // Create a zero-value coin
        let fee = coin::zero<CARIB_COIN>(ts::ctx(&mut scenario));
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        let mut carib_treasury: Treasury = ts::take_from_sender(&scenario);

        fee_converter::process_fee(
            &mut converter,
            &mut carib_treasury,
            fee,
            b"zero_fee",
            ts::ctx(&mut scenario),
        );

        ts::return_to_sender(&scenario, carib_treasury);
        ts::return_shared(converter);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = fee_converter::EInvalidBurnRate)]
fun test_burn_rate_over_10000_aborts() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: FeeConverterAdmin = ts::take_from_sender(&scenario);
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        // 10001 is over max — should abort
        fee_converter::update_burn_rate(&admin, &mut converter, 10001);
        ts::return_shared(converter);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

// ============ Cumulative Tracking ============

#[test]
fun test_cumulative_counters_across_multiple_fees() {
    let mut scenario = setup();

    // Process 5 fees of 1000 CARIB each at default 50/50
    let mut i = 0;
    while (i < 5) {
        ts::next_tx(&mut scenario, ADMIN);
        {
            let fee = take_carib(&mut scenario, THOUSAND_CARIB);
            let mut converter: FeeConverter = ts::take_shared(&scenario);
            let mut carib_treasury: Treasury = ts::take_from_sender(&scenario);

            fee_converter::process_fee(
                &mut converter,
                &mut carib_treasury,
                fee,
                b"cumulative",
                ts::ctx(&mut scenario),
            );

            ts::return_to_sender(&scenario, carib_treasury);
            ts::return_shared(converter);
        };
        i = i + 1;
    };

    // Verify cumulative totals
    ts::next_tx(&mut scenario, ADMIN);
    {
        let converter: FeeConverter = ts::take_shared(&scenario);
        assert!(fee_converter::total_burned(&converter) == (THOUSAND_CARIB / 2) * 5, 0);
        assert!(fee_converter::total_to_treasury(&converter) == (THOUSAND_CARIB / 2) * 5, 1);
        assert!(fee_converter::fee_event_count(&converter) == 5, 2);
        ts::return_shared(converter);
    };

    ts::end(scenario);
}

#[test]
fun test_consecutive_fees_accumulate_correctly() {
    // Two fees, first default 50/50, then we change burn_rate to 70/30 and process another.
    // Verifies that rate changes apply to subsequent fees, not retroactively.
    let mut scenario = setup();

    // First fee: default 50/50
    ts::next_tx(&mut scenario, ADMIN);
    {
        let fee = take_carib(&mut scenario, THOUSAND_CARIB);
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        let mut carib_treasury: Treasury = ts::take_from_sender(&scenario);

        fee_converter::process_fee(
            &mut converter,
            &mut carib_treasury,
            fee,
            b"first",
            ts::ctx(&mut scenario),
        );

        ts::return_to_sender(&scenario, carib_treasury);
        ts::return_shared(converter);
    };

    // Change rate to 70/30
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: FeeConverterAdmin = ts::take_from_sender(&scenario);
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        fee_converter::update_burn_rate(&admin, &mut converter, 7000);
        ts::return_shared(converter);
        ts::return_to_sender(&scenario, admin);
    };

    // Second fee: 70/30
    ts::next_tx(&mut scenario, ADMIN);
    {
        let fee = take_carib(&mut scenario, THOUSAND_CARIB);
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        let mut carib_treasury: Treasury = ts::take_from_sender(&scenario);

        fee_converter::process_fee(
            &mut converter,
            &mut carib_treasury,
            fee,
            b"second",
            ts::ctx(&mut scenario),
        );

        // First fee: 500 burn, 500 treasury (50%)
        // Second fee: 700 burn, 300 treasury (70%)
        // Cumulative: 1200 burn, 800 treasury
        assert!(fee_converter::total_burned(&converter) == 1200 * ONE_CARIB, 0);
        assert!(fee_converter::total_to_treasury(&converter) == 800 * ONE_CARIB, 1);
        assert!(fee_converter::fee_event_count(&converter) == 2, 2);

        ts::return_to_sender(&scenario, carib_treasury);
        ts::return_shared(converter);
    };

    ts::end(scenario);
}

// ============ Admin Functions ============

#[test]
fun test_admin_can_update_burn_rate() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: FeeConverterAdmin = ts::take_from_sender(&scenario);
        let mut converter: FeeConverter = ts::take_shared(&scenario);

        assert!(fee_converter::burn_bps(&converter) == 5000, 0);
        fee_converter::update_burn_rate(&admin, &mut converter, 3000);
        assert!(fee_converter::burn_bps(&converter) == 3000, 1);

        ts::return_shared(converter);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
fun test_admin_can_update_treasury_address() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: FeeConverterAdmin = ts::take_from_sender(&scenario);
        let mut converter: FeeConverter = ts::take_shared(&scenario);

        assert!(fee_converter::treasury_address(&converter) == TREASURY, 0);
        fee_converter::update_treasury_address(&admin, &mut converter, NEW_TREASURY);
        assert!(fee_converter::treasury_address(&converter) == NEW_TREASURY, 1);

        ts::return_shared(converter);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
fun test_new_treasury_receives_subsequent_fees() {
    // Treasury-address change should take effect immediately on next fee.
    let mut scenario = setup();

    // Update treasury to NEW_TREASURY
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: FeeConverterAdmin = ts::take_from_sender(&scenario);
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        fee_converter::update_treasury_address(&admin, &mut converter, NEW_TREASURY);
        ts::return_shared(converter);
        ts::return_to_sender(&scenario, admin);
    };

    // Process a fee
    ts::next_tx(&mut scenario, ADMIN);
    {
        let fee = take_carib(&mut scenario, THOUSAND_CARIB);
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        let mut carib_treasury: Treasury = ts::take_from_sender(&scenario);

        fee_converter::process_fee(
            &mut converter,
            &mut carib_treasury,
            fee,
            b"new_treasury_test",
            ts::ctx(&mut scenario),
        );

        ts::return_to_sender(&scenario, carib_treasury);
        ts::return_shared(converter);
    };

    // NEW_TREASURY should have received the treasury portion
    ts::next_tx(&mut scenario, NEW_TREASURY);
    {
        let received: Coin<CARIB_COIN> = ts::take_from_sender(&scenario);
        assert!(coin::value(&received) == THOUSAND_CARIB / 2, 0);
        ts::return_to_sender(&scenario, received);
    };

    // Old TREASURY should NOT have received anything
    ts::next_tx(&mut scenario, TREASURY);
    {
        assert!(!ts::has_most_recent_for_sender<Coin<CARIB_COIN>>(&scenario), 0);
    };

    ts::end(scenario);
}

#[test]
fun test_admin_can_transfer_cap() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: FeeConverterAdmin = ts::take_from_sender(&scenario);
        fee_converter::transfer_admin(admin, NEW_TREASURY);
    };

    // Verify NEW_TREASURY now holds the admin cap
    ts::next_tx(&mut scenario, NEW_TREASURY);
    {
        assert!(ts::has_most_recent_for_sender<FeeConverterAdmin>(&scenario), 0);
        let admin: FeeConverterAdmin = ts::take_from_sender(&scenario);
        ts::return_to_sender(&scenario, admin);
    };

    // Verify ADMIN no longer has it
    ts::next_tx(&mut scenario, ADMIN);
    {
        assert!(!ts::has_most_recent_for_sender<FeeConverterAdmin>(&scenario), 0);
    };

    ts::end(scenario);
}

#[test]
fun test_admin_can_set_max_burn_rate() {
    // 10000 bps exactly (100%) should be allowed; 10001 aborts.
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: FeeConverterAdmin = ts::take_from_sender(&scenario);
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        fee_converter::update_burn_rate(&admin, &mut converter, 10000);
        assert!(fee_converter::burn_bps(&converter) == 10000, 0);
        ts::return_shared(converter);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

// ============ CARIB Treasury Integration ============

#[test]
fun test_burn_updates_carib_treasury_counter() {
    // Verify that fee_converter's burn actually calls carib_coin::burn
    // and carib_coin's own total_burned counter advances.
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let fee = take_carib(&mut scenario, THOUSAND_CARIB);
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        let mut carib_treasury: Treasury = ts::take_from_sender(&scenario);

        let before_burned = carib_coin::total_burned(&carib_treasury);

        fee_converter::process_fee(
            &mut converter,
            &mut carib_treasury,
            fee,
            b"treasury_counter_test",
            ts::ctx(&mut scenario),
        );

        let after_burned = carib_coin::total_burned(&carib_treasury);
        // Both counters agree on the burn amount
        assert!(after_burned - before_burned == THOUSAND_CARIB / 2, 0);
        assert!(fee_converter::total_burned(&converter) == after_burned - before_burned, 1);

        ts::return_to_sender(&scenario, carib_treasury);
        ts::return_shared(converter);
    };

    ts::end(scenario);
}

#[test]
fun test_circulating_supply_decreases_after_burn() {
    // Integration check: after a burn, carib_coin's circulating_supply reflects it.
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let fee = take_carib(&mut scenario, MILLION_CARIB);
        let mut converter: FeeConverter = ts::take_shared(&scenario);
        let mut carib_treasury: Treasury = ts::take_from_sender(&scenario);

        let circulating_before = carib_coin::circulating_supply(&carib_treasury);

        fee_converter::process_fee(
            &mut converter,
            &mut carib_treasury,
            fee,
            b"circulating_test",
            ts::ctx(&mut scenario),
        );

        let circulating_after = carib_coin::circulating_supply(&carib_treasury);
        assert!(circulating_before - circulating_after == MILLION_CARIB / 2, 0);

        ts::return_to_sender(&scenario, carib_treasury);
        ts::return_shared(converter);
    };

    ts::end(scenario);
}

// ============ Source Tagging ============

#[test]
fun test_different_sources_processed_independently() {
    // Verify that multiple fees from different products (spice_surplus, dollar_yield, etc.)
    // all accumulate correctly in the shared converter.
    let mut scenario = setup();

    let sources: vector<vector<u8>> = vector[
        b"spice_surplus",
        b"dollar_yield",
        b"carib_mint_fee",
        b"cogni_subscription",
    ];

    let mut i = 0;
    let n = vector::length(&sources);
    while (i < n) {
        ts::next_tx(&mut scenario, ADMIN);
        {
            let fee = take_carib(&mut scenario, THOUSAND_CARIB);
            let mut converter: FeeConverter = ts::take_shared(&scenario);
            let mut carib_treasury: Treasury = ts::take_from_sender(&scenario);

            fee_converter::process_fee(
                &mut converter,
                &mut carib_treasury,
                fee,
                *vector::borrow(&sources, i),
                ts::ctx(&mut scenario),
            );

            ts::return_to_sender(&scenario, carib_treasury);
            ts::return_shared(converter);
        };
        i = i + 1;
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        let converter: FeeConverter = ts::take_shared(&scenario);
        assert!(fee_converter::fee_event_count(&converter) == (n as u64), 0);
        assert!(fee_converter::total_burned(&converter) == (THOUSAND_CARIB / 2) * (n as u64), 1);
        ts::return_shared(converter);
    };

    ts::end(scenario);
}
