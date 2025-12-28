import { createMediaAction } from "@/app/actions/media/create"

export async function uploadFile(fileUrl: string | undefined | null): Promise<{ url: string, id?: string, filename?: string, bucket_path?: string } | null> {
  if (!fileUrl) return null
    if (!fileUrl.startsWith('blob:')) return { url: fileUrl }

    try {
    // 1. Get the file blob
    const response = await fetch(fileUrl)
    const blob = await response.blob()
    const fileType = blob.type
    const fileExt = fileType.split('/')[1] || 'bin'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // 2. Get Signed URL from our API
    const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: fileName,
            contentType: fileType
        })
    })

    if (!uploadRes.ok) {
        throw new Error('Failed to get upload URL')
    }

    const { url, publicUrl, key } = await uploadRes.json()

    // 3. Upload to R2 using the signed URL
    const r2UploadRes = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': fileType
        },
        body: blob
    })

    if (!r2UploadRes.ok) {
        throw new Error('Failed to upload file to R2')
    }

    // 4. Save to Media Library (DB)
    const { data: mediaRecord } = await createMediaAction({
        url: publicUrl,
        type: fileType,
        filename: fileName,
        bucket_path: key,
        size: blob.size
    })

    return {
        url: publicUrl,
        id: mediaRecord?.id,
        filename: fileName,
        bucket_path: key
    }

    return publicUrl
  } catch (error) {
    console.error('Error uploading file:', error)
    return null
  }
}