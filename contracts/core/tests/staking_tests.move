#[test_only]
module anansi::staking_tests;

use anansi::staking::{Self, StakingConfig, StakingAdmin, StakePosition};
use anansi::carib_coin::{Self, CARIB_COIN};
use sui::test_scenario::{Self as ts, Scenario};
use sui::coin::{Self, Coin};
use sui::clock::{Self, Clock};

// ============ Test Addresses ============

const ADMIN: address = @0xA11CE;
const ALICE: address = @0xA11;
const BOB: address = @0xB0B;
const EVE: address = @0xE1E; // attacker

// ============ Test Constants ============

// CARIB has 9 decimals; amounts below are raw units
const ONE_CARIB:                u64 = 1_000_000_000;
const HALF_K_CARIB:             u64 = 500 * 1_000_000_000;
const ONE_K_CARIB:              u64 = 1_000 * 1_000_000_000;     // tier 1 threshold
const FIVE_K_CARIB:             u64 = 5_000 * 1_000_000_000;     // tier 2
const TEN_K_CARIB:              u64 = 10_000 * 1_000_000_000;    // tier 3
const FIFTY_K_CARIB:            u64 = 50_000 * 1_000_000_000;    // tier 4
const ONE_HUNDRED_K_CARIB:      u64 = 100_000 * 1_000_000_000;

// Cooldown values in ms
const COOLDOWN_24H_MS: u64 = 86_400_000;
const COOLDOWN_12H_MS: u64 = 43_200_000;
const COOLDOWN_72H_MS: u64 = 259_200_000;

// ============ Setup Helpers ============

/// Initialize carib_coin + staking. Returns scenario with ADMIN holding the genesis
/// CARIB supply and the StakingAdmin cap. StakingConfig is a shared object.
fun setup(): Scenario {
    let mut scenario = ts::begin(ADMIN);

    ts::next_tx(&mut scenario, ADMIN);
    {
        carib_coin::init_for_testing(ts::ctx(&mut scenario));
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        staking::init_for_testing(ts::ctx(&mut scenario));
    };

    ts::next_tx(&mut scenario, ADMIN);
    scenario
}

/// Split `amount` CARIB from the genesis coin held by ADMIN and transfer to `recipient`.
/// The recipient can then use this coin to stake in a subsequent tx.
fun fund(scenario: &mut Scenario, recipient: address, amount: u64) {
    ts::next_tx(scenario, ADMIN);
    {
        let mut genesis: Coin<CARIB_COIN> = ts::take_from_sender(scenario);
        let chunk = coin::split(&mut genesis, amount, ts::ctx(scenario));
        transfer::public_transfer(chunk, recipient);
        ts::return_to_sender(scenario, genesis);
    };
}

/// Stake `amount` CARIB on behalf of `staker` using the clock.
/// Creates a new StakePosition owned by `staker`.
fun stake_for(scenario: &mut Scenario, staker: address, amount: u64, clock: &Clock) {
    fund(scenario, staker, amount);

    ts::next_tx(scenario, staker);
    {
        let carib: Coin<CARIB_COIN> = ts::take_from_sender(scenario);
        let mut config: StakingConfig = ts::take_shared(scenario);
        staking::stake(&mut config, carib, clock, ts::ctx(scenario));
        ts::return_shared(config);
    };
}

// ============ Init & Default State ============

#[test]
fun test_init_default_config() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let config: StakingConfig = ts::take_shared(&scenario);
        assert!(staking::cooldown_ms(&config) == COOLDOWN_24H_MS, 0);
        assert!(staking::total_staked(&config) == 0, 1);
        assert!(staking::total_stakers(&config) == 0, 2);

        let (gov, prem, fee_red, prio) = staking::thresholds(&config);
        assert!(gov == ONE_K_CARIB, 3);
        assert!(prem == FIVE_K_CARIB, 4);
        assert!(fee_red == TEN_K_CARIB, 5);
        assert!(prio == FIFTY_K_CARIB, 6);

        ts::return_shared(config);
    };

    ts::end(scenario);
}

// ============ Stake ============

