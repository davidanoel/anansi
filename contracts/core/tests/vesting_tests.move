#[test_only]
module anansi::vesting_tests;

use anansi::vesting::{Self, VestingConfig, VestingAdmin, VestingSchedule};
use anansi::carib_coin::{Self, CARIB_COIN};
use sui::test_scenario::{Self as ts, Scenario};
use sui::coin::{Self, Coin};
use sui::clock::{Self, Clock};

// ============ Test Addresses ============

const ADMIN:   address = @0xA11CE;
const CREATOR: address = @0xC12EA;
const ALICE:   address = @0xA11;    // beneficiary
const BOB:     address = @0xB0B;    // secondary beneficiary (for transfers)
const EVE:     address = @0xE1E;    // attacker

// ============ Constants ============

const ONE_CARIB: u64 = 1_000_000_000;
const DAY_MS:   u64 = 86_400_000;
const YEAR_MS:  u64 = 365 * 86_400_000;

// ============ Setup ============

/// Init vesting + carib_coin. ADMIN holds VestingAdmin + genesis CARIB supply.
fun setup(): Scenario {
    let mut scenario = ts::begin(ADMIN);

    ts::next_tx(&mut scenario, ADMIN);
    { vesting::init_for_testing(ts::ctx(&mut scenario)); };

    ts::next_tx(&mut scenario, ADMIN);
    { carib_coin::init_for_testing(ts::ctx(&mut scenario)); };

    ts::next_tx(&mut scenario, ADMIN);
    scenario
}

/// Transfer `amount` CARIB from ADMIN's genesis supply to `recipient`.
fun fund(scenario: &mut Scenario, recipient: address, amount: u64) {
    ts::next_tx(scenario, ADMIN);
    {
        let mut genesis: Coin<CARIB_COIN> = ts::take_from_sender(scenario);
        let chunk = coin::split(&mut genesis, amount, ts::ctx(scenario));
        transfer::public_transfer(chunk, recipient);
        ts::return_to_sender(scenario, genesis);
    };
}

/// Create a vesting schedule on behalf of `creator_addr` for `beneficiary_addr`.
/// Scenario is positioned with ADMIN as sender after this call.
fun create_schedule(
    scenario: &mut Scenario,
    creator_addr: address,
    beneficiary_addr: address,
    amount: u64,
    start_ms: u64,
    cliff_ms: u64,
    end_ms: u64,
    revocable: bool,
) {
    fund(scenario, creator_addr, amount);

    ts::next_tx(scenario, creator_addr);
    {
        let coin: Coin<CARIB_COIN> = ts::take_from_sender(scenario);
        let mut config: VestingConfig = ts::take_shared(scenario);
        vesting::create_schedule(
            &mut config, coin, beneficiary_addr,
            start_ms, cliff_ms, end_ms, revocable,
            ts::ctx(scenario),
        );
        ts::return_shared(config);
    };

    ts::next_tx(scenario, ADMIN);
}

// ============ Init ============

#[test]
fun test_init_default_state() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let config: VestingConfig = ts::take_shared(&scenario);
        assert!(!vesting::is_paused(&config), 0);
        assert!(vesting::total_schedules(&config) == 0, 1);
        assert!(vesting::total_locked(&config) == 0, 2);
        assert!(vesting::total_released_global(&config) == 0, 3);
        assert!(vesting::total_revoked_global(&config) == 0, 4);
        ts::return_shared(config);
    };

    // ADMIN has the VestingAdmin cap
    ts::next_tx(&mut scenario, ADMIN);
    {
        assert!(ts::has_most_recent_for_sender<VestingAdmin>(&scenario), 5);
    };

    ts::end(scenario);
}

// ============ Creation ============

