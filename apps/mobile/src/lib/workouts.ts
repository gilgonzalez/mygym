import type { WorkoutVisibility } from '@mygym/shared'
import type { Database } from '@mygym/shared/types/database'

import { supabase } from './supabase'

// Data layer del feed mobile. Versión simplificada de
// src/app/actions/workout/list.ts (apps/web):
// - Ahí es un Server Action que corre con el cliente de Supabase del server
//   (cookies de sesión). Acá no hay server: el cliente de la app pega
//   directo a Supabase, protegido por las mismas RLS policies.
// - La búsqueda en la web pagina "a ciegas" y filtra en memoria por cómo
//   está armada esa función (fetchea ventanas de a `pageSize * 3` y prueba
//   con distintos batches hasta juntar una página que matchee el término).
//   Acá usamos `ilike` de Postgres directo en la query, que hace lo mismo
//   sin el round-trip extra — no hace falta portar esa parte.
type DbUser = Database['public']['Tables']['users']['Row']

export type FeedSort = 'newest' | 'popular'
export type FeedFilter = 'all' | 'following'

export type LikePreviewUser = Pick<DbUser, 'id' | 'username' | 'name' | 'avatar_url'>

export interface FeedWorkout {
  id: string
  user_id: string
  title: string
  description: string | null
  difficulty: string | null
  estimated_time: number | null
  rating: number | null
  cover: string | null
  tags: string[] | null
  created_at: string | null
  user: Pick<DbUser, 'id' | 'username' | 'name' | 'avatar_url'> | null
  likes_count: number
  is_liked: boolean
  likes_preview: LikePreviewUser[]
  comments_count: number
}

export interface FetchFeedResult {
  workouts: FeedWorkout[]
  hasMore: boolean
}

interface FetchFeedParams {
  page: number
  sortBy: FeedSort
  filter: FeedFilter
  search: string
  viewerId: string | null
}

const PAGE_SIZE = 8

const FEED_SELECT = `
  id, user_id, title, description, difficulty, estimated_time, rating, cover, tags, created_at,
  user:users!user_id(id, username, name, avatar_url)
`

async function getFollowedUserIds(viewerId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_follows')
    .select('followed_id')
    .eq('follower_id', viewerId)
    .eq('status', 'accepted')

  if (error) throw error
  return (data ?? []).map((row) => row.followed_id)
}

async function fetchLikesData(workoutIds: string[], viewerId: string | null) {
  const likesCounts: Record<string, number> = {}
  const likedByViewer = new Set<string>()
  const likesPreviews: Record<string, LikePreviewUser[]> = {}
  if (workoutIds.length === 0) return { likesCounts, likedByViewer, likesPreviews }

  // Igual que buildWorkoutLikesData en la web (src/app/actions/workout/list.ts):
  // el join con users da para armar de una el preview de "a quién le gustó"
  // (máx. 3, los likes más recientes primero) sin pegarle a la tabla de nuevo.
  const { data, error } = await supabase
    .from('workout_likes')
    .select('workout_id, user_id, created_at, user:users!workout_likes_user_id_fkey(id, username, name, avatar_url)')
    .in('workout_id', workoutIds)
    .order('created_at', { ascending: false })

  if (error) throw error

  for (const row of data ?? []) {
    likesCounts[row.workout_id] = (likesCounts[row.workout_id] ?? 0) + 1
    if (viewerId && row.user_id === viewerId) likedByViewer.add(row.workout_id)

    const liker = row.user as unknown as LikePreviewUser | null
    if (liker) {
      const preview = likesPreviews[row.workout_id] ?? (likesPreviews[row.workout_id] = [])
      if (preview.length < 3) preview.push(liker)
    }
  }

  return { likesCounts, likedByViewer, likesPreviews }
}

async function fetchCommentsCounts(workoutIds: string[]) {
  const counts: Record<string, number> = {}
  if (workoutIds.length === 0) return counts

  // Igual que en la web: "comentario" es un workout_log con notas, no una
  // tabla de comentarios propia.
  const { data, error } = await supabase
    .from('workout_logs')
    .select('workout_id')
    .in('workout_id', workoutIds)
    .not('notes', 'is', null)
    .neq('notes', '')

  if (error) throw error

  for (const row of data ?? []) {
    if (!row.workout_id) continue
    counts[row.workout_id] = (counts[row.workout_id] ?? 0) + 1
  }

  return counts
}

