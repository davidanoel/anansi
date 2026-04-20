#[test_only]
module anansi::asset_pool_tests;

use anansi::asset_pool::{Self, Registry, RegistryAdmin, AssetType, Lot, CustodianCap};
use sui::test_scenario::{Self as ts, Scenario};
use sui::clock::{Self, Clock};
use std::string;

// ============ Test Addresses ============

const ADMIN:     address = @0xA11CE;
const CUSTODIAN: address = @0xC057;
const OTHER_CUSTODIAN: address = @0xC057B;
const FARMER_ALICE: address = @0xA11;
const FARMER_BOB:   address = @0xB0B;

// ============ Setup ============

/// Initializes asset_pool. Registry is shared; ADMIN holds RegistryAdmin cap.
fun setup(): Scenario {
    let mut scenario = ts::begin(ADMIN);

    ts::next_tx(&mut scenario, ADMIN);
    {
        asset_pool::init_for_testing(ts::ctx(&mut scenario));
    };

    ts::next_tx(&mut scenario, ADMIN);
    scenario
}

/// Create a NUTMEG asset type and issue a CustodianCap to CUSTODIAN.
fun create_nutmeg_asset(scenario: &mut Scenario) {
    ts::next_tx(scenario, ADMIN);
    {
        let admin: RegistryAdmin = ts::take_from_sender(scenario);
        let mut registry: Registry = ts::take_shared(scenario);
        asset_pool::create_asset_type(
            &admin, &mut registry,
            b"NUTMEG", b"Grenada Nutmeg", b"kg", b"Grenada", b"GCNA",
            CUSTODIAN,
            ts::ctx(scenario),
        );
        ts::return_shared(registry);
        ts::return_to_sender(scenario, admin);
    };
}

/// Create a COCOA asset type and issue a CustodianCap to OTHER_CUSTODIAN.
fun create_cocoa_asset(scenario: &mut Scenario) {
    ts::next_tx(scenario, ADMIN);
    {
        let admin: RegistryAdmin = ts::take_from_sender(scenario);
        let mut registry: Registry = ts::take_shared(scenario);
        asset_pool::create_asset_type(
            &admin, &mut registry,
            b"COCOA", b"Grenada Cocoa", b"kg", b"Grenada", b"GCA",
            OTHER_CUSTODIAN,
            ts::ctx(scenario),
        );
        ts::return_shared(registry);
        ts::return_to_sender(scenario, admin);
    };
}

/// Create a lot with the NUTMEG custodian. Returns the lot_id.
fun create_nutmeg_lot(scenario: &mut Scenario, clock: &Clock): sui::object::ID {
    let mut lot_id = sui::object::id_from_address(@0x0);
    ts::next_tx(scenario, CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(scenario);
        let mut registry: Registry = ts::take_shared(scenario);
        let mut asset_type: AssetType = ts::take_shared(scenario);
        lot_id = asset_pool::create_lot(
            &cap, &mut registry, &mut asset_type,
            b"ipfs://receipt",
            clock, ts::ctx(scenario),
        );
        ts::return_shared(asset_type);
        ts::return_shared(registry);
        ts::return_to_sender(scenario, cap);
    };
    ts::next_tx(scenario, ADMIN);
    lot_id
}

// ============ Init ============

#[test]
fun test_init_default_state() {
    let mut scenario = setup();

    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: Registry = ts::take_shared(&scenario);
        assert!(asset_pool::registry_lot_count(&registry) == 0, 0);
        ts::return_shared(registry);
    };

    ts::end(scenario);
}

// ============ Asset Type Creation ============

#[test]
fun test_create_asset_type_shares_and_issues_cap() {
    let mut scenario = setup();
    create_nutmeg_asset(&mut scenario);

    // Verify AssetType exists as shared object
    ts::next_tx(&mut scenario, ADMIN);
    {
        let asset_type: AssetType = ts::take_shared(&scenario);
        assert!(asset_pool::asset_type_symbol(&asset_type) == string::utf8(b"NUTMEG"), 0);
        assert!(asset_pool::asset_type_name(&asset_type) == string::utf8(b"Grenada Nutmeg"), 1);
        assert!(asset_pool::asset_type_region(&asset_type) == string::utf8(b"Grenada"), 2);
        assert!(asset_pool::asset_type_active(&asset_type), 3);
        ts::return_shared(asset_type);
    };

    // Verify CUSTODIAN received a CustodianCap
    ts::next_tx(&mut scenario, CUSTODIAN);
    {
        assert!(ts::has_most_recent_for_sender<CustodianCap>(&scenario), 4);
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        assert!(asset_pool::custodian_cap_symbol(&cap) == string::utf8(b"NUTMEG"), 5);
        ts::return_to_sender(&scenario, cap);
    };

    ts::end(scenario);
}

