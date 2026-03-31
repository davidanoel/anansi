import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { execSync } from "child_process";

// Your deployed contract
const PACKAGE_ID = "0xdd44bb6b168efe26e8b4df958765a5e011b480ebf459452a882ae139ced8b492";
const REGISTRY_ID = "0x2c2df3cd9ad80bc53c7027277c1933b3a1bc71e4278ec9a516a110ce41cb08e0";
const REGISTRY_ADMIN_ID = "0x8a958e1617cfe4e0a506ff5099932ed46e904abd95f4a3cd1cff671ae519d0e1";

// Your zkLogin address (farmer receives tokens here)
const FARMER_ADDRESS = "0x7a584a2f129f2823705bde5d4734cff9c09ae3532c521c332beee1d7d088e588";

// Get the active Sui CLI keypair
function getKeypair() {
  const output = execSync(
    "sui keytool export --key-identity 0x5e8388bacd2da180d38bbeceee2bdd2ad68958747d92f678af59bae8078a46d8 --json",
    { encoding: "utf8" },
  );
  const data = JSON.parse(output);

  if (!data?.exportedPrivateKey) {
    throw new Error("sui keytool export did not return exportedPrivateKey");
  }

  const decoded = decodeSuiPrivateKey(data.exportedPrivateKey);
  if (decoded.schema !== "ED25519") {
    throw new Error(`Unsupported key scheme: ${decoded.schema}`);
  }

  return Ed25519Keypair.fromSecretKey(decoded.secretKey);
}

const client = new SuiClient({ url: getFullnodeUrl("testnet") });
const SENDER = "0x5e8388bacd2da180d38bbeceee2bdd2ad68958747d92f678af59bae8078a46d8";

async function signAndExecute(tx) {
  tx.setSender(SENDER);
  const keypair = getKeypair();
  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showObjectChanges: true },
  });
  return result;
}

async function main() {
  const step = process.argv[2];

  if (step === "create-asset") {
    console.log("Creating NUTMG asset type...");
    const tx = new Transaction();

    const assetType = tx.moveCall({
      target: `${PACKAGE_ID}::asset_pool::create_asset_type`,
      arguments: [
        tx.object(REGISTRY_ADMIN_ID),
        tx.object(REGISTRY_ID),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode("NUTMG"))),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode("Grenada Nutmeg"))),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode("kg"))),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode("Grenada"))),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode("GCNA"))),
        tx.pure.address(SENDER),
      ],
    });

    // Transfer the returned AssetType to our address
    tx.transferObjects([assetType], tx.pure.address(SENDER));

    const result = await signAndExecute(tx);
    console.log("Status:", result.effects?.status?.status);
    console.log("Digest:", result.digest);

    // Find created objects
    const created = result.objectChanges?.filter((c) => c.type === "created") || [];
    for (const obj of created) {
      console.log(`Created: ${obj.objectType} → ${obj.objectId}`);
    }
    console.log("\nSave the AssetType and CustodianCap IDs for the next step.");
  } else if (step === "create-lot") {
    const custodianCapId = process.argv[3];
    const assetTypeId = process.argv[4];
    if (!custodianCapId || !assetTypeId) {
      console.log("Usage: node setup.js create-lot CUSTODIAN_CAP_ID ASSET_TYPE_ID");
      return;
    }

    console.log("Creating lot...");
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::asset_pool::create_lot`,
      arguments: [
        tx.object(custodianCapId),
        tx.object(REGISTRY_ID),
        tx.object(assetTypeId),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode("initial-receipt"))),
        tx.object("0x6"),
      ],
    });

    const result = await signAndExecute(tx);
    console.log("Status:", result.effects?.status?.status);
    console.log("Digest:", result.digest);

    const created = result.objectChanges?.filter((c) => c.type === "created") || [];
    for (const obj of created) {
      console.log(`Created: ${obj.objectType} → ${obj.objectId}`);
    }
    console.log("\nSave the Lot ID for the next step.");
  } else if (step === "deliver") {
    const custodianCapId = process.argv[3];
    const lotId = process.argv[4];
    const kgs = parseInt(process.argv[5] || "100");
    if (!custodianCapId || !lotId) {
      console.log("Usage: node setup.js deliver CUSTODIAN_CAP_ID LOT_ID [KG]");
      return;
    }

    console.log(`Recording delivery: ${kgs} kg to farmer ${FARMER_ADDRESS}...`);
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::asset_pool::record_delivery`,
      arguments: [
        tx.object(custodianCapId),
        tx.object(lotId),
        tx.pure.address(FARMER_ADDRESS),
        tx.pure.u64(kgs),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode("A"))),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode("test-receipt-hash"))),
        tx.object("0x6"),
      ],
    });

    const result = await signAndExecute(tx);
    console.log("Status:", result.effects?.status?.status);
    console.log("Digest:", result.digest);

    const created = result.objectChanges?.filter((c) => c.type === "created") || [];
    for (const obj of created) {
      console.log(`Created: ${obj.objectType} → ${obj.objectId}`);
    }
    console.log(`\n${kgs} NUTMG tokens minted to farmer ${FARMER_ADDRESS}`);
    console.log("Open the Spice app farmer view to see them!");
  } else {
    console.log("Anansi Setup Script");
    console.log("---");
    console.log("Usage:");
    console.log("  node setup.js create-asset                          Create NUTMG asset type");
    console.log("  node setup.js create-lot CUSTODIAN_CAP ASSET_TYPE   Create a new lot");
    console.log("  node setup.js deliver CUSTODIAN_CAP LOT_ID [KG]     Record delivery to farmer");
  }
}

main().catch(console.error);