export async function fetchFeedPage({
  page,
  sortBy,
  filter,
  search,
  viewerId,
}: FetchFeedParams): Promise<FetchFeedResult> {
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase.from('workouts').select(FEED_SELECT)

  query = query.in('visibility', viewerId ? ['public', 'followers'] : ['public'])

  if (filter === 'following' && viewerId) {
    const followedIds = await getFollowedUserIds(viewerId)
    query = query.in('user_id', [...followedIds, viewerId])
  }

  const term = search.trim()
  if (term) {
    const escaped = term.replace(/[%,]/g, '')
    query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`)
  }

  query =
    sortBy === 'popular'
      ? query.order('rating', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
      : query.order('created_at', { ascending: false })

  const { data, error } = await query.range(from, to)
  if (error) throw error

  const rows = (data ?? []) as unknown as Omit<FeedWorkout, 'likes_count' | 'is_liked' | 'comments_count'>[]
  const workoutIds = rows.map((row) => row.id)

  const [{ likesCounts, likedByViewer, likesPreviews }, commentsCounts] = await Promise.all([
    fetchLikesData(workoutIds, viewerId),
    fetchCommentsCounts(workoutIds),
  ])

  let workouts: FeedWorkout[] = rows.map((row) => ({
    ...row,
    likes_count: likesCounts[row.id] ?? 0,
    is_liked: likedByViewer.has(row.id),
    likes_preview: likesPreviews[row.id] ?? [],
    comments_count: commentsCounts[row.id] ?? 0,
  }))

  // El orden por rating en la DB no contempla los likes: re-ordenamos en
  // memoria con el mismo puntaje que usa la web (src/app/actions/workout/list.ts).
  if (sortBy === 'popular') {
    workouts = [...workouts].sort((a, b) => {
      const popA = (a.likes_count || 0) + (a.rating || 0) * 10
      const popB = (b.likes_count || 0) + (b.rating || 0) * 10
      return popB - popA
    })
  }

  return { workouts, hasMore: rows.length === PAGE_SIZE }
}

// ---------------------------------------------------------------------------
// Detalle de un workout puntual — data layer de WorkoutOverview (el preview
// que se ve al tocar "Comenzar workout"). Versión simplificada de
// src/app/actions/workout/get.ts (apps/web):
// - Mismo patrón que fetchFeedPage: cliente pegando directo a Supabase
//   (RLS), sin el wrapper {success,data,error} de los Server Actions — acá
//   se throwea, como el resto de este archivo.
// - No trae el tutorial de cada ejercicio (media/steps): eso alimenta el
//   ExercisePreviewDialog de la web, que todavía no está portado. El resto
//   (secciones, ejercicios, reto AMRAP) sí, porque es lo que pinta
//   WorkoutOverview.
// - Tampoco trae likes/follow-status del viewer — el overview no los
//   muestra (a diferencia de la página de detalle completa de la web).
export type WorkoutDetailExerciseType = 'reps' | 'time' | 'emom'

export interface WorkoutDetailExercise {
  id: string
  name: string
  type: WorkoutDetailExerciseType
  reps: number
  sets: number
  duration: number
  rest: number
  weight_kg: number | null
  thumbnail_url?: string
  description: string | null
  muscle_groups: string[]
  equipment: string[]
}

export interface WorkoutDetailSection {
  id: string
  name: string
  orderType: 'linear' | 'single'
  exercises: WorkoutDetailExercise[]
}

export interface WorkoutDetailChallenge {
  challengeSectionId: string
  timeCapSeconds: number
}

export interface WorkoutDetail {
  id: string
  title: string
  cover: string | null
  description: string
  tags: string[]
  difficulty: string | null
  visibility: string | null
  sections: WorkoutDetailSection[]
  challenge: WorkoutDetailChallenge | null
}

const WORKOUT_DETAIL_SELECT = `
  id, title, cover, description, tags, difficulty, visibility,
  challenge:workout_challenges(challenge_section_id, time_cap_seconds),
  workout_sections(
    order_index,
    sections(
      id, name, type,
      section_exercises(
        id, order_index, type, reps, sets, duration, rest, weight_kg,
        exercises(
          id, name, description, muscle_group, equipment,
          thumbnail:media!exercises_thumbnail_media_id_fkey(url)
        )
      )
    )
  )
`

export async function fetchWorkoutById(id: string): Promise<WorkoutDetail> {
  const { data, error } = await supabase.from('workouts').select(WORKOUT_DETAIL_SELECT).eq('id', id).single()

  if (error) throw error
  if (!data) throw new Error('Workout no encontrado')

  const raw = data as any
  // El join a workout_challenges es 1:1 pero supabase-js lo tipa como array
  // cuando no se declara la FK como unique en el select — igual que
  // challengeData en get.ts (web).
  const challengeRow = Array.isArray(raw.challenge) ? raw.challenge[0] : raw.challenge

  return {
    id: raw.id,
    title: raw.title,
    cover: raw.cover,
    description: raw.description ?? '',
    tags: raw.tags ?? [],
    difficulty: raw.difficulty,
    visibility: raw.visibility,
    challenge: challengeRow
      ? { challengeSectionId: challengeRow.challenge_section_id, timeCapSeconds: challengeRow.time_cap_seconds }
      : null,
    sections: ((raw.workout_sections ?? []) as any[])
      .sort((a, b) => a.order_index - b.order_index)
      .map((ws) => ({
        id: ws.sections.id as string,
        name: ws.sections.name as string,
        orderType: ((ws.sections.type as 'linear' | 'single') || 'single'),
        exercises: ((ws.sections.section_exercises ?? []) as any[])
          .sort((a, b) => a.order_index - b.order_index)
          .map((se) => ({
            id: se.exercises.id as string,
            name: se.exercises.name as string,
            type: ((se.type || 'reps') as WorkoutDetailExerciseType),
            reps: se.reps ?? 0,
            sets: se.sets ?? 0,
            duration: se.duration ?? 0,
            rest: se.rest ?? 0,
            weight_kg: se.weight_kg ?? null,
            thumbnail_url: se.exercises.thumbnail?.url ?? undefined,
            description: se.exercises.description ?? null,
            muscle_groups: se.exercises.muscle_group ?? [],
            equipment: se.exercises.equipment ?? [],
          })),
      })),
  }
}

// ---------------------------------------------------------------------------
// "Mis workouts" del tab Workouts del perfil (ver app/(tabs)/profile.tsx y
// components/profile/WorkoutsTab.tsx) — puerto de getUserWorkoutsAction
// (apps/web, src/app/actions/workout/list.ts), pero filtrando por
// visibilidad en la query en vez de traer todo y filtrar en memoria: son
// los workouts del propio usuario, pero no hay motivo para bajar los que no
// se van a mostrar.
export type MyWorkoutsFilter = 'all' | WorkoutVisibility

export interface MyWorkout {
  id: string
  title: string
  cover: string | null
  difficulty: string | null
  estimated_time: number | null
  visibility: WorkoutVisibility
  tags: string[] | null
  created_at: string | null
  likes_count: number
  comments_count: number
}

const MY_WORKOUTS_SELECT = `
  id, title, cover, difficulty, estimated_time, visibility, tags, created_at
`

export async function fetchMyWorkouts(userId: string, filter: MyWorkoutsFilter): Promise<MyWorkout[]> {
  let query = supabase.from('workouts').select(MY_WORKOUTS_SELECT).eq('user_id', userId)
  if (filter !== 'all') query = query.eq('visibility', filter)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error

  const rows = (data ?? []) as unknown as Omit<MyWorkout, 'likes_count' | 'comments_count'>[]
  const workoutIds = rows.map((row) => row.id)

  const [{ likesCounts }, commentsCounts] = await Promise.all([
    fetchLikesData(workoutIds, userId),
    fetchCommentsCounts(workoutIds),
  ])

  return rows.map((row) => ({
    ...row,
    likes_count: likesCounts[row.id] ?? 0,
    comments_count: commentsCounts[row.id] ?? 0,
  }))
}

// Borrado del workout — puerto de deleteWorkoutAction (apps/web,
// src/app/actions/workout/delete.ts). `sections`/`section_exercises` NO
// cascadean al borrar `workouts` (workout_sections sí, vía ON DELETE CASCADE
// en workout_id, pero `sections` es una entidad aparte sin FK hacia
// workouts — ver 20260702_0001_clean_schema.sql), así que hay que limpiarlas
// a mano después de borrar el workout, igual que hace la Server Action.
export async function deleteWorkout(workoutId: string, userId: string): Promise<void> {
  const { data: workout, error: fetchError } = await supabase
    .from('workouts')
    .select('user_id')
    .eq('id', workoutId)
    .single()

  if (fetchError || !workout) throw new Error('Workout no encontrado')
  if (workout.user_id !== userId) throw new Error('No autorizado')

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
}

export async function setWorkoutLiked(workoutId: string, viewerId: string, liked: boolean): Promise<void> {
  if (liked) {
    const { error } = await supabase
      .from('workout_likes')
      .insert({ workout_id: workoutId, user_id: viewerId })
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('workout_likes')
      .delete()
      .eq('workout_id', workoutId)
      .eq('user_id', viewerId)
    if (error) throw error
  }
}