#[test]
fun test_stake_creates_position() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        assert!(staking::staked_amount(&position) == TEN_K_CARIB, 0);
        assert!(staking::active_amount(&position) == TEN_K_CARIB, 1);
        assert!(!staking::is_cooling_down(&position), 2);
        assert!(staking::position_owner(&position) == ALICE, 3);
        ts::return_to_sender(&scenario, position);
    };

    // Config should reflect the stake
    ts::next_tx(&mut scenario, ADMIN);
    {
        let config: StakingConfig = ts::take_shared(&scenario);
        assert!(staking::total_staked(&config) == TEN_K_CARIB, 4);
        assert!(staking::total_stakers(&config) == 1, 5);
        ts::return_shared(config);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = staking::EZeroStake)]
fun test_stake_zero_amount_aborts() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    ts::next_tx(&mut scenario, ALICE);
    {
        let empty = coin::zero<CARIB_COIN>(ts::ctx(&mut scenario));
        let mut config: StakingConfig = ts::take_shared(&scenario);
        staking::stake(&mut config, empty, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_stake_into_adds_to_existing() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, FIVE_K_CARIB, &clock);
    // Second stake: adds to same position
    fund(&mut scenario, ALICE, FIVE_K_CARIB);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let carib: Coin<CARIB_COIN> = ts::take_from_sender(&scenario);
        let mut config: StakingConfig = ts::take_shared(&scenario);

        staking::stake_into(&mut config, &mut position, carib, &clock, ts::ctx(&mut scenario));

        assert!(staking::staked_amount(&position) == TEN_K_CARIB, 0);

        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = staking::ENotOwner)]
fun test_stake_into_wrong_owner_aborts() {
    // Alice creates position. Eve tries to stake_into it. Should abort.
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, FIVE_K_CARIB, &clock);
    fund(&mut scenario, EVE, FIVE_K_CARIB);

    // Eve tries to transfer Alice's position to herself and stake into it.
    // We simulate the attack by directly taking Alice's position from the address
    // pool in a tx signed by Eve. In scenario terms we fetch from_address.
    ts::next_tx(&mut scenario, EVE);
    {
        let mut position: StakePosition = ts::take_from_address(&scenario, ALICE);
        let carib: Coin<CARIB_COIN> = ts::take_from_sender(&scenario);
        let mut config: StakingConfig = ts::take_shared(&scenario);

        // position.owner == ALICE, sender == EVE → aborts with ENotOwner
        staking::stake_into(&mut config, &mut position, carib, &clock, ts::ctx(&mut scenario));

        ts::return_shared(config);
        ts::return_to_address(ALICE, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Request Unstake ============

#[test]
fun test_request_unstake_starts_cooldown() {
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);

    // Advance clock to a known time
    clock::set_for_testing(&mut clock, 1_000_000_000);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);

        staking::request_unstake(&mut position, FIVE_K_CARIB, &config, &clock, ts::ctx(&mut scenario));

        assert!(staking::is_cooling_down(&position), 0);
        assert!(staking::cooldown_ends_at(&position) == 1_000_000_000 + COOLDOWN_24H_MS, 1);
        assert!(staking::pending_unstake(&position) == FIVE_K_CARIB, 2);
        // active_amount excludes the pending amount
        assert!(staking::active_amount(&position) == FIVE_K_CARIB, 3);
        // staked_amount still includes it
        assert!(staking::staked_amount(&position) == TEN_K_CARIB, 4);

        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_active_amount_zero_when_unstaking_full_balance() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);

        staking::request_unstake(&mut position, TEN_K_CARIB, &config, &clock, ts::ctx(&mut scenario));

        // Full balance being unstaked → no active tokens for benefits
        assert!(staking::active_amount(&position) == 0, 0);

        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = staking::ECooldownAlreadyActive)]
fun test_request_unstake_twice_aborts() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);

    // First request — ok
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);
        staking::request_unstake(&mut position, HALF_K_CARIB, &config, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    // Second request — aborts
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);
        staking::request_unstake(&mut position, HALF_K_CARIB, &config, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = staking::EInsufficientStake)]
fun test_request_unstake_more_than_balance_aborts() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, FIVE_K_CARIB, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);
        // Try to unstake 10K but only have 5K
        staking::request_unstake(&mut position, TEN_K_CARIB, &config, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = staking::EZeroStake)]
fun test_request_unstake_zero_aborts() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);
        staking::request_unstake(&mut position, 0, &config, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = staking::EPendingUnstakeExists)]
