// ============================================================
// Server-side admin signer — platform admin transactions
// ============================================================

import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc'
import { Transaction } from '@mysten/sui/transactions'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { USDC_TYPE } from './constants'

let client = null
let keypair = null

function getClient() {
  if (!client) {
    client = new SuiJsonRpcClient({
      network: process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet',
      url: process.env.SUI_RPC_URL || getJsonRpcFullnodeUrl(process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet'),
    })
  }
  return client
}

function getAdminKeypair() {
  if (!keypair) {
    const privateKey = process.env.ADMIN_PRIVATE_KEY
    if (!privateKey) throw new Error('ADMIN_PRIVATE_KEY not set')
    keypair = Ed25519Keypair.fromSecretKey(privateKey)
  }
  return keypair
}

export function getAdminAddress() {
  return getAdminKeypair().getPublicKey().toSuiAddress()
}

export async function adminExecute(tx) {
  const client = getClient()
  const kp = getAdminKeypair()
  tx.setSender(kp.getPublicKey().toSuiAddress())

  let lastError
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await client.signAndExecuteTransaction({
        signer: kp,
        transaction: tx,
        options: { showEffects: true, showObjectChanges: true, showEvents: true },
      })
      console.log('adminExecute success:', result.digest)
      return result
    } catch (err) {
      lastError = err
      console.log(`adminExecute attempt ${attempt + 1} failed:`, err.message)
      if (attempt < 2) await new Promise(r => setTimeout(r, 2000))
    }
  }
  throw lastError
}

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID
const ORIGINAL_PACKAGE_ID = process.env.NEXT_PUBLIC_ORIGINAL_PACKAGE_ID || PACKAGE_ID
const REGISTRY_ID = process.env.NEXT_PUBLIC_REGISTRY_ID

// ============================================================
// Queries
// ============================================================

export async function getAdminCapId() {
  const client = getClient()
  const type = `${ORIGINAL_PACKAGE_ID}::asset_pool::RegistryAdmin`
  const result = await client.getOwnedObjects({
    owner: getAdminAddress(),
    filter: { StructType: type },
    options: { showContent: true },
  })
  if (result.data.length === 0) throw new Error('No RegistryAdmin found')
  return result.data[0].data?.objectId
}

export async function getAllCustodianCaps() {
  const client = getClient()

  const created = await client.queryEvents({
    query: { MoveEventType: `${PACKAGE_ID}::asset_pool::AssetTypeCreated` },
    limit: 100, order: 'descending',
  })

  const issued = await client.queryEvents({
    query: { MoveEventType: `${PACKAGE_ID}::asset_pool::CustodianCapIssued` },
    limit: 100, order: 'descending',
  })

  let issuedOld = { data: [] }
  if (ORIGINAL_PACKAGE_ID !== PACKAGE_ID) {
    issuedOld = await client.queryEvents({
      query: { MoveEventType: `${ORIGINAL_PACKAGE_ID}::asset_pool::CustodianCapIssued` },
      limit: 100, order: 'descending',
    })
  }

  const caps = []
  const seen = new Set()

  for (const e of created.data) {
    try {
      const tx = await client.getTransactionBlock({
        digest: e.id.txDigest,
        options: { showObjectChanges: true },
      })
      const capObj = tx.objectChanges?.find(c =>
        c.type === 'created' && c.objectType?.includes('::asset_pool::CustodianCap')
      )
      if (capObj) {
        const addr = capObj.owner?.AddressOwner
        const key = `${e.parsedJson?.symbol}-${addr}`
        if (!seen.has(key)) {
          seen.add(key)
          caps.push({ assetTypeSymbol: e.parsedJson?.symbol, custodianAddress: addr, timestamp: Number(e.timestampMs || 0) })
        }
      }
    } catch (err) { console.error('Failed to fetch custodian:', err) }
  }

  for (const e of [...issued.data, ...issuedOld.data]) {
    const key = `${e.parsedJson?.asset_type_symbol}-${e.parsedJson?.custodian_address}`
    if (!seen.has(key)) {
      seen.add(key)
      caps.push({ assetTypeSymbol: e.parsedJson?.asset_type_symbol, custodianAddress: e.parsedJson?.custodian_address, timestamp: Number(e.timestampMs || 0) })
    }
  }

  return caps
}

