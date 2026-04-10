/// NUTMEG — Standard Sui Coin representing tokenized Grenada nutmeg.
/// Backed by physical nutmeg deliveries recorded through GCNA.
///
/// This is a SEPARATE PACKAGE from the core platform.
/// It imports anansi::asset_pool and anansi::compliance from core.
module anansi_nutmeg::nutmeg {
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::url;
    use sui::clock::Clock;
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
            6,                                  // decimals
            b"NUTMEG",                          // symbol
            b"Grenada Nutmeg",                  // name
            b"Tokenized Grenada nutmeg. Each token represents 1 unit (kg) of Grade A nutmeg backed by GCNA warehouse receipts.",
            option::some(url::new_unsafe_from_bytes(
                b"https://spice.anansi.tech/tokens/nutmeg.png"
            )),
            ctx,
        );

        transfer::public_freeze_object(metadata);

        transfer::share_object(MintVault {
            id: object::new(ctx),
            cap,
        });
    }

    // ============ Delivery + Minting ============

    /// Record a delivery and mint NUTMEG to the farmer.
    /// Calls core asset_pool::record_delivery (public) for lot tracking,
    /// then mints the corresponding Coin<NUTMEG>.
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
        // Compliance check
        compliance::assert_can_participate(registry, farmer);

        // 1 unit = 1_000_000 smallest coin units (6 decimals)
        let coin_amount = units * 1_000_000;

        // Record in lot (core package — public, authorized by CustodianCap)
        asset_pool::record_delivery(
            cap, lot, farmer, units, coin_amount, grade, receipt_hash, clock, ctx
        );

        // Mint Coin<NUTMEG> to farmer
        let coin = coin::mint(&mut vault.cap, coin_amount, ctx);
        transfer::public_transfer(coin, farmer);
    }

    // ============ View Functions ============

    public fun total_supply(vault: &MintVault): u64 {
        coin::total_supply(&vault.cap)
    }
}
