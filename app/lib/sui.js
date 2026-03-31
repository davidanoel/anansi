import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { SUI_NETWORK, SUI_RPC_URL } from './constants'

// Create a singleton Sui client
let client = null

export function getSuiClient() {
  if (!client) {
    client = new SuiClient({
      url: SUI_RPC_URL || getFullnodeUrl(SUI_NETWORK),
    })
  }
  return client
}

// Fetch an object by ID
export async function getObject(objectId) {
  const client = getSuiClient()
  return client.getObject({
    id: objectId,
    options: {
      showContent: true,
      showOwner: true,
    },
  })
}

// Fetch all objects owned by an address with a specific type
export async function getOwnedObjects(address, structType) {
  const client = getSuiClient()
  const result = await client.getOwnedObjects({
    owner: address,
    filter: structType ? { StructType: structType } : undefined,
    options: {
      showContent: true,
    },
  })
  return result.data
}

// Fetch SpiceTokens owned by an address
export async function getSpiceTokens(address, packageId) {
  const type = `${packageId}::asset_pool::SpiceToken`
  return getOwnedObjects(address, type)
}

// Fetch CARIB coins owned by an address
export async function getCaribBalance(address, packageId) {
  const client = getSuiClient()
  const type = `${packageId}::carib_coin::CARIB_COIN`
  const balance = await client.getBalance({
    owner: address,
    coinType: type,
  })
  return balance
}

// Query events by type
export async function queryEvents(eventType, cursor, limit = 50) {
  const client = getSuiClient()
  return client.queryEvents({
    query: { MoveEventType: eventType },
    cursor,
    limit,
    order: 'descending',
  })
}
