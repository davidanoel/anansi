/// Asset Pool — Generic real-world asset tokenization for the Spice platform.
/// Supports any asset type: agricultural commodities, real estate, revenue streams.
/// Each Lot represents one batch cycle with full lifecycle tracking.
module anansi::asset_pool {
    use sui::coin::{Self, Coin};
    use sui::event;
    use sui::clock::Clock;
    use sui::table::{Self, Table};
    use std::string::{Self, String};

    // ============ Objects ============

    /// Global registry of all asset types and lots.
    /// Shared object — the single entry point for the platform.
    public struct Registry has key {
        id: UID,
        /// Total lots ever created (used for lot numbering)
        lot_count: u64,
        /// Total asset types registered
        asset_type_count: u64,
    }

    /// An AssetType defines a category of tokenizable assets (e.g., NUTMG, COCO, VILLA).
    /// Created once per asset category, referenced by all lots of that type.
    public struct AssetType has key, store {
        id: UID,
        /// Short symbol (e.g., "NUTMG", "COCO")
        symbol: String,
        /// Full name (e.g., "Grenada Nutmeg")
        name: String,
        /// Unit of measurement (e.g., "kg", "sqft", "barrel")
        unit: String,
        /// Island/region
        region: String,
        /// Custodian name (e.g., "GCNA", "Grenada Cocoa Association")
        custodian: String,
        /// Whether new lots can be created for this asset type
        active: bool,
    }

    /// A Lot represents one batch cycle of an asset moving through the system.
    /// Lifecycle: Open → Deliveries → Selling → Distributing → Closed
    public struct Lot has key, store {
        id: UID,
        /// Sequential lot number (e.g., "NUTMG-001")
        lot_number: u64,
        /// Reference to the asset type
        asset_type_symbol: String,
        /// Current status: 0=Open, 1=Selling, 2=Distributing, 3=Closed
        status: u8,
        /// Total physical units in this lot (e.g., total kg of nutmeg)
        total_units: u64,
        /// Total tokens minted for this lot
        total_tokens_minted: u64,
        /// Current estimated value in USDC (6 decimals, e.g., 1000000 = $1)
        estimated_value_usdc: u64,
        /// IPFS hash of the warehouse receipt / legal document
        receipt_hash: String,
        /// Timestamp when lot was created
        created_at: u64,
        /// Timestamp when lot was closed (0 if still open)
        closed_at: u64,
        /// Total USDC surplus deposited for this lot
        total_surplus_deposited: u64,
        /// Total USDC surplus distributed to holders
        total_surplus_distributed: u64,
        /// Individual delivery records
        delivery_count: u64,
        /// Custodian who manages this lot
        custodian: address,
    }

    /// A Delivery records one farmer's contribution to a lot.
    /// Stored as individual objects owned by the lot.
    public struct Delivery has key, store {
        id: UID,
        lot_id: ID,
        /// Farmer's address
        farmer: address,
        /// Physical units delivered (e.g., kg)
        units: u64,
        /// Quality grade (e.g., "A", "B", "C")
        grade: String,
        /// IPFS hash of delivery receipt photo
        receipt_hash: String,
        /// Tokens minted for this delivery
        tokens_minted: u64,
        /// Timestamp
        delivered_at: u64,
    }

    /// SpiceToken — A fungible token representing a share in a specific lot.
    /// Each lot type gets its own token. Transferable, tradeable.
    public struct SpiceToken has key, store {
        id: UID,
        /// Which lot this token belongs to
        lot_id: ID,
        /// Asset type symbol (e.g., "NUTMG")
        asset_type_symbol: String,
        /// Lot number for display
        lot_number: u64,
        /// Number of tokens (1 token = 1 unit of the underlying asset)
        balance: u64,
    }

    /// Admin capability for managing the registry and creating asset types.
    public struct RegistryAdmin has key, store {
        id: UID,
    }

    /// Custodian capability — allows a specific address to manage lots.
    /// Issued per asset type (e.g., GCNA gets custodian cap for NUTMG).
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

    const ELotNotOpen: u64 = 100;
    const ELotNotSelling: u64 = 101;
    const ENotCustodian: u64 = 102;
    const EInvalidStatus: u64 = 103;
    const EAssetTypeNotActive: u64 = 104;
    const EInsufficientBalance: u64 = 105;
    const ELotMismatch: u64 = 106;