fun test_stake_into_during_cooldown_aborts() {
    // Charter rule: cannot add to position while a pending unstake is active.
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);

    // Start cooldown
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);
        staking::request_unstake(&mut position, FIVE_K_CARIB, &config, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    // Try to stake more into the cooling-down position
    fund(&mut scenario, ALICE, ONE_K_CARIB);
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let carib: Coin<CARIB_COIN> = ts::take_from_sender(&scenario);
        let mut config: StakingConfig = ts::take_shared(&scenario);
        staking::stake_into(&mut config, &mut position, carib, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Cancel Unstake ============

#[test]
fun test_cancel_unstake_restores_active_amount() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);
        staking::request_unstake(&mut position, FIVE_K_CARIB, &config, &clock, ts::ctx(&mut scenario));
        assert!(staking::active_amount(&position) == FIVE_K_CARIB, 0);

        staking::cancel_unstake(&mut position, &clock, ts::ctx(&mut scenario));

        // Benefits re-activate immediately
        assert!(!staking::is_cooling_down(&position), 1);
        assert!(staking::pending_unstake(&position) == 0, 2);
        assert!(staking::cooldown_ends_at(&position) == 0, 3);
        assert!(staking::active_amount(&position) == TEN_K_CARIB, 4);

        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = staking::ENoPendingUnstake)]
fun test_cancel_without_pending_aborts() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        staking::cancel_unstake(&mut position, &clock, ts::ctx(&mut scenario));
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_can_request_unstake_again_after_cancel() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);

        staking::request_unstake(&mut position, FIVE_K_CARIB, &config, &clock, ts::ctx(&mut scenario));
        staking::cancel_unstake(&mut position, &clock, ts::ctx(&mut scenario));
        // Should be allowed: no pending unstake now.
        staking::request_unstake(&mut position, ONE_K_CARIB, &config, &clock, ts::ctx(&mut scenario));

        assert!(staking::pending_unstake(&position) == ONE_K_CARIB, 0);

        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Withdraw Unstaked ============

