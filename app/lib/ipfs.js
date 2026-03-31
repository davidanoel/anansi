// IPFS upload via Pinata — used for warehouse receipts, quality certs, photos
// This runs server-side (API route) to keep Pinata keys secret

import { IPFS_GATEWAY } from './constants'

// Upload a file to IPFS via the Spice API route
export async function uploadToIPFS(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/ipfs/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to upload to IPFS')
  }

  const data = await response.json()
  return {
    hash: data.IpfsHash,
    url: `${IPFS_GATEWAY}/${data.IpfsHash}`,
  }
}

// Get a gateway URL for an IPFS hash
export function getIPFSUrl(hash) {
  if (!hash) return null
  return `${IPFS_GATEWAY}/${hash}`
}
