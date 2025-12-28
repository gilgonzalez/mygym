'use server'


import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createMediaAction(media: {
    url: string
    type: string
    filename: string
    bucket_path: string
    size?: number
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Determine media type (image/video/audio)
    let mediaType = 'image'
    if (media.type.startsWith('audio/')) mediaType = 'audio'
    if (media.type.startsWith('video/')) mediaType = 'video'

    const { data, error } = await supabase
        .from('media')
        .insert({
            user_id: user.id,
            url: media.url,
            type: mediaType,
            mime_type: media.type,
            filename: media.filename,
            bucket_path: media.bucket_path,
            size_bytes: media.size
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating media:', error)
        return { error: error.message }
    }

    revalidatePath('/editor/media')
    return { data }
}