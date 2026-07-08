import { r2 } from '@/lib/r2'
import { createClient } from '@/lib/supabase/server'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { key } = await request.json()

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: mediaRecord, error: mediaError } = await supabase
      .from('media')
      .select('id')
      .eq('bucket_path', key)
      .eq('user_id', user.id)
      .single()

    if (mediaError || !mediaRecord) {
      return NextResponse.json({ error: 'Media not found or access denied' }, { status: 404 })
    }

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
