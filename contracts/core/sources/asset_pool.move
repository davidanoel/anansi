/// Asset Pool — Core lot and delivery management for the Spice platform.
/// Tracks physical commodity lots and deliveries.
/// Does NOT mint tokens —
/// each commodity module (nutmeg.move, cocoa.move) handles its own Coin<T> minting.
module anansi::asset_pool {
    use sui::event;
    use sui::clock::Clock;
    use std::string::{Self, String};

    // ============ Objects ============

    public struct Registry has key {
        id: UID,
        lot_count: u64, // Global counter for platform stats
        asset_type_count: u64,
    }

    public struct AssetType has key, store {
        id: UID,
        symbol: String,
        name: String,
        unit: String,
        region: String,
        custodian: String,
        active: bool,
        lot_count: u64, // Local counter for independent lot numbering
    }

    public struct Lot has key, store {
        id: UID,
        lot_number: u64,
        asset_type_symbol: String,
        status: u8,
        total_units: u64,
        total_tokens_minted: u64,
        estimated_value_usdc: u64,
        receipt_hash: String,
        created_at: u64,
        closed_at: u64,
        total_surplus_deposited: u64,
        total_surplus_distributed: u64,
        delivery_count: u64,
        custodian: address,
    }

    public struct Delivery has key, store {
        id: UID,
        lot_id: ID,
        farmer: address,
        units: u64,
        grade: String,
        receipt_hash: String,
        tokens_minted: u64,
        delivered_at: u64,
    }

    public struct RegistryAdmin has key, store { id: UID }

    public struct CustodianCap has key, store {
        id: UID,
        asset_type_symbol: String,
    }

    // ============ Constants ============

    const STATUS_OPEN: u8 = 0;
    const STATUS_SELLING: u8 = 1;
    const STATUS_DISTRIBUTING: u8 = 2;
    const STATUS_CLOSED: u8 = 3;

    // ============ Errors ============

    const ENotCustodian: u64 = 100;
    const ELotNotOpen: u64 = 101;
    const ELotNotSelling: u64 = 102;
    const EInvalidStatus: u64 = 103;
    const EAssetTypeNotActive: u64 = 104;

    // ============ Events ============

    public struct AssetTypeCreated has copy, drop {
        symbol: String, name: String, region: String, custodian: String,
    }
    public struct AssetTypeDeactivated has copy, drop { symbol: String }
    public struct AssetTypeReactivated has copy, drop { symbol: String }
    public struct CustodianCapIssued has copy, drop { asset_type_symbol: String, custodian_address: address }
    public struct CustodianCapRevoked has copy, drop { asset_type_symbol: String }

    public struct LotCreated has copy, drop {
        lot_id: ID, lot_number: u64, asset_type_symbol: String, custodian: address,
    }
    public struct DeliveryRecorded has copy, drop {
        lot_id: ID, farmer: address, units: u64, tokens_minted: u64, grade: String,
    }
    public struct LotStatusChanged has copy, drop {
        lot_id: ID, old_status: u8, new_status: u8,
    }
    public struct ValuationUpdated has copy, drop {
        lot_id: ID, old_value: u64, new_value: u64,
    }

    // ============ Init ============

    fun init(ctx: &mut TxContext) {
        transfer::share_object(Registry {
            id: object::new(ctx),
            lot_count: 0,
            asset_type_count: 0,
        });
        transfer::transfer(RegistryAdmin { id: object::new(ctx) }, ctx.sender());
    }

    // ============ Admin Functions ============