#[test]
fun test_withdraw_after_cooldown_succeeds() {
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
    clock::set_for_testing(&mut clock, 1_000_000_000);

    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);

    // Request unstake of 4K
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);
        staking::request_unstake(&mut position, 4_000 * ONE_CARIB, &config, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    // Fast-forward past cooldown
    clock::increment_for_testing(&mut clock, COOLDOWN_24H_MS + 1);

    // Withdraw
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let mut config: StakingConfig = ts::take_shared(&scenario);

        let withdrawn = staking::withdraw_unstaked(&mut config, &mut position, &clock, ts::ctx(&mut scenario));

        assert!(coin::value(&withdrawn) == 4_000 * ONE_CARIB, 0);
        assert!(staking::staked_amount(&position) == 6_000 * ONE_CARIB, 1);
        assert!(staking::active_amount(&position) == 6_000 * ONE_CARIB, 2);
        assert!(!staking::is_cooling_down(&position), 3);
        assert!(staking::total_staked(&config) == 6_000 * ONE_CARIB, 4);

        transfer::public_transfer(withdrawn, ALICE);
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = staking::ECooldownNotComplete)]
fun test_withdraw_before_cooldown_aborts() {
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
    clock::set_for_testing(&mut clock, 1_000_000_000);

    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);
        staking::request_unstake(&mut position, FIVE_K_CARIB, &config, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    // Advance only half the cooldown
    clock::increment_for_testing(&mut clock, COOLDOWN_24H_MS / 2);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let mut config: StakingConfig = ts::take_shared(&scenario);
        let withdrawn = staking::withdraw_unstaked(&mut config, &mut position, &clock, ts::ctx(&mut scenario));
        transfer::public_transfer(withdrawn, ALICE);
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_withdraw_at_exact_cooldown_boundary() {
    // When now == cooldown_ends_at exactly, withdraw should succeed (uses >=).
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
    clock::set_for_testing(&mut clock, 1_000_000_000);

    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);
        staking::request_unstake(&mut position, FIVE_K_CARIB, &config, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    // Advance exactly to cooldown boundary
    clock::increment_for_testing(&mut clock, COOLDOWN_24H_MS);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let mut config: StakingConfig = ts::take_shared(&scenario);
        let withdrawn = staking::withdraw_unstaked(&mut config, &mut position, &clock, ts::ctx(&mut scenario));
        assert!(coin::value(&withdrawn) == FIVE_K_CARIB, 0);
        transfer::public_transfer(withdrawn, ALICE);
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = staking::ENoPendingUnstake)]
fun test_withdraw_without_pending_aborts() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let mut config: StakingConfig = ts::take_shared(&scenario);
        // No unstake requested → abort
        let withdrawn = staking::withdraw_unstaked(&mut config, &mut position, &clock, ts::ctx(&mut scenario));
        transfer::public_transfer(withdrawn, ALICE);
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = staking::ENotOwner)]
fun test_withdraw_by_non_owner_aborts() {
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
    clock::set_for_testing(&mut clock, 1_000_000_000);

    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);
        staking::request_unstake(&mut position, FIVE_K_CARIB, &config, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::increment_for_testing(&mut clock, COOLDOWN_24H_MS + 1);

    // Eve grabs Alice's position and tries to withdraw
    ts::next_tx(&mut scenario, EVE);
    {
        let mut position: StakePosition = ts::take_from_address(&scenario, ALICE);
        let mut config: StakingConfig = ts::take_shared(&scenario);
        let withdrawn = staking::withdraw_unstaked(&mut config, &mut position, &clock, ts::ctx(&mut scenario));
        transfer::public_transfer(withdrawn, EVE);
        ts::return_shared(config);
        ts::return_to_address(ALICE, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Close Position ============

#[test]
fun test_close_empty_position_succeeds() {
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
    clock::set_for_testing(&mut clock, 1_000_000_000);

    stake_for(&mut scenario, ALICE, ONE_K_CARIB, &clock);

    // Fully unstake and withdraw
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);
        staking::request_unstake(&mut position, ONE_K_CARIB, &config, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::increment_for_testing(&mut clock, COOLDOWN_24H_MS + 1);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let mut config: StakingConfig = ts::take_shared(&scenario);
        let withdrawn = staking::withdraw_unstaked(&mut config, &mut position, &clock, ts::ctx(&mut scenario));
        transfer::public_transfer(withdrawn, ALICE);
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    // Close the now-empty position
    ts::next_tx(&mut scenario, ALICE);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        let mut config: StakingConfig = ts::take_shared(&scenario);
        staking::close_position(position, &mut config);
        // Staker count decremented
        assert!(staking::total_stakers(&config) == 0, 0);
        ts::return_shared(config);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = staking::EInsufficientStake)]
fun test_close_nonempty_position_aborts() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, ONE_K_CARIB, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        let mut config: StakingConfig = ts::take_shared(&scenario);
        // Balance > 0 → abort
        staking::close_position(position, &mut config);
        ts::return_shared(config);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// Note: staking::EPendingUnstakeExists is also checked in close_position, but that
// path is unreachable through the public API — the balance check (EInsufficientStake)
// fires first on any position that still has a pending unstake. The guard exists as
// defense-in-depth against future refactors that might decouple the two fields.

// ============ Tier Boundary Tests ============

#[test]
fun test_tier_calculation_across_thresholds() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    // Tier 0: below 1K
    stake_for(&mut scenario, ALICE, HALF_K_CARIB, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);
        assert!(staking::tier(&position, &config) == 0, 0);
        assert!(!staking::has_governance(&position, &config), 1);
        assert!(!staking::has_premium(&position, &config), 2);
        assert!(!staking::has_fee_reduction(&position, &config), 3);
        assert!(!staking::has_priority_access(&position, &config), 4);
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    // Bob at 1K → tier 1 (governance only)
    stake_for(&mut scenario, BOB, ONE_K_CARIB, &clock);

    ts::next_tx(&mut scenario, BOB);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);
        assert!(staking::tier(&position, &config) == 1, 5);
        assert!(staking::has_governance(&position, &config), 6);
        assert!(!staking::has_premium(&position, &config), 7);
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_tier_at_exact_threshold() {
    // At exactly fee_reduction_threshold (10K), should qualify as tier 3.
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);
        assert!(staking::tier(&position, &config) == 3, 0);
        assert!(staking::has_fee_reduction(&position, &config), 1);
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_tier_4_at_50k() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, FIFTY_K_CARIB, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);
        assert!(staking::tier(&position, &config) == 4, 0);
        assert!(staking::has_governance(&position, &config), 1);
        assert!(staking::has_premium(&position, &config), 2);
        assert!(staking::has_fee_reduction(&position, &config), 3);
        assert!(staking::has_priority_access(&position, &config), 4);
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_cooldown_drops_tier() {
    // 10K staker at tier 3, requests 5K unstake → active = 5K → tier 2.
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);

        // Before unstake: tier 3
        assert!(staking::tier(&position, &config) == 3, 0);

        staking::request_unstake(&mut position, FIVE_K_CARIB, &config, &clock, ts::ctx(&mut scenario));

        // After unstake request: active = 5K → tier 2 (premium)
        assert!(staking::tier(&position, &config) == 2, 1);
        assert!(staking::has_premium(&position, &config), 2);
        assert!(!staking::has_fee_reduction(&position, &config), 3);

        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Cooldown Remaining View ============

