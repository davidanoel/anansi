#[test_only]
module anansi::carib_coin_tests;

use anansi::carib_coin::{Self, CARIB_COIN, Treasury, AdminCap};
use sui::test_scenario::{Self as ts, Scenario};
use sui::coin::{Self, Coin};

// ============ Test Addresses ============

const ADMIN: address = @0xA11CE;
const BOB:   address = @0xB0B;
const EVE:   address = @0xE1E;

// ============ Constants ============

// Fixed supply: 10B at 9 decimals
const TOTAL_SUPPLY_RAW: u64 = 10_000_000_000_000_000_000;
const ONE_CARIB:        u64 = 1_000_000_000;

// ============ Setup ============

fun setup(): Scenario {
    let mut scenario = ts::begin(ADMIN);

    ts::next_tx(&mut scenario, ADMIN);
    {
        carib_coin::init_for_testing(ts::ctx(&mut scenario));
    };

    ts::next_tx(&mut scenario, ADMIN);
    scenario
}

/// Take a Coin<CARIB_COIN> chunk of `amount` from ADMIN's genesis supply.
/// ADMIN must be the current sender.
fun split_from_genesis(scenario: &mut Scenario, amount: u64): Coin<CARIB_COIN> {
    let mut genesis: Coin<CARIB_COIN> = ts::take_from_sender(scenario);
    let chunk = coin::split(&mut genesis, amount, ts::ctx(scenario));
    ts::return_to_sender(scenario, genesis);
    chunk
}

// ============ Init / Genesis ============

#[test]
fun test_init_creates_genesis_supply() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let genesis: Coin<CARIB_COIN> = ts::take_from_sender(&scenario);
        assert!(coin::value(&genesis) == TOTAL_SUPPLY_RAW, 0);
        ts::return_to_sender(&scenario, genesis);
    };

    ts::end(scenario);
}

#[test]
fun test_init_creates_treasury_with_zero_burned() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let treasury: Treasury = ts::take_from_sender(&scenario);
        assert!(carib_coin::total_burned(&treasury) == 0, 0);
        assert!(carib_coin::circulating_supply(&treasury) == TOTAL_SUPPLY_RAW, 1);
        ts::return_to_sender(&scenario, treasury);
    };

    ts::end(scenario);
}

#[test]
fun test_init_creates_admin_cap_for_publisher() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        assert!(ts::has_most_recent_for_sender<AdminCap>(&scenario), 0);
        let cap: AdminCap = ts::take_from_sender(&scenario);
        ts::return_to_sender(&scenario, cap);
    };

    ts::end(scenario);
}

#[test]
fun test_total_supply_constant() {
    assert!(carib_coin::total_supply() == TOTAL_SUPPLY_RAW, 0);
}

// ============ Burn ============

#[test]
fun test_burn_reduces_circulating_and_increments_burned() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let chunk = split_from_genesis(&mut scenario, 100 * ONE_CARIB);
        let mut treasury: Treasury = ts::take_from_sender(&scenario);

        carib_coin::burn(&mut treasury, chunk, ts::ctx(&mut scenario));

        assert!(carib_coin::total_burned(&treasury) == 100 * ONE_CARIB, 0);
        assert!(
            carib_coin::circulating_supply(&treasury) == TOTAL_SUPPLY_RAW - 100 * ONE_CARIB,
            1,
        );

        ts::return_to_sender(&scenario, treasury);
    };

    ts::end(scenario);
}

#[test]
fun test_burn_multiple_times_accumulates() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let chunk1 = split_from_genesis(&mut scenario, 100 * ONE_CARIB);
        let chunk2 = split_from_genesis(&mut scenario, 250 * ONE_CARIB);
        let chunk3 = split_from_genesis(&mut scenario, 50 * ONE_CARIB);
        let mut treasury: Treasury = ts::take_from_sender(&scenario);

        carib_coin::burn(&mut treasury, chunk1, ts::ctx(&mut scenario));
        carib_coin::burn(&mut treasury, chunk2, ts::ctx(&mut scenario));
        carib_coin::burn(&mut treasury, chunk3, ts::ctx(&mut scenario));

        assert!(carib_coin::total_burned(&treasury) == 400 * ONE_CARIB, 0);

        ts::return_to_sender(&scenario, treasury);
    };

    ts::end(scenario);
}

