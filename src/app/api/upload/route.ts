import { r2 } from '@/lib/r2'
import { createClient } from '@/lib/supabase/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  try {
    const { filename, contentType } = await request.json()

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename and contentType are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const safeFilename = String(filename).replace(/[^a-zA-Z0-9._-]/g, '-')
    const normalizedContentType = String(contentType)

    // Determinar la carpeta basada en el tipo de contenido
    let folder = 'others'
    if (normalizedContentType.startsWith('image/')) folder = 'images'
    else if (normalizedContentType.startsWith('video/')) folder = 'videos'
    else if (normalizedContentType.startsWith('audio/')) folder = 'audio'

    // Generar un nombre único con la carpeta
    const uniqueFilename = `${folder}/${user.id}/${randomUUID()}-${safeFilename}`

    // Generar la URL firmada
    const signedUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: uniqueFilename,
        ContentType: normalizedContentType,
      }),
      { expiresIn: 3600 } // URL válida por 1 hora
    )

    return NextResponse.json({ 
      url: signedUrl, 
      key: uniqueFilename,
      publicUrl: `${process.env.R2_PUBLIC_URL}/${uniqueFilename}` 
    })
  } catch (error) {
    console.error('Error creating upload URL:', error)
    return NextResponse.json(
      { error: 'Error creating upload URL' }, 
      { status: 500 }
    )
  }
}