#[test]
fun test_cooldown_remaining_decreases_with_time() {
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
    clock::set_for_testing(&mut clock, 0);

    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);

        assert!(staking::cooldown_remaining(&position, &clock) == 0, 0);

        staking::request_unstake(&mut position, FIVE_K_CARIB, &config, &clock, ts::ctx(&mut scenario));

        // Right after request: full cooldown ahead
        assert!(staking::cooldown_remaining(&position, &clock) == COOLDOWN_24H_MS, 1);

        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    // Advance 12h
    clock::increment_for_testing(&mut clock, 12 * 3_600_000);

    ts::next_tx(&mut scenario, ALICE);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        // Half the cooldown remaining
        assert!(staking::cooldown_remaining(&position, &clock) == 12 * 3_600_000, 2);
        ts::return_to_sender(&scenario, position);
    };

    // Advance past end
    clock::increment_for_testing(&mut clock, COOLDOWN_24H_MS);

    ts::next_tx(&mut scenario, ALICE);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        assert!(staking::cooldown_remaining(&position, &clock) == 0, 3);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Admin ============

#[test]
fun test_admin_can_update_cooldown() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: StakingAdmin = ts::take_from_sender(&scenario);
        let mut config: StakingConfig = ts::take_shared(&scenario);

        staking::update_cooldown(&admin, &mut config, COOLDOWN_12H_MS);
        assert!(staking::cooldown_ms(&config) == COOLDOWN_12H_MS, 0);

        staking::update_cooldown(&admin, &mut config, COOLDOWN_72H_MS);
        assert!(staking::cooldown_ms(&config) == COOLDOWN_72H_MS, 1);

        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = staking::EInvalidCooldown)]
fun test_admin_cannot_set_cooldown_below_min() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: StakingAdmin = ts::take_from_sender(&scenario);
        let mut config: StakingConfig = ts::take_shared(&scenario);
        // 1 hour is below the 12h minimum
        staking::update_cooldown(&admin, &mut config, 3_600_000);
        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = staking::EInvalidCooldown)]
fun test_admin_cannot_set_cooldown_above_max() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: StakingAdmin = ts::take_from_sender(&scenario);
        let mut config: StakingConfig = ts::take_shared(&scenario);
        // 80h is above the 72h max
        staking::update_cooldown(&admin, &mut config, 80 * 3_600_000);
        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
fun test_admin_can_update_thresholds() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: StakingAdmin = ts::take_from_sender(&scenario);
        let mut config: StakingConfig = ts::take_shared(&scenario);

        // Double all thresholds
        staking::update_thresholds(
            &admin, &mut config,
            2 * ONE_K_CARIB,
            2 * FIVE_K_CARIB,
            2 * TEN_K_CARIB,
            2 * FIFTY_K_CARIB,
        );

        let (gov, prem, fee_red, prio) = staking::thresholds(&config);
        assert!(gov == 2 * ONE_K_CARIB, 0);
        assert!(prem == 2 * FIVE_K_CARIB, 1);
        assert!(fee_red == 2 * TEN_K_CARIB, 2);
        assert!(prio == 2 * FIFTY_K_CARIB, 3);

        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