#[test]
fun test_burn_by_non_admin_caller_succeeds() {
    // Burn is permissionless — anyone can burn their own tokens.
    // Send BOB some tokens, then have BOB burn them with the shared Treasury.
    //
    // Treasury is owned by ADMIN, not shared, so for this test we transfer it
    // temporarily. In production, Treasury goes to Foundation multi-sig but
    // remains reachable by anyone who holds CARIB + can reference it by ID.
    //
    // Simpler test: ADMIN sends coins to BOB, then ADMIN (holding Treasury) burns
    // on BOB's behalf via a fresh tx where we take the coin from BOB's address.
    // That's awkward. Cleanest: transfer Treasury to BOB for the test, have BOB burn.
    let mut scenario = setup();

    // ADMIN sends some coins to BOB
    ts::next_tx(&mut scenario, ADMIN);
    {
        let chunk = split_from_genesis(&mut scenario, 100 * ONE_CARIB);
        transfer::public_transfer(chunk, BOB);
    };

    // ADMIN transfers the treasury to BOB
    ts::next_tx(&mut scenario, ADMIN);
    {
        let treasury: Treasury = ts::take_from_sender(&scenario);
        carib_coin::transfer_treasury(treasury, BOB);
    };

    // BOB burns his tokens
    ts::next_tx(&mut scenario, BOB);
    {
        let mut treasury: Treasury = ts::take_from_sender(&scenario);
        let carib: Coin<CARIB_COIN> = ts::take_from_sender(&scenario);

        carib_coin::burn(&mut treasury, carib, ts::ctx(&mut scenario));

        assert!(carib_coin::total_burned(&treasury) == 100 * ONE_CARIB, 0);
        ts::return_to_sender(&scenario, treasury);
    };

    ts::end(scenario);
}

#[test]
fun test_burn_entire_supply() {
    // Absolute worst-case — burn every single genesis token.
    // Verifies the math doesn't underflow when circulating_supply hits 0.
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let entire_supply: Coin<CARIB_COIN> = ts::take_from_sender(&scenario);
        let mut treasury: Treasury = ts::take_from_sender(&scenario);

        carib_coin::burn(&mut treasury, entire_supply, ts::ctx(&mut scenario));

        assert!(carib_coin::total_burned(&treasury) == TOTAL_SUPPLY_RAW, 0);
        assert!(carib_coin::circulating_supply(&treasury) == 0, 1);

        ts::return_to_sender(&scenario, treasury);
    };

    ts::end(scenario);
}

// ============ Treasury Transfer ============

#[test]
fun test_transfer_treasury_moves_ownership() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let treasury: Treasury = ts::take_from_sender(&scenario);
        carib_coin::transfer_treasury(treasury, BOB);
    };

    // ADMIN no longer has it
    ts::next_tx(&mut scenario, ADMIN);
    {
        assert!(!ts::has_most_recent_for_sender<Treasury>(&scenario), 0);
    };

    // BOB does
    ts::next_tx(&mut scenario, BOB);
    {
        assert!(ts::has_most_recent_for_sender<Treasury>(&scenario), 1);
        let treasury: Treasury = ts::take_from_sender(&scenario);
        ts::return_to_sender(&scenario, treasury);
    };

    ts::end(scenario);
}

#[test]
fun test_treasury_state_preserved_across_transfer() {
    let mut scenario = setup();

    // Burn some first to make sure state is nonzero
    ts::next_tx(&mut scenario, ADMIN);
    {
        let chunk = split_from_genesis(&mut scenario, 500 * ONE_CARIB);
        let mut treasury: Treasury = ts::take_from_sender(&scenario);
        carib_coin::burn(&mut treasury, chunk, ts::ctx(&mut scenario));
        ts::return_to_sender(&scenario, treasury);
    };

    // Transfer to BOB
    ts::next_tx(&mut scenario, ADMIN);
    {
        let treasury: Treasury = ts::take_from_sender(&scenario);
        carib_coin::transfer_treasury(treasury, BOB);
    };

    // State (total_burned) preserved
    ts::next_tx(&mut scenario, BOB);
    {
        let treasury: Treasury = ts::take_from_sender(&scenario);
        assert!(carib_coin::total_burned(&treasury) == 500 * ONE_CARIB, 0);
        assert!(
            carib_coin::circulating_supply(&treasury) == TOTAL_SUPPLY_RAW - 500 * ONE_CARIB,
            1,
        );
        ts::return_to_sender(&scenario, treasury);
    };

    ts::end(scenario);
}

