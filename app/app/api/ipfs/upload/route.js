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

    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PINATA_API_KEY}`,
      },
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
