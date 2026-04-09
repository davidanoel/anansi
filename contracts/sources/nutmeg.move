/// NUTMEG — Standard Sui Coin representing tokenized Grenada nutmeg.
/// Backed by physical nutmeg deliveries recorded through GCNA.
///
/// TEMPLATE: To add a new commodity (e.g., cocoa), copy this file,
/// find-replace NUTMEG → COCOA, and update the metadata strings.
/// Then `sui client upgrade` — the core modules (asset_pool, yield_engine)
/// work with any Coin<T> automatically.
module anansi::nutmeg {
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::url;
    use sui::clock::Clock;
    use std::string::String;
    use anansi::asset_pool::{Self, CustodianCap, Lot};
    use anansi::compliance::{Self, ComplianceRegistry};

    // ============ One-Time Witness ============

    public struct NUTMEG has drop {}

    // ============ Objects ============

    /// Shared vault holding the TreasuryCap.
    /// Custodians mint via record_delivery. No one can mint arbitrarily.
    public struct MintVault has key {
        id: UID,
        cap: TreasuryCap<NUTMEG>,
    }

    // ============ Init ============

    fun init(witness: NUTMEG, ctx: &mut TxContext) {
        let (cap, metadata) = coin::create_currency(
            witness,
            6,                                  // decimals — matches USDC for clean math
            b"NUTMEG",                          // symbol
            b"Grenada Nutmeg",                  // name
            b"Tokenized Grenada nutmeg. Each token represents 1 unit (kg) of Grade A nutmeg backed by GCNA warehouse receipts.",
            option::some(url::new_unsafe_from_bytes(
                b"https://spice.anansi.tech/tokens/nutmeg.png"
            )),
            ctx,
        );

        // Freeze metadata — symbol/name/icon can't change after deployment
        transfer::public_freeze_object(metadata);

        // Share the mint vault so custodians can mint via record_delivery
        transfer::share_object(MintVault {
            id: object::new(ctx),
            cap,
        });
    }

    // ============ Delivery + Minting ============

    /// Record a delivery and mint NUTMEG to the farmer.
    /// This is the ONLY way to create new NUTMEG tokens.
    /// Checks compliance: farmer must be verified and not frozen.
    public fun record_delivery(
        vault: &mut MintVault,
        cap: &CustodianCap,
        lot: &mut Lot,
        registry: &ComplianceRegistry,
        farmer: address,
        units: u64,
        grade: vector<u8>,
        receipt_hash: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        // Compliance check — farmer must be verified and not frozen
        compliance::assert_can_participate(registry, farmer);

        // 1 unit = 1_000_000 smallest coin units (6 decimals, like USDC)
        let coin_amount = units * 1_000_000;

        // Record in lot — tracks both raw units and coin amount
        asset_pool::record_delivery(
            cap, lot, farmer, units, coin_amount, grade, receipt_hash, clock, ctx
        );

        // Mint Coin<NUTMEG> to farmer
        let coin = coin::mint(&mut vault.cap, coin_amount, ctx);
        transfer::public_transfer(coin, farmer);
    }

    // ============ View Functions ============

    /// Total NUTMEG supply across all lots
    public fun total_supply(vault: &MintVault): u64 {
        coin::total_supply(&vault.cap)
    }
}