    public fun create_asset_type(
        _admin: &RegistryAdmin,
        registry: &mut Registry,
        symbol: vector<u8>,
        name: vector<u8>,
        unit: vector<u8>,
        region: vector<u8>,
        custodian_name: vector<u8>,
        custodian_address: address,
        ctx: &mut TxContext,
    ) {
        let symbol_str = string::utf8(symbol);
        let name_str = string::utf8(name);
        let region_str = string::utf8(region);
        let custodian_str = string::utf8(custodian_name);

        registry.asset_type_count = registry.asset_type_count + 1;

        transfer::transfer(CustodianCap {
            id: object::new(ctx),
            asset_type_symbol: symbol_str,
        }, custodian_address);

        event::emit(AssetTypeCreated {
            symbol: symbol_str, name: name_str, region: region_str, custodian: custodian_str,
        });

        transfer::share_object(AssetType {
            id: object::new(ctx),
            symbol: symbol_str,
            name: name_str,
            unit: string::utf8(unit),
            region: region_str,
            custodian: custodian_str,
            active: true,
            lot_count: 0, // Initialize local counter
        });
    }

    public fun deactivate_asset_type(_admin: &RegistryAdmin, asset_type: &mut AssetType) {
        asset_type.active = false;
        event::emit(AssetTypeDeactivated { symbol: asset_type.symbol });
    }

    public fun reactivate_asset_type(_admin: &RegistryAdmin, asset_type: &mut AssetType) {
        asset_type.active = true;
        event::emit(AssetTypeReactivated { symbol: asset_type.symbol });
    }

    public fun issue_custodian_cap(
        _admin: &RegistryAdmin, asset_type: &AssetType, new_custodian: address, ctx: &mut TxContext,
    ) {
        transfer::transfer(CustodianCap {
            id: object::new(ctx),
            asset_type_symbol: asset_type.symbol,
        }, new_custodian);
        event::emit(CustodianCapIssued {
            asset_type_symbol: asset_type.symbol, custodian_address: new_custodian,
        });
    }

    public fun revoke_custodian_cap(_admin: &RegistryAdmin, cap: CustodianCap) {
        let symbol = cap.asset_type_symbol;
        let CustodianCap { id, asset_type_symbol: _ } = cap;
        object::delete(id);
        event::emit(CustodianCapRevoked { asset_type_symbol: symbol });
    }

    // ============ Custodian Functions ============

    public fun create_lot(
        cap: &CustodianCap, registry: &mut Registry, asset_type: &mut AssetType,
        receipt_hash: vector<u8>, clock: &Clock, ctx: &mut TxContext,
    ): ID {
        assert!(asset_type.active, EAssetTypeNotActive);
        assert!(cap.asset_type_symbol == asset_type.symbol, ENotCustodian);

        // Increment both counters
        registry.lot_count = registry.lot_count + 1;
        asset_type.lot_count = asset_type.lot_count + 1;

        let lot = Lot {
            id: object::new(ctx),
            lot_number: asset_type.lot_count, // Use independent counter
            asset_type_symbol: asset_type.symbol,
            status: STATUS_OPEN,
            total_units: 0,
            total_tokens_minted: 0,
            estimated_value_usdc: 0,
            receipt_hash: string::utf8(receipt_hash),
            created_at: sui::clock::timestamp_ms(clock),
            closed_at: 0,
            total_surplus_deposited: 0,
            total_surplus_distributed: 0,
            delivery_count: 0,
            custodian: ctx.sender(),
        };

        let lot_id = object::id(&lot);
        event::emit(LotCreated {
            lot_id, 
            lot_number: asset_type.lot_count, // Broadcast independent counter
            asset_type_symbol: asset_type.symbol, 
            custodian: ctx.sender(),
        });

        transfer::share_object(lot);
        lot_id
    }

    /// Record a delivery and update lot state.
    /// Called by commodity modules (nutmeg, cocoa, coffee — may be in separate packages).
    /// Safe as `public` because CustodianCap already authorizes the caller.
    public fun record_delivery(
        cap: &CustodianCap, lot: &mut Lot,
        farmer: address, units: u64, coin_amount: u64, grade: vector<u8>,
        receipt_hash: vector<u8>, clock: &Clock, ctx: &mut TxContext,
    ) {
        assert!(lot.status == STATUS_OPEN, ELotNotOpen);
        assert!(cap.asset_type_symbol == lot.asset_type_symbol, ENotCustodian);

        lot.total_units = lot.total_units + units;
        lot.total_tokens_minted = lot.total_tokens_minted + coin_amount;
        lot.delivery_count = lot.delivery_count + 1;
        let grade_str = string::utf8(grade);

        transfer::transfer(Delivery {
            id: object::new(ctx),
            lot_id: object::id(lot),
            farmer, units, grade: grade_str,
            receipt_hash: string::utf8(receipt_hash),
            tokens_minted: coin_amount,
            delivered_at: sui::clock::timestamp_ms(clock),
        }, farmer);

        event::emit(DeliveryRecorded {
            lot_id: object::id(lot), farmer, units,
            tokens_minted: coin_amount, grade: grade_str,
        });
    }

