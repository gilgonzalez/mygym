'use server'

import { createClient } from '@/lib/supabase/server'
import type { FollowStatus } from '@/types/social'
import { Workout } from '@/types/workout/composite'

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

    const workouts: Workout[] = (data as any).map((workout: any) => ({
      ...workout,
      user: workout.user,
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
    }))

    return { success: true, data: workouts }
  } catch (error: any) {
    console.error('Error fetching workouts:', error)
    return { success: false, error: error.message }
  }
}

export async function getUserWorkoutsAction(userId: string): Promise<{ success: boolean, data?: Workout[], error?: string }> {
  try {
    const supabase = await createClient()

    const query = supabase
      .from('workouts')
      .select(`
        *,
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

    const workouts: Workout[] = (data as any).map((workout: any) => ({
      ...workout,
      user: workout.user,
      sections: (workout.workout_sections || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((ws: any) => ({
          ...ws.sections,
          total_exercises: ws.sections.section_exercises?.[0]?.count || 0,
          exercises: []
        }))
    }))

    return { success: true, data: workouts }
  } catch (error: any) {
    console.error('Error fetching user workouts:', error)
    return { success: false, error: error.message }
  }
}
