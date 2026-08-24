import { r2 } from '@/lib/r2'
import { createClient } from '@/lib/supabase/server'
import { createClient as createJwtClient } from '@supabase/supabase-js'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

async function getRequestUser(request: Request) {
  const cookieClient = await createClient()
  const {
    data: { user: cookieUser },
  } = await cookieClient.auth.getUser()
  if (cookieUser) return cookieUser

  // La app mobile no manda cookies: autentica con el access token de
  // supabase en Authorization: Bearer (ver apps/mobile/src/lib/mediaUpload.ts).
  const header = request.headers.get('authorization')
  if (!header?.toLowerCase().startsWith('bearer ')) return null

  const jwtClient = createJwtClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const {
    data: { user },
  } = await jwtClient.auth.getUser(header.slice(7).trim())

  return user ?? null
}

export async function POST(request: Request) {
  try {
    const { filename, contentType } = await request.json()

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename and contentType are required' }, { status: 400 })
    }

    const user = await getRequestUser(request)

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
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
      { error: 'Error creando URL de subida' }, 
      { status: 500 }
    )
  }
}
