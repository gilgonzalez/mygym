import { createClient as createJwtClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { createClient as createCookieClient } from './server'

// Autenticación compartida entre las rutas de /api que sirven tanto a la
// web (cookie de sesión) como a mobile (Authorization: Bearer, ver
// apps/mobile/src/lib/mediaUpload.ts) — extraído de api/upload/route.ts
// para no reescribir el mismo switch cookie-o-bearer en cada ruta nueva
// (ver api/workout/[id]/route.ts).
//
// A diferencia de la versión anterior (que solo devolvía el user), acá
// también se devuelve un cliente de supabase ya autenticado como ese
// usuario — el de cookies para la web, o uno anon-key con el bearer token
// pegado en el header Authorization para mobile (así PostgREST resuelve
// auth.uid() igual que con una sesión de cookie, y las políticas RLS
// aplican sin tener que duplicarlas a mano acá).
export async function getRequestContext(
  request: Request
): Promise<{ userId: string; supabase: SupabaseClient<Database> } | null> {
  const cookieClient = await createCookieClient()
  const {
    data: { user: cookieUser },
  } = await cookieClient.auth.getUser()
  if (cookieUser) return { userId: cookieUser.id, supabase: cookieClient }

  const header = request.headers.get('authorization')
  if (!header?.toLowerCase().startsWith('bearer ')) return null
  const accessToken = header.slice(7).trim()

  const bearerClient = createJwtClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  )
  const {
    data: { user },
  } = await bearerClient.auth.getUser(accessToken)
  if (!user) return null

  return { userId: user.id, supabase: bearerClient }
}
