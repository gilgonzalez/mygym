'use server'

import { createClient } from '@/lib/supabase/server'

export type MediaItem = {
  id: string
  url: string
  type: string | null
  mime_type?: string | null
  filename: string | null
  created_at: string | null
  bucket_path?: string | null
}

export async function listMediaAction(typeFilter?: 'image' | 'audio' | 'video', search?: string): Promise<{ success: boolean; data?: MediaItem[]; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    let query = supabase
      .from('media')
      .select('id, url, type, mime_type, filename, created_at, bucket_path')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (typeFilter) {
      if (typeFilter === 'image') {
        query = query.ilike('type', 'image%')
      } else if (typeFilter === 'audio') {
        query = query.ilike('type', 'audio%')
      } else if (typeFilter === 'video') {
        query = query.ilike('type', 'video%')
      }
    }

    if (search) {
      query = query.ilike('filename', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching media:', error)
        return { success: false, error: error.message }
    }

    const r2PublicUrl = process.env.R2_PUBLIC_URL

    const formattedData = (data || []).map((item: any) => {
        let finalUrl = item.url
        
        // If url is missing or relative, try to construct it using R2_PUBLIC_URL
        if (r2PublicUrl) {
            if (!finalUrl && item.bucket_path) {
                finalUrl = `${r2PublicUrl}/${item.bucket_path}`
            } else if (finalUrl && !finalUrl.startsWith('http') && !finalUrl.startsWith('blob:')) {
                const cleanPath = finalUrl.startsWith('/') ? finalUrl.slice(1) : finalUrl
                finalUrl = `${r2PublicUrl}/${cleanPath}`
            }
        }
        
        return {
            ...item,
            url: finalUrl
        }
    })

    return { success: true, data: formattedData }
  } catch (error: any) {
    console.error('Unexpected error fetching media:', error)
    return { success: false, error: error.message }
  }
}