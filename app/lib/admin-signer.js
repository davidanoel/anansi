// ============================================================
// Server-side admin signer — platform admin transactions
// ============================================================

import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { CetusClmmSDK } from "@cetusprotocol/sui-clmm-sdk";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { USDC_TYPE, getToken } from "./constants";
import Decimal from "decimal.js";

let client = null;
let keypair = null;

function getClient() {
  if (!client) {
    client = new SuiJsonRpcClient({
      network: process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet",
      url:
        process.env.SUI_RPC_URL ||
        getJsonRpcFullnodeUrl(process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet"),
    });
  }
  return client;
}

function getAdminKeypair() {
  if (!keypair) {
    const privateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!privateKey) throw new Error("ADMIN_PRIVATE_KEY not set");
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

  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await client.signAndExecuteTransaction({
        signer: kp,
        transaction: tx,
        options: { showEffects: true, showObjectChanges: true, showEvents: true },
      });

      const status =
        result?.effects?.status?.status ||
        result?.effects?.status?.$kind ||
        result?.effects?.status;
      const errorMessage =
        result?.effects?.status?.error ||
        result?.effects?.status?.Failure?.error ||
        result?.effects?.status?.failure;

      if (String(status).toLowerCase() !== "success") {
        throw new Error(
          errorMessage
            ? `Transaction execution failed: ${errorMessage}`
            : `Transaction execution failed with status: ${status || "unknown"}`,
        );
      }

      console.log("adminExecute success:", result.digest);
      return result;
    } catch (err) {
      lastError = err;
      console.log(`adminExecute attempt ${attempt + 1} failed:`, err.message);
      if (attempt < 2) await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw lastError;
}

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
const ORIGINAL_PACKAGE_ID = process.env.NEXT_PUBLIC_ORIGINAL_PACKAGE_ID || PACKAGE_ID;
const REGISTRY_ID = process.env.NEXT_PUBLIC_REGISTRY_ID;

// Minimum USDC balance in admin wallet to bother converting.
// Below this we leave it in place and wait for more to accumulate.
const MIN_CONVERSION_DUST_USDC = 0.01;

// Max slippage on fee-conversion swaps (5%).
// Generous because conversion happens at protocol pace, not user pace.
const FEE_CONVERSION_SLIPPAGE = 0.05;

// Time to wait after TX1 for the coin to be indexed before TX2 scans for it.
const INDEXING_DELAY_MS = 2000;

// ============================================================
// Queries
// ============================================================

export async function getAdminCapId() {
  const client = getClient();
  const type = `${ORIGINAL_PACKAGE_ID}::asset_pool::RegistryAdmin`;
  const result = await client.getOwnedObjects({
    owner: getAdminAddress(),
    filter: { StructType: type },
    options: { showContent: true },
  });
  if (result.data.length === 0) throw new Error("No RegistryAdmin found");
  return result.data[0].data?.objectId;
}

export async function getAllCustodianCaps() {
  const client = getClient();

  const created = await client.queryEvents({
    query: { MoveEventType: `${PACKAGE_ID}::asset_pool::AssetTypeCreated` },
    limit: 100,
    order: "descending",
  });

  const issued = await client.queryEvents({
    query: { MoveEventType: `${PACKAGE_ID}::asset_pool::CustodianCapIssued` },
    limit: 100,
    order: "descending",
  });

  let issuedOld = { data: [] };
  if (ORIGINAL_PACKAGE_ID !== PACKAGE_ID) {
    issuedOld = await client.queryEvents({
      query: { MoveEventType: `${ORIGINAL_PACKAGE_ID}::asset_pool::CustodianCapIssued` },
      limit: 100,
      order: "descending",
    });
  }

  const caps = [];
  const seen = new Set();

  for (const e of created.data) {
    try {
      const tx = await client.getTransactionBlock({
        digest: e.id.txDigest,
        options: { showObjectChanges: true },
      });
      const capObj = tx.objectChanges?.find(
        (c) => c.type === "created" && c.objectType?.includes("::asset_pool::CustodianCap"),
      );
      if (capObj) {
        const addr = capObj.owner?.AddressOwner;
        const key = `${e.parsedJson?.symbol}-${addr}`;
        if (!seen.has(key)) {
          seen.add(key);
          caps.push({
            assetTypeSymbol: e.parsedJson?.symbol,
            custodianAddress: addr,
            timestamp: Number(e.timestampMs || 0),
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch custodian:", err);
    }
  }

  for (const e of [...issued.data, ...issuedOld.data]) {
    const key = `${e.parsedJson?.asset_type_symbol}-${e.parsedJson?.custodian_address}`;
    if (!seen.has(key)) {
      seen.add(key);
      caps.push({
        assetTypeSymbol: e.parsedJson?.asset_type_symbol,
        custodianAddress: e.parsedJson?.custodian_address,
        timestamp: Number(e.timestampMs || 0),
      });
    }
  }

  return caps;
}

export async function getOwnedAssetTypes() {
  const client = getClient();

  const events = await client.queryEvents({
    query: { MoveEventType: `${PACKAGE_ID}::asset_pool::AssetTypeCreated` },
    limit: 50,
    order: "descending",
  });

  let allEvents = [...events.data];
  if (ORIGINAL_PACKAGE_ID !== PACKAGE_ID) {
    const eventsOld = await client.queryEvents({
      query: { MoveEventType: `${ORIGINAL_PACKAGE_ID}::asset_pool::AssetTypeCreated` },
      limit: 50,
      order: "descending",
    });
    allEvents = [...allEvents, ...eventsOld.data];
  }

  const assetTypes = [];
  const seenIds = new Set();

  for (const event of allEvents) {
    try {
      const tx = await client.getTransactionBlock({
        digest: event.id.txDigest,
        options: { showObjectChanges: true },
      });
      const created = tx.objectChanges?.find(
        (c) => c.type === "created" && c.objectType?.includes("::asset_pool::AssetType"),
      );
      if (created && !seenIds.has(created.objectId)) {
        seenIds.add(created.objectId);
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

// ============================================================
// Admin Transactions
// ============================================================

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

// ============================================================
// PRIMARY ENTRY POINT
// ============================================================

/**
 * Deposit surplus and auto-convert the fee to CARIB (burn + treasury split).
 *
 * Flow:
 *   TX1: yield_engine::deposit_surplus → fee coin to admin wallet
 *   TX2: swap THAT SPECIFIC COIN → CARIB, then fee_converter::process_fee
 *
 * @param {string} lotId
 * @param {number} usdcAmount - gross surplus in human USDC (e.g., 2 = $2)
 * @param {string} tokenSymbol - NUTMEG, COCOA, COFFEE, etc.
 * @param {object} [options]
 * @param {boolean} [options.skipConversion=false]
 * @returns {Promise<object>}
 */
export async function adminDepositSurplusWithFeeConversion(
  lotId,
  usdcAmount,
  tokenSymbol,
  options = {},
) {
  const client = getClient();
  const address = getAdminAddress();
  const amountUnits = Math.floor(usdcAmount * 10 ** 6);

  if (!tokenSymbol) throw new Error("tokenSymbol is required");

  const token = getToken(tokenSymbol);
  if (!token?.type) throw new Error(`No coinType for ${tokenSymbol}`);

  const tokenConfig = JSON.parse(process.env.NEXT_PUBLIC_TOKEN_CONFIG || "{}");
  const config = tokenConfig[tokenSymbol];
  if (!config?.mintVault) {
    throw new Error(`No mintVault configured for ${tokenSymbol}`);
  }

  // ---------- TX1: deposit_surplus ----------

  const { data: usdcCoins } = await client.getCoins({
    owner: address,
    coinType: USDC_TYPE,
  });
  if (usdcCoins.length === 0) throw new Error("No USDC in admin wallet");

  // Verify admin has enough USDC for the deposit
  const totalUsdcRaw = usdcCoins.reduce((sum, c) => sum + BigInt(c.balance), 0n);
  if (totalUsdcRaw < BigInt(amountUnits)) {
    throw new Error(`Insufficient USDC: need ${usdcAmount}, have ${Number(totalUsdcRaw) / 1e6}`);
  }

  const tx1 = new Transaction();

  if (usdcCoins.length > 1) {
    const others = usdcCoins.slice(1).map((c) => tx1.object(c.coinObjectId));
    tx1.mergeCoins(tx1.object(usdcCoins[0].coinObjectId), others);
  }

  const vaultObj = await client.getObject({
    id: config.mintVault,
    options: { showContent: true },
  });
  const totalSupply = Number(
    vaultObj.data?.content?.fields?.cap?.fields?.total_supply?.fields?.value || 0,
  );
  if (totalSupply === 0) {
    throw new Error(`No ${tokenSymbol} tokens minted yet — record deliveries first`);
  }

  // deposit_surplus returns Coin<USDC> (the fee) — transfer to admin wallet
  const [feeCoin] = tx1.moveCall({
    target: `${PACKAGE_ID}::yield_engine::deposit_surplus`,
    typeArguments: [USDC_TYPE, token.type],
    arguments: [
      tx1.object(process.env.NEXT_PUBLIC_YIELD_ENGINE_ID),
      tx1.object(lotId),
      tx1.object(usdcCoins[0].coinObjectId),
      tx1.pure.u64(amountUnits),
      tx1.pure.u64(totalSupply),
      tx1.object("0x6"),
    ],
  });
  tx1.transferObjects([feeCoin], tx1.pure.address(address));

  const depositResult = await adminExecute(tx1);

  // ---------- Extract the fee coin object ID from TX1 ----------

  // The fee coin is a newly-created Coin<USDC> owned by admin.
  // Find it in the objectChanges.
  const feeCoinChange = depositResult.objectChanges?.find(
    (c) =>
      c.type === "created" &&
      c.objectType === `0x2::coin::Coin<${USDC_TYPE}>` &&
      c.owner?.AddressOwner === address,
  );

  if (!feeCoinChange) {
    return {
      depositDigest: depositResult.digest,
      conversionDigest: null,
      feeConverted: false,
      reason:
        "Could not locate fee coin in tx result — manual recovery needed. Check admin wallet and run adminRecoverStuckFees.",
      recoverable: true,
    };
  }

  const feeCoinId = feeCoinChange.objectId;
  const feeAmount = Math.floor(amountUnits * 0.01); // 1% fee, for logging

  console.log(
    `[fee-conversion] TX1 deposited ${usdcAmount} USDC surplus. Fee coin ${feeCoinId} holds ~${feeAmount / 1e6} USDC.`,
  );

  // ---------- TX2: swap + process_fee (on THAT SPECIFIC COIN only) ----------

  if (options.skipConversion) {
    return {
      depositDigest: depositResult.digest,
      feeCoinId,
      conversionDigest: null,
      feeConverted: false,
      reason: "skipConversion=true — fee held as USDC in admin wallet",
    };
  }

  const poolReady = Boolean(
    process.env.NEXT_PUBLIC_CARIB_POOL_ID &&
    process.env.NEXT_PUBLIC_CARIB_TYPE &&
    process.env.NEXT_PUBLIC_FEE_CONVERTER_ID &&
    process.env.NEXT_PUBLIC_CARIB_TREASURY_ID,
  );
  if (!poolReady) {
    return {
      depositDigest: depositResult.digest,
      feeCoinId,
      conversionDigest: null,
      feeConverted: false,
      reason: "CARIB/USDC pool or fee_converter not configured — fee held in admin wallet",
    };
  }

  await new Promise((r) => setTimeout(r, INDEXING_DELAY_MS));

  try {
    const conversionResult = await convertSpecificUsdcCoin({
      feeCoinId,
      sourceTag: `spice_surplus:${tokenSymbol}`,
      lotId,
    });
    return {
      depositDigest: depositResult.digest,
      feeCoinId,
      conversionDigest: conversionResult.digest,
      feeConverted: conversionResult.converted,
      burned: conversionResult.burned,
      toTreasury: conversionResult.toTreasury,
    };
  } catch (err) {
    console.error(
      `TX2 failed for fee coin ${feeCoinId} — recover via adminConvertSpecificUsdcCoin('${feeCoinId}'):`,
      err,
    );
    return {
      depositDigest: depositResult.digest,
      feeCoinId,
      conversionDigest: null,
      feeConverted: false,
      reason: `TX2 failed: ${err.message}`,
      recoverable: true,
    };
  }
}

// ============================================================
// Convert a SPECIFIC USDC coin → CARIB, then process
// Safe: only touches the coin you name.
// ============================================================

/**
 * Swap a specific USDC coin (by objectId) into CARIB, then process_fee.
 *
 * This is the narrow, safe path. It touches ONLY the named coin.
 *
 * Use cases:
 *   - Called automatically as TX2 after deposit_surplus
 *   - Called manually to recover a specific stuck fee coin
 *
 * @param {object} params
 * @param {string} params.feeCoinId - the objectId of the Coin<USDC> to convert
 * @param {string} [params.sourceTag="manual"]
 * @param {string} [params.lotId=null]
 */
export async function convertSpecificUsdcCoin({ feeCoinId, sourceTag = "manual", lotId = null }) {
  if (!feeCoinId) throw new Error("feeCoinId is required");

  const client = getClient();
  const address = getAdminAddress();

  const caribPoolId = process.env.NEXT_PUBLIC_CARIB_POOL_ID;
  const caribCoinType = process.env.NEXT_PUBLIC_CARIB_TYPE;
  const feeConverterId = process.env.NEXT_PUBLIC_FEE_CONVERTER_ID;
  const caribTreasuryId = process.env.NEXT_PUBLIC_CARIB_TREASURY_ID;

  if (!caribPoolId || !caribCoinType || !feeConverterId || !caribTreasuryId) {
    throw new Error("Missing CARIB/fee_converter env vars");
  }

  // Read the coin to get its balance
  const coinObj = await client.getObject({
    id: feeCoinId,
    options: { showContent: true, showOwner: true, showType: true },
  });

  if (!coinObj.data) {
    throw new Error(`Fee coin ${feeCoinId} not found — may already be consumed`);
  }

  // Verify it's still owned by admin
  const owner = coinObj.data.owner;
  const ownedBy = typeof owner === "object" && owner?.AddressOwner ? owner.AddressOwner : null;
  if (ownedBy !== address) {
    throw new Error(
      `Fee coin ${feeCoinId} not owned by admin (owner: ${ownedBy}) — already processed?`,
    );
  }

  // Verify it's a USDC coin
  const expectedType = `0x2::coin::Coin<${USDC_TYPE}>`;
  if (coinObj.data.type !== expectedType) {
    throw new Error(`Fee coin ${feeCoinId} is ${coinObj.data.type}, expected ${expectedType}`);
  }

  const balance = BigInt(coinObj.data.content?.fields?.balance || 0);
  if (balance === 0n) {
    throw new Error(`Fee coin ${feeCoinId} has zero balance`);
  }

  const amountRaw = balance.toString();
  console.log(
    `[fee-conversion] Converting coin ${feeCoinId} (${Number(balance) / 1e6} USDC) → CARIB...`,
  );

  // ---- Step A: quote the swap ----
  const network =
    (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") === "mainnet" ? "mainnet" : "testnet";

  const sdk = CetusClmmSDK.createSDK({
    env: network,
    full_rpc_url: process.env.SUI_RPC_URL || getJsonRpcFullnodeUrl(network),
  });
  sdk.setSenderAddress(address);

  const pool = await sdk.Pool.getPool(caribPoolId);
  if (!pool) throw new Error(`CARIB/USDC pool ${caribPoolId} not found`);

  const usdcIsA = pool.coin_type_a === USDC_TYPE;
  const a2b = usdcIsA;

  const preSwap = await sdk.Swap.preSwap({
    pool,
    current_sqrt_price: pool.current_sqrt_price,
    coin_type_a: pool.coin_type_a,
    coin_type_b: pool.coin_type_b,
    decimals_a: usdcIsA ? 6 : 9,
    decimals_b: usdcIsA ? 9 : 6,
    a2b,
    by_amount_in: true,
    amount: amountRaw,
  });

  const estimatedOut = preSwap.estimated_amount_out?.toString() || "0";
  if (estimatedOut === "0") {
    throw new Error("Insufficient CARIB/USDC pool liquidity");
  }

  const amountLimit = new Decimal(estimatedOut).mul(1 - FEE_CONVERSION_SLIPPAGE).toFixed(0);

  // ---- Step B: execute swap ----
  // NOTE: The SDK's createSwapPayload builds its own tx and picks coins from
  // the admin wallet itself. It may pick OTHER USDC coins in addition to
  // `feeCoinId`. To lock it to this specific coin, we'd need to pre-isolate
  // the amount by splitting.
  //
  // Since we already know the exact fee amount, we call the SDK with that
  // exact amount — the SDK will consume USDC equivalent to `amountRaw` from
  // the wallet. In practice, it will use `feeCoinId` because it's there and
  // sized correctly. But if other USDC coins exist, it may mix them.
  //
  // The cleaner fix: merge feeCoinId to itself (no-op) then cap the swap
  // amount to exactly the fee size. Since we pass exact amount, the SDK
  // cannot consume more USDC than the fee amount — regardless of which
  // specific coin objects it picks.
  const swapPayload = await sdk.Swap.createSwapPayload({
    pool_id: pool.id,
    coin_type_a: pool.coin_type_a,
    coin_type_b: pool.coin_type_b,
    a2b,
    by_amount_in: true,
    amount: amountRaw,
    amount_limit: amountLimit,
  });
  swapPayload.setSender(address);
  const swapResult = await adminExecute(swapPayload);

  // ---- Step C: find resulting CARIB from swap, process it ----
  // The swap transferred CARIB to admin. Find it by looking at the swap's
  // balance changes for CARIB received.
  await new Promise((r) => setTimeout(r, INDEXING_DELAY_MS));

  const caribReceived = findCaribReceivedInTx(swapResult, caribCoinType, address);
  if (!caribReceived) {
    throw new Error(
      `Swap ${swapResult.digest} succeeded but could not locate CARIB coin in result`,
    );
  }

  // Process ONLY the CARIB received from this swap
  const processResult = await processSpecificCaribCoin({
    caribCoinId: caribReceived.objectId,
    sourceTag,
    lotId,
  });

  return {
    converted: true,
    digest: processResult.digest,
    swapDigest: swapResult.digest,
    usdcSwapped: amountRaw,
    caribReceived: caribReceived.amount,
    burned: processResult.burned,
    toTreasury: processResult.toTreasury,
  };
}

// ============================================================
// Process a specific CARIB coin through fee_converter
// ============================================================

/**
 * Process a specific CARIB coin via fee_converter::process_fee.
 * Narrow, idempotent — only touches the named coin.
 */
export async function processSpecificCaribCoin({
  caribCoinId,
  sourceTag = "manual",
  lotId = null,
}) {
  if (!caribCoinId) throw new Error("caribCoinId is required");

  const client = getClient();
  const address = getAdminAddress();

  const caribCoinType = process.env.NEXT_PUBLIC_CARIB_TYPE;
  const feeConverterId = process.env.NEXT_PUBLIC_FEE_CONVERTER_ID;
  const caribTreasuryId = process.env.NEXT_PUBLIC_CARIB_TREASURY_ID;

  // Verify ownership + type
  const coinObj = await client.getObject({
    id: caribCoinId,
    options: { showContent: true, showOwner: true, showType: true },
  });
  if (!coinObj.data) throw new Error(`CARIB coin ${caribCoinId} not found`);

  const owner = coinObj.data.owner;
  const ownedBy = typeof owner === "object" && owner?.AddressOwner ? owner.AddressOwner : null;
  if (ownedBy !== address) {
    throw new Error(`CARIB coin ${caribCoinId} not owned by admin — already processed?`);
  }

  const expectedType = `0x2::coin::Coin<${caribCoinType}>`;
  if (coinObj.data.type !== expectedType) {
    throw new Error(
      `CARIB coin ${caribCoinId} type mismatch: got ${coinObj.data.type}, expected ${expectedType}`,
    );
  }

  const balance = BigInt(coinObj.data.content?.fields?.balance || 0);
  if (balance === 0n) {
    throw new Error(`CARIB coin ${caribCoinId} has zero balance`);
  }

  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::fee_converter::process_fee`,
    arguments: [
      tx.object(feeConverterId),
      tx.object(caribTreasuryId),
      tx.object(caribCoinId),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(sourceTag))),
    ],
  });

  const result = await adminExecute(tx);

  const feeEvent = result.events?.find((e) => e.type?.endsWith("::fee_converter::FeeProcessed"));

  return {
    processed: true,
    digest: result.digest,
    burned: feeEvent?.parsedJson?.burned || "0",
    toTreasury: feeEvent?.parsedJson?.to_treasury || "0",
    totalFee: feeEvent?.parsedJson?.total_fee || balance.toString(),
  };
}

// ============================================================
// Helpers
// ============================================================

/**
 * Find CARIB coin that was received by `address` in a transaction result.
 * Returns { objectId, amount } or null.
 */
function findCaribReceivedInTx(txResult, caribCoinType, address) {
  // Prefer objectChanges (more reliable than balanceChanges for object IDs)
  const expectedType = `0x2::coin::Coin<${caribCoinType}>`;
  const created = txResult.objectChanges?.find(
    (c) =>
      c.type === "created" && c.objectType === expectedType && c.owner?.AddressOwner === address,
  );
  if (created) {
    return {
      objectId: created.objectId,
      amount: null, // will read from balance lookup later if needed
    };
  }

  // Sometimes swap mutates an existing admin CARIB coin rather than creating one.
  const mutated = txResult.objectChanges?.find(
    (c) =>
      c.type === "mutated" && c.objectType === expectedType && c.owner?.AddressOwner === address,
  );
  if (mutated) {
    return { objectId: mutated.objectId, amount: null };
  }

  return null;
}

// ============================================================
// Public manual-recovery helpers
// ============================================================

/**
 * Manually recover a stuck fee conversion. Pass the feeCoinId that was
 * returned in the partial-success response.
 */
export async function adminConvertSpecificUsdcCoin(feeCoinId, sourceTag = "manual_recovery") {
  return convertSpecificUsdcCoin({ feeCoinId, sourceTag });
}

/**
 * Manually process a stuck CARIB coin (if swap succeeded but process_fee failed).
 */
export async function adminProcessSpecificCarib(caribCoinId, sourceTag = "manual_recovery") {
  return processSpecificCaribCoin({ caribCoinId, sourceTag });
}

// ============================================================
// Stats
// ============================================================

export async function getAdminStats() {
  const client = getClient();
  const [assetTypes, registryObj] = await Promise.all([
    getOwnedAssetTypes(),
    client.getObject({ id: REGISTRY_ID, options: { showContent: true } }),
  ]);
  const regFields = registryObj.data?.content?.fields || {};
  return {
    adminAddress: getAdminAddress(),
    assetTypes: assetTypes.length,
    totalLots: Number(regFields.lot_count || 0),
    totalAssetTypes: Number(regFields.asset_type_count || 0),
  };
}

// ============================================================
// Compliance — KYC verification, freeze/unfreeze, enforcement
// ============================================================

const COMPLIANCE_ID = process.env.NEXT_PUBLIC_COMPLIANCE_ID;

// Get ComplianceAdmin capability ID
export async function getComplianceAdminId() {
  const client = getClient();
  const type = `${ORIGINAL_PACKAGE_ID}::compliance::ComplianceAdmin`;
  const result = await client.getOwnedObjects({
    owner: getAdminAddress(),
    filter: { StructType: type },
    options: { showContent: true },
  });
  return result.data?.[0]?.data?.objectId || null;
}

// Verify a user (register KYC)
export async function adminVerifyUser(userAddress, jurisdiction, providerRef, role) {
  const adminCapId = await getComplianceAdminId();
  if (!adminCapId) throw new Error("ComplianceAdmin capability not found");

  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::compliance::verify_user`,
    arguments: [
      tx.object(adminCapId),
      tx.object(COMPLIANCE_ID),
      tx.pure.address(userAddress),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(jurisdiction))),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(providerRef || ""))),
      tx.pure.u8(role),
      tx.pure.u64(Date.now()),
    ],
  });
  return adminExecute(tx);
}

// Freeze a user
export async function adminFreezeUser(userAddress, reason) {
  const adminCapId = await getComplianceAdminId();
  if (!adminCapId) throw new Error("ComplianceAdmin capability not found");

  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::compliance::freeze_user`,
    arguments: [
      tx.object(adminCapId),
      tx.object(COMPLIANCE_ID),
      tx.pure.address(userAddress),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(reason))),
    ],
  });
  return adminExecute(tx);
}

// Unfreeze a user
export async function adminUnfreezeUser(userAddress) {
  const adminCapId = await getComplianceAdminId();
  if (!adminCapId) throw new Error("ComplianceAdmin capability not found");

  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::compliance::unfreeze_user`,
    arguments: [tx.object(adminCapId), tx.object(COMPLIANCE_ID), tx.pure.address(userAddress)],
  });
  return adminExecute(tx);
}

// Toggle enforcement on/off
export async function adminSetEnforcement(enabled) {
  const adminCapId = await getComplianceAdminId();
  if (!adminCapId) throw new Error("ComplianceAdmin capability not found");

  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::compliance::set_enforcement`,
    arguments: [tx.object(adminCapId), tx.object(COMPLIANCE_ID), tx.pure.bool(enabled)],
  });
  return adminExecute(tx);
}

// Get compliance registry state
export async function getComplianceState() {
  const client = getClient();
  const obj = await client.getObject({
    id: COMPLIANCE_ID,
    options: { showContent: true },
  });
  const fields = obj.data?.content?.fields || {};
  return {
    userCount: Number(fields.user_count || 0),
    enforcementEnabled: fields.enforcement_enabled || false,
  };
}

// Get verified users from events
export async function getVerifiedUsers() {
  const client = getClient();

  async function queryEventsServer(eventType, limit = 100) {
    return client.queryEvents({
      query: { MoveEventType: eventType },
      limit,
      order: "descending",
    });
  }

  const events = await queryEventsServer(`${PACKAGE_ID}::compliance::UserVerified`);
  let allEvents = [...events.data];
  if (ORIGINAL_PACKAGE_ID !== PACKAGE_ID) {
    const oldEvents = await queryEventsServer(`${ORIGINAL_PACKAGE_ID}::compliance::UserVerified`);
    allEvents = [...allEvents, ...oldEvents.data];
  }

  const frozenEvents = await queryEventsServer(`${PACKAGE_ID}::compliance::UserFrozen`);
  const unfrozenEvents = await queryEventsServer(`${PACKAGE_ID}::compliance::UserUnfrozen`);

  const frozenSet = new Set();
  for (const e of frozenEvents.data) frozenSet.add(e.parsedJson?.user);
  for (const e of unfrozenEvents.data) frozenSet.delete(e.parsedJson?.user);

  const roleLabels = { 0: "Buyer", 1: "Farmer", 2: "Custodian", 3: "Admin" };
  const seenUsers = new Map();

  for (const event of allEvents) {
    const user = event.parsedJson?.user;
    if (!user || seenUsers.has(user)) continue;
    seenUsers.set(user, {
      address: user,
      jurisdiction: event.parsedJson?.jurisdiction || "",
      role: Number(event.parsedJson?.role || 0),
      roleLabel: roleLabels[event.parsedJson?.role] || "Buyer",
      frozen: frozenSet.has(user),
      verifiedAt: Number(event.timestampMs || 0),
    });
  }

  return Array.from(seenUsers.values());
}

// ============================================================
// Fee Conversion Flow — Production Implementation
// ============================================================
//
// After the yield_engine.move refactor:
//   - `deposit_surplus` RETURNS the USDC fee as Coin<USDC>
//   - The caller is responsible for swapping that USDC → CARIB
//   - Then calling `fee_converter::process_fee` to split burn/treasury
//
// ATOMICITY NOTE:
//   Ideally this is a single atomic PTB. The Cetus Aggregator SDK
//   supports that pattern via `client.routerSwap({ txb, inputCoin })`
//   which accepts an existing transaction and an input coin reference.
//
//   However, the Cetus Aggregator currently supports testnet only for
//   Cetus and DeepBook providers and is unreliable there. For now we
//   use a two-transaction flow that is SAFE but not atomic:
//
//     TX1: yield_engine::deposit_surplus → fee USDC goes to admin wallet
//     TX2: swap USDC → CARIB, then fee_converter::process_fee
//
//   Both transactions are signed by the same trusted admin. If TX2
//   fails, the USDC fee sits in the admin wallet and can be safely
//   flushed later via `adminFlushPendingFees()`. Nothing is at risk.
//
//   MAINNET MIGRATION:
//   When migrating to mainnet, swap the two-tx path for a single
//   aggregator-sdk PTB. The Move contracts do not need to change —
//   `deposit_surplus` returning Coin<USDC> is compatible with both flows.
//
//   See the commented `adminDepositSurplusAtomic()` block at the bottom
//   of this file for the mainnet code path.
//
// IDEMPOTENCY:
//   - TX1 writes on-chain event `SurplusReceived` with the lot ID
//   - TX2 is retry-safe: it scans the admin wallet for USDC balance
//     and converts whatever is found
//   - If TX2 fails after TX1 succeeds, re-running the flush function
//     processes any unconverted USDC without re-running TX1
//   - `adminRecoverStuckFees()` is the all-purpose recovery routine —
//     safe to call anytime, from a cron, or manually after a failure
//
// ============================================================

// ============================================================
// TODO: MAINNET MIGRATION PATH (commented, for reference)
// ============================================================
//
// When migrating to mainnet, replace `adminDepositSurplusWithFeeConversion`
// with this single-PTB atomic version using the aggregator SDK.
//
// Install: `npm install @cetusprotocol/aggregator-sdk bn.js`
//
// ```javascript
// import { AggregatorClient, Env } from "@cetusprotocol/aggregator-sdk";
// import BN from "bn.js";
//
// export async function adminDepositSurplusAtomic(lotId, usdcAmount, tokenSymbol) {
//   const client = getClient();
//   const address = getAdminAddress();
//   const amountUnits = Math.floor(usdcAmount * 10 ** 6);
//   const feeAmount = Math.floor(amountUnits * 0.01); // 1% fee
//   const netAmount = amountUnits - feeAmount;
//
//   const token = getToken(tokenSymbol);
//   const tokenConfig = JSON.parse(process.env.NEXT_PUBLIC_TOKEN_CONFIG || "{}");
//   const config = tokenConfig[tokenSymbol];
//
//   const { data: usdcCoins } = await client.getCoins({
//     owner: address, coinType: USDC_TYPE,
//   });
//
//   const vaultObj = await client.getObject({
//     id: config.mintVault, options: { showContent: true },
//   });
//   const totalSupply = Number(
//     vaultObj.data?.content?.fields?.cap?.fields?.total_supply?.fields?.value || 0,
//   );
//
//   const tx = new Transaction();
//
//   if (usdcCoins.length > 1) {
//     const others = usdcCoins.slice(1).map((c) => tx.object(c.coinObjectId));
//     tx.mergeCoins(tx.object(usdcCoins[0].coinObjectId), others);
//   }
//
//   // Split admin USDC into [fee, net]
//   const [feeCoinUsdc, netCoinUsdc] = tx.splitCoins(
//     tx.object(usdcCoins[0].coinObjectId),
//     [tx.pure.u64(feeAmount), tx.pure.u64(netAmount)],
//   );
//
//   // deposit_surplus with net amount (caller pre-extracted fee).
//   // Requires small Move signature change — see comment below.
//   tx.moveCall({
//     target: `${PACKAGE_ID}::yield_engine::deposit_surplus_with_split_fee`,
//     typeArguments: [USDC_TYPE, token.type],
//     arguments: [
//       tx.object(process.env.NEXT_PUBLIC_YIELD_ENGINE_ID),
//       tx.object(lotId),
//       netCoinUsdc,
//       tx.pure.u64(amountUnits),
//       tx.pure.u64(totalSupply),
//       tx.object("0x6"),
//     ],
//   });
//
//   // Swap fee USDC → CARIB in the same PTB
//   const aggregatorClient = new AggregatorClient({ env: Env.Mainnet });
//   const router = await aggregatorClient.findRouters({
//     from: USDC_TYPE,
//     target: process.env.NEXT_PUBLIC_CARIB_TYPE,
//     amount: new BN(feeAmount),
//     byAmountIn: true,
//   });
//   const caribCoin = await aggregatorClient.routerSwap({
//     router,
//     txb: tx,
//     inputCoin: feeCoinUsdc,
//     slippage: FEE_CONVERSION_SLIPPAGE,
//   });
//
//   // Process the fee atomically
//   tx.moveCall({
//     target: `${PACKAGE_ID}::fee_converter::process_fee`,
//     arguments: [
//       tx.object(process.env.NEXT_PUBLIC_FEE_CONVERTER_ID),
//       tx.object(process.env.NEXT_PUBLIC_CARIB_TREASURY_ID),
//       caribCoin,
//       tx.pure.vector("u8", Array.from(
//         new TextEncoder().encode(`spice_surplus:${tokenSymbol}`),
//       )),
//     ],
//   });
//
//   return await adminExecute(tx);
// }
// ```
//
// The mainnet path benefits from a small Move addition:
// add a new `deposit_surplus_with_split_fee` function that takes net amount
// directly (no internal fee split). The current `deposit_surplus` can be kept
// for two-tx fallback or deprecated.
//
// The `fee_converter.move` module is identical in both paths.
// ============================================================
