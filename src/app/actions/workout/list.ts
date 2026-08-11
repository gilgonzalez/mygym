'use server'

import { createClient } from '@/lib/supabase/server'
import type { FollowStatus } from '@/types/social'
import { Workout, WorkoutLikerPreview } from '@/types/workout/composite'

export type FeedSort = 'newest' | 'popular'
export type FeedFilter = 'all' | 'following'

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
  }
) {
  const { from, to, filter, sortBy } = opts
  const SELECT_FIELDS = `
    id, user_id, title, description, visibility, created_at, updated_at,
    rating, difficulty, estimated_time, exp_earned, cover, audio, stats, tags,
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
