import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface UploadResult {
  publicUrl: string
  key: string
  id: string
}

export function useMediaUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadMedia = async (file: File): Promise<UploadResult> => {
    setIsUploading(true)
    setError(null)
    try {
      // 0. Verificar autenticación
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Must be logged in to upload media')
      const user = session.user

      // 1. Obtener URL firmada
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      })

      if (!response.ok) throw new Error('Failed to get upload URL')

      const { url, publicUrl, key } = await response.json()

      // 2. Subir directamente a R2
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      })

      if (!uploadResponse.ok) throw new Error('Failed to upload file')

      // 3. Registrar en Supabase directamente (aprovechando la sesión del cliente)
      const { data: mediaRecord, error: dbError } = await supabase
        .from('media')
        .insert({
          url: publicUrl,
          bucket_path: key,
          type: file.type.split('/')[0] as 'image' | 'video',
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          uploader_id: user.id
        })
        .select()
        .single()

      if (dbError) {
        // Rollback: borrar de R2 si falla la BD
        await fetch('/api/media/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        })
        throw new Error(`Database error: ${dbError.message}`)
      }

      return { publicUrl, key, id: mediaRecord.id }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsUploading(false)
    }
  }

  return { uploadMedia, isUploading, error }
}