#[test]
fun test_create_basic_schedule() {
    let mut scenario = setup();
    let amount = 1_000 * ONE_CARIB;

    create_schedule(
        &mut scenario, CREATOR, ALICE, amount,
        0, DAY_MS * 90, YEAR_MS, false,  // 90-day cliff, 1-year vest, non-revocable
    );

    ts::next_tx(&mut scenario, ADMIN);
    {
        let schedule: VestingSchedule = ts::take_shared(&scenario);
        assert!(vesting::beneficiary(&schedule) == ALICE, 0);
        assert!(vesting::creator(&schedule) == CREATOR, 1);
        assert!(vesting::total(&schedule) == amount, 2);
        assert!(vesting::released(&schedule) == 0, 3);
        assert!(vesting::remaining(&schedule) == amount, 4);
        assert!(vesting::start_ms(&schedule) == 0, 5);
        assert!(vesting::cliff_ms(&schedule) == DAY_MS * 90, 6);
        assert!(vesting::end_ms(&schedule) == YEAR_MS, 7);
        assert!(!vesting::is_revocable(&schedule), 8);
        assert!(!vesting::is_revoked(&schedule), 9);
        ts::return_shared(schedule);
    };

    ts::end(scenario);
}

#[test]
fun test_create_schedule_increments_config_stats() {
    let mut scenario = setup();

    create_schedule(&mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB, 0, 0, YEAR_MS, false);
    create_schedule(&mut scenario, CREATOR, BOB,   2_000 * ONE_CARIB, 0, 0, YEAR_MS, true);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let config: VestingConfig = ts::take_shared(&scenario);
        assert!(vesting::total_schedules(&config) == 2, 0);
        assert!(vesting::total_locked(&config) == 3_000 * ONE_CARIB, 1);
        ts::return_shared(config);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = vesting::EZeroAmount)]
fun test_create_zero_amount_aborts() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, CREATOR);
    {
        let empty = coin::zero<CARIB_COIN>(ts::ctx(&mut scenario));
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::create_schedule(
            &mut config, empty, ALICE,
            0, 0, YEAR_MS, false,
            ts::ctx(&mut scenario),
        );
        ts::return_shared(config);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = vesting::EInvalidTimeRange)]