export async function getOwnedAssetTypes() {
  const client = getClient()

  const events = await client.queryEvents({
    query: { MoveEventType: `${PACKAGE_ID}::asset_pool::AssetTypeCreated` },
    limit: 50, order: 'descending',
  })

  let allEvents = [...events.data]
  if (ORIGINAL_PACKAGE_ID !== PACKAGE_ID) {
    const eventsOld = await client.queryEvents({
      query: { MoveEventType: `${ORIGINAL_PACKAGE_ID}::asset_pool::AssetTypeCreated` },
      limit: 50, order: 'descending',
    })
    allEvents = [...allEvents, ...eventsOld.data]
  }

  const assetTypes = []
  const seenIds = new Set()

  for (const event of allEvents) {
    try {
      const tx = await client.getTransactionBlock({
        digest: event.id.txDigest,
        options: { showObjectChanges: true },
      })
      const created = tx.objectChanges?.find(c =>
        c.type === 'created' && c.objectType?.includes('::asset_pool::AssetType')
      )
      if (created && !seenIds.has(created.objectId)) {
        seenIds.add(created.objectId)
        const obj = await client.getObject({ id: created.objectId, options: { showContent: true } })
        const fields = obj.data?.content?.fields || {}
        assetTypes.push({
          id: created.objectId, symbol: fields.symbol, name: fields.name,
          unit: fields.unit, region: fields.region, custodian: fields.custodian, active: fields.active,
        })
      }
    } catch (err) { console.error('Failed to fetch asset type:', err) }
  }

  return assetTypes
}

// ============================================================
// Admin Transactions
// ============================================================

export async function createAssetType({ symbol, name, unit, region, custodianName, custodianAddress }) {
  const adminCapId = await getAdminCapId()
  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::asset_pool::create_asset_type`,
    arguments: [
      tx.object(adminCapId), tx.object(REGISTRY_ID),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(symbol))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(name))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(unit))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(region))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(custodianName))),
      tx.pure.address(custodianAddress),
    ],
  })
  return adminExecute(tx)
}

export async function deactivateAssetType(assetTypeId) {
  const adminCapId = await getAdminCapId()
  const tx = new Transaction()
  tx.moveCall({ target: `${PACKAGE_ID}::asset_pool::deactivate_asset_type`, arguments: [tx.object(adminCapId), tx.object(assetTypeId)] })
  return adminExecute(tx)
}

export async function reactivateAssetType(assetTypeId) {
  const adminCapId = await getAdminCapId()
  const tx = new Transaction()
  tx.moveCall({ target: `${PACKAGE_ID}::asset_pool::reactivate_asset_type`, arguments: [tx.object(adminCapId), tx.object(assetTypeId)] })
  return adminExecute(tx)
}

export async function issueCustodianCap(assetTypeId, newCustodianAddress) {
  const adminCapId = await getAdminCapId()
  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::asset_pool::issue_custodian_cap`,
    arguments: [tx.object(adminCapId), tx.object(assetTypeId), tx.pure.address(newCustodianAddress)],
  })
  return adminExecute(tx)
}

// Deposit USDC surplus for a lot (contract uses &mut Coin + gross_amount)
export async function adminDepositSurplus(lotId, usdcAmount) {
  const client = getClient()
  const address = getAdminAddress()
  const amountUnits = Math.floor(usdcAmount * (10 ** 6))

  const { data: coins } = await client.getCoins({ owner: address, coinType: USDC_TYPE })
  if (coins.length === 0) throw new Error('No USDC found in admin wallet')

  const tx = new Transaction()

  if (coins.length > 1) {
    const otherCoins = coins.slice(1).map(c => tx.object(c.coinObjectId))
    tx.mergeCoins(tx.object(coins[0].coinObjectId), otherCoins)
  }

  // Read total NUTMEG supply from MintVault for pro-rata snapshot
  const vaultObj = await client.getObject({
    id: process.env.NEXT_PUBLIC_NUTMEG_MINT_VAULT_ID,
    options: { showContent: true },
  })
  const totalSupply = Number(
    vaultObj.data?.content?.fields?.cap?.fields?.total_supply?.fields?.value || 0
  )
  console.log('Total NUTMEG supply:', totalSupply)

  if (totalSupply === 0) {
    throw new Error('No NUTMEG tokens have been minted yet. Record deliveries first.')
  }

  tx.moveCall({
    target: `${PACKAGE_ID}::yield_engine::deposit_surplus`,
    typeArguments: [USDC_TYPE],
    arguments: [
      tx.object(process.env.NEXT_PUBLIC_YIELD_ENGINE_ID),
      tx.object(lotId),
      tx.object(coins[0].coinObjectId),
      tx.pure.u64(amountUnits),
      tx.pure.u64(totalSupply),
      tx.object('0x6'),
    ],
  })

  return adminExecute(tx)
}

// ============================================================
// Stats
// ============================================================

export async function getAdminStats() {
  const client = getClient()
  const [assetTypes, registryObj] = await Promise.all([
    getOwnedAssetTypes(),
    client.getObject({ id: REGISTRY_ID, options: { showContent: true } }),
  ])
  const regFields = registryObj.data?.content?.fields || {}
  return {
    adminAddress: getAdminAddress(),
    assetTypes: assetTypes.length,
    totalLots: Number(regFields.lot_count || 0),
    totalAssetTypes: Number(regFields.asset_type_count || 0),
  }
}

