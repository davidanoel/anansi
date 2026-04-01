import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

let client = null;
let keypair = null;

function getClient() {
  if (!client) {
    client = new SuiClient({
      url: process.env.NEXT_PUBLIC_SUI_RPC_URL || getFullnodeUrl("testnet"),
    });
  }
  return client;
}

function getAdminKeypair() {
  if (!keypair) {
    const privateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("ADMIN_PRIVATE_KEY not set in environment");
    }
    keypair = Ed25519Keypair.fromSecretKey(privateKey);
  }
  return keypair;
}

export function getAdminAddress() {
  return getAdminKeypair().getPublicKey().toSuiAddress();
}

export async function adminExecute(tx) {
  const client = getClient();
  const kp = getAdminKeypair();
  tx.setSender(kp.getPublicKey().toSuiAddress());
  const result = await client.signAndExecuteTransaction({
    signer: kp,
    transaction: tx,
    options: { showEffects: true, showObjectChanges: true, showEvents: true },
  });
  return result;
}

// PACKAGE_ID = upgraded package (for function calls)
// ORIGINAL_PACKAGE_ID = first published package (for object type filters)
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
const ORIGINAL_PACKAGE_ID = process.env.NEXT_PUBLIC_ORIGINAL_PACKAGE_ID || PACKAGE_ID;
const REGISTRY_ID = process.env.NEXT_PUBLIC_REGISTRY_ID;

export async function getAdminCapId() {
  const client = getClient();
  const address = getAdminAddress();
  const type = `${ORIGINAL_PACKAGE_ID}::asset_pool::RegistryAdmin`;
  const result = await client.getOwnedObjects({
    owner: address,
    filter: { StructType: type },
    options: { showContent: true },
  });
  if (result.data.length === 0) {
    throw new Error("No RegistryAdmin capability found for admin address");
  }
  return result.data[0].data?.objectId;
}

export async function getAllCustodianCaps() {
  const client = getClient();
  const events = await client.queryEvents({
    query: { MoveEventType: `${PACKAGE_ID}::asset_pool::CustodianCapIssued` },
    limit: 100,
    order: "descending",
  });
  // Also check original package events
  const eventsOld = await client.queryEvents({
    query: { MoveEventType: `${ORIGINAL_PACKAGE_ID}::asset_pool::CustodianCapIssued` },
    limit: 100,
    order: "descending",
  });
  const all = [...events.data, ...eventsOld.data];
  // Dedupe by timestamp
  const seen = new Set();
  return all
    .filter((e) => {
      const key = `${e.parsedJson?.asset_type_symbol}-${e.parsedJson?.custodian_address}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((e) => ({
      assetTypeSymbol: e.parsedJson?.asset_type_symbol,
      custodianAddress: e.parsedJson?.custodian_address,
      timestamp: Number(e.timestampMs || 0),
    }));
}

export async function getOwnedAssetTypes() {
  const client = getClient();

  // Query both old and new package events
  const [eventsNew, eventsOld] = await Promise.all([
    client.queryEvents({
      query: { MoveEventType: `${PACKAGE_ID}::asset_pool::AssetTypeCreated` },
      limit: 50,
      order: "descending",
    }),
    client.queryEvents({
      query: { MoveEventType: `${ORIGINAL_PACKAGE_ID}::asset_pool::AssetTypeCreated` },
      limit: 50,
      order: "descending",
    }),
  ]);

  const allEvents = [...eventsNew.data, ...eventsOld.data];

  // Get the actual shared objects by looking at transaction effects
  const assetTypes = [];
  for (const event of allEvents) {
    try {
      const tx = await client.getTransactionBlock({
        digest: event.id.txDigest,
        options: { showObjectChanges: true },
      });
      const created = tx.objectChanges?.find(
        (c) => c.type === "created" && c.objectType?.includes("::asset_pool::AssetType"),
      );
      if (created) {
        const obj = await client.getObject({
          id: created.objectId,
          options: { showContent: true },
        });
        const fields = obj.data?.content?.fields || {};
        assetTypes.push({
          id: created.objectId,
          symbol: fields.symbol,
          name: fields.name,
          unit: fields.unit,
          region: fields.region,
          custodian: fields.custodian,
          active: fields.active,
        });
      }
    } catch (err) {
      console.error("Failed to fetch asset type:", err);
    }
  }

  return assetTypes;
}

export async function createAssetType({
  symbol,
  name,
  unit,
  region,
  custodianName,
  custodianAddress,
}) {
  const adminCapId = await getAdminCapId();
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::asset_pool::create_asset_type`,
    arguments: [
      tx.object(adminCapId),
      tx.object(REGISTRY_ID),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(symbol))),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(name))),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(unit))),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(region))),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(custodianName))),
      tx.pure.address(custodianAddress),
    ],
  });
  return adminExecute(tx);
}

export async function deactivateAssetType(assetTypeId) {
  const adminCapId = await getAdminCapId();
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::asset_pool::deactivate_asset_type`,
    arguments: [tx.object(adminCapId), tx.object(assetTypeId)],
  });
  return adminExecute(tx);
}

export async function reactivateAssetType(assetTypeId) {
  const adminCapId = await getAdminCapId();
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::asset_pool::reactivate_asset_type`,
    arguments: [tx.object(adminCapId), tx.object(assetTypeId)],
  });
  return adminExecute(tx);
}

export async function issueCustodianCap(assetTypeId, newCustodianAddress) {
  const adminCapId = await getAdminCapId();
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::asset_pool::issue_custodian_cap`,
    arguments: [
      tx.object(adminCapId),
      tx.object(assetTypeId),
      tx.pure.address(newCustodianAddress),
    ],
  });
  return adminExecute(tx);
}

export async function getAdminStats() {
  const client = getClient();
  const address = getAdminAddress();
  const [assetTypes, registryObj] = await Promise.all([
    getOwnedAssetTypes(),
    client.getObject({ id: REGISTRY_ID, options: { showContent: true } }),
  ]);
  const regFields = registryObj.data?.content?.fields || {};
  return {
    adminAddress: address,
    assetTypes: assetTypes.length,
    totalLots: Number(regFields.lot_count || 0),
    totalAssetTypes: Number(regFields.asset_type_count || 0),
  };
}