fun test_create_start_after_cliff_aborts() {
    let mut scenario = setup();
    fund(&mut scenario, CREATOR, 100 * ONE_CARIB);

    ts::next_tx(&mut scenario, CREATOR);
    {
        let coin: Coin<CARIB_COIN> = ts::take_from_sender(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        // start=100, cliff=50 → cliff before start, aborts
        vesting::create_schedule(
            &mut config, coin, ALICE,
            100, 50, YEAR_MS, false,
            ts::ctx(&mut scenario),
        );
        ts::return_shared(config);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = vesting::EInvalidTimeRange)]
fun test_create_cliff_after_end_aborts() {
    let mut scenario = setup();
    fund(&mut scenario, CREATOR, 100 * ONE_CARIB);

    ts::next_tx(&mut scenario, CREATOR);
    {
        let coin: Coin<CARIB_COIN> = ts::take_from_sender(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        // cliff=2*YEAR, end=YEAR → cliff after end, aborts
        vesting::create_schedule(
            &mut config, coin, ALICE,
            0, 2 * YEAR_MS, YEAR_MS, false,
            ts::ctx(&mut scenario),
        );
        ts::return_shared(config);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = vesting::EInvalidTimeRange)]
fun test_create_zero_duration_aborts() {
    let mut scenario = setup();
    fund(&mut scenario, CREATOR, 100 * ONE_CARIB);

    ts::next_tx(&mut scenario, CREATOR);
    {
        let coin: Coin<CARIB_COIN> = ts::take_from_sender(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        // start == end → zero duration, aborts
        vesting::create_schedule(
            &mut config, coin, ALICE,
            1000, 1000, 1000, false,
            ts::ctx(&mut scenario),
        );
        ts::return_shared(config);
    };

    ts::end(scenario);
}

// ============ Vesting math ============

#[test]
fun test_before_cliff_nothing_vested() {
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
    clock::set_for_testing(&mut clock, 0);

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, YEAR_MS, 4 * YEAR_MS, false,  // 1yr cliff, 4yr vest
    );

    // Clock at start, before cliff
    ts::next_tx(&mut scenario, ADMIN);
    {
        let schedule: VestingSchedule = ts::take_shared(&scenario);
        assert!(vesting::vested_amount(&schedule, &clock) == 0, 0);
        assert!(vesting::claimable(&schedule, &clock) == 0, 1);
        assert!(!vesting::cliff_reached(&schedule, &clock), 2);
        ts::return_shared(schedule);
    };

    // Advance to just before cliff
    clock::set_for_testing(&mut clock, YEAR_MS - 1);
    ts::next_tx(&mut scenario, ADMIN);
    {
        let schedule: VestingSchedule = ts::take_shared(&scenario);
        assert!(vesting::vested_amount(&schedule, &clock) == 0, 3);
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_linear_vesting_at_cliff() {
    // Schedule: 1000 tokens, start=0, cliff=1yr, end=4yr.
    // At cliff (t=1yr), vested = 1000 * 1/4 = 250.
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, YEAR_MS, 4 * YEAR_MS, false,
    );

    clock::set_for_testing(&mut clock, YEAR_MS);
    ts::next_tx(&mut scenario, ADMIN);
    {
        let schedule: VestingSchedule = ts::take_shared(&scenario);
        assert!(vesting::vested_amount(&schedule, &clock) == 250 * ONE_CARIB, 0);
        assert!(vesting::cliff_reached(&schedule, &clock), 1);
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_linear_vesting_midpoint() {
    // 1000 tokens, start=0, cliff=0 (no cliff), end=2yr.
    // At t=1yr (midpoint), vested = 500.
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, 0, 2 * YEAR_MS, false,
    );

    clock::set_for_testing(&mut clock, YEAR_MS);
    ts::next_tx(&mut scenario, ADMIN);
    {
        let schedule: VestingSchedule = ts::take_shared(&scenario);
        assert!(vesting::vested_amount(&schedule, &clock) == 500 * ONE_CARIB, 0);
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_fully_vested_after_end() {
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, 0, YEAR_MS, false,
    );

    // Far past end
    clock::set_for_testing(&mut clock, 10 * YEAR_MS);
    ts::next_tx(&mut scenario, ADMIN);
    {
        let schedule: VestingSchedule = ts::take_shared(&scenario);
        assert!(vesting::vested_amount(&schedule, &clock) == 1_000 * ONE_CARIB, 0);
        assert!(vesting::is_fully_vested(&schedule, &clock), 1);
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Claim ============

#[test]
fun test_claim_transfers_vested_to_beneficiary() {
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, 0, YEAR_MS, false,
    );

    // Half vested
    clock::set_for_testing(&mut clock, YEAR_MS / 2);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::claim(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));

        assert!(vesting::released(&schedule) == 500 * ONE_CARIB, 0);
        assert!(vesting::remaining(&schedule) == 500 * ONE_CARIB, 1);
        assert!(vesting::total_released_global(&config) == 500 * ONE_CARIB, 2);

        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    // Alice received the coin
    ts::next_tx(&mut scenario, ALICE);
    {
        let payout: Coin<CARIB_COIN> = ts::take_from_sender(&scenario);
        assert!(coin::value(&payout) == 500 * ONE_CARIB, 3);
        ts::return_to_sender(&scenario, payout);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = vesting::ENotBeneficiary)]
fun test_claim_not_beneficiary_aborts() {
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, 0, YEAR_MS, false,
    );

    clock::set_for_testing(&mut clock, YEAR_MS / 2);

    // Eve tries to claim Alice's schedule
    ts::next_tx(&mut scenario, EVE);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::claim(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = vesting::ENothingToClaim)]
fun test_claim_before_cliff_aborts() {
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
    clock::set_for_testing(&mut clock, 0);

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, YEAR_MS, 4 * YEAR_MS, false,
    );

    // Before cliff — claimable = 0 → abort
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::claim(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = vesting::ENothingToClaim)]
fun test_double_claim_at_same_time_aborts() {
    // Claim once, then claim again immediately — second abort (nothing new vested).
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, 0, YEAR_MS, false,
    );

    clock::set_for_testing(&mut clock, YEAR_MS / 2);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::claim(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    // Same clock — nothing new to claim
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::claim(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_multiple_claims_over_time_accumulate() {
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, 0, YEAR_MS, false,
    );

    // Quarter vested — claim
    clock::set_for_testing(&mut clock, YEAR_MS / 4);
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::claim(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));
        assert!(vesting::released(&schedule) == 250 * ONE_CARIB, 0);
        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    // Half vested — claim again (gets additional 250)
    clock::set_for_testing(&mut clock, YEAR_MS / 2);
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::claim(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));
        assert!(vesting::released(&schedule) == 500 * ONE_CARIB, 1);
        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    // Fully vested — claim remainder
    clock::set_for_testing(&mut clock, YEAR_MS);
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::claim(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));
        assert!(vesting::released(&schedule) == 1_000 * ONE_CARIB, 2);
        assert!(vesting::remaining(&schedule) == 0, 3);
        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Revoke ============

#[test]
fun test_revoke_returns_unvested_to_creator() {
    // Schedule: 1000 tokens, 1-year vest. Revoke at t=YEAR/4 → 250 vested, 750 returned.
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, 0, YEAR_MS, true,  // REVOCABLE
    );

    clock::set_for_testing(&mut clock, YEAR_MS / 4);

    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::revoke(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));

        assert!(vesting::is_revoked(&schedule), 0);
        // 250 vested stays in schedule for Alice, 750 returned
        assert!(vesting::remaining(&schedule) == 250 * ONE_CARIB, 1);
        assert!(vesting::total_revoked_global(&config) == 750 * ONE_CARIB, 2);

        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    // Creator got 750 back
    ts::next_tx(&mut scenario, CREATOR);
    {
        let returned: Coin<CARIB_COIN> = ts::take_from_sender(&scenario);
        assert!(coin::value(&returned) == 750 * ONE_CARIB, 3);
        ts::return_to_sender(&scenario, returned);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = vesting::ENotRevocable)]
