import { r2 } from '@/lib/r2'
import { getRequestContext } from '@/lib/supabase/requestUser'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const ALLOWED_FOLDERS = ['images', 'videos', 'audio', 'others'] as const
type UploadFolder = (typeof ALLOWED_FOLDERS)[number]

export async function POST(request: Request) {
  try {
    const { filename, contentType, folder: requestedFolder } = await request.json()

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename and contentType are required' }, { status: 400 })
    }

    const ctx = await getRequestContext(request)

    if (!ctx) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const { userId } = ctx

    const safeFilename = String(filename).replace(/[^a-zA-Z0-9._-]/g, '-')
    const normalizedContentType = String(contentType)

    // La carpeta normalmente sale del content-type, pero el caller puede
    // pedir una carpeta puntual (`folder`) cuando el archivo no encaja bien
    // en esa regla — el caso de uso es la miniatura "GIF" de un ejercicio en
    // mobile (mediaUpload.ts): por dentro es un video/mp4 (para que se vea
    // bien — un .gif real queda muy por debajo en calidad), pero
    // conceptualmente es una miniatura como cualquier otra, así que pide
    // folder: 'images' explícito en vez de terminar en videos/. El
    // Content-Type real que ve R2 y el mime_type que se guarda en `media`
    // no cambian — solo el prefijo de la key.
    let folder: UploadFolder = 'others'
    if (typeof requestedFolder === 'string' && (ALLOWED_FOLDERS as readonly string[]).includes(requestedFolder)) {
      folder = requestedFolder as UploadFolder
    } else if (normalizedContentType.startsWith('image/')) folder = 'images'
    else if (normalizedContentType.startsWith('video/')) folder = 'videos'
    else if (normalizedContentType.startsWith('audio/')) folder = 'audio'

    // Generar un nombre único con la carpeta
    const uniqueFilename = `${folder}/${userId}/${randomUUID()}-${safeFilename}`

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