    // ============ Events ============

    public struct AssetTypeCreated has copy, drop {
        symbol: String,
        name: String,
        region: String,
        custodian: String,
    }

    public struct AssetTypeDeactivated has copy, drop {
        symbol: String,
    }

    public struct AssetTypeReactivated has copy, drop {
        symbol: String,
    }

    public struct CustodianCapIssued has copy, drop {
        asset_type_symbol: String,
        custodian_address: address,
    }

    public struct CustodianCapRevoked has copy, drop {
        asset_type_symbol: String,
    }

    public struct LotCreated has copy, drop {
        lot_id: ID,
        lot_number: u64,
        asset_type_symbol: String,
        custodian: address,
    }

    public struct DeliveryRecorded has copy, drop {
        lot_id: ID,
        farmer: address,
        units: u64,
        tokens_minted: u64,
        grade: String,
    }

    public struct LotStatusChanged has copy, drop {
        lot_id: ID,
        old_status: u8,
        new_status: u8,
    }

    public struct TokensTransferred has copy, drop {
        lot_id: ID,
        from: address,
        to: address,
        amount: u64,
    }

    public struct ValuationUpdated has copy, drop {
        lot_id: ID,
        old_value: u64,
        new_value: u64,
    }

    // ============ Init ============

    fun init(ctx: &mut TxContext) {
        let registry = Registry {
            id: object::new(ctx),
            lot_count: 0,
            asset_type_count: 0,
        };

        let admin = RegistryAdmin {
            id: object::new(ctx),
        };

        transfer::share_object(registry);
        transfer::transfer(admin, ctx.sender());
    }

    // ============ Admin Functions ============

    /// Register a new asset type (e.g., NUTMG, COCO, VILLA).
    /// Only callable by registry admin.
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

        // Create custodian capability
        let custodian_cap = CustodianCap {
            id: object::new(ctx),
            asset_type_symbol: symbol_str,
        };
        transfer::transfer(custodian_cap, custodian_address);

        event::emit(AssetTypeCreated {
            symbol: symbol_str,
            name: name_str,
            region: region_str,
            custodian: custodian_str,
        });

        let asset_type = AssetType {
            id: object::new(ctx),
            symbol: symbol_str,
            name: name_str,
            unit: string::utf8(unit),
            region: region_str,
            custodian: custodian_str,
            active: true,
        };

