import { Transaction } from "@mysten/sui/transactions";
import { getZkLoginSignature, genAddressSeed } from "@mysten/sui/zklogin";
import { getSuiClient } from "./sui";
import { getEphemeralKeypair, getZkProof, getMaxEpoch, getSalt, getSession } from "./auth";
import {
  PACKAGE_ID,
  REGISTRY_ID,
  YIELD_ENGINE_ID,
  CARIB_TREASURY_ID,
  COMPLIANCE_ID,
  MODULES,
  USDC_TYPE,
  USDC_DECIMALS,
  NUTMEG_TYPE,
  NUTMEG_DECIMALS,
  TOKEN_REGISTRY,
  getToken,
} from "./constants";

// ============================================================
// zkLogin Signature Helpers
// ============================================================

function buildZkLoginParams() {
  const session = getSession();
  const ephemeralKey = getEphemeralKeypair();
  const zkProof = getZkProof();
  const maxEpoch = getMaxEpoch();
  const salt = getSalt();

  if (!session || !ephemeralKey || !zkProof) {
    throw new Error("Not authenticated. Please sign in.");
  }

  const saltBytes = Uint8Array.from(atob(salt), (c) => c.charCodeAt(0));
  const saltBigInt = saltBytes.reduce((acc, byte) => (acc << 8n) + BigInt(byte), 0n);

  const addressSeed = genAddressSeed(saltBigInt, "sub", session.sub, session.aud).toString();

  return { session, ephemeralKey, zkProof, maxEpoch, addressSeed };
}

// ============================================================
// Transaction Execution
// ============================================================

async function executeTransaction(tx) {
  const client = getSuiClient();
  const { session, ephemeralKey, zkProof, maxEpoch, addressSeed } = buildZkLoginParams();

  tx.setSender(session.address);
  const txBytes = await tx.build({ client, onlyTransactionKind: true });
  const txBase64 = btoa(String.fromCharCode(...txBytes));

  const sponsorResponse = await fetch("/api/sponsor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txBytes: txBase64, sender: session.address }),
  });

  if (!sponsorResponse.ok) {
    const err = await sponsorResponse.json();
    throw new Error(err.error || "Gas sponsorship failed");
  }

  const sponsored = await sponsorResponse.json();
  const sponsoredBytes = Uint8Array.from(atob(sponsored.txBytes), (c) => c.charCodeAt(0));
  const { signature: ephemeralSig } = await ephemeralKey.signTransaction(sponsoredBytes);

  const zkLoginSignature = getZkLoginSignature({
    inputs: { ...zkProof, addressSeed },
    maxEpoch,
    userSignature: ephemeralSig,
  });

  return client.executeTransactionBlock({
    transactionBlock: sponsoredBytes,
    signature: [zkLoginSignature, sponsored.signature],
    options: { showEffects: true, showEvents: true, showObjectChanges: true },
  });
}

async function executeTransactionDirect(tx) {
  const client = getSuiClient();
  const { session, ephemeralKey, zkProof, maxEpoch, addressSeed } = buildZkLoginParams();

  tx.setSender(session.address);
  tx.setGasBudget(50000000);

  const bytes = await tx.build({ client });
  const { signature: ephemeralSig } = await ephemeralKey.signTransaction(bytes);

  const zkLoginSignature = getZkLoginSignature({
    inputs: { ...zkProof, addressSeed },
    maxEpoch,
    userSignature: ephemeralSig,
  });

  return client.executeTransactionBlock({
    transactionBlock: bytes,
    signature: zkLoginSignature,
    options: { showEffects: true, showEvents: true, showObjectChanges: true },
  });
}

// ============================================================
// Lot Lifecycle (Custodian actions)
// ============================================================