#[test]
fun test_multiple_asset_types_independent() {
    let mut scenario = setup();
    create_nutmeg_asset(&mut scenario);
    create_cocoa_asset(&mut scenario);

    // Each asset type has its own custodian
    ts::next_tx(&mut scenario, CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        assert!(asset_pool::custodian_cap_symbol(&cap) == string::utf8(b"NUTMEG"), 0);
        ts::return_to_sender(&scenario, cap);
    };

    ts::next_tx(&mut scenario, OTHER_CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        assert!(asset_pool::custodian_cap_symbol(&cap) == string::utf8(b"COCOA"), 1);
        ts::return_to_sender(&scenario, cap);
    };

    ts::end(scenario);
}

#[test]
fun test_deactivate_and_reactivate_asset_type() {
    let mut scenario = setup();
    create_nutmeg_asset(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: RegistryAdmin = ts::take_from_sender(&scenario);
        let mut asset_type: AssetType = ts::take_shared(&scenario);

        assert!(asset_pool::asset_type_active(&asset_type), 0);

        asset_pool::deactivate_asset_type(&admin, &mut asset_type);
        assert!(!asset_pool::asset_type_active(&asset_type), 1);

        asset_pool::reactivate_asset_type(&admin, &mut asset_type);
        assert!(asset_pool::asset_type_active(&asset_type), 2);

        ts::return_shared(asset_type);
        ts::return_to_sender(&scenario, admin);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = asset_pool::EAssetTypeNotActive)]
fun test_create_lot_on_deactivated_asset_aborts() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    create_nutmeg_asset(&mut scenario);

    // Deactivate
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: RegistryAdmin = ts::take_from_sender(&scenario);
        let mut asset_type: AssetType = ts::take_shared(&scenario);
        asset_pool::deactivate_asset_type(&admin, &mut asset_type);
        ts::return_shared(asset_type);
        ts::return_to_sender(&scenario, admin);
    };

    // Custodian tries to create a lot — aborts
    ts::next_tx(&mut scenario, CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        let mut registry: Registry = ts::take_shared(&scenario);
        let mut asset_type: AssetType = ts::take_shared(&scenario);
        asset_pool::create_lot(
            &cap, &mut registry, &mut asset_type,
            b"receipt", &clock, ts::ctx(&mut scenario),
        );
        ts::return_shared(asset_type);
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, cap);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Custodian Cap Management ============

#[test]
fun test_issue_additional_custodian_cap() {
    // A second custodian can be issued a cap for the same asset type.
    let mut scenario = setup();
    create_nutmeg_asset(&mut scenario);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: RegistryAdmin = ts::take_from_sender(&scenario);
        let asset_type: AssetType = ts::take_shared(&scenario);
        asset_pool::issue_custodian_cap(&admin, &asset_type, OTHER_CUSTODIAN, ts::ctx(&mut scenario));
        ts::return_shared(asset_type);
        ts::return_to_sender(&scenario, admin);
    };

    // Both now have caps for NUTMEG
    ts::next_tx(&mut scenario, CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        assert!(asset_pool::custodian_cap_symbol(&cap) == string::utf8(b"NUTMEG"), 0);
        ts::return_to_sender(&scenario, cap);
    };
    ts::next_tx(&mut scenario, OTHER_CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        assert!(asset_pool::custodian_cap_symbol(&cap) == string::utf8(b"NUTMEG"), 1);
        ts::return_to_sender(&scenario, cap);
    };

    ts::end(scenario);
}