// ============================================================
// Compliance — KYC verification, freeze/unfreeze, enforcement
// ============================================================

const COMPLIANCE_ID = process.env.NEXT_PUBLIC_COMPLIANCE_ID

// Get ComplianceAdmin capability ID
export async function getComplianceAdminId() {
  const client = getClient()
  const type = `${ORIGINAL_PACKAGE_ID}::compliance::ComplianceAdmin`
  const result = await client.getOwnedObjects({
    owner: getAdminAddress(),
    filter: { StructType: type },
    options: { showContent: true },
  })
  return result.data?.[0]?.data?.objectId || null
}

// Verify a user (register KYC)
export async function adminVerifyUser(userAddress, jurisdiction, providerRef, role) {
  const adminCapId = await getComplianceAdminId()
  if (!adminCapId) throw new Error('ComplianceAdmin capability not found')

  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::compliance::verify_user`,
    arguments: [
      tx.object(adminCapId),
      tx.object(COMPLIANCE_ID),
      tx.pure.address(userAddress),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(jurisdiction))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(providerRef || ''))),
      tx.pure.u8(role),
      tx.pure.u64(Date.now()),
    ],
  })
  return adminExecute(tx)
}

// Freeze a user
export async function adminFreezeUser(userAddress, reason) {
  const adminCapId = await getComplianceAdminId()
  if (!adminCapId) throw new Error('ComplianceAdmin capability not found')

  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::compliance::freeze_user`,
    arguments: [
      tx.object(adminCapId),
      tx.object(COMPLIANCE_ID),
      tx.pure.address(userAddress),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(reason))),
    ],
  })
  return adminExecute(tx)
}

// Unfreeze a user
export async function adminUnfreezeUser(userAddress) {
  const adminCapId = await getComplianceAdminId()
  if (!adminCapId) throw new Error('ComplianceAdmin capability not found')

  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::compliance::unfreeze_user`,
    arguments: [
      tx.object(adminCapId),
      tx.object(COMPLIANCE_ID),
      tx.pure.address(userAddress),
    ],
  })
  return adminExecute(tx)
}

// Toggle enforcement on/off
export async function adminSetEnforcement(enabled) {
  const adminCapId = await getComplianceAdminId()
  if (!adminCapId) throw new Error('ComplianceAdmin capability not found')

  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::compliance::set_enforcement`,
    arguments: [
      tx.object(adminCapId),
      tx.object(COMPLIANCE_ID),
      tx.pure.bool(enabled),
    ],
  })
  return adminExecute(tx)
}

// Get compliance registry state
export async function getComplianceState() {
  const client = getClient()
  const obj = await client.getObject({
    id: COMPLIANCE_ID,
    options: { showContent: true },
  })
  const fields = obj.data?.content?.fields || {}
  return {
    userCount: Number(fields.user_count || 0),
    enforcementEnabled: fields.enforcement_enabled || false,
  }
}

// Get verified users from events
export async function getVerifiedUsers() {
  const client = getClient()

  async function queryEventsServer(eventType, limit = 100) {
    return client.queryEvents({
      query: { MoveEventType: eventType },
      limit,
      order: 'descending',
    })
  }

  const events = await queryEventsServer(`${PACKAGE_ID}::compliance::UserVerified`)
  let allEvents = [...events.data]
  if (ORIGINAL_PACKAGE_ID !== PACKAGE_ID) {
    const oldEvents = await queryEventsServer(`${ORIGINAL_PACKAGE_ID}::compliance::UserVerified`)
    allEvents = [...allEvents, ...oldEvents.data]
  }

  const frozenEvents = await queryEventsServer(`${PACKAGE_ID}::compliance::UserFrozen`)
  const unfrozenEvents = await queryEventsServer(`${PACKAGE_ID}::compliance::UserUnfrozen`)

  const frozenSet = new Set()
  for (const e of frozenEvents.data) frozenSet.add(e.parsedJson?.user)
  for (const e of unfrozenEvents.data) frozenSet.delete(e.parsedJson?.user)

  const roleLabels = { 0: 'Buyer', 1: 'Farmer', 2: 'Custodian', 3: 'Admin' }
  const seenUsers = new Map()

  for (const event of allEvents) {
    const user = event.parsedJson?.user
    if (!user || seenUsers.has(user)) continue
    seenUsers.set(user, {
      address: user,
      jurisdiction: event.parsedJson?.jurisdiction || '',
      role: Number(event.parsedJson?.role || 0),
      roleLabel: roleLabels[event.parsedJson?.role] || 'Buyer',
      frozen: frozenSet.has(user),
      verifiedAt: Number(event.timestampMs || 0),
    })
  }

  return Array.from(seenUsers.values())
}