// ============ Admin Cap Transfer ============

#[test]
fun test_transfer_admin_moves_cap() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let cap: AdminCap = ts::take_from_sender(&scenario);
        carib_coin::transfer_admin(cap, BOB);
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        assert!(!ts::has_most_recent_for_sender<AdminCap>(&scenario), 0);
    };

    ts::next_tx(&mut scenario, BOB);
    {
        assert!(ts::has_most_recent_for_sender<AdminCap>(&scenario), 1);
        let cap: AdminCap = ts::take_from_sender(&scenario);
        ts::return_to_sender(&scenario, cap);
    };

    ts::end(scenario);
}

// ============ Composition: Treasury + Admin separable ============

#[test]
fun test_treasury_and_admin_cap_separable() {
    // Treasury can live on one address, AdminCap on another.
    // Charter-aligned: Foundation holds Treasury (operational), another entity holds
    // AdminCap (governance-gated configuration). Though in current carib_coin the
    // AdminCap is effectively unused — the test just verifies they're truly independent.
    let mut scenario = setup();

    // Treasury → BOB, AdminCap → EVE
    ts::next_tx(&mut scenario, ADMIN);
    {
        let treasury: Treasury = ts::take_from_sender(&scenario);
        carib_coin::transfer_treasury(treasury, BOB);
    };
    ts::next_tx(&mut scenario, ADMIN);
    {
        let cap: AdminCap = ts::take_from_sender(&scenario);
        carib_coin::transfer_admin(cap, EVE);
    };

    // BOB holds Treasury
    ts::next_tx(&mut scenario, BOB);
    {
        assert!(ts::has_most_recent_for_sender<Treasury>(&scenario), 0);
        assert!(!ts::has_most_recent_for_sender<AdminCap>(&scenario), 1);
    };

    // EVE holds AdminCap
    ts::next_tx(&mut scenario, EVE);
    {
        assert!(ts::has_most_recent_for_sender<AdminCap>(&scenario), 2);
        assert!(!ts::has_most_recent_for_sender<Treasury>(&scenario), 3);
    };

    ts::end(scenario);
}

// ============ Supply Invariants ============

#[test]
fun test_total_burned_plus_circulating_equals_supply() {
    // Fundamental invariant: for any state, total_burned + circulating_supply == TOTAL_SUPPLY.
    let mut scenario = setup();

    // Burn 1/3 of supply
    ts::next_tx(&mut scenario, ADMIN);
    {
        let chunk = split_from_genesis(&mut scenario, TOTAL_SUPPLY_RAW / 3);
        let mut treasury: Treasury = ts::take_from_sender(&scenario);

        carib_coin::burn(&mut treasury, chunk, ts::ctx(&mut scenario));

        let burned = carib_coin::total_burned(&treasury);
        let circulating = carib_coin::circulating_supply(&treasury);
        assert!(burned + circulating == TOTAL_SUPPLY_RAW, 0);

        ts::return_to_sender(&scenario, treasury);
    };

    // Burn another chunk — invariant still holds
    ts::next_tx(&mut scenario, ADMIN);
    {
        let chunk = split_from_genesis(&mut scenario, 100 * ONE_CARIB);
        let mut treasury: Treasury = ts::take_from_sender(&scenario);

        carib_coin::burn(&mut treasury, chunk, ts::ctx(&mut scenario));

        let burned = carib_coin::total_burned(&treasury);
        let circulating = carib_coin::circulating_supply(&treasury);
        assert!(burned + circulating == TOTAL_SUPPLY_RAW, 1);

        ts::return_to_sender(&scenario, treasury);
    };

    ts::end(scenario);
}

#[test]
fun test_no_mint_capability_exposed() {
    // The module does not expose a public `mint` function.
    // TreasuryCap<CARIB_COIN> is wrapped inside the Treasury struct and never
    // exposed by a public getter, so no external module can call coin::mint on it.
    //
    // This test is a structural assertion that burning is the only supply-altering
    // operation. If anyone adds a public mint, this test's docstring becomes a lie —
    // update it then to reflect the new intent.
    //
    // No runtime check: just documents the architectural invariant.
    let scenario = setup();
    ts::end(scenario);
}
