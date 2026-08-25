import { supabase } from './supabase'

// Base para hablar con el backend de Next (apps/web) desde mobile — se usa
// para cualquier operación que necesite correr en el server porque toca
// secretos que mobile no tiene (R2 para /api/upload, o ahora /api/workout
// para borrar la portada del workout en R2 al eliminarlo). Todas esas rutas
// aceptan cookie de sesión (web) o Authorization: Bearer (mobile, ver
// getFreshAccessToken) — mismo esquema para las dos, ver
// src/lib/supabase/requestUser.ts del lado de apps/web.
export const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? 'https://mygymgigo.vercel.app').replace(/\/$/, '')

// Margen antes de que expire el access_token para forzar un refresh
// proactivo — un flujo largo (p.ej. grabar con la cámara: permisos,
// countdown, grabar, volver al form) tranquilamente toma varios minutos, y
// si la sesión venía por vencer justo en ese rato, getSession() puede
// devolver igual el token viejo (el auto-refresh de supabase-js corre en
// background, no está garantizado que ya haya corrido para este momento
// puntual). Sin esto, el endpoint devuelve 401 "No autorizado" recién al
// hacer el request — tarde para el usuario, que ya hizo la acción.
const SESSION_REFRESH_MARGIN_SECONDS = 120

export async function getFreshAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('No hay sesión activa')
  }

  const expiresInSeconds = (session.expires_at ?? 0) - Date.now() / 1000
  if (expiresInSeconds > SESSION_REFRESH_MARGIN_SECONDS) {
    return session.access_token
  }

  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
  if (refreshError || !refreshed.session?.access_token) {
    // Si el refresh falla igual probamos con el token que había — puede que
    // el margen haya sido demasiado conservador y el token viejo siga
    // sirviendo; si no sirve, el 401 del server ahora sí trae detalle real.
    return session.access_token
  }

  return refreshed.session.access_token
}
