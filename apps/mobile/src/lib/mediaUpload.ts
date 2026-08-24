import { File } from 'expo-file-system'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'

import { supabase } from './supabase'
import type { ExerciseEditorInput, SectionEditorInput } from './workoutEditor'

const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? 'https://mygymgigo.vercel.app').replace(/\/$/, '')

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

// Margen antes de que expire el access_token para forzar un refresh
// proactivo — completar todo el flujo de la cámara (permisos, countdown,
// grabar, volver al form) tranquilamente toma varios minutos, y si la
// sesión venía por vencer justo en ese rato, getSession() puede devolver
// igual el token viejo (el auto-refresh de supabase-js corre en background,
// no está garantizado que ya haya corrido para este momento puntual). Sin
// esto, /api/upload devuelve 401 "No autorizado" recién en el POST — muy
// tarde para el usuario, que ya grabó el clip.
const SESSION_REFRESH_MARGIN_SECONDS = 120

async function getFreshAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('No hay sesión para subir la miniatura')
  }

  const expiresInSeconds = (session.expires_at ?? 0) - Date.now() / 1000
  if (expiresInSeconds > SESSION_REFRESH_MARGIN_SECONDS) {
    return session.access_token
  }

  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
  if (refreshError || !refreshed.session?.access_token) {
    // Si el refresh falla igual probamos con el token que había — puede que
    // el margen haya sido demasiado conservador y el token viejo siga
    // sirviendo; si no sirve, el 401 del server ahora sí trae detalle real
    // (ver el catch de más abajo).
    return session.access_token
  }

  return refreshed.session.access_token
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
    body: JSON.stringify({ filename, contentType: mimeType }),
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

  const fileRes = await fetch(localUri)
  const blob = await fileRes.blob()

  const putRes = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    body: blob,
  })

  if (!putRes.ok) {
    throw new Error('No se pudo subir la miniatura')
  }

  const size = blob.size || new File(localUri).size || null

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
