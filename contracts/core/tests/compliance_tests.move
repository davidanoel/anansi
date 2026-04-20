#[test_only]
module anansi::compliance_tests;

use anansi::compliance::{Self, ComplianceRegistry, ComplianceAdmin};
use sui::test_scenario::{Self as ts, Scenario};

// ============ Test Addresses ============

const ADMIN: address = @0xA11CE;
const ALICE: address = @0xA11;
const BOB:   address = @0xB0B;
const EVE:   address = @0xE1E;

// Role constants (mirror the module's internal constants since they're not public)
const ROLE_BUYER: u8     = 0;
const ROLE_FARMER: u8    = 1;
const ROLE_CUSTODIAN: u8 = 2;
const ROLE_ADMIN: u8     = 3;

// ============ Setup ============

fun setup(): Scenario {
    let mut scenario = ts::begin(ADMIN);

    ts::next_tx(&mut scenario, ADMIN);
    {
        compliance::init_for_testing(ts::ctx(&mut scenario));
    };

    ts::next_tx(&mut scenario, ADMIN);
    scenario
}

/// Helper: verify a user as ADMIN.
fun verify(scenario: &mut Scenario, user: address, role: u8) {
    ts::next_tx(scenario, ADMIN);
    {
        let admin: ComplianceAdmin = ts::take_from_sender(scenario);
        let mut registry: ComplianceRegistry = ts::take_shared(scenario);
        compliance::verify_user(
            &admin, &mut registry, user,
            b"GD", b"test-provider-ref", role, 1000,
        );
        ts::return_shared(registry);
        ts::return_to_sender(scenario, admin);
    };
}

/// Helper: enable enforcement.
fun enable_enforcement(scenario: &mut Scenario) {
    ts::next_tx(scenario, ADMIN);
    {
        let admin: ComplianceAdmin = ts::take_from_sender(scenario);
        let mut registry: ComplianceRegistry = ts::take_shared(scenario);
        compliance::set_enforcement(&admin, &mut registry, true);
        ts::return_shared(registry);
        ts::return_to_sender(scenario, admin);
    };
}

// ============ Init ============

#[test]
fun test_init_default_state() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        // Enforcement disabled by default (testnet mode)
        assert!(!compliance::enforcement_enabled(&registry), 0);
        assert!(compliance::user_count(&registry) == 0, 1);
        ts::return_shared(registry);
    };

    ts::end(scenario);
}

// ============ Verify ============

#[test]
fun test_verify_new_user_increments_count() {
    let mut scenario = setup();

    verify(&mut scenario, ALICE, ROLE_FARMER);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        assert!(compliance::is_verified(&registry, ALICE), 0);
        assert!(!compliance::is_frozen(&registry, ALICE), 1);
        assert!(compliance::user_count(&registry) == 1, 2);
        ts::return_shared(registry);
    };

    ts::end(scenario);
}

#[test]
fun test_verify_same_user_twice_does_not_double_count() {
    // Re-verifying an existing user updates the profile without incrementing user_count.
    let mut scenario = setup();

    verify(&mut scenario, ALICE, ROLE_FARMER);
    verify(&mut scenario, ALICE, ROLE_CUSTODIAN); // role change

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        assert!(compliance::user_count(&registry) == 1, 0);
        assert!(compliance::is_verified(&registry, ALICE), 1);
        ts::return_shared(registry);
    };

    ts::end(scenario);
}