#[test]
fun test_revoke_custodian_cap_destroys_it() {
    let mut scenario = setup();
    create_nutmeg_asset(&mut scenario);

    // Admin revokes the cap
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin: RegistryAdmin = ts::take_from_sender(&scenario);
        let cap: CustodianCap = ts::take_from_address(&scenario, CUSTODIAN);
        asset_pool::revoke_custodian_cap(&admin, cap);
        ts::return_to_sender(&scenario, admin);
    };

    // CUSTODIAN no longer has a cap
    ts::next_tx(&mut scenario, CUSTODIAN);
    {
        assert!(!ts::has_most_recent_for_sender<CustodianCap>(&scenario), 0);
    };

    ts::end(scenario);
}

// ============ Lot Creation ============

#[test]
fun test_create_lot_initializes_defaults() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    create_nutmeg_asset(&mut scenario);
    let lot_id = create_nutmeg_lot(&mut scenario, &clock);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        assert!(asset_pool::lot_status(&lot) == 0, 0); // STATUS_OPEN
        assert!(asset_pool::lot_total_units(&lot) == 0, 1);
        assert!(asset_pool::lot_total_tokens(&lot) == 0, 2);
        assert!(asset_pool::lot_value(&lot) == 0, 3);
        assert!(asset_pool::lot_number(&lot) == 1, 4); // first lot
        assert!(asset_pool::lot_asset_type(&lot) == string::utf8(b"NUTMEG"), 5);
        assert!(asset_pool::lot_surplus_deposited(&lot) == 0, 6);
        ts::return_shared(lot);
    };

    // Registry counter incremented
    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: Registry = ts::take_shared(&scenario);
        assert!(asset_pool::registry_lot_count(&registry) == 1, 7);
        ts::return_shared(registry);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_per_asset_type_lot_numbering() {
    // NUTMEG lots get 1,2,3... COCOA lots get 1,2,3... independently.
    // We build up state: create NUTMEG, make a lot, then create COCOA, make a lot.
    // Rather than juggling two AssetType shared objects in one tx, we do each in
    // sequence with the relevant custodian as sender.
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    create_nutmeg_asset(&mut scenario);

    // Create NUTMEG lot #1
    let nutmeg_lot_1 = create_nutmeg_lot(&mut scenario, &clock);

    // Now create COCOA asset type — only one AssetType<symbol=COCOA> exists after this,
    // so COCOA take_shared is unambiguous in txs where we need it.
    create_cocoa_asset(&mut scenario);

    // But wait — at this point two AssetType shared objects exist (NUTMEG and COCOA).
    // take_shared can only return one. The approach: capture ID at creation time via
    // take_shared + symbol filter; return non-matching. We implement a helper that
    // takes all shared AssetTypes, returns the ones not matching, yields the match.
    //
    // Actually simpler: use take_shared (returns arbitrary), check symbol, swap if
    // wrong. test_scenario holds shared objects in a pool, take_shared is LIFO over
    // creation order. We created NUTMEG first, then COCOA — so take_shared returns
    // COCOA (most recent). This is implementation-defined but currently reliable.
    //
    // Rather than rely on that, we use an approach that's guaranteed correct:
    // iterate by taking all, checking, and returning the wrong one.
    let mut cocoa_lot_id = sui::object::id_from_address(@0x0);
    ts::next_tx(&mut scenario, OTHER_CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        let mut registry: Registry = ts::take_shared(&scenario);
        let mut cocoa_type = pick_asset_type(&mut scenario, b"COCOA");
        cocoa_lot_id = asset_pool::create_lot(
            &cap, &mut registry, &mut cocoa_type,
            b"cocoa_receipt", &clock, ts::ctx(&mut scenario),
        );
        ts::return_shared(cocoa_type);
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, cap);
    };

    // Create NUTMEG lot #2
    ts::next_tx(&mut scenario, CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        let mut registry: Registry = ts::take_shared(&scenario);
        let mut nutmeg_type = pick_asset_type(&mut scenario, b"NUTMEG");
        asset_pool::create_lot(
            &cap, &mut registry, &mut nutmeg_type,
            b"receipt_2", &clock, ts::ctx(&mut scenario),
        );
        ts::return_shared(nutmeg_type);
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, cap);
    };

    // NUTMEG lot #1 should be lot_number 1
    ts::next_tx(&mut scenario, ADMIN);
    {
        let lot: Lot = ts::take_shared_by_id(&scenario, nutmeg_lot_1);
        assert!(asset_pool::lot_number(&lot) == 1, 0);
        ts::return_shared(lot);
    };
    // COCOA lot should also be lot_number 1 (independent counter)
    ts::next_tx(&mut scenario, ADMIN);
    {
        let lot: Lot = ts::take_shared_by_id(&scenario, cocoa_lot_id);
        assert!(asset_pool::lot_number(&lot) == 1, 1);
        ts::return_shared(lot);
    };

    // Registry lot_count is global: 3
    ts::next_tx(&mut scenario, ADMIN);
    {
        let registry: Registry = ts::take_shared(&scenario);
        assert!(asset_pool::registry_lot_count(&registry) == 3, 2);
        ts::return_shared(registry);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

/// When two AssetType shared objects exist (NUTMEG + COCOA), take one specifically.
/// Strategy: take one; if its symbol matches target, return it; else return it to
/// shared pool and try again. In a 2-type scenario this terminates in at most 2 iterations.
fun pick_asset_type(scenario: &mut Scenario, target_symbol: vector<u8>): AssetType {
    let target = string::utf8(target_symbol);
    let first: AssetType = ts::take_shared(scenario);
    if (asset_pool::asset_type_symbol(&first) == target) {
        first
    } else {
        // Wrong one — put it back, take the other
        ts::return_shared(first);
        let second: AssetType = ts::take_shared(scenario);
        assert!(asset_pool::asset_type_symbol(&second) == target, 9999);
        second
    }
}

#[test]
#[expected_failure(abort_code = asset_pool::ENotCustodian)]
fun test_create_lot_with_wrong_custodian_cap_aborts() {
    // NUTMEG lot creation with COCOA cap → abort
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    create_nutmeg_asset(&mut scenario);
    create_cocoa_asset(&mut scenario);

    // OTHER_CUSTODIAN has COCOA cap. Try to use it for NUTMEG asset_type.
    ts::next_tx(&mut scenario, OTHER_CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        let mut registry: Registry = ts::take_shared(&scenario);
        let mut nutmeg_type = pick_asset_type(&mut scenario, b"NUTMEG");
        // cap is for COCOA, asset_type is NUTMEG → abort
        asset_pool::create_lot(
            &cap, &mut registry, &mut nutmeg_type,
            b"receipt", &clock, ts::ctx(&mut scenario),
        );
        ts::return_shared(nutmeg_type);
        ts::return_shared(registry);
        ts::return_to_sender(&scenario, cap);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Delivery Recording ============

#[test]
fun test_record_delivery_updates_lot_and_creates_receipt() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    create_nutmeg_asset(&mut scenario);
    let lot_id = create_nutmeg_lot(&mut scenario, &clock);

    ts::next_tx(&mut scenario, CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);

        asset_pool::record_delivery(
            &cap, &mut lot, FARMER_ALICE,
            100, // units (kg)
            100_000_000_000, // token amount (100 tokens at 9 decimals)
            b"Grade A", b"ipfs://delivery-receipt",
            &clock, ts::ctx(&mut scenario),
        );

        assert!(asset_pool::lot_total_units(&lot) == 100, 0);
        assert!(asset_pool::lot_total_tokens(&lot) == 100_000_000_000, 1);

        ts::return_shared(lot);
        ts::return_to_sender(&scenario, cap);
    };

    // Alice received a Delivery receipt
    ts::next_tx(&mut scenario, FARMER_ALICE);
    {
        let delivery: asset_pool::Delivery = ts::take_from_sender(&scenario);
        // Delivery struct fields aren't publicly getter-wrapped, so we only verify it exists
        ts::return_to_sender(&scenario, delivery);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
fun test_multiple_deliveries_aggregate() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    create_nutmeg_asset(&mut scenario);
    let lot_id = create_nutmeg_lot(&mut scenario, &clock);

    // Alice delivers 100kg
    ts::next_tx(&mut scenario, CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        asset_pool::record_delivery(
            &cap, &mut lot, FARMER_ALICE,
            100, 100_000_000_000, b"A", b"receipt1",
            &clock, ts::ctx(&mut scenario),
        );
        ts::return_shared(lot);
        ts::return_to_sender(&scenario, cap);
    };

    // Bob delivers 250kg
    ts::next_tx(&mut scenario, CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        asset_pool::record_delivery(
            &cap, &mut lot, FARMER_BOB,
            250, 250_000_000_000, b"A", b"receipt2",
            &clock, ts::ctx(&mut scenario),
        );
        ts::return_shared(lot);
        ts::return_to_sender(&scenario, cap);
    };

    // Alice delivers again 50kg
    ts::next_tx(&mut scenario, CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        asset_pool::record_delivery(
            &cap, &mut lot, FARMER_ALICE,
            50, 50_000_000_000, b"B", b"receipt3",
            &clock, ts::ctx(&mut scenario),
        );

        assert!(asset_pool::lot_total_units(&lot) == 400, 0);
        assert!(asset_pool::lot_total_tokens(&lot) == 400_000_000_000, 1);

        ts::return_shared(lot);
        ts::return_to_sender(&scenario, cap);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = asset_pool::ENotCustodian)]
fun test_record_delivery_with_wrong_custodian_cap_aborts() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    create_nutmeg_asset(&mut scenario);
    create_cocoa_asset(&mut scenario);
    let nutmeg_lot_id = create_nutmeg_lot(&mut scenario, &clock);

    // OTHER_CUSTODIAN has COCOA cap — tries to record on NUTMEG lot
    ts::next_tx(&mut scenario, OTHER_CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, nutmeg_lot_id);
        asset_pool::record_delivery(
            &cap, &mut lot, FARMER_ALICE,
            100, 100_000_000_000, b"A", b"receipt",
            &clock, ts::ctx(&mut scenario),
        );
        ts::return_shared(lot);
        ts::return_to_sender(&scenario, cap);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = asset_pool::ELotNotOpen)]
