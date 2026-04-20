#[test_only]
module anansi::platform_tests;

use anansi::platform::{Self, Platform, SuperAdmin};
use sui::test_scenario::{Self as ts, Scenario};
use std::string;

// ============ Test Addresses ============

const ADMIN: address = @0xA11CE;
const BOB:   address = @0xB0B;

// ============ Setup ============

fun setup(): Scenario {
    let mut scenario = ts::begin(ADMIN);

    ts::next_tx(&mut scenario, ADMIN);
    {
        platform::init_for_testing(ts::ctx(&mut scenario));
    };

    ts::next_tx(&mut scenario, ADMIN);
    scenario
}

// ============ Init ============

#[test]
fun test_init_default_state() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let platform: Platform = ts::take_shared(&scenario);
        assert!(!platform::is_paused(&platform), 0);
        assert!(platform::version(&platform) == string::utf8(b"0.1.0"), 1);
        // assert_not_paused should not abort
        platform::assert_not_paused(&platform);
        ts::return_shared(platform);
    };

    // SuperAdmin cap goes to publisher
    ts::next_tx(&mut scenario, ADMIN);
    {
        assert!(ts::has_most_recent_for_sender<SuperAdmin>(&scenario), 2);
        let admin: SuperAdmin = ts::take_from_sender(&scenario);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

// ============ Pause ============

#[test]
fun test_pause_sets_paused_state() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: SuperAdmin = ts::take_from_sender(&scenario);
        let mut platform: Platform = ts::take_shared(&scenario);

        platform::pause(&admin, &mut platform, b"security incident", ts::ctx(&mut scenario));

        assert!(platform::is_paused(&platform), 0);

        ts::return_shared(platform);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = platform::EPlatformPaused)]
fun test_assert_not_paused_aborts_when_paused() {
    let mut scenario = setup();

    // Pause
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: SuperAdmin = ts::take_from_sender(&scenario);
        let mut platform: Platform = ts::take_shared(&scenario);
        platform::pause(&admin, &mut platform, b"test pause", ts::ctx(&mut scenario));
        ts::return_shared(platform);
        ts::return_to_sender(&scenario, admin);
    };

    // Now assert_not_paused should abort
    ts::next_tx(&mut scenario, ADMIN);
    {
        let platform: Platform = ts::take_shared(&scenario);
        platform::assert_not_paused(&platform);
        ts::return_shared(platform);
    };

    ts::end(scenario);
}

// ============ Unpause ============

#[test]
fun test_unpause_restores_state() {
    let mut scenario = setup();

    // Pause then unpause
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: SuperAdmin = ts::take_from_sender(&scenario);
        let mut platform: Platform = ts::take_shared(&scenario);

        platform::pause(&admin, &mut platform, b"incident", ts::ctx(&mut scenario));
        assert!(platform::is_paused(&platform), 0);

        platform::unpause(&admin, &mut platform, ts::ctx(&mut scenario));
        assert!(!platform::is_paused(&platform), 1);

        // assert_not_paused should pass again
        platform::assert_not_paused(&platform);

        ts::return_shared(platform);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
fun test_pause_unpause_pause_cycle() {
    // Multiple pause/unpause cycles are clean.
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: SuperAdmin = ts::take_from_sender(&scenario);
        let mut platform: Platform = ts::take_shared(&scenario);

        platform::pause(&admin, &mut platform, b"first", ts::ctx(&mut scenario));
        assert!(platform::is_paused(&platform), 0);

        platform::unpause(&admin, &mut platform, ts::ctx(&mut scenario));
        assert!(!platform::is_paused(&platform), 1);

        platform::pause(&admin, &mut platform, b"second", ts::ctx(&mut scenario));
        assert!(platform::is_paused(&platform), 2);

        platform::unpause(&admin, &mut platform, ts::ctx(&mut scenario));
        assert!(!platform::is_paused(&platform), 3);

        ts::return_shared(platform);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
fun test_pause_twice_stays_paused() {
    // Pausing an already-paused platform is idempotent — no error.
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: SuperAdmin = ts::take_from_sender(&scenario);
        let mut platform: Platform = ts::take_shared(&scenario);

        platform::pause(&admin, &mut platform, b"first", ts::ctx(&mut scenario));
        platform::pause(&admin, &mut platform, b"second reason", ts::ctx(&mut scenario));

        assert!(platform::is_paused(&platform), 0);

        ts::return_shared(platform);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
fun test_unpause_when_not_paused_is_no_op() {
    // Unpause on an already-running platform is idempotent — no error.
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: SuperAdmin = ts::take_from_sender(&scenario);
        let mut platform: Platform = ts::take_shared(&scenario);

        assert!(!platform::is_paused(&platform), 0);
        platform::unpause(&admin, &mut platform, ts::ctx(&mut scenario));
        assert!(!platform::is_paused(&platform), 1);

        ts::return_shared(platform);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

// ============ Super Admin Transfer ============

#[test]
fun test_transfer_super_admin_moves_cap() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: SuperAdmin = ts::take_from_sender(&scenario);
        platform::transfer_super_admin(admin, BOB);
    };

    // ADMIN no longer has it
    ts::next_tx(&mut scenario, ADMIN);
    {
        assert!(!ts::has_most_recent_for_sender<SuperAdmin>(&scenario), 0);
    };

    // BOB does
    ts::next_tx(&mut scenario, BOB);
    {
        assert!(ts::has_most_recent_for_sender<SuperAdmin>(&scenario), 1);
        let admin: SuperAdmin = ts::take_from_sender(&scenario);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
fun test_new_admin_can_pause_after_transfer() {
    // Functional check: after transfer, the new holder can actually exercise the cap.
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: SuperAdmin = ts::take_from_sender(&scenario);
        platform::transfer_super_admin(admin, BOB);
    };

    // BOB pauses the platform
    ts::next_tx(&mut scenario, BOB);
    {
        let admin: SuperAdmin = ts::take_from_sender(&scenario);
        let mut platform: Platform = ts::take_shared(&scenario);

        platform::pause(&admin, &mut platform, b"bob pausing", ts::ctx(&mut scenario));
        assert!(platform::is_paused(&platform), 0);

        ts::return_shared(platform);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}