fun test_threshold_change_affects_existing_position_tier() {
    // Alice at 10K is tier 3. Admin raises fee_reduction_threshold to 20K.
    // Alice should drop to tier 2 without any action on her part.
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);

    // Alice is tier 3
    ts::next_tx(&mut scenario, ALICE);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);
        assert!(staking::tier(&position, &config) == 3, 0);
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    // Admin doubles thresholds
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: StakingAdmin = ts::take_from_sender(&scenario);
        let mut config: StakingConfig = ts::take_shared(&scenario);
        staking::update_thresholds(
            &admin, &mut config,
            2 * ONE_K_CARIB,
            2 * FIVE_K_CARIB,
            2 * TEN_K_CARIB, // now 20K
            2 * FIFTY_K_CARIB,
        );
        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin);
    };

    // Alice now tier 2 (premium, not fee reduction)
    ts::next_tx(&mut scenario, ALICE);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);
        assert!(staking::tier(&position, &config) == 2, 1);
        assert!(!staking::has_fee_reduction(&position, &config), 2);
        assert!(staking::has_premium(&position, &config), 3);
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_admin_can_transfer_cap() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: StakingAdmin = ts::take_from_sender(&scenario);
        staking::transfer_admin(admin, BOB);
    };

    ts::next_tx(&mut scenario, BOB);
    {
        assert!(ts::has_most_recent_for_sender<StakingAdmin>(&scenario), 0);
        let admin: StakingAdmin = ts::take_from_sender(&scenario);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

// ============ Multi-User Aggregation ============

#[test]
fun test_multiple_stakers_aggregate_totals() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);
    stake_for(&mut scenario, BOB, FIVE_K_CARIB, &clock);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let config: StakingConfig = ts::take_shared(&scenario);
        assert!(staking::total_staked(&config) == TEN_K_CARIB + FIVE_K_CARIB, 0);
        assert!(staking::total_stakers(&config) == 2, 1);
        ts::return_shared(config);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_withdraw_updates_total_staked() {
    // Verify config.total_staked decreases after a withdrawal.
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
    clock::set_for_testing(&mut clock, 1_000_000_000);

    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);
    stake_for(&mut scenario, BOB, FIVE_K_CARIB, &clock);

    // Alice unstakes 4K
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);
        staking::request_unstake(&mut position, 4_000 * ONE_CARIB, &config, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::increment_for_testing(&mut clock, COOLDOWN_24H_MS + 1);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let mut config: StakingConfig = ts::take_shared(&scenario);
        let withdrawn = staking::withdraw_unstaked(&mut config, &mut position, &clock, ts::ctx(&mut scenario));
        transfer::public_transfer(withdrawn, ALICE);
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    // total_staked = 15K - 4K = 11K
    ts::next_tx(&mut scenario, ADMIN);
    {
        let config: StakingConfig = ts::take_shared(&scenario);
        assert!(staking::total_staked(&config) == 11_000 * ONE_CARIB, 0);
        // Both still counted as stakers
        assert!(staking::total_stakers(&config) == 2, 1);
        ts::return_shared(config);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Full Lifecycle ============

#[test]
fun test_full_lifecycle_stake_unstake_restake() {
    // End-to-end: stake → unstake → withdraw → close → new stake
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
    clock::set_for_testing(&mut clock, 1_000_000_000);

    // Round 1
    stake_for(&mut scenario, ALICE, TEN_K_CARIB, &clock);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let config: StakingConfig = ts::take_shared(&scenario);
        staking::request_unstake(&mut position, TEN_K_CARIB, &config, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    clock::increment_for_testing(&mut clock, COOLDOWN_24H_MS + 1);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut position: StakePosition = ts::take_from_sender(&scenario);
        let mut config: StakingConfig = ts::take_shared(&scenario);
        let withdrawn = staking::withdraw_unstaked(&mut config, &mut position, &clock, ts::ctx(&mut scenario));
        transfer::public_transfer(withdrawn, ALICE);
        ts::return_shared(config);
        ts::return_to_sender(&scenario, position);
    };

    // Close the empty position
    ts::next_tx(&mut scenario, ALICE);
    {
        let position: StakePosition = ts::take_from_sender(&scenario);
        let mut config: StakingConfig = ts::take_shared(&scenario);
        staking::close_position(position, &mut config);
        assert!(staking::total_staked(&config) == 0, 0);
        assert!(staking::total_stakers(&config) == 0, 1);
        ts::return_shared(config);
    };

    // Round 2: Alice stakes again with a fresh position
    stake_for(&mut scenario, ALICE, FIVE_K_CARIB, &clock);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let config: StakingConfig = ts::take_shared(&scenario);
        assert!(staking::total_staked(&config) == FIVE_K_CARIB, 2);
        assert!(staking::total_stakers(&config) == 1, 3);
        ts::return_shared(config);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}