fun test_revoke_non_revocable_aborts() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, 0, YEAR_MS, false,  // NON-revocable
    );

    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::revoke(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = vesting::ENotCreator)]
fun test_revoke_not_creator_aborts() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, 0, YEAR_MS, true,
    );

    // Eve (not creator) tries to revoke
    ts::next_tx(&mut scenario, EVE);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::revoke(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = vesting::EAlreadyRevoked)]
fun test_double_revoke_aborts() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, 0, YEAR_MS, true,
    );

    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::revoke(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    // Try to revoke again
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::revoke(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_beneficiary_claims_remainder_after_revoke() {
    // Alice claims 100 at t=YEAR/4 (vested 250). Creator revokes → 750 returned,
    // 150 stays in schedule for Alice to claim. Clock advancing further doesn't
    // vest more (frozen at revoked_at_ms).
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, 0, YEAR_MS, true,
    );

    // Alice claims at quarter point (250 vested)
    clock::set_for_testing(&mut clock, YEAR_MS / 4);
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::claim(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    // Creator revokes at same time
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::revoke(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));

        // Remaining balance = 1000 - 250 (claimed) - 750 (returned) = 0... wait.
        // vested=250, unvested=750 → returned. Balance before revoke = 1000 - 250 = 750.
        // Balance after revoke = 750 - 750 = 0. But there's nothing left for Alice!
        //
        // That's because Alice already claimed the full 250 vested. Correct behavior.
        assert!(vesting::remaining(&schedule) == 0, 0);
        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    // Advance clock far past end — Alice should NOT be able to claim more
    // because schedule is revoked and vested is frozen at 250 (already claimed).
    clock::set_for_testing(&mut clock, 10 * YEAR_MS);
    ts::next_tx(&mut scenario, ADMIN);
    {
        let schedule: VestingSchedule = ts::take_shared(&scenario);
        assert!(vesting::claimable(&schedule, &clock) == 0, 1);
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_beneficiary_can_claim_partial_after_revoke_without_prior_claim() {
    // Alice has not claimed yet. Creator revokes at YEAR/4 → 250 vested stays in schedule.
    // Alice can now claim that 250 but no more (even after clock advances).
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, 0, YEAR_MS, true,
    );

    clock::set_for_testing(&mut clock, YEAR_MS / 4);
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::revoke(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));
        assert!(vesting::remaining(&schedule) == 250 * ONE_CARIB, 0);
        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    // Advance clock — should NOT unlock more
    clock::set_for_testing(&mut clock, YEAR_MS);

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        assert!(vesting::claimable(&schedule, &clock) == 250 * ONE_CARIB, 1);
        vesting::claim(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));
        assert!(vesting::released(&schedule) == 250 * ONE_CARIB, 2);
        assert!(vesting::remaining(&schedule) == 0, 3);
        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Transfer Schedule ============

#[test]
fun test_transfer_schedule_changes_beneficiary() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, 0, YEAR_MS, false,
    );

    ts::next_tx(&mut scenario, ALICE);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        vesting::transfer_schedule(&mut schedule, BOB, ts::ctx(&mut scenario));
        assert!(vesting::beneficiary(&schedule) == BOB, 0);
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = vesting::ENotBeneficiary)]
fun test_transfer_schedule_not_beneficiary_aborts() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, 0, YEAR_MS, false,
    );

    // Eve tries to transfer
    ts::next_tx(&mut scenario, EVE);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        vesting::transfer_schedule(&mut schedule, EVE, ts::ctx(&mut scenario));
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_new_beneficiary_can_claim_after_transfer() {
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, 0, YEAR_MS, false,
    );

    // Alice transfers to Bob
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        vesting::transfer_schedule(&mut schedule, BOB, ts::ctx(&mut scenario));
        ts::return_shared(schedule);
    };

    // Bob claims at half vest
    clock::set_for_testing(&mut clock, YEAR_MS / 2);
    ts::next_tx(&mut scenario, BOB);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::claim(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    ts::next_tx(&mut scenario, BOB);
    {
        let payout: Coin<CARIB_COIN> = ts::take_from_sender(&scenario);
        assert!(coin::value(&payout) == 500 * ONE_CARIB, 0);
        ts::return_to_sender(&scenario, payout);
    };

    // Alice should NOT receive anything
    ts::next_tx(&mut scenario, ALICE);
    {
        assert!(!ts::has_most_recent_for_sender<Coin<CARIB_COIN>>(&scenario), 1);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Admin / Pause ============

#[test]
fun test_admin_pause_toggles() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: VestingAdmin = ts::take_from_sender(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);

        assert!(!vesting::is_paused(&config), 0);
        vesting::set_paused(&admin, &mut config, true);
        assert!(vesting::is_paused(&config), 1);
        vesting::set_paused(&admin, &mut config, false);
        assert!(!vesting::is_paused(&config), 2);

        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = vesting::EPaused)]
