/// Commodity Registry — Tracks registered commodity packages on-chain.
/// Each commodity (NUTMEG, COFFEE, etc.) is a separate package.
/// After deploying a commodity package, the admin registers it here.
/// This enables on-chain discovery and governance.
module anansi::commodity_registry {
    use sui::event;
    use sui::table::{Self, Table};
    use std::string::{Self, String};

    // ============ Objects ============

    /// Shared registry of all commodity packages.
    public struct CommodityRegistry has key {
        id: UID,
        /// symbol => CommodityEntry
        commodities: Table<String, CommodityEntry>,
        /// Total registered commodities
        count: u64,
    }

    /// Info about a registered commodity.
    public struct CommodityEntry has store, drop {
        /// Token symbol (e.g., "NUTMEG", "COFFEE")
        symbol: String,
        /// Human-readable name (e.g., "Grenada Nutmeg")
        name: String,
        /// The deployed commodity package address
        package_id: address,
        /// Whether this commodity is active
        active: bool,
    }

    /// Admin capability for registry operations.
    public struct CommodityRegistryAdmin has key, store {
        id: UID,
    }

    // ============ Events ============

    public struct CommodityRegistered has copy, drop {
        symbol: String,
        name: String,
        package_id: address,
    }

    public struct CommodityDeactivated has copy, drop {
        symbol: String,
    }

    public struct CommodityReactivated has copy, drop {
        symbol: String,
    }

    // ============ Errors ============

    const EAlreadyRegistered: u64 = 400;
    const ENotRegistered: u64 = 401;

    // ============ Init ============

    fun init(ctx: &mut TxContext) {
        transfer::share_object(CommodityRegistry {
            id: object::new(ctx),
            commodities: table::new(ctx),
            count: 0,
        });

        transfer::transfer(CommodityRegistryAdmin {
            id: object::new(ctx),
        }, ctx.sender());
    }

    // ============ Admin Functions ============

    /// Register a new commodity package after deploying it.
    /// Called via CLI after `sui client publish` of the commodity package.
    public fun register(
        _admin: &CommodityRegistryAdmin,
        registry: &mut CommodityRegistry,
        symbol: vector<u8>,
        name: vector<u8>,
        package_id: address,
    ) {
        let symbol_str = string::utf8(symbol);
        let name_str = string::utf8(name);

        assert!(!table::contains(&registry.commodities, symbol_str), EAlreadyRegistered);

        table::add(&mut registry.commodities, symbol_str, CommodityEntry {
            symbol: symbol_str,
            name: name_str,
            package_id,
            active: true,
        });

        registry.count = registry.count + 1;

        event::emit(CommodityRegistered {
            symbol: symbol_str,
            name: name_str,
            package_id,
        });
    }

    /// Deactivate a commodity (soft-disable).
    public fun deactivate(
        _admin: &CommodityRegistryAdmin,
        registry: &mut CommodityRegistry,
        symbol: vector<u8>,
    ) {
        let symbol_str = string::utf8(symbol);
        assert!(table::contains(&registry.commodities, symbol_str), ENotRegistered);
        let entry = table::borrow_mut(&mut registry.commodities, symbol_str);
        entry.active = false;
        event::emit(CommodityDeactivated { symbol: symbol_str });
    }

    /// Reactivate a deactivated commodity.
    public fun reactivate(
        _admin: &CommodityRegistryAdmin,
        registry: &mut CommodityRegistry,
        symbol: vector<u8>,
    ) {
        let symbol_str = string::utf8(symbol);
        assert!(table::contains(&registry.commodities, symbol_str), ENotRegistered);
        let entry = table::borrow_mut(&mut registry.commodities, symbol_str);
        entry.active = true;
        event::emit(CommodityReactivated { symbol: symbol_str });
    }

    // ============ View Functions ============

    public fun is_registered(registry: &CommodityRegistry, symbol: vector<u8>): bool {
        table::contains(&registry.commodities, string::utf8(symbol))
    }

    public fun is_active(registry: &CommodityRegistry, symbol: vector<u8>): bool {
        let symbol_str = string::utf8(symbol);
        if (!table::contains(&registry.commodities, symbol_str)) {
            return false
        };
        let entry = table::borrow(&registry.commodities, symbol_str);
        entry.active
    }

    public fun commodity_count(registry: &CommodityRegistry): u64 {
        registry.count
    }

    // ============ Test Helpers ============

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
