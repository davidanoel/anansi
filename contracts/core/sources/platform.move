/// Platform — System-level admin controls, emergency pause, and configuration.
/// Coordinates across all other modules.
module anansi::platform;

use std::string::{Self, String};
use sui::event;

// ============ Objects ============

/// Global platform state. Shared object.
public struct Platform has key {
    id: UID,
    /// Whether the platform is paused (emergency stop)
    paused: bool,
    /// Platform version string
    version: String,
    /// Pause reason (empty if not paused)
    pause_reason: String,
}

/// Super admin capability — can pause/unpause the platform.
/// Should be held by a multi-sig in production.
public struct SuperAdmin has key, store {
    id: UID,
}

// ============ Errors ============

const EPlatformPaused: u64 = 400;

// ============ Events ============

public struct PlatformPaused has copy, drop {
    reason: String,
    paused_by: address,
}

public struct PlatformUnpaused has copy, drop {
    unpaused_by: address,
}

// ============ Init ============

fun init(ctx: &mut TxContext) {
    let platform = Platform {
        id: object::new(ctx),
        paused: false,
        version: string::utf8(b"0.1.0"),
        pause_reason: string::utf8(b""),
    };

    let admin = SuperAdmin {
        id: object::new(ctx),
    };

    transfer::share_object(platform);
    transfer::transfer(admin, ctx.sender());
}

// ============ Admin Functions ============

/// Emergency pause — stops all platform operations.
public fun pause(
    _admin: &SuperAdmin,
    platform: &mut Platform,
    reason: vector<u8>,
    ctx: &TxContext,
) {
    platform.paused = true;
    platform.pause_reason = string::utf8(reason);

    event::emit(PlatformPaused {
        reason: string::utf8(reason),
        paused_by: ctx.sender(),
    });
}

/// Unpause the platform.
public fun unpause(_admin: &SuperAdmin, platform: &mut Platform, ctx: &TxContext) {
    platform.paused = false;
    platform.pause_reason = string::utf8(b"");

    event::emit(PlatformUnpaused {
        unpaused_by: ctx.sender(),
    });
}

/// Transfer super admin to a new address (e.g., multi-sig).
public fun transfer_super_admin(admin: SuperAdmin, recipient: address) {
    transfer::transfer(admin, recipient);
}

// ============ Check Functions ============

/// Assert platform is not paused. Call this at the start of critical operations.
public fun assert_not_paused(platform: &Platform) {
    assert!(!platform.paused, EPlatformPaused);
}

public fun is_paused(platform: &Platform): bool {
    platform.paused
}

public fun version(platform: &Platform): String {
    platform.version
}

// ============ Test Helpers ============

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
