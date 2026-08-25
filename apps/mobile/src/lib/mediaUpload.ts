import { File } from 'expo-file-system'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'

import { supabase } from './supabase'
import { API_BASE, getFreshAccessToken } from './apiClient'
import type { ExerciseEditorInput, SectionEditorInput } from './workoutEditor'

export function isLocalMediaUri(uri: string | null | undefined): uri is string {
  if (!uri) return false
  return (
    uri.startsWith('file:') ||
    uri.startsWith('content:') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library:') ||
    uri.startsWith('/')
  )
}

export async function prepareStillThumbnail(uri: string): Promise<{ uri: string; mimeType: 'image/jpeg' }> {
  const resized = await manipulateAsync(uri, [{ resize: { width: 720 } }], {
    compress: 0.82,
    format: SaveFormat.JPEG,
  })
  return { uri: resized.uri, mimeType: 'image/jpeg' }
}

async function uploadLocalThumbnail(localUri: string, mimeType: string, userId: string) {
  const isVideo = mimeType.startsWith('video/')
  const accessToken = await getFreshAccessToken()

  const ext = isVideo ? 'mp4' : mimeType === 'image/gif' ? 'gif' : 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const signRes = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    // folder: 'images' explícito — esta función solo sube miniaturas
    // (de ejercicio o portada), nunca "video real" para la biblioteca de
    // media. La miniatura "GIF" es video/mp4 por dentro (ver
    // thumbnailCapture.ts), pero conceptualmente sigue siendo una
    // miniatura: sin este override /api/upload la mandaría a videos/ por
    // el content-type, mezclando esta carpeta con archivos que sí son
    // video de verdad.
    body: JSON.stringify({ filename, contentType: mimeType, folder: 'images' }),
  })

  if (!signRes.ok) {
    // El status/body real importa para diagnosticar esto — "no se pudo
    // preparar la subida" a secas no decía si era 401 (token vencido/
    // proyecto de Supabase distinto al del server), 500 (R2 mal
    // configurado del lado de apps/web) u otra cosa. /api/upload no
    // rechaza ningún contentType (ver src/app/api/upload/route.ts) — un
    // fallo acá nunca es por el formato del archivo, pasa antes de que
    // el formato importe.
    const detail = await signRes.text().catch(() => '')
    let reason = detail
    try {
      reason = JSON.parse(detail)?.error || detail
    } catch {
      // detail ya no es JSON, se usa tal cual
    }
    throw new Error(`No se pudo preparar la subida de la miniatura (${signRes.status}): ${reason || 'sin detalle'}`)
  }

  const { url, publicUrl, key } = (await signRes.json()) as {
    url: string
    publicUrl: string
    key: string
  }

  // Antes: fetch(localUri) + .blob() + fetch(url, { method: 'PUT', body: blob }).
  // React Native no tiene un Blob nativo real — su Response.blob() copia la
  // respuesta al blob store nativo y la vuelve a leer codificada en base64
  // (de ahí el warning de perf, y por qué era lento para el clip de la
  // "GIF"). file.upload() (expo-file-system, API nueva) sube el archivo
  // directo desde disco sin pasar por Blob/base64 — más rápido y sin el
  // warning. uploadType por default es BINARY_CONTENT (body crudo con el
  // Content-Type indicado), justo lo que espera una PUT presignada de R2.
  const file = new File(localUri)
  const uploadResult = await file.upload(url, {
    httpMethod: 'PUT',
    headers: { 'Content-Type': mimeType },
  })

  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    throw new Error(`No se pudo subir la miniatura (${uploadResult.status})`)
  }

  const size = file.size ?? null

  const { data, error } = await supabase
    .from('media')
    .insert({
      user_id: userId,
      url: publicUrl,
      type: isVideo ? 'video' : 'image',
      mime_type: mimeType,
      filename,
      bucket_path: key,
      size_bytes: size,
    })
    .select('id, url')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo guardar la miniatura')
  }

  return { url: data.url, id: data.id }
}

// Fallback para cuando no se conoce el mimeType real (casos viejos/de
// borde) — persistExerciseThumbnails usa exercise.thumbnailMimeType cuando
// está disponible en vez de adivinar por extensión.
function guessMimeType(uri: string): 'video/mp4' | 'image/jpeg' {
  return /\.(mp4|mov|m4v)($|\?)/i.test(uri) ? 'video/mp4' : 'image/jpeg'
}

// Portada del workout — mismo patrón lazy-upload-al-guardar que la web
// (uploadFile en create/page.tsx: el picker deja una URI/blob local y recién
// se sube cuando el usuario confirma el guardado). Siempre es una imagen fija
// (ver WorkoutCoverField.tsx, cabecera del editor — su picker nunca ofrece
// GIF/video), por eso el mimeType queda fijo en 'image/jpeg' —
// prepareStillThumbnail ya normaliza cualquier foto elegida a ese formato
// antes de que llegue acá.
export async function persistWorkoutCover(cover: string | null, userId: string): Promise<string | null> {
  if (!isLocalMediaUri(cover)) return cover
  const uploaded = await uploadLocalThumbnail(cover, 'image/jpeg', userId)
  return uploaded.url
}

export async function persistExerciseThumbnails(
  sections: SectionEditorInput[],
  userId: string
): Promise<SectionEditorInput[]> {
  const next: SectionEditorInput[] = []

  for (const section of sections) {
    const exercises: ExerciseEditorInput[] = []
    for (const exercise of section.exercises) {
      if (!isLocalMediaUri(exercise.thumbnailUrl)) {
        exercises.push(exercise)
        continue
      }

      const mimeType = exercise.thumbnailMimeType || guessMimeType(exercise.thumbnailUrl)
      const uploaded = await uploadLocalThumbnail(exercise.thumbnailUrl, mimeType, userId)
      exercises.push({
        ...exercise,
        thumbnailUrl: uploaded.url,
        thumbnailMediaId: uploaded.id,
        thumbnailMimeType: mimeType,
      })
    }
    next.push({ ...section, exercises })
  }

  return next
}