fun test_record_delivery_on_closed_lot_aborts() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    create_nutmeg_asset(&mut scenario);
    let lot_id = create_nutmeg_lot(&mut scenario, &clock);

    // Move lot to SELLING state
    ts::next_tx(&mut scenario, CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        asset_pool::start_selling(&cap, &mut lot);
        ts::return_shared(lot);
        ts::return_to_sender(&scenario, cap);
    };

    // Now try to record a delivery on a non-open lot → abort
    ts::next_tx(&mut scenario, CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        asset_pool::record_delivery(
            &cap, &mut lot, FARMER_ALICE,
            100, 100_000_000_000, b"A", b"receipt",
            &clock, ts::ctx(&mut scenario),
        );
        ts::return_shared(lot);
        ts::return_to_sender(&scenario, cap);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Status Transitions ============

#[test]
fun test_status_transitions_open_selling_distributing_closed() {
    let mut scenario = setup();
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
    clock::set_for_testing(&mut clock, 1_000_000_000);
    create_nutmeg_asset(&mut scenario);
    let lot_id = create_nutmeg_lot(&mut scenario, &clock);

    // OPEN → SELLING
    ts::next_tx(&mut scenario, CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        assert!(asset_pool::lot_status(&lot) == 0, 0);
        asset_pool::start_selling(&cap, &mut lot);
        assert!(asset_pool::lot_status(&lot) == 1, 1);
        ts::return_shared(lot);
        ts::return_to_sender(&scenario, cap);
    };

    // SELLING → DISTRIBUTING
    ts::next_tx(&mut scenario, CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        asset_pool::start_distributing(&cap, &mut lot);
        assert!(asset_pool::lot_status(&lot) == 2, 0);
        ts::return_shared(lot);
        ts::return_to_sender(&scenario, cap);
    };

    // DISTRIBUTING → CLOSED
    ts::next_tx(&mut scenario, CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        asset_pool::close_lot(&cap, &mut lot, &clock);
        assert!(asset_pool::lot_status(&lot) == 3, 0);
        ts::return_shared(lot);
        ts::return_to_sender(&scenario, cap);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = asset_pool::ELotNotOpen)]
fun test_start_selling_on_selling_lot_aborts() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    create_nutmeg_asset(&mut scenario);
    let lot_id = create_nutmeg_lot(&mut scenario, &clock);

    ts::next_tx(&mut scenario, CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        asset_pool::start_selling(&cap, &mut lot);
        // Second call — already selling, abort
        asset_pool::start_selling(&cap, &mut lot);
        ts::return_shared(lot);
        ts::return_to_sender(&scenario, cap);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = asset_pool::ELotNotSelling)]
