import { r2 } from '@/lib/r2'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { key } = await request.json()

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    console.log('Deleting from R2:', key)

    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    })

    await r2.send(command)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting file from R2:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}