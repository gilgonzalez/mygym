import { r2 } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  try {
    const { filename, contentType } = await request.json()
    
    // Determinar la carpeta basada en el tipo de contenido
    let folder = 'others'
    if (contentType.startsWith('image/')) folder = 'images'
    else if (contentType.startsWith('video/')) folder = 'videos'
    else if (contentType.startsWith('audio/')) folder = 'audio'
    
    // Generar un nombre único con la carpeta
    const uniqueFilename = `${folder}/${randomUUID()}-${filename}`
    
    // Generar la URL firmada
    const signedUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: uniqueFilename,
        ContentType: contentType,
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