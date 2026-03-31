import { Transaction } from '@mysten/sui/transactions'
import { getZkLoginSignature } from '@mysten/sui/zklogin'
import { getSuiClient } from './sui'
import { getEphemeralKeypair, getZkProof, getMaxEpoch, getSalt, getSession } from './auth'
import {
  PACKAGE_ID,
  REGISTRY_ID,
  YIELD_ENGINE_ID,
  COMPLIANCE_ID,
  PLATFORM_ID,
  CARIB_TREASURY_ID,
  MODULES,
} from './constants'

// ============================================================
// Execute a transaction with zkLogin signature
// All gas is sponsored by Anansi (via Shinami or custom gas station)
// ============================================================

async function executeTransaction(tx) {
  const client = getSuiClient()
  const session = getSession()
  const ephemeralKey = getEphemeralKeypair()
  const zkProof = getZkProof()
  const maxEpoch = getMaxEpoch()
  const salt = getSalt()

  if (!session || !ephemeralKey || !zkProof) {
    throw new Error('Not authenticated. Please sign in.')
  }

  // Set sender
  tx.setSender(session.address)

  // Build the transaction
  const bytes = await tx.build({ client })

  // Sign with ephemeral key
  const { signature: ephemeralSig } = await ephemeralKey.signTransaction(bytes)

  // Combine with ZK proof to create zkLogin signature
  const zkLoginSignature = getZkLoginSignature({
    inputs: {
      ...zkProof,
      addressSeed: salt,
    },
    maxEpoch,
    userSignature: ephemeralSig,
  })

  // Execute
  const result = await client.executeTransactionBlock({
    transactionBlock: bytes,
    signature: zkLoginSignature,
    options: {
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
    },
  })

  return result
}

// ============================================================
// Asset Pool Transactions
// ============================================================

// Register a new asset type (e.g., NUTMG, COCO, VILLA)
// Only callable by RegistryAdmin holder
export async function createAssetType(registryAdminCapId, symbol, name, unit, region, custodianName, custodianAddress) {
  const tx = new Transaction()

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULES.ASSET_POOL}::create_asset_type`,
    arguments: [
      tx.object(registryAdminCapId),
      tx.object(REGISTRY_ID),
      tx.pure.vector('u8', new TextEncoder().encode(symbol)),
      tx.pure.vector('u8', new TextEncoder().encode(name)),
      tx.pure.vector('u8', new TextEncoder().encode(unit)),
      tx.pure.vector('u8', new TextEncoder().encode(region)),
      tx.pure.vector('u8', new TextEncoder().encode(custodianName)),
      tx.pure.address(custodianAddress),
    ],
  })

  return executeTransaction(tx)
}

// Create a new lot for an asset type
export async function createLot(assetTypeId, custodianCapId, receiptHash) {
  const tx = new Transaction()

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULES.ASSET_POOL}::create_lot`,
    arguments: [
      tx.object(custodianCapId),
      tx.object(REGISTRY_ID),
      tx.object(assetTypeId),
      tx.pure.string(receiptHash),
      tx.object('0x6'), // Clock object
    ],
  })

  return executeTransaction(tx)
}

// Record a delivery and mint tokens to farmer
export async function recordDelivery(custodianCapId, lotId, farmerAddress, units, grade, receiptHash) {
  const tx = new Transaction()

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULES.ASSET_POOL}::record_delivery`,
    arguments: [
      tx.object(custodianCapId),
      tx.object(lotId),
      tx.pure.address(farmerAddress),
      tx.pure.u64(units),
      tx.pure.string(grade),
      tx.pure.string(receiptHash),
      tx.object('0x6'), // Clock
    ],
  })

  return executeTransaction(tx)
}

// Update lot valuation
export async function updateValuation(custodianCapId, lotId, newValueUsdc) {
  const tx = new Transaction()

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULES.ASSET_POOL}::update_valuation`,
    arguments: [
      tx.object(custodianCapId),
      tx.object(lotId),
      tx.pure.u64(newValueUsdc),
    ],
  })

  return executeTransaction(tx)
}

// Move lot to selling status
export async function startSelling(custodianCapId, lotId) {
  const tx = new Transaction()

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULES.ASSET_POOL}::start_selling`,
    arguments: [
      tx.object(custodianCapId),
      tx.object(lotId),
    ],
  })

  return executeTransaction(tx)
}

// Split SpiceTokens (for partial selling)
export async function splitToken(tokenId, amount) {
  const tx = new Transaction()

  const newToken = tx.moveCall({
    target: `${PACKAGE_ID}::${MODULES.ASSET_POOL}::split_token`,
    arguments: [
      tx.object(tokenId),
      tx.pure.u64(amount),
    ],
  })

  // Transfer the new token to sender
  tx.transferObjects([newToken], tx.pure.address(getSession().address))

  return executeTransaction(tx)
}

// Transfer SpiceTokens to another address
export async function transferToken(tokenId, recipientAddress) {
  const tx = new Transaction()

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULES.ASSET_POOL}::transfer_token`,
    arguments: [
      tx.object(tokenId),
      tx.pure.address(recipientAddress),
    ],
  })

  return executeTransaction(tx)
}

// ============================================================
// Yield Engine Transactions
// ============================================================

// Deposit surplus USDC for a lot (custodian action)
export async function depositSurplus(lotId, usdcCoinId) {
  const tx = new Transaction()

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULES.YIELD_ENGINE}::deposit_surplus`,
    typeArguments: ['0x2::sui::SUI'], // Replace with USDC type in production
    arguments: [
      tx.object(YIELD_ENGINE_ID),
      tx.object(lotId),
      tx.object(usdcCoinId),
      tx.object('0x6'), // Clock
    ],
  })

  return executeTransaction(tx)
}

// ============================================================
// CaribCoin Transactions
// ============================================================

// Burn CARIB tokens
export async function burnCarib(coinId) {
  const tx = new Transaction()

  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULES.CARIB_COIN}::burn`,
    arguments: [
      tx.object(CARIB_TREASURY_ID),
      tx.object(coinId),
    ],
  })

  return executeTransaction(tx)
}