    public fun update_valuation(cap: &CustodianCap, lot: &mut Lot, new_value_usdc: u64) {
        assert!(cap.asset_type_symbol == lot.asset_type_symbol, ENotCustodian);
        let old_value = lot.estimated_value_usdc;
        lot.estimated_value_usdc = new_value_usdc;
        event::emit(ValuationUpdated { lot_id: object::id(lot), old_value, new_value: new_value_usdc });
    }

    public fun start_selling(cap: &CustodianCap, lot: &mut Lot) {
        assert!(lot.status == STATUS_OPEN, ELotNotOpen);
        assert!(cap.asset_type_symbol == lot.asset_type_symbol, ENotCustodian);
        lot.status = STATUS_SELLING;
        event::emit(LotStatusChanged { lot_id: object::id(lot), old_status: STATUS_OPEN, new_status: STATUS_SELLING });
    }

    public fun start_distributing(cap: &CustodianCap, lot: &mut Lot) {
        assert!(lot.status == STATUS_SELLING, ELotNotSelling);
        assert!(cap.asset_type_symbol == lot.asset_type_symbol, ENotCustodian);
        lot.status = STATUS_DISTRIBUTING;
        event::emit(LotStatusChanged { lot_id: object::id(lot), old_status: STATUS_SELLING, new_status: STATUS_DISTRIBUTING });
    }

    public fun close_lot(cap: &CustodianCap, lot: &mut Lot, clock: &Clock) {
        assert!(lot.status == STATUS_DISTRIBUTING, EInvalidStatus);
        assert!(cap.asset_type_symbol == lot.asset_type_symbol, ENotCustodian);
        lot.status = STATUS_CLOSED;
        lot.closed_at = sui::clock::timestamp_ms(clock);
        event::emit(LotStatusChanged { lot_id: object::id(lot), old_status: STATUS_DISTRIBUTING, new_status: STATUS_CLOSED });
    }

    // ============ View Functions ============

    public fun lot_status(lot: &Lot): u8 { lot.status }
    public fun lot_total_units(lot: &Lot): u64 { lot.total_units }
    public fun lot_total_tokens(lot: &Lot): u64 { lot.total_tokens_minted }
    public fun lot_value(lot: &Lot): u64 { lot.estimated_value_usdc }
    public fun lot_number(lot: &Lot): u64 { lot.lot_number }
    public fun lot_asset_type(lot: &Lot): String { lot.asset_type_symbol }
    public fun lot_surplus_deposited(lot: &Lot): u64 { lot.total_surplus_deposited }
    public fun registry_lot_count(registry: &Registry): u64 { registry.lot_count }

    public fun asset_type_symbol(at: &AssetType): String { at.symbol }
    public fun asset_type_name(at: &AssetType): String { at.name }
    public fun asset_type_region(at: &AssetType): String { at.region }
    public fun asset_type_active(at: &AssetType): bool { at.active }

    public fun custodian_cap_symbol(cap: &CustodianCap): String { cap.asset_type_symbol }

    // ============ Package Functions ============

    public(package) fun record_surplus_deposit(lot: &mut Lot, amount: u64) {
        lot.total_surplus_deposited = lot.total_surplus_deposited + amount;
    }

    public(package) fun record_surplus_distribution(lot: &mut Lot, amount: u64) {
        lot.total_surplus_distributed = lot.total_surplus_distributed + amount;
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) { init(ctx); }
}