#[test]
fun test_verify_resets_frozen_state() {
    // Re-verifying a frozen user clears the frozen flag.
    // The struct is fully replaced via *existing = profile with frozen: false.
    let mut scenario = setup();

    verify(&mut scenario, ALICE, ROLE_FARMER);

    // Freeze Alice
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: ComplianceAdmin = ts::take_from_sender(&scenario);
        let mut registry: ComplianceRegistry = ts::take_shared(&scenario);
        compliance::freeze_user(&admin, &mut registry, ALICE, b"test");
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, admin);
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        assert!(compliance::is_frozen(&registry, ALICE), 0);
        ts::return_shared(registry);
    };

    // Re-verify Alice — frozen state should reset
    verify(&mut scenario, ALICE, ROLE_FARMER);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        assert!(!compliance::is_frozen(&registry, ALICE), 1);
        assert!(compliance::is_verified(&registry, ALICE), 2);
        ts::return_shared(registry);
    };

    ts::end(scenario);
}

#[test]
fun test_multiple_users_verified_independently() {
    let mut scenario = setup();

    verify(&mut scenario, ALICE, ROLE_FARMER);
    verify(&mut scenario, BOB, ROLE_BUYER);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        assert!(compliance::user_count(&registry) == 2, 0);
        assert!(compliance::is_verified(&registry, ALICE), 1);
        assert!(compliance::is_verified(&registry, BOB), 2);
        assert!(!compliance::is_verified(&registry, EVE), 3); // not verified
        ts::return_shared(registry);
    };

    ts::end(scenario);
}

// ============ Freeze / Unfreeze ============

#[test]
fun test_freeze_marks_user_frozen() {
    let mut scenario = setup();

    verify(&mut scenario, ALICE, ROLE_FARMER);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: ComplianceAdmin = ts::take_from_sender(&scenario);
        let mut registry: ComplianceRegistry = ts::take_shared(&scenario);
        compliance::freeze_user(&admin, &mut registry, ALICE, b"regulatory hold");
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, admin);
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        assert!(compliance::is_frozen(&registry, ALICE), 0);
        // Still verified, just frozen
        assert!(compliance::is_verified(&registry, ALICE), 1);
        ts::return_shared(registry);
    };

    ts::end(scenario);
}

#[test]
fun test_unfreeze_clears_frozen_flag() {
    let mut scenario = setup();

    verify(&mut scenario, ALICE, ROLE_FARMER);

    // Freeze then unfreeze
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: ComplianceAdmin = ts::take_from_sender(&scenario);
        let mut registry: ComplianceRegistry = ts::take_shared(&scenario);
        compliance::freeze_user(&admin, &mut registry, ALICE, b"test");
        compliance::unfreeze_user(&admin, &mut registry, ALICE);
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, admin);
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        assert!(!compliance::is_frozen(&registry, ALICE), 0);
        ts::return_shared(registry);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = compliance::EUserNotFound)]
fun test_freeze_unknown_user_aborts() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: ComplianceAdmin = ts::take_from_sender(&scenario);
        let mut registry: ComplianceRegistry = ts::take_shared(&scenario);
        // Eve was never verified — freeze should abort
        compliance::freeze_user(&admin, &mut registry, EVE, b"test");
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = compliance::EUserNotFound)]
fun test_unfreeze_unknown_user_aborts() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: ComplianceAdmin = ts::take_from_sender(&scenario);
        let mut registry: ComplianceRegistry = ts::take_shared(&scenario);
        compliance::unfreeze_user(&admin, &mut registry, EVE);
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

// ============ can_participate / assert_can_participate ============

#[test]
fun test_can_participate_always_true_when_enforcement_off() {
    // Default: enforcement disabled. Unverified users can "participate".
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        assert!(compliance::can_participate(&registry, ALICE), 0);
        assert!(compliance::can_participate(&registry, EVE), 1);
        // assert_can_participate should also not abort
        compliance::assert_can_participate(&registry, EVE);
        ts::return_shared(registry);
    };

    ts::end(scenario);
}

#[test]
fun test_can_participate_verified_user_with_enforcement() {
    let mut scenario = setup();

    verify(&mut scenario, ALICE, ROLE_FARMER);
    enable_enforcement(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        assert!(compliance::can_participate(&registry, ALICE), 0);
        compliance::assert_can_participate(&registry, ALICE);
        ts::return_shared(registry);
    };

    ts::end(scenario);
}

