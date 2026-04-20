#[test_only]
module anansi::fee_discount_tests;

use anansi::fee_discount::{Self, FeeDiscountConfig, FeeDiscountAdmin};
use anansi::staking::{Self, StakingConfig, StakingAdmin, StakePosition};
use anansi::carib_coin::{Self, CARIB_COIN};
use sui::test_scenario::{Self as ts, Scenario};
use sui::coin::{Self, Coin};
use sui::clock::{Self, Clock};

// ============ Test Constants ============

const ADMIN: address = @0xA11CE;
const ALICE: address = @0xA11;   // tier 3 staker
const BOB: address = @0xB0B;     // tier 2 staker
const CAROL: address = @0xCA401; // tier 4 staker
const DAVE: address = @0xDA1E;   // no stake
const EVE: address = @0xE1E;     // attacker trying to borrow others' positions

/// Staking thresholds, one tier per level (raw CARIB, 9 decimals)
const TIER_1_AMOUNT: u64 = 1_000_000_000_000;   // 1K CARIB
const TIER_2_AMOUNT: u64 = 5_000_000_000_000;   // 5K CARIB
const TIER_3_AMOUNT: u64 = 10_000_000_000_000;  // 10K CARIB
const TIER_4_AMOUNT: u64 = 50_000_000_000_000;  // 50K CARIB

// ============ Setup Helpers ============

/// Bootstrap a scenario with all three configs (carib, staking, fee_discount) initialized.
/// Returns the scenario positioned after setup, with ADMIN as sender.
fun setup(): Scenario {
    let mut scenario = ts::begin(ADMIN);

    // Init carib_coin module (creates Treasury + AdminCap)
    ts::next_tx(&mut scenario, ADMIN);
    {
        carib_coin::init_for_testing(ts::ctx(&mut scenario));
    };

    // Init staking module
    ts::next_tx(&mut scenario, ADMIN);
    {
        staking::init_for_testing(ts::ctx(&mut scenario));
    };

    // Init fee_discount module
    ts::next_tx(&mut scenario, ADMIN);
    {
        fee_discount::init_for_testing(ts::ctx(&mut scenario));
    };

    // Advance for object visibility
    ts::next_tx(&mut scenario, ADMIN);
    scenario
}

/// Mint CARIB directly to an address for testing. Uses carib_coin test helper.
fun mint_carib_to(scenario: &mut Scenario, to: address, amount: u64) {
    ts::next_tx(scenario, ADMIN);
    {
        // In production, carib_coin genesis mints 10B to admin.
        // For tests, we need a direct mint helper. Assuming carib_coin has
        // test-only mint; if not, we'd grab genesis supply and split.
        //
        // To keep tests self-contained, we take the admin's genesis CARIB
        // and transfer portions to test addresses.
        let mut genesis: Coin<CARIB_COIN> = ts::take_from_sender(scenario);
        let chunk = coin::split(&mut genesis, amount, ts::ctx(scenario));
        transfer::public_transfer(chunk, to);
        ts::return_to_sender(scenario, genesis);
    };
}

/// Stake `amount` on behalf of `staker`. Creates a StakePosition owned by `staker`.
fun stake_for(scenario: &mut Scenario, staker: address, amount: u64, clock: &Clock) {
    mint_carib_to(scenario, staker, amount);

    ts::next_tx(scenario, staker);
    {
        let carib: Coin<CARIB_COIN> = ts::take_from_sender(scenario);
        let mut config: StakingConfig = ts::take_shared(scenario);
        staking::stake(&mut config, carib, clock, ts::ctx(scenario));
        ts::return_shared(config);
    };
}

/// Enable the fee discount kill switch. Call after setup to activate discounts.
fun enable_discounts(scenario: &mut Scenario) {
    ts::next_tx(scenario, ADMIN);
    {
        let admin: FeeDiscountAdmin = ts::take_from_sender(scenario);
        let mut config: FeeDiscountConfig = ts::take_shared(scenario);
        fee_discount::set_enabled(&admin, &mut config, true, ts::ctx(scenario));
        ts::return_shared(config);
        ts::return_to_sender(scenario, admin);
    };
}

// ============ Core Logic Tests ============

#[test]
fun test_default_config_disabled() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let config: FeeDiscountConfig = ts::take_shared(&scenario);
        assert!(!fee_discount::is_enabled(&config), 0);
        assert!(fee_discount::min_tier_for_discount(&config) == 3, 1);
        ts::return_shared(config);
    };

    ts::end(scenario);
}