export async function createLot(custodianCapId, assetTypeId, receiptHash) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULES.ASSET_POOL}::create_lot`,
    arguments: [
      tx.object(custodianCapId),
      tx.object(REGISTRY_ID),
      tx.object(assetTypeId),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(receiptHash || "new-lot"))),
      tx.object("0x6"),
    ],
  });
  return executeTransaction(tx);
}

// Record delivery and mint tokens to farmer.
// tokenSymbol determines which commodity module to call (nutmeg, cocoa, etc.)
export async function recordDelivery(
  custodianCapId,
  lotId,
  farmerAddress,
  units,
  grade,
  receiptHash,
  tokenSymbol = "NUTMEG",
) {
  const token = getToken(tokenSymbol);
  if (!token) throw new Error(`Unknown token: ${tokenSymbol}`);

  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${token.moduleName}::record_delivery`,
    arguments: [
      tx.object(token.mintVaultId),
      tx.object(custodianCapId),
      tx.object(lotId),
      tx.object(COMPLIANCE_ID),
      tx.pure.address(farmerAddress),
      tx.pure.u64(units),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(grade))),
      tx.pure.vector("u8", Array.from(new TextEncoder().encode(receiptHash || ""))),
      tx.object("0x6"),
    ],
  });
  return executeTransaction(tx);
}

export async function updateValuation(custodianCapId, lotId, newValueUsdc) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULES.ASSET_POOL}::update_valuation`,
    arguments: [tx.object(custodianCapId), tx.object(lotId), tx.pure.u64(newValueUsdc)],
  });
  return executeTransaction(tx);
}

export async function startSelling(custodianCapId, lotId) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULES.ASSET_POOL}::start_selling`,
    arguments: [tx.object(custodianCapId), tx.object(lotId)],
  });
  return executeTransaction(tx);
}

export async function startDistributing(custodianCapId, lotId) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULES.ASSET_POOL}::start_distributing`,
    arguments: [tx.object(custodianCapId), tx.object(lotId)],
  });
  return executeTransaction(tx);
}

export async function closeLot(custodianCapId, lotId) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULES.ASSET_POOL}::close_lot`,
    arguments: [tx.object(custodianCapId), tx.object(lotId), tx.object("0x6")],
  });
  return executeTransaction(tx);
}

// ============================================================
// Surplus Claims (generic — works with any commodity token)
// ============================================================

export async function claimSurplus(depositId, tokenSymbol = "NUTMEG") {
  const client = getSuiClient();
  const session = getSession();
  const token = getToken(tokenSymbol);
  if (!token) throw new Error(`Unknown token: ${tokenSymbol}`);

  const tx = new Transaction();

  const { data: coins } = await client.getCoins({
    owner: session.address,
    coinType: token.type,
  });

  if (coins.length === 0) {
    throw new Error(`No ${tokenSymbol} tokens found in your wallet`);
  }

  if (coins.length > 1) {
    const otherCoins = coins.slice(1).map((c) => tx.object(c.coinObjectId));
    tx.mergeCoins(tx.object(coins[0].coinObjectId), otherCoins);
  }

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULES.YIELD_ENGINE}::claim_surplus`,
    typeArguments: [USDC_TYPE, token.type],
    arguments: [tx.object(depositId), tx.object(coins[0].coinObjectId), tx.object(COMPLIANCE_ID)],
  });

  return executeTransaction(tx);
}

// ============================================================
// DEX Swap — Generic multi-token support
// Server builds tx via Cetus SDK, client signs with zkLogin
// ============================================================

// Sell any token for USDC
export async function sellToken(amount, tokenSymbol = "NUTMEG") {
  const session = getSession();
  if (!session) throw new Error("Not authenticated. Please sign in.");

  const res = await fetch("/api/cetus/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      direction: "sell",
      amount,
      senderAddress: session.address,
      token: tokenSymbol,
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  console.log("Swap quote:", data.quote);

  const txBytes = Uint8Array.from(atob(data.txBytes), (c) => c.charCodeAt(0));
  const tx = Transaction.from(txBytes);

  return executeTransactionDirect(tx);
}

// Buy any token with USDC
export async function buyToken(usdcAmount, tokenSymbol = "NUTMEG") {
  const session = getSession();
  if (!session) throw new Error("Not authenticated. Please sign in.");

  const res = await fetch("/api/cetus/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      direction: "buy",
      amount: usdcAmount,
      senderAddress: session.address,
      token: tokenSymbol,
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  console.log("Swap quote:", data.quote);

  const txBytes = Uint8Array.from(atob(data.txBytes), (c) => c.charCodeAt(0));
  const tx = Transaction.from(txBytes);

  return executeTransactionDirect(tx);
}

// ============================================================
// CaribCoin
// ============================================================

export async function burnCarib(coinId) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULES.CARIB_COIN}::burn`,
    arguments: [tx.object(CARIB_TREASURY_ID), tx.object(coinId)],
  });
  return executeTransaction(tx);
}