        transfer::share_object(asset_type);
    }

    /// Deactivate an asset type — prevents new lots from being created.
    /// Existing lots continue to function normally.
    public fun deactivate_asset_type(
        _admin: &RegistryAdmin,
        asset_type: &mut AssetType,
    ) {
        asset_type.active = false;
        event::emit(AssetTypeDeactivated {
            symbol: asset_type.symbol,
        });
    }

    /// Reactivate a previously deactivated asset type.
    public fun reactivate_asset_type(
        _admin: &RegistryAdmin,
        asset_type: &mut AssetType,
    ) {
        asset_type.active = true;
        event::emit(AssetTypeReactivated {
            symbol: asset_type.symbol,
        });
    }

    /// Issue a new CustodianCap for an asset type to a new address.
    /// Used to assign a new custodian (e.g., new GCNA staff member).
    /// Does NOT revoke existing caps — call revoke_custodian_cap separately if needed.
    public fun issue_custodian_cap(
        _admin: &RegistryAdmin,
        asset_type: &AssetType,
        new_custodian: address,
        ctx: &mut TxContext,
    ) {
        let cap = CustodianCap {
            id: object::new(ctx),
            asset_type_symbol: asset_type.symbol,
        };

        event::emit(CustodianCapIssued {
            asset_type_symbol: asset_type.symbol,
            custodian_address: new_custodian,
        });

        transfer::transfer(cap, new_custodian);
    }

    /// Revoke a custodian cap. The cap holder must send it to be destroyed.
    /// In practice: admin asks custodian to return cap, or cap is transferred
    /// to admin first, then destroyed here.
    public fun revoke_custodian_cap(
        _admin: &RegistryAdmin,
        cap: CustodianCap,
    ) {
        let symbol = cap.asset_type_symbol;
        let CustodianCap { id, asset_type_symbol: _ } = cap;
        object::delete(id);

        event::emit(CustodianCapRevoked {
            asset_type_symbol: symbol,
        });
    }

    /// Transfer a RegistryAdmin to a new owner.
    public fun transfer_registry_admin(
        admin: RegistryAdmin,
        new_owner: address,
    ) {
        transfer::transfer(admin, new_owner);
    }

    // ============ View Functions (AssetType) ============

    public fun asset_type_symbol(at: &AssetType): String { at.symbol }
    public fun asset_type_name(at: &AssetType): String { at.name }
    public fun asset_type_region(at: &AssetType): String { at.region }
    public fun asset_type_active(at: &AssetType): bool { at.active }

    // ============ Custodian Functions ============

    /// Create a new lot for an asset type.
    /// Only callable by the custodian for that asset type.
    public fun create_lot(
        cap: &CustodianCap,
        registry: &mut Registry,
        asset_type: &AssetType,
        receipt_hash: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext,
    ): ID {
        assert!(asset_type.active, EAssetTypeNotActive);
        assert!(cap.asset_type_symbol == asset_type.symbol, ENotCustodian);

        registry.lot_count = registry.lot_count + 1;

        let lot = Lot {
            id: object::new(ctx),
            lot_number: registry.lot_count,
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
            lot_number: registry.lot_count,
            asset_type_symbol: asset_type.symbol,
            custodian: ctx.sender(),
        });

        transfer::share_object(lot);
        lot_id
    }

    /// Record a delivery and mint tokens to the farmer.
    /// Only callable by the lot's custodian.
    public fun record_delivery(
        cap: &CustodianCap,
        lot: &mut Lot,
        farmer: address,
        units: u64,
        grade: vector<u8>,
        receipt_hash: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(lot.status == STATUS_OPEN, ELotNotOpen);
        assert!(cap.asset_type_symbol == lot.asset_type_symbol, ENotCustodian);

        // 1 token per unit (e.g., 1 NUTMG per kg)
        let tokens_to_mint = units;

        // Update lot totals
        lot.total_units = lot.total_units + units;
        lot.total_tokens_minted = lot.total_tokens_minted + tokens_to_mint;
        lot.delivery_count = lot.delivery_count + 1;

        let grade_str = string::utf8(grade);

        // Create delivery record
        let delivery = Delivery {
            id: object::new(ctx),
            lot_id: object::id(lot),
            farmer,
            units,
            grade: grade_str,
            receipt_hash: string::utf8(receipt_hash),
            tokens_minted: tokens_to_mint,
            delivered_at: sui::clock::timestamp_ms(clock),
        };

        // Mint SpiceTokens to the farmer
        let token = SpiceToken {
            id: object::new(ctx),
            lot_id: object::id(lot),
            asset_type_symbol: lot.asset_type_symbol,
            lot_number: lot.lot_number,
            balance: tokens_to_mint,
        };

        event::emit(DeliveryRecorded {
            lot_id: object::id(lot),
            farmer,
            units,
            tokens_minted: tokens_to_mint,
            grade: grade_str,
        });

        // Transfer token and delivery record
        transfer::transfer(token, farmer);
        transfer::transfer(delivery, farmer);
    }

    /// Update the estimated USDC value of a lot.
    /// Called by custodian or oracle.
    public fun update_valuation(
        cap: &CustodianCap,
        lot: &mut Lot,
        new_value_usdc: u64,
    ) {
        assert!(cap.asset_type_symbol == lot.asset_type_symbol, ENotCustodian);

        let old_value = lot.estimated_value_usdc;
        lot.estimated_value_usdc = new_value_usdc;

        event::emit(ValuationUpdated {
            lot_id: object::id(lot),
            old_value,
            new_value: new_value_usdc,
        });
    }

    /// Move lot to "selling" status — no more deliveries accepted.
    public fun start_selling(
        cap: &CustodianCap,
        lot: &mut Lot,
    ) {
        assert!(lot.status == STATUS_OPEN, ELotNotOpen);
        assert!(cap.asset_type_symbol == lot.asset_type_symbol, ENotCustodian);

        lot.status = STATUS_SELLING;
        event::emit(LotStatusChanged {
            lot_id: object::id(lot),
            old_status: STATUS_OPEN,
            new_status: STATUS_SELLING,
        });
    }

    /// Move lot to "distributing" status — surplus is being distributed.
    public fun start_distributing(
        cap: &CustodianCap,
        lot: &mut Lot,
    ) {
        assert!(lot.status == STATUS_SELLING, ELotNotSelling);
        assert!(cap.asset_type_symbol == lot.asset_type_symbol, ENotCustodian);

        lot.status = STATUS_DISTRIBUTING;
        event::emit(LotStatusChanged {
            lot_id: object::id(lot),
            old_status: STATUS_SELLING,
            new_status: STATUS_DISTRIBUTING,
        });
    }

    /// Close the lot. Final state.
    public fun close_lot(
        cap: &CustodianCap,
        lot: &mut Lot,
        clock: &Clock,
    ) {
        assert!(lot.status == STATUS_DISTRIBUTING, EInvalidStatus);
        assert!(cap.asset_type_symbol == lot.asset_type_symbol, ENotCustodian);

        lot.status = STATUS_CLOSED;
        lot.closed_at = sui::clock::timestamp_ms(clock);

        event::emit(LotStatusChanged {
            lot_id: object::id(lot),
            old_status: STATUS_DISTRIBUTING,
            new_status: STATUS_CLOSED,
        });
    }

    // ============ Token Operations ============

    /// Split tokens — take `amount` from a SpiceToken and create a new one.
    /// Used when a farmer wants to sell part of their holdings.
    public fun split_token(
        token: &mut SpiceToken,
        amount: u64,
        ctx: &mut TxContext,
    ): SpiceToken {
        assert!(token.balance >= amount, EInsufficientBalance);
        token.balance = token.balance - amount;

        SpiceToken {
            id: object::new(ctx),
            lot_id: token.lot_id,
            asset_type_symbol: token.asset_type_symbol,
            lot_number: token.lot_number,
            balance: amount,
        }
    }

    /// Merge two SpiceTokens from the same lot.
    public fun merge_tokens(
        token_a: &mut SpiceToken,
        token_b: SpiceToken,
    ) {
        assert!(token_a.lot_id == token_b.lot_id, ELotMismatch);

        let SpiceToken { id, lot_id: _, asset_type_symbol: _, lot_number: _, balance } = token_b;
        object::delete(id);
        token_a.balance = token_a.balance + balance;
    }

    /// Transfer a SpiceToken to another address.
    public fun transfer_token(
        token: SpiceToken,
        recipient: address,
    ) {
        let lot_id = token.lot_id;
        event::emit(TokensTransferred {
            lot_id,
            from: @0x0, // sender info comes from tx context
            to: recipient,
            amount: token.balance,
        });
        transfer::transfer(token, recipient);
    }

    // ============ View Functions ============

    public fun lot_status(lot: &Lot): u8 { lot.status }
    public fun lot_total_units(lot: &Lot): u64 { lot.total_units }
    public fun lot_total_tokens(lot: &Lot): u64 { lot.total_tokens_minted }
    public fun lot_value(lot: &Lot): u64 { lot.estimated_value_usdc }
    public fun lot_number(lot: &Lot): u64 { lot.lot_number }
    public fun lot_asset_type(lot: &Lot): String { lot.asset_type_symbol }
    public fun lot_surplus_deposited(lot: &Lot): u64 { lot.total_surplus_deposited }

    public fun token_balance(token: &SpiceToken): u64 { token.balance }
    public fun token_lot_id(token: &SpiceToken): ID { token.lot_id }
    public fun token_asset_type(token: &SpiceToken): String { token.asset_type_symbol }

    public fun registry_lot_count(registry: &Registry): u64 { registry.lot_count }

    // ============ Friend / Package Functions ============

    /// Called by yield_engine to record surplus deposits
    public(package) fun record_surplus_deposit(lot: &mut Lot, amount: u64) {
        lot.total_surplus_deposited = lot.total_surplus_deposited + amount;
    }

    /// Called by yield_engine to record distributions
    public(package) fun record_surplus_distribution(lot: &mut Lot, amount: u64) {
        lot.total_surplus_distributed = lot.total_surplus_distributed + amount;
    }

    // ============ Test Helpers ============

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
