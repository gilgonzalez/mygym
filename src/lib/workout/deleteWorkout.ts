import type { SupabaseClient } from '@supabase/supabase-js'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2 } from '@/lib/r2'
import type { Database } from '@/types/database'

// Borrado de un workout — única implementación, usada tanto por la Server
// Action de la web (deleteWorkoutAction) como por la ruta /api/workout/[id]
// que llama mobile (apps/mobile no puede borrar el objeto de R2 directo: no
// tiene las credenciales, ver src/lib/r2.ts). Antes cada plataforma portaba
// su propia versión de "borrar sections/section_exercises a mano" (ver
// git blame de deleteWorkoutAction y apps/mobile/src/lib/workouts.ts) sin
// que ninguna limpiara R2 — quedaba basura ahí para siempre. Una sola
// función evita que las dos vuelvan a divergir.
//
// Solo se limpia la portada (`workouts.cover`) — es lo único exclusivo del
// workout. Las miniaturas de ejercicio NO se tocan acá: `exercises` es un
// catálogo compartido (el vault), un ejercicio puede seguir usándose en
// otros workouts o simplemente querer quedar disponible para reusar más
// adelante aunque este workout se borre; borrar su media a ciegas rompería
// esas otras referencias o vaciaría el vault del usuario sin que lo haya
// pedido.
export async function deleteWorkoutForUser(
  supabase: SupabaseClient<Database>,
  workoutId: string,
  userId: string
): Promise<void> {
  const { data: workout, error: fetchError } = await supabase
    .from('workouts')
    .select('user_id, cover')
    .eq('id', workoutId)
    .single()

  if (fetchError || !workout) throw new Error('Workout no encontrado')
  if (workout.user_id !== userId) throw new Error('No autorizado')

  // sections/section_exercises no cascadean al borrar `workouts`
  // (workout_sections sí, vía ON DELETE CASCADE en workout_id, pero
  // `sections` es una entidad aparte sin FK hacia workouts — ver
  // 20260702_0001_clean_schema.sql), así que hay que limpiarlas a mano.
  const { data: workoutSections } = await supabase
    .from('workout_sections')
    .select('section_id')
    .eq('workout_id', workoutId)

  const sectionIds = (workoutSections ?? []).map((ws) => ws.section_id)

  const { error: deleteError } = await supabase.from('workouts').delete().eq('id', workoutId)
  if (deleteError) throw deleteError

  if (sectionIds.length > 0) {
    await supabase.from('section_exercises').delete().in('section_id', sectionIds)
    await supabase.from('sections').delete().in('id', sectionIds)
  }

  await cleanupOrphanedCoverMedia(supabase, userId, workout.cover)
}

async function cleanupOrphanedCoverMedia(
  supabase: SupabaseClient<Database>,
  userId: string,
  coverUrl: string | null
): Promise<void> {
  if (!coverUrl) return

  // El workout ya se borró — si sigue habiendo OTRO workout apuntando a la
  // misma URL exacta de portada (p.ej. uno duplicado a partir de este), no
  // tocamos el archivo.
  const { count: stillReferenced } = await supabase
    .from('workouts')
    .select('id', { count: 'exact', head: true })
    .eq('cover', coverUrl)

  if ((stillReferenced ?? 0) > 0) return

  // La portada puede ser una URL externa (fallback de Unsplash, pegada a
  // mano) sin fila en `media` — ahí no hay nada nuestro que borrar en R2.
  const { data: media } = await supabase
    .from('media')
    .select('id, bucket_path')
    .eq('url', coverUrl)
    .eq('user_id', userId)
    .maybeSingle()

  if (!media?.bucket_path) return

  // La misma fila de `media` puede estar reusada como miniatura de un
  // ejercicio o como media de un tutorial — la biblioteca de media es
  // compartida entre esos usos (ver MediaSelectionDialog en la web), no es
  // exclusiva de la portada de un workout. Si está referenciada desde ahí,
  // solo dejamos de usarla como portada de este workout (ya borrado); no
  // tocamos el archivo ni la fila.
  const [{ count: usedAsThumbnail }, { count: usedInTutorial }] = await Promise.all([
    supabase.from('exercises').select('id', { count: 'exact', head: true }).eq('thumbnail_media_id', media.id),
    supabase.from('exercise_tutorials').select('id', { count: 'exact', head: true }).eq('media_id', media.id),
  ])

  if ((usedAsThumbnail ?? 0) > 0 || (usedInTutorial ?? 0) > 0) return

  try {
    await r2.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: media.bucket_path }))
  } catch (err) {
    // El workout ya se borró y es lo que le importa al usuario — que quede
    // una fila de `media` huérfana apuntando a un archivo que R2 no pudo
    // borrar ahora es preferible a fallar todo el borrado acá.
    console.error('No se pudo borrar la portada del workout en R2:', err)
    return
  }

  await supabase.from('media').delete().eq('id', media.id)
}
