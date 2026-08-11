'use server'

import { createClient } from '@/lib/supabase/server'
import type { FollowStatus } from '@/types/social'
import { Workout, WorkoutLikerPreview } from '@/types/workout/composite'

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

export async function getWorkoutsAction(): Promise<{ success: boolean, data?: Workout[], error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
      .in('visibility', ['public', 'followers'])
      .order('created_at', { ascending: false })

    if (error) throw error

    const followStatusByOwner = await buildViewerFollowStatusMap(
      supabase,
      user?.id,
      ((data as any[]) ?? []).map((workout: any) => workout.user_id)
    )

    const workoutIds = ((data as any[]) ?? []).map((workout: any) => workout.id)
    const { likesCounts, likedByUser, likesPreviews } = await buildWorkoutLikesData(
      supabase,
      user?.id,
      workoutIds
    )
    const commentsCounts = await buildWorkoutCommentsCount(supabase, workoutIds)

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
          workout.user_id && workout.user_id !== user?.id
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
    console.error('Error fetching workouts:', error)
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
