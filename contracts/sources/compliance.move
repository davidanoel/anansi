/// Compliance — KYC/AML whitelist management and transfer restriction enforcement.
/// Jurisdiction-aware: different lots/asset types can have different compliance rules.
module anansi::compliance {
    use sui::event;
    use sui::table::{Self, Table};
    use std::string::{Self, String};

    // ============ Objects ============

    /// Global compliance registry. Shared object.
    public struct ComplianceRegistry has key {
        id: UID,
        /// address => KYC status (true = verified)
        verified_users: Table<address, UserProfile>,
        /// Total verified users
        user_count: u64,
        /// Whether compliance checks are enforced (can be disabled for testnet)
        enforcement_enabled: bool,
    }

    /// User KYC profile stored in the compliance registry.
    public struct UserProfile has store, drop {
        /// Whether KYC is complete and valid
        verified: bool,
        /// Jurisdiction code (e.g., "US", "GD" for Grenada, "TT" for Trinidad)
        jurisdiction: String,
        /// KYC provider reference (external ID)
        provider_ref: String,
        /// Timestamp of verification
        verified_at: u64,
        /// User role: 0=buyer, 1=farmer, 2=custodian, 3=admin
        role: u8,
        /// Whether this address is frozen (regulatory hold)
        frozen: bool,
    }

    /// Admin capability for compliance operations.
    public struct ComplianceAdmin has key, store {
        id: UID,
    }

    // ============ Constants ============

    const ROLE_BUYER: u8 = 0;
    const ROLE_FARMER: u8 = 1;
    const ROLE_CUSTODIAN: u8 = 2;
    const ROLE_ADMIN: u8 = 3;

    // ============ Errors ============

    const ENotVerified: u64 = 300;
    const EUserFrozen: u64 = 301;
    const EAlreadyRegistered: u64 = 302;
    const EUserNotFound: u64 = 303;
    const EComplianceCheckFailed: u64 = 304;

    // ============ Events ============

    public struct UserVerified has copy, drop {
        user: address,
        jurisdiction: String,
        role: u8,
    }

    public struct UserFrozen has copy, drop {
        user: address,
        reason: String,
    }

    public struct UserUnfrozen has copy, drop {
        user: address,
    }

    // ============ Init ============

    fun init(ctx: &mut TxContext) {
        let registry = ComplianceRegistry {
            id: object::new(ctx),
            verified_users: table::new(ctx),
            user_count: 0,
            enforcement_enabled: false, // Disabled for MVP/testnet
        };

        let admin = ComplianceAdmin {
            id: object::new(ctx),
        };

        transfer::share_object(registry);
        transfer::transfer(admin, ctx.sender());
    }

    // ============ Admin Functions ============

    /// Register and verify a user (called after off-chain KYC completion).
    public fun verify_user(
        _admin: &ComplianceAdmin,
        registry: &mut ComplianceRegistry,
        user: address,
        jurisdiction: vector<u8>,
        provider_ref: vector<u8>,
        role: u8,
        timestamp: u64,
    ) {
        let jurisdiction_str = string::utf8(jurisdiction);

        let profile = UserProfile {
            verified: true,
            jurisdiction: jurisdiction_str,
            provider_ref: string::utf8(provider_ref),
            verified_at: timestamp,
            role,
            frozen: false,
        };

        if (table::contains(&registry.verified_users, user)) {
            let existing = table::borrow_mut(&mut registry.verified_users, user);
            *existing = profile;
        } else {
            table::add(&mut registry.verified_users, user, profile);
            registry.user_count = registry.user_count + 1;
        };

        event::emit(UserVerified {
            user,
            jurisdiction: jurisdiction_str,
            role,
        });
    }

    /// Freeze a user's address (regulatory compliance).
    public fun freeze_user(
        _admin: &ComplianceAdmin,
        registry: &mut ComplianceRegistry,
        user: address,
        reason: vector<u8>,
    ) {
        assert!(table::contains(&registry.verified_users, user), EUserNotFound);
        let profile = table::borrow_mut(&mut registry.verified_users, user);
        profile.frozen = true;

        event::emit(UserFrozen {
            user,
            reason: string::utf8(reason),
        });
    }

    /// Unfreeze a user's address.
    public fun unfreeze_user(
        _admin: &ComplianceAdmin,
        registry: &mut ComplianceRegistry,
        user: address,
    ) {
        assert!(table::contains(&registry.verified_users, user), EUserNotFound);
        let profile = table::borrow_mut(&mut registry.verified_users, user);
        profile.frozen = false;

        event::emit(UserUnfrozen { user });
    }

    /// Toggle enforcement on/off (for testnet/mainnet switch).
    public fun set_enforcement(
        _admin: &ComplianceAdmin,
        registry: &mut ComplianceRegistry,
        enabled: bool,
    ) {
        registry.enforcement_enabled = enabled;
    }

    // ============ Check Functions ============

    /// Check if a user can participate (verified and not frozen).
    /// Returns true if enforcement is disabled (testnet) or user is compliant.
    public fun can_participate(
        registry: &ComplianceRegistry,
        user: address,
    ): bool {
        if (!registry.enforcement_enabled) {
            return true
        };

        if (!table::contains(&registry.verified_users, user)) {
            return false
        };

        let profile = table::borrow(&registry.verified_users, user);
        profile.verified && !profile.frozen
    }

    /// Assert that a user can participate (reverts if not).
    public fun assert_can_participate(
        registry: &ComplianceRegistry,
        user: address,
    ) {
        assert!(can_participate(registry, user), EComplianceCheckFailed);
    }

    // ============ View Functions ============

    public fun is_verified(registry: &ComplianceRegistry, user: address): bool {
        if (!table::contains(&registry.verified_users, user)) {
            return false
        };
        let profile = table::borrow(&registry.verified_users, user);
        profile.verified
    }

    public fun is_frozen(registry: &ComplianceRegistry, user: address): bool {
        if (!table::contains(&registry.verified_users, user)) {
            return false
        };
        let profile = table::borrow(&registry.verified_users, user);
        profile.frozen
    }

    public fun user_count(registry: &ComplianceRegistry): u64 {
        registry.user_count
    }

    public fun enforcement_enabled(registry: &ComplianceRegistry): bool {
        registry.enforcement_enabled
    }

    // ============ Test Helpers ============

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
