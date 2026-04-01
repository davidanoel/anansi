import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Pinata
    const pinataForm = new FormData()
    pinataForm.append('file', new Blob([buffer]), file.name)
    pinataForm.append('pinataMetadata', JSON.stringify({
      name: `spice-receipt-${Date.now()}`,
    }))

    const apiKey = process.env.PINATA_API_KEY
    const secret = process.env.PINATA_SECRET_KEY
    const jwt = process.env.PINATA_JWT?.trim()

    if (!jwt && (!apiKey || !secret)) {
      return NextResponse.json(
        {
          error:
            'Pinata not configured: set PINATA_JWT (Bearer), or both PINATA_API_KEY and PINATA_SECRET_KEY',
        },
        { status: 500 },
      )
    }

    const headers = jwt
      ? { Authorization: `Bearer ${jwt}` }
      : {
          pinata_api_key: apiKey,
          pinata_secret_api_key: secret,
        }

    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers,
      body: pinataForm,
    })

    if (!pinataResponse.ok) {
      const err = await pinataResponse.text()
      console.error('Pinata upload failed:', err)
      return NextResponse.json({ error: 'IPFS upload failed' }, { status: 500 })
    }

    const data = await pinataResponse.json()
    return NextResponse.json({
      IpfsHash: data.IpfsHash,
      PinSize: data.PinSize,
      Timestamp: data.Timestamp,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