#[test]
fun test_kill_switch_blocks_discount() {
    // Even a tier-4 staker gets 0 discount when kill switch is off
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, CAROL, TIER_4_AMOUNT, &clock);

    ts::next_tx(&mut scenario, CAROL);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        let staking_config: StakingConfig = ts::take_shared(&scenario);
        let discount_config: FeeDiscountConfig = ts::take_shared(&scenario);

        // Kill switch is off (default) — should return 0 even though Carol is tier 4
        assert!(!fee_discount::is_enabled(&discount_config), 0);
        let bps = fee_discount::compute_discount_bps(
            &position, &staking_config, &discount_config
        );
        assert!(bps == 0, 1);

        ts::return_shared(discount_config);
        ts::return_shared(staking_config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_enabled_tier_3_gets_discount() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    enable_discounts(&mut scenario);
    stake_for(&mut scenario, ALICE, TIER_3_AMOUNT, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        let staking_config: StakingConfig = ts::take_shared(&scenario);
        let discount_config: FeeDiscountConfig = ts::take_shared(&scenario);

        let bps = fee_discount::compute_discount_bps(
            &position, &staking_config, &discount_config
        );
        assert!(bps == 5000, 0); // default tier 3 = 50%

        ts::return_shared(discount_config);
        ts::return_shared(staking_config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_tier_2_gets_no_discount_by_default() {
    // Tier 1 and 2 are about governance/premium features, not fees.
    // Default config has tier_2_discount_bps = 0.
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    enable_discounts(&mut scenario);
    stake_for(&mut scenario, BOB, TIER_2_AMOUNT, &clock);

    ts::next_tx(&mut scenario, BOB);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        let staking_config: StakingConfig = ts::take_shared(&scenario);
        let discount_config: FeeDiscountConfig = ts::take_shared(&scenario);

        let bps = fee_discount::compute_discount_bps(
            &position, &staking_config, &discount_config
        );
        assert!(bps == 0, 0);

        ts::return_shared(discount_config);
        ts::return_shared(staking_config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_no_stake_gets_no_discount() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    enable_discounts(&mut scenario);
    // Stake a trivial amount (below tier 1) for DAVE so he has a position
    stake_for(&mut scenario, DAVE, 100, &clock); // 100 raw units, way below tier 1

    ts::next_tx(&mut scenario, DAVE);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        let staking_config: StakingConfig = ts::take_shared(&scenario);
        let discount_config: FeeDiscountConfig = ts::take_shared(&scenario);

        // Dave is tier 0 → discount 0
        let bps = fee_discount::compute_discount_bps(
            &position, &staking_config, &discount_config
        );
        assert!(bps == 0, 0);

        ts::return_shared(discount_config);
        ts::return_shared(staking_config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_tier_4_equal_to_tier_3_by_default() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    enable_discounts(&mut scenario);
    stake_for(&mut scenario, CAROL, TIER_4_AMOUNT, &clock);

    ts::next_tx(&mut scenario, CAROL);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        let staking_config: StakingConfig = ts::take_shared(&scenario);
        let discount_config: FeeDiscountConfig = ts::take_shared(&scenario);

        let bps = fee_discount::compute_discount_bps(
            &position, &staking_config, &discount_config
        );
        // Tier 4 = tier 3 in fee terms by default (both 50%). T4 bonus is priority access.
        assert!(bps == 5000, 0);

        ts::return_shared(discount_config);
        ts::return_shared(staking_config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Math Tests ============

#[test]
fun test_apply_discount_math() {
    // 100 bps fee with 5000 bps (50%) discount → 50 bps
    assert!(fee_discount::apply_discount(100, 5000) == 50, 0);

    // 0 bps discount → unchanged
    assert!(fee_discount::apply_discount(100, 0) == 100, 1);

    // 10000 bps discount (100%) → 0
    assert!(fee_discount::apply_discount(100, 10000) == 0, 2);

    // 2500 bps discount (25%) on 400 bps fee → 300 bps
    assert!(fee_discount::apply_discount(400, 2500) == 300, 3);

    // Rounding: 33 bps * 0.33 discount rounds down
    // 33 * (10000 - 3333) / 10000 = 33 * 6667 / 10000 = 22.0011 → 22
    assert!(fee_discount::apply_discount(33, 3333) == 22, 4);
}

#[test]
fun test_apply_discount_over_100_percent_saturates() {
    // Over-100% discount treated as 100% discount — no underflow
    assert!(fee_discount::apply_discount(100, 15000) == 0, 0);
    assert!(fee_discount::apply_discount(100, 10001) == 0, 1);
}

#[test]
fun test_apply_discount_to_amount_u128_safe() {
    // Large fee amount that would overflow u64 * u16 without u128 intermediate
    // 10_000_000_000_000_000 (1e16) * 5000 bps = 5e19 which overflows u64 (~1.8e19)
    let huge_fee: u64 = 10_000_000_000_000_000; // 1e16 raw
    let result = fee_discount::apply_discount_to_amount(huge_fee, 5000);
    // 50% of 1e16 = 5e15
    assert!(result == 5_000_000_000_000_000, 0);
}

#[test]
fun test_compute_effective_fee_bps_integrates() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    enable_discounts(&mut scenario);
    stake_for(&mut scenario, ALICE, TIER_3_AMOUNT, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        let staking_config: StakingConfig = ts::take_shared(&scenario);
        let discount_config: FeeDiscountConfig = ts::take_shared(&scenario);

        // Base fee 100 bps, Alice is tier 3 (50% discount) → 50 bps
        let eff = fee_discount::compute_effective_fee_bps(
            100, &position, &staking_config, &discount_config
        );
        assert!(eff == 50, 0);

        ts::return_shared(discount_config);
        ts::return_shared(staking_config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Ownership / Security Tests ============

#[test]
fun test_assert_owner_passes_for_owner() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, TIER_3_AMOUNT, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        // Should not abort
        fee_discount::assert_position_owned_by(&position, ALICE);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = fee_discount::EWrongOwner)]
fun test_assert_owner_aborts_for_wrong_caller() {
    // Eve tries to use Alice's stake position to claim a discount
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, TIER_3_AMOUNT, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        // Eve asserting ownership on Alice's position should abort
        fee_discount::assert_position_owned_by(&position, EVE);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_assert_meets_min_tier_passes_for_tier_3() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    enable_discounts(&mut scenario);
    stake_for(&mut scenario, ALICE, TIER_3_AMOUNT, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        let staking_config: StakingConfig = ts::take_shared(&scenario);
        let discount_config: FeeDiscountConfig = ts::take_shared(&scenario);

        // Default min tier = 3, Alice is tier 3 → ok
        fee_discount::assert_meets_min_tier(&position, &staking_config, &discount_config);

        ts::return_shared(discount_config);
        ts::return_shared(staking_config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = fee_discount::EInsufficientTier)]
fun test_assert_meets_min_tier_aborts_for_tier_2() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    enable_discounts(&mut scenario);
    stake_for(&mut scenario, BOB, TIER_2_AMOUNT, &clock);

    ts::next_tx(&mut scenario, BOB);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        let staking_config: StakingConfig = ts::take_shared(&scenario);
        let discount_config: FeeDiscountConfig = ts::take_shared(&scenario);

        // Min tier = 3, Bob is tier 2 → aborts
        fee_discount::assert_meets_min_tier(&position, &staking_config, &discount_config);

        ts::return_shared(discount_config);
        ts::return_shared(staking_config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Admin Function Tests ============

#[test]
fun test_admin_can_toggle_kill_switch() {
    let mut scenario = setup();

    // Start disabled
    ts::next_tx(&mut scenario, ADMIN);
    {
        let config: FeeDiscountConfig = ts::take_shared(&scenario);
        assert!(!fee_discount::is_enabled(&config), 0);
        ts::return_shared(config);
    };

    enable_discounts(&mut scenario);

    // Now enabled
    ts::next_tx(&mut scenario, ADMIN);
    {
        let config: FeeDiscountConfig = ts::take_shared(&scenario);
        assert!(fee_discount::is_enabled(&config), 1);
        ts::return_shared(config);
    };

    // Disable again
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: FeeDiscountAdmin = ts::take_from_sender(&scenario);
        let mut config: FeeDiscountConfig = ts::take_shared(&scenario);
        fee_discount::set_enabled(&admin, &mut config, false, ts::ctx(&mut scenario));
        assert!(!fee_discount::is_enabled(&config), 2);
        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
fun test_admin_can_update_tier_discount() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: FeeDiscountAdmin = ts::take_from_sender(&scenario);
        let mut config: FeeDiscountConfig = ts::take_shared(&scenario);

        // Default tier 3 is 5000 bps; change to 4000 (40%)
        fee_discount::set_tier_discount(&admin, &mut config, 3, 4000, ts::ctx(&mut scenario));

        let (_, _, t3, _) = fee_discount::tier_discounts(&config);
        assert!(t3 == 4000, 0);

        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = fee_discount::EDiscountTooLarge)]
fun test_admin_cannot_exceed_max_discount() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: FeeDiscountAdmin = ts::take_from_sender(&scenario);
        let mut config: FeeDiscountConfig = ts::take_shared(&scenario);

        // Default max_discount_bps is 5000. Try to set tier 3 to 6000 → abort.
        fee_discount::set_tier_discount(&admin, &mut config, 3, 6000, ts::ctx(&mut scenario));

        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = fee_discount::EMaxDiscountTooLarge)]
fun test_admin_cannot_exceed_absolute_max() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: FeeDiscountAdmin = ts::take_from_sender(&scenario);
        let mut config: FeeDiscountConfig = ts::take_shared(&scenario);

        // ABSOLUTE_MAX is 7500. Try to set max to 8000 → abort.
        fee_discount::set_max_discount_bps(&admin, &mut config, 8000, ts::ctx(&mut scenario));

        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = fee_discount::EInvalidTier)]
fun test_admin_cannot_set_invalid_tier() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: FeeDiscountAdmin = ts::take_from_sender(&scenario);
        let mut config: FeeDiscountConfig = ts::take_shared(&scenario);

        // Tier 0 is invalid (no benefits tier); tiers must be 1-4
        fee_discount::set_tier_discount(&admin, &mut config, 0, 1000, ts::ctx(&mut scenario));

        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = fee_discount::EInvalidTier)]
fun test_admin_cannot_set_tier_5() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: FeeDiscountAdmin = ts::take_from_sender(&scenario);
        let mut config: FeeDiscountConfig = ts::take_shared(&scenario);

        fee_discount::set_tier_discount(&admin, &mut config, 5, 1000, ts::ctx(&mut scenario));

        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
fun test_admin_can_raise_max_up_to_absolute() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: FeeDiscountAdmin = ts::take_from_sender(&scenario);
        let mut config: FeeDiscountConfig = ts::take_shared(&scenario);

        // Raise max to 7500 (absolute ceiling) — should succeed
        fee_discount::set_max_discount_bps(&admin, &mut config, 7500, ts::ctx(&mut scenario));
        assert!(fee_discount::max_discount_bps(&config) == 7500, 0);

        // Now can set a tier to 7500 too
        fee_discount::set_tier_discount(&admin, &mut config, 4, 7500, ts::ctx(&mut scenario));
        let (_, _, _, t4) = fee_discount::tier_discounts(&config);
        assert!(t4 == 7500, 1);

        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

// ============ Integration: Full Flow ============

#[test]
fun test_full_flow_enabled_tier_3_applies_discount() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    enable_discounts(&mut scenario);
    stake_for(&mut scenario, ALICE, TIER_3_AMOUNT, &clock);

    // Simulated product-level fee: 100 bps base fee
    ts::next_tx(&mut scenario, ALICE);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        let staking_config: StakingConfig = ts::take_shared(&scenario);
        let discount_config: FeeDiscountConfig = ts::take_shared(&scenario);

        // Product check: verify Alice owns the position
        fee_discount::assert_position_owned_by(&position, ALICE);
        // Product check: verify Alice meets minimum tier
        fee_discount::assert_meets_min_tier(&position, &staking_config, &discount_config);
        // Compute effective fee
        let eff_bps = fee_discount::compute_effective_fee_bps(
            100, &position, &staking_config, &discount_config
        );
        assert!(eff_bps == 50, 0); // 50% discount applied

        // Compute on raw amount: 1M USDC fee → 500K after discount
        let eff_amount = fee_discount::apply_discount_to_amount(1_000_000, 5000);
        assert!(eff_amount == 500_000, 1);

        ts::return_shared(discount_config);
        ts::return_shared(staking_config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Clamp safety: tier bps exceed max at read time ============

#[test]
fun test_compute_discount_clamps_to_max() {
    // Scenario: admin raises max to 7500, sets tier 4 to 7500,
    // then lowers max back to 3000 (lower) without updating tier 4.
    // Reading Carol's (tier 4) discount should clamp at 3000, not return 7500.
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    // Raise max, set tier 4 high
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: FeeDiscountAdmin = ts::take_from_sender(&scenario);
        let mut config: FeeDiscountConfig = ts::take_shared(&scenario);
        fee_discount::set_max_discount_bps(&admin, &mut config, 7500, ts::ctx(&mut scenario));
        fee_discount::set_tier_discount(&admin, &mut config, 4, 7500, ts::ctx(&mut scenario));
        // Now lower max
        fee_discount::set_max_discount_bps(&admin, &mut config, 3000, ts::ctx(&mut scenario));
        fee_discount::set_enabled(&admin, &mut config, true, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin);
    };

    stake_for(&mut scenario, CAROL, TIER_4_AMOUNT, &clock);

    ts::next_tx(&mut scenario, CAROL);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        let staking_config: StakingConfig = ts::take_shared(&scenario);
        let discount_config: FeeDiscountConfig = ts::take_shared(&scenario);

        let bps = fee_discount::compute_discount_bps(
            &position, &staking_config, &discount_config
        );
        // Should be clamped at 3000, not 7500
        assert!(bps == 3000, 0);

        ts::return_shared(discount_config);
        ts::return_shared(staking_config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}
