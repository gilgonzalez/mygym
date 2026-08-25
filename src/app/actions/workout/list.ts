'use server'

import { createClient } from '@/lib/supabase/server'
import type { FollowStatus } from '@/types/social'
import { Workout, WorkoutLikerPreview } from '@/types/workout/composite'

export type FeedSort = 'newest' | 'popular'
export type FeedFilter = 'all' | 'following' | 'favorites'

export interface GetWorkoutsParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: FeedSort
  filter?: FeedFilter
}

export interface GetWorkoutsResult {
  workouts: Workout[]
  hasMore: boolean
  totalCount: number
}

async function buildViewerFollowStatusMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  viewerId: string | undefined,
  ownerIds: string[]
) {
  const uniqueOwnerIds = [...new Set(ownerIds.filter(Boolean))]

  if (!viewerId || uniqueOwnerIds.length === 0) {
    return {} as Record<string, FollowStatus>
  }

  const idsToQuery = uniqueOwnerIds.filter((ownerId) => ownerId !== viewerId)

  if (idsToQuery.length === 0) {
    return {} as Record<string, FollowStatus>
  }

  const { data, error } = await supabase
    .from('user_follows')
    .select('followed_id, status')
    .eq('follower_id', viewerId)
    .in('followed_id', idsToQuery)

  if (error) throw error

  return (data ?? []).reduce<Record<string, FollowStatus>>((acc, row) => {
    if (row.status === 'pending' || row.status === 'accepted') {
      acc[row.followed_id] = row.status
    }

    return acc
  }, {})
}

async function getFollowedUserIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  viewerId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_follows')
    .select('followed_id')
    .eq('follower_id', viewerId)
    .eq('status', 'accepted')

  if (error) throw error

  return (data ?? []).map((row) => row.followed_id)
}

// IDs de los workouts que el usuario marcó como favorito (workout_likes),
// más recientes primero. RLS en workout_likes ya restringe esto a "auth.uid()
// = user_id", así que no hace falta validar nada más acá.
async function getLikedWorkoutIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  viewerId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('workout_likes')
    .select('workout_id')
    .eq('user_id', viewerId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => row.workout_id)
}

async function buildWorkoutLikesData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  viewerId: string | undefined,
  workoutIds: string[]
) {
  const uniqueIds = [...new Set(workoutIds.filter(Boolean))]

  if (uniqueIds.length === 0) {
    return {
      likesCounts: {} as Record<string, number>,
      likedByUser: {} as Record<string, boolean>,
      likesPreviews: {} as Record<string, WorkoutLikerPreview[]>,
    }
  }

  const { data: likesData, error: likesError } = await supabase
    .from('workout_likes')
    .select(`
      workout_id,
      user_id,
      created_at,
      user:users!workout_likes_user_id_fkey(id, username, name, avatar_url)
    `)
    .in('workout_id', uniqueIds)
    .order('created_at', { ascending: false })

  if (likesError) throw likesError

  const likesCounts: Record<string, number> = {}
  const likedByUser: Record<string, boolean> = {}
  const likesPreviewsAcc: Record<string, WorkoutLikerPreview[]> = {}

  for (const row of likesData ?? []) {
    likesCounts[row.workout_id] = (likesCounts[row.workout_id] || 0) + 1
    if (viewerId && row.user_id === viewerId) {
      likedByUser[row.workout_id] = true
    }

    const userRow = (row as any).user
    if (userRow) {
      const previewArr = likesPreviewsAcc[row.workout_id] ?? (likesPreviewsAcc[row.workout_id] = [])
      if (previewArr.length < 3) {
        previewArr.push({
          id: userRow.id,
          username: userRow.username ?? null,
          name: userRow.name ?? null,
          avatar_url: userRow.avatar_url ?? null,
        })
      }
    }
  }

  return { likesCounts, likedByUser, likesPreviews: likesPreviewsAcc }
}