fun test_create_while_paused_aborts() {
    let mut scenario = setup();

    // Pause
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: VestingAdmin = ts::take_from_sender(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::set_paused(&admin, &mut config, true);
        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin);
    };

    // Try to create — should abort
    fund(&mut scenario, CREATOR, 100 * ONE_CARIB);
    ts::next_tx(&mut scenario, CREATOR);
    {
        let coin: Coin<CARIB_COIN> = ts::take_from_sender(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::create_schedule(
            &mut config, coin, ALICE,
            0, 0, YEAR_MS, false,
            ts::ctx(&mut scenario),
        );
        ts::return_shared(config);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = vesting::EPaused)]
fun test_claim_while_paused_aborts() {
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, 0, YEAR_MS, false,
    );

    // Pause after creation
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: VestingAdmin = ts::take_from_sender(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::set_paused(&admin, &mut config, true);
        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin);
    };

    // Alice tries to claim
    clock::set_for_testing(&mut clock, YEAR_MS / 2);
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::claim(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));
        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_revoke_works_even_while_paused() {
    // Design intent: pause blocks create/claim but NOT revoke. If the module
    // itself is compromised, creators must still be able to unwind.
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, 0, YEAR_MS, true,
    );

    // Pause
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: VestingAdmin = ts::take_from_sender(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::set_paused(&admin, &mut config, true);
        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin);
    };

    // Creator revokes — should succeed despite pause
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::revoke(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));
        assert!(vesting::is_revoked(&schedule), 0);
        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_admin_transfer_cap() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: VestingAdmin = ts::take_from_sender(&scenario);
        vesting::transfer_admin(admin, BOB);
    };

    ts::next_tx(&mut scenario, BOB);
    {
        assert!(ts::has_most_recent_for_sender<VestingAdmin>(&scenario), 0);
        let admin: VestingAdmin = ts::take_from_sender(&scenario);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

// ============ Edge Cases ============

#[test]
fun test_cliff_equals_end_unlocks_all_at_cliff() {
    // "Cliff-only" schedule: cliff == end → everything unlocks at cliff, nothing before.
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, YEAR_MS, YEAR_MS, false,
    );

    // Before cliff: 0
    clock::set_for_testing(&mut clock, YEAR_MS - 1);
    ts::next_tx(&mut scenario, ADMIN);
    {
        let schedule: VestingSchedule = ts::take_shared(&scenario);
        assert!(vesting::vested_amount(&schedule, &clock) == 0, 0);
        ts::return_shared(schedule);
    };

    // At cliff: full (since cliff == end, we hit the "after end" branch)
    clock::set_for_testing(&mut clock, YEAR_MS);
    ts::next_tx(&mut scenario, ADMIN);
    {
        let schedule: VestingSchedule = ts::take_shared(&scenario);
        assert!(vesting::vested_amount(&schedule, &clock) == 1_000 * ONE_CARIB, 1);
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_no_cliff_linear_from_start() {
    // cliff == start → no cliff, pure linear vesting from day zero.
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, 0, YEAR_MS, false,
    );

    // At t=1 (one ms), a tiny fraction vested (not zero)
    clock::set_for_testing(&mut clock, 1);
    ts::next_tx(&mut scenario, ADMIN);
    {
        let schedule: VestingSchedule = ts::take_shared(&scenario);
        // vested = 1000e9 * 1 / YEAR_MS = 1000e9 / 31,536,000,000 ≈ 31 raw units
        let v = vesting::vested_amount(&schedule, &clock);
        assert!(v > 0, 0);
        assert!(v < ONE_CARIB, 1); // way less than 1 CARIB
        assert!(vesting::cliff_reached(&schedule, &clock), 2);
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_backdated_start() {
    // Start in the past — useful for SAFT signed months ago, vesting retroactive.
    // Clock starts at t=YEAR, schedule has start=0, end=2*YEAR.
    // At t=YEAR, vested = 500 (halfway through).
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
    clock::set_for_testing(&mut clock, YEAR_MS);

    create_schedule(
        &mut scenario, CREATOR, ALICE, 1_000 * ONE_CARIB,
        0, 0, 2 * YEAR_MS, false,
    );

    ts::next_tx(&mut scenario, ADMIN);
    {
        let schedule: VestingSchedule = ts::take_shared(&scenario);
        assert!(vesting::vested_amount(&schedule, &clock) == 500 * ONE_CARIB, 0);
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Overflow Regression ============

#[test]
fun test_overflow_regression_large_amount_long_duration() {
    // Worst-case sanity: 1B CARIB (1e18 raw) locked, 4-year vest.
    // Without u128: total * elapsed = 1e18 * 1.26e11 (4yr in ms) = 1.26e29 → overflow.
    // With u128: math holds.
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));

    let huge_amount: u64 = 1_000_000_000 * ONE_CARIB;   // 1B CARIB raw
    let duration_ms: u64 = 4 * YEAR_MS;                  // 4-year vest

    create_schedule(
        &mut scenario, CREATOR, ALICE, huge_amount,
        0, 0, duration_ms, false,
    );

    // At midpoint: exactly half vested
    clock::set_for_testing(&mut clock, duration_ms / 2);
    ts::next_tx(&mut scenario, ADMIN);
    {
        let schedule: VestingSchedule = ts::take_shared(&scenario);
        let vested = vesting::vested_amount(&schedule, &clock);
        assert!(vested == huge_amount / 2, 0);
        ts::return_shared(schedule);
    };

    // Alice can claim
    ts::next_tx(&mut scenario, ALICE);
    {
        let mut schedule: VestingSchedule = ts::take_shared(&scenario);
        let mut config: VestingConfig = ts::take_shared(&scenario);
        vesting::claim(&mut config, &mut schedule, &clock, ts::ctx(&mut scenario));
        assert!(vesting::released(&schedule) == huge_amount / 2, 1);
        ts::return_shared(config);
        ts::return_shared(schedule);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}