fun test_start_distributing_from_open_aborts() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    create_nutmeg_asset(&mut scenario);
    let lot_id = create_nutmeg_lot(&mut scenario, &clock);

    // Skip selling, try to go straight to distributing
    ts::next_tx(&mut scenario, CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        asset_pool::start_distributing(&cap, &mut lot);
        ts::return_shared(lot);
        ts::return_to_sender(&scenario, cap);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = asset_pool::EInvalidStatus)]
fun test_close_lot_from_open_aborts() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    create_nutmeg_asset(&mut scenario);
    let lot_id = create_nutmeg_lot(&mut scenario, &clock);

    ts::next_tx(&mut scenario, CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);
        // Trying to close while still OPEN
        asset_pool::close_lot(&cap, &mut lot, &clock);
        ts::return_shared(lot);
        ts::return_to_sender(&scenario, cap);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = asset_pool::ENotCustodian)]
fun test_status_transition_with_wrong_cap_aborts() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    create_nutmeg_asset(&mut scenario);
    create_cocoa_asset(&mut scenario);
    let nutmeg_lot_id = create_nutmeg_lot(&mut scenario, &clock);

    // OTHER_CUSTODIAN (COCOA cap) tries to start selling NUTMEG lot
    ts::next_tx(&mut scenario, OTHER_CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, nutmeg_lot_id);
        asset_pool::start_selling(&cap, &mut lot);
        ts::return_shared(lot);
        ts::return_to_sender(&scenario, cap);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Valuation ============