async function buildWorkoutCommentsCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workoutIds: string[]
) {
  const uniqueIds = [...new Set(workoutIds.filter(Boolean))]

  if (uniqueIds.length === 0) {
    return {} as Record<string, number>
  }

  const { data, error } = await supabase
    .from('workout_logs')
    .select('workout_id')
    .in('workout_id', uniqueIds)
    .not('notes', 'is', null)
    .neq('notes', '')

  if (error) throw error

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const workoutId = row.workout_id
    if (!workoutId) continue
    counts[workoutId] = (counts[workoutId] || 0) + 1
  }

  return counts
}

async function buildWorkoutsWithMetadata(
  supabase: Awaited<ReturnType<typeof createClient>>,
  viewer: { id: string } | undefined,
  rawData: any[]
): Promise<Workout[]> {
  const followStatusByOwner = await buildViewerFollowStatusMap(
    supabase,
    viewer?.id,
    rawData.map((workout: any) => workout.user_id)
  )

  const workoutIds = rawData.map((workout: any) => workout.id)
  const { likesCounts, likedByUser, likesPreviews } = await buildWorkoutLikesData(
    supabase,
    viewer?.id,
    workoutIds
  )
  const commentsCounts = await buildWorkoutCommentsCount(supabase, workoutIds)

  return rawData.map((workout: any) => {
    const challengeData = Array.isArray(workout.challenge)
      ? workout.challenge[0]
      : workout.challenge

    return {
      ...workout,
      challenge: challengeData || null,
      user: workout.user,
      likes_count: likesCounts[workout.id] || 0,
      is_liked: likedByUser[workout.id] || false,
      likes_preview: likesPreviews[workout.id] || [],
      comments_count: commentsCounts[workout.id] || 0,
      viewer_follow_status:
        workout.user_id && workout.user_id !== viewer?.id
          ? followStatusByOwner[workout.user_id] || 'none'
          : undefined,
      sections: (workout.workout_sections || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((ws: any) => ({
          ...ws.sections,
          total_exercises: ws.sections.section_exercises?.[0]?.count || 0,
          exercises: []
        }))
    }
  })
}

function matchesSearch(workout: any, search: string): boolean {
  if (!search) return true
  const haystack = [
    workout.title ?? '',
    workout.description ?? '',
    workout.user?.name ?? '',
    workout.user?.username ?? '',
    ...(workout.tags ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(search)
}

async function fetchWorkoutWindow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string } | undefined,
  opts: {
    from: number
    to: number
    filter: FeedFilter
    sortBy: FeedSort
    // Ya resueltos una sola vez en getWorkoutsAction (evita repetir la
    // consulta a workout_likes en cada ventana del loop de paginación de
    // abajo).
    likedWorkoutIds?: string[]
  }
) {
  const { from, to, filter, sortBy, likedWorkoutIds } = opts
  const SELECT_FIELDS = `
    id, user_id, title, description, visibility, created_at, updated_at,
    rating, difficulty, estimated_time, exp_earned, cover, stats, tags,
    challenge:workout_challenges(*),
    user:users!user_id(id, username, name, avatar_url),
    workout_sections(
      order_index,
      sections(
        *,
        section_exercises(count)
      )
    )
  `

  let query = supabase
    .from('workouts')
    .select(SELECT_FIELDS)

  if (filter === 'favorites') {
    // Sin filtro extra de visibilidad: son los workouts que el propio
    // usuario likeó, así que si dejaron de ser accesibles (el dueño lo puso
    // privado, se dejó de seguir) RLS ya los saca solo. Incluye los propios
    // workouts del usuario si se likeó a sí mismo.
    if (!likedWorkoutIds || likedWorkoutIds.length === 0) return []
    query = query.in('id', likedWorkoutIds)
  } else {
    const visibilities: string[] = []
    if (user) {
      visibilities.push('public', 'followers')
    } else {
      visibilities.push('public')
    }
    query = query.in('visibility', visibilities)

    if (filter === 'following' && user) {
      const followedIds = await getFollowedUserIds(supabase, user.id)
      const allowedUserIds = [...followedIds, user.id]
      query = query.in('user_id', allowedUserIds)
    }
  }

  if (sortBy === 'popular') {
    query = query.order('rating', { ascending: false, nullsFirst: false })
    query = query.order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  query = query.range(from, to)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as any[]
}

export async function getWorkoutsAction(
  params: GetWorkoutsParams = {}
): Promise<{ success: boolean, data?: GetWorkoutsResult, error?: string }> {
  try {
    const {
      page = 1,
      pageSize = 8,
      search = '',
      sortBy = 'newest',
      filter = 'all',
    } = params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const normalizedSearch = search.trim().toLowerCase()
    const WINDOW_MULTIPLIER = 3
    const windowSize = pageSize * WINDOW_MULTIPLIER
    const currentWindowStart = (page - 1) * pageSize

    // Resuelto una sola vez acá afuera del loop de ventanas: fetchWorkoutWindow
    // lo necesita en cada iteración, pero es la misma lista de IDs siempre.
    const likedWorkoutIds = filter === 'favorites' && user ? await getLikedWorkoutIds(supabase, user.id) : undefined

    const filtered: any[] = []
    let windowIndex = 0
    let totalFetchedWindows = 0
    const MAX_WINDOWS = 5

    while (filtered.length < pageSize && totalFetchedWindows < MAX_WINDOWS) {
      const from = currentWindowStart + windowIndex * windowSize
      const to = from + windowSize - 1
      const raw = await fetchWorkoutWindow(supabase, user ?? undefined, {
        from,
        to,
        filter,
        sortBy,
        likedWorkoutIds,
      })

      const matchingInWindow = raw.filter((w) => matchesSearch(w, normalizedSearch))
      filtered.push(...matchingInWindow)

      if (raw.length < windowSize) break
      windowIndex++
      totalFetchedWindows++
    }

    const pageItems = filtered.slice(0, pageSize)
    const hasMoreInFiltered = filtered.length > pageSize

    const workouts = await buildWorkoutsWithMetadata(
      supabase,
      user ?? undefined,
      pageItems
    )

    if (sortBy === 'popular') {
      workouts.sort((a, b) => {
        const popA = (a.likes_count || 0) + (a.rating || 0) * 10
        const popB = (b.likes_count || 0) + (b.rating || 0) * 10
        return popB - popA
      })
    }

    const totalCount = hasMoreInFiltered
      ? page * pageSize + pageSize + 1
      : Math.max(0, (page - 1) * pageSize + workouts.length)

    return {
      success: true,
      data: { workouts, hasMore: hasMoreInFiltered, totalCount },
    }
  } catch (error: any) {
    console.error('Error fetching workouts:', error)
    return { success: false, error: error.message }
  }
}

export async function countNewWorkoutsAction(
  sinceDate: string,
  params: Pick<GetWorkoutsParams, 'search' | 'sortBy' | 'filter'> = {}
): Promise<{ success: boolean, data?: number, error?: string }> {
  try {
    const {
      search = '',
      filter = 'all',
    } = params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const normalizedSearch = search.trim().toLowerCase()

    let query = supabase
      .from('workouts')
      .select(`
        id, user_id, title, description, tags,
        user:users!user_id(id, username, name, avatar_url),
        created_at
      `)
      .gt('created_at', sinceDate)
      .order('created_at', { ascending: false })
      .limit(50)

    const visibilities: string[] = []
    if (user) {
      visibilities.push('public', 'followers')
    } else {
      visibilities.push('public')
    }
    query = query.in('visibility', visibilities)

    if (filter === 'following' && user) {
      const followedIds = await getFollowedUserIds(supabase, user.id)
      const allowedUserIds = [...followedIds, user.id]
      query = query.in('user_id', allowedUserIds)
    }

    const { data, error } = await query

    if (error) throw error

    const count = (data ?? []).filter((w: any) =>
      matchesSearch(w, normalizedSearch)
    ).length

    return { success: true, data: count }
  } catch (error: any) {
    console.error('Error counting new workouts:', error)
    return { success: false, error: error.message }
  }
}

export async function getUserWorkoutsAction(userId: string): Promise<{ success: boolean, data?: Workout[], error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user: viewer },
    } = await supabase.auth.getUser()

    const query = supabase
      .from('workouts')
      .select(`
        *,
        challenge:workout_challenges(*),
        user:users!user_id(id, username, name, avatar_url),
        workout_sections(
          order_index,
          sections(
            *,
            section_exercises(count)
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) throw error

    const followStatusByOwner = await buildViewerFollowStatusMap(
      supabase,
      viewer?.id,
      (data ?? []).map((workout: any) => workout.user_id)
    )

    const workoutIdsUser = ((data as any[]) ?? []).map((workout: any) => workout.id)
    const { likesCounts, likedByUser, likesPreviews } = await buildWorkoutLikesData(
      supabase,
      viewer?.id,
      workoutIdsUser
    )
    const commentsCounts = await buildWorkoutCommentsCount(supabase, workoutIdsUser)

    const workouts: Workout[] = (data as any).map((workout: any) => {
      const challengeData = Array.isArray(workout.challenge)
        ? workout.challenge[0]
        : workout.challenge

      return {
        ...workout,
        challenge: challengeData || null,
        user: workout.user,
        likes_count: likesCounts[workout.id] || 0,
        is_liked: likedByUser[workout.id] || false,
        likes_preview: likesPreviews[workout.id] || [],
        comments_count: commentsCounts[workout.id] || 0,
        viewer_follow_status:
          workout.user_id && workout.user_id !== viewer?.id
            ? followStatusByOwner[workout.user_id] || 'none'
            : undefined,
        sections: (workout.workout_sections || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((ws: any) => ({
            ...ws.sections,
            total_exercises: ws.sections.section_exercises?.[0]?.count || 0,
            exercises: []
          }))
      }
    })

    return { success: true, data: workouts }
  } catch (error: any) {
    console.error('Error fetching user workouts:', error)
    return { success: false, error: error.message }
  }
}

// Workouts que el usuario logueado marcó como favorito — usado por el tab
// "Favoritos" de perfil (getUserWorkoutsAction de arriba trae los workouts
// CREADOS por userId; acá es al revés, workouts de CUALQUIER autor que estén
// en workout_likes con user_id = viewer). Sin parámetro: siempre son los
// favoritos de quien hace el pedido, nunca los de otro usuario — RLS en
// workout_likes ya lo garantiza, pero no tiene sentido pedirlo "para" otro id.
export async function getFavoriteWorkoutsAction(): Promise<{ success: boolean, data?: Workout[], error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user: viewer },
    } = await supabase.auth.getUser()

    if (!viewer) {
      return { success: true, data: [] }
    }

    const likedWorkoutIds = await getLikedWorkoutIds(supabase, viewer.id)
    if (likedWorkoutIds.length === 0) {
      return { success: true, data: [] }
    }

    const { data, error } = await supabase
      .from('workouts')
      .select(`
        *,
        challenge:workout_challenges(*),
        user:users!user_id(id, username, name, avatar_url),
        workout_sections(
          order_index,
          sections(
            *,
            section_exercises(count)
          )
        )
      `)
      .in('id', likedWorkoutIds)

    if (error) throw error

    // El orden de la query no respeta el de likedWorkoutIds (más recientes
    // primero) — se reordena acá para que "Favoritos" liste por fecha de
    // like, no por fecha de creación del workout.
    const byId = new Map(((data as any[]) ?? []).map((w) => [w.id, w]))
    const orderedRaw = likedWorkoutIds.map((id) => byId.get(id)).filter(Boolean)

    const workouts = await buildWorkoutsWithMetadata(supabase, viewer, orderedRaw)

    return { success: true, data: workouts }
  } catch (error: any) {
    console.error('Error fetching favorite workouts:', error)
    return { success: false, error: error.message }
  }
}
