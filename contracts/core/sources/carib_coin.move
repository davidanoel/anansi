/// CaribCoin (CARIB) — The protocol token for Anansi Technology Corporation.
/// Fixed supply of 10,000,000,000 CARIB. No inflation. Burns are permanent.
/// Powers fees, staking, governance, and access across all Anansi products.
module anansi::carib_coin;

use sui::coin::{Self, Coin, TreasuryCap, CoinMetadata};
use sui::event;
use sui::url;

// ============ One-Time Witness ============

/// OTW for coin creation. Must match module name in UPPERCASE.
public struct CARIB_COIN has drop {}

// ============ Objects ============

/// Treasury — controls minting and tracks total supply info.
/// Held by Foundation multi-sig after initial distribution.
public struct Treasury has key {
    id: UID,
    cap: TreasuryCap<CARIB_COIN>,
    /// Total tokens burned (cumulative, never decreases)
    total_burned: u64,
}

/// Admin capability for treasury operations.
/// Transferable — can be sent to a multi-sig address.
public struct AdminCap has key, store {
    id: UID,
}

// ============ Constants ============

/// Total supply: 10 billion CARIB with 9 decimals
const TOTAL_SUPPLY: u64 = 10_000_000_000_000_000_000; // 10B * 10^9
const DECIMALS: u8 = 9;

// ============ Errors ============

const ENotAuthorized: u64 = 0;
const EExceedsSupply: u64 = 1;

// ============ Events ============

public struct TokensBurned has copy, drop {
    amount: u64,
    burner: address,
    total_burned: u64,
}

public struct TokensMinted has copy, drop {
    amount: u64,
    recipient: address,
}

public struct TreasuryTransferred has copy, drop {
    new_owner: address,
}

// ============ Init ============

/// Called once at publish. Creates the CARIB currency and mints total supply.
fun init(witness: CARIB_COIN, ctx: &mut TxContext) {
    let (mut treasury_cap, metadata) = coin::create_currency<CARIB_COIN>(
        witness,
        DECIMALS,
        b"CARIB",
        b"CaribCoin",
        b"Protocol token for Anansi Technology Corporation. Participation, not permission.",
        option::some(
            url::new_unsafe_from_bytes(
                b"https://anansi.tech/caribcoin-icon.png",
            ),
        ),
        ctx,
    );

    // Mint the entire fixed supply to the publisher
    let total_coins = coin::mint(&mut treasury_cap, TOTAL_SUPPLY, ctx);
    transfer::public_transfer(total_coins, ctx.sender());

    // Wrap treasury cap in our Treasury object
    let treasury = Treasury {
        id: object::new(ctx),
        cap: treasury_cap,
        total_burned: 0,
    };

    // Create admin capability
    let admin_cap = AdminCap {
        id: object::new(ctx),
    };

    // Transfer to publisher (founder) — will later transfer to Foundation multi-sig
    transfer::transfer(treasury, ctx.sender());
    transfer::transfer(admin_cap, ctx.sender());

    // Freeze metadata so it can't be changed
    transfer::public_freeze_object(metadata);
}

// ============ Public Functions ============

/// Burn CARIB tokens permanently. Anyone can burn their own tokens.
/// This is the deflationary mechanism — fees are auto-converted and burned.
public fun burn(treasury: &mut Treasury, coins: Coin<CARIB_COIN>, ctx: &TxContext) {
    let amount = coin::value(&coins);
    coin::burn(&mut treasury.cap, coins);
    treasury.total_burned = treasury.total_burned + amount;

    event::emit(TokensBurned {
        amount,
        burner: ctx.sender(),
        total_burned: treasury.total_burned,
    });
}

/// Transfer the Treasury to a new owner (e.g., Foundation multi-sig).
/// Only callable by current holder.
public fun transfer_treasury(treasury: Treasury, recipient: address) {
    event::emit(TreasuryTransferred {
        new_owner: recipient,
    });
    transfer::transfer(treasury, recipient);
}

/// Transfer AdminCap to a new owner.
public fun transfer_admin(cap: AdminCap, recipient: address) {
    transfer::transfer(cap, recipient);
}

// ============ View Functions ============

/// Get total tokens burned
public fun total_burned(treasury: &Treasury): u64 {
    treasury.total_burned
}

/// Get circulating supply (total - burned)
public fun circulating_supply(treasury: &Treasury): u64 {
    TOTAL_SUPPLY - treasury.total_burned
}

/// Get the total supply constant
public fun total_supply(): u64 {
    TOTAL_SUPPLY
}

// ============ Test ============

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(CARIB_COIN {}, ctx);
}