#[test]
fun test_update_valuation_tracks_value() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    create_nutmeg_asset(&mut scenario);
    let lot_id = create_nutmeg_lot(&mut scenario, &clock);

    ts::next_tx(&mut scenario, CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);

        assert!(asset_pool::lot_value(&lot) == 0, 0);
        asset_pool::update_valuation(&cap, &mut lot, 50_000_000_000); // $50K at 6 dec
        assert!(asset_pool::lot_value(&lot) == 50_000_000_000, 1);
        asset_pool::update_valuation(&cap, &mut lot, 75_000_000_000); // $75K
        assert!(asset_pool::lot_value(&lot) == 75_000_000_000, 2);

        ts::return_shared(lot);
        ts::return_to_sender(&scenario, cap);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = asset_pool::ENotCustodian)]
fun test_update_valuation_with_wrong_cap_aborts() {
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    create_nutmeg_asset(&mut scenario);
    create_cocoa_asset(&mut scenario);
    let nutmeg_lot_id = create_nutmeg_lot(&mut scenario, &clock);

    ts::next_tx(&mut scenario, OTHER_CUSTODIAN);
    {
        let cap: CustodianCap = ts::take_from_sender(&scenario);
        let mut lot: Lot = ts::take_shared_by_id(&scenario, nutmeg_lot_id);
        asset_pool::update_valuation(&cap, &mut lot, 100_000);
        ts::return_shared(lot);
        ts::return_to_sender(&scenario, cap);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}

// ============ Package-Visible Surplus Hooks ============

#[test]
fun test_record_surplus_deposit_aggregates() {
    // These package functions are called from yield_engine.
    // Tests live in same package, so we can call them directly.
    let mut scenario = setup();
    let clock = clock::create_for_testing(ts::ctx(&mut scenario));
    create_nutmeg_asset(&mut scenario);
    let lot_id = create_nutmeg_lot(&mut scenario, &clock);

    ts::next_tx(&mut scenario, ADMIN);
    {
        let mut lot: Lot = ts::take_shared_by_id(&scenario, lot_id);

        assert!(asset_pool::lot_surplus_deposited(&lot) == 0, 0);
        asset_pool::record_surplus_deposit(&mut lot, 1_000_000);
        assert!(asset_pool::lot_surplus_deposited(&lot) == 1_000_000, 1);
        asset_pool::record_surplus_deposit(&mut lot, 500_000);
        assert!(asset_pool::lot_surplus_deposited(&lot) == 1_500_000, 2);

        ts::return_shared(lot);
    };

    clock::destroy_for_testing(clock);
    ts::end(scenario);
}