#[test]
fun test_unverified_cannot_participate_when_enforcement_on() {
    let mut scenario = setup();

    enable_enforcement(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        assert!(!compliance::can_participate(&registry, EVE), 0);
        ts::return_shared(registry);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = compliance::EComplianceCheckFailed)]
fun test_assert_unverified_aborts_with_enforcement() {
    let mut scenario = setup();

    enable_enforcement(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        compliance::assert_can_participate(&registry, EVE);
        ts::return_shared(registry);
    };

    ts::end(scenario);
}

#[test]
fun test_frozen_user_cannot_participate() {
    let mut scenario = setup();

    verify(&mut scenario, ALICE, ROLE_FARMER);
    enable_enforcement(&mut scenario);

    // Freeze Alice
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: ComplianceAdmin = ts::take_from_sender(&scenario);
        let mut registry: ComplianceRegistry = ts::take_shared(&scenario);
        compliance::freeze_user(&admin, &mut registry, ALICE, b"test");
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, admin);
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        assert!(!compliance::can_participate(&registry, ALICE), 0);
        ts::return_shared(registry);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = compliance::EComplianceCheckFailed)]
fun test_assert_frozen_user_aborts() {
    let mut scenario = setup();

    verify(&mut scenario, ALICE, ROLE_FARMER);
    enable_enforcement(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: ComplianceAdmin = ts::take_from_sender(&scenario);
        let mut registry: ComplianceRegistry = ts::take_shared(&scenario);
        compliance::freeze_user(&admin, &mut registry, ALICE, b"test");
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, admin);
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        compliance::assert_can_participate(&registry, ALICE);
        ts::return_shared(registry);
    };

    ts::end(scenario);
}

#[test]
fun test_unfreeze_restores_ability_to_participate() {
    let mut scenario = setup();

    verify(&mut scenario, ALICE, ROLE_FARMER);
    enable_enforcement(&mut scenario);

    // Freeze, verify can't participate, unfreeze, verify can again
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: ComplianceAdmin = ts::take_from_sender(&scenario);
        let mut registry: ComplianceRegistry = ts::take_shared(&scenario);
        compliance::freeze_user(&admin, &mut registry, ALICE, b"test");
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, admin);
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        assert!(!compliance::can_participate(&registry, ALICE), 0);
        ts::return_shared(registry);
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: ComplianceAdmin = ts::take_from_sender(&scenario);
        let mut registry: ComplianceRegistry = ts::take_shared(&scenario);
        compliance::unfreeze_user(&admin, &mut registry, ALICE);
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, admin);
    };

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        assert!(compliance::can_participate(&registry, ALICE), 1);
        compliance::assert_can_participate(&registry, ALICE); // does not abort
        ts::return_shared(registry);
    };

    ts::end(scenario);
}

// ============ Enforcement Toggle ============

#[test]
fun test_toggle_enforcement() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        assert!(!compliance::enforcement_enabled(&registry), 0);
        ts::return_shared(registry);
    };

    enable_enforcement(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        assert!(compliance::enforcement_enabled(&registry), 1);
        ts::return_shared(registry);
    };

    // Toggle off
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: ComplianceAdmin = ts::take_from_sender(&scenario);
        let mut registry: ComplianceRegistry = ts::take_shared(&scenario);
        compliance::set_enforcement(&admin, &mut registry, false);
        assert!(!compliance::enforcement_enabled(&registry), 2);
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

// ============ View Functions on Unknown Users ============

#[test]
fun test_is_verified_on_unknown_user_returns_false() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: ComplianceRegistry = ts::take_shared(&scenario);
        assert!(!compliance::is_verified(&registry, EVE), 0);
        assert!(!compliance::is_frozen(&registry, EVE), 1);
        ts::return_shared(registry);
    };

    ts::end(scenario);
}
