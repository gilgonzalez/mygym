'use server'

import { createClient } from '@/lib/supabase/server'
import { Workout } from '@/types/workout/composite'

export async function getWorkoutsAction(): Promise<{ success: boolean, data?: Workout[], error?: string }> {
  try {
    const supabase = await createClient()
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
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })

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
    console.error('Error fetching workouts:', error)
    return { success: false, error: error.message }
  }
}

export async function getUserWorkoutsAction(userId: string): Promise<{ success: boolean, data?: Workout[], error?: string }> {
  try {
    const supabase = await createClient()
    
    // Verify if requesting user is the same as userId to allow seeing private/draft
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const isOwner = currentUser?.id === userId

    let query = supabase
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

    // If not owner, only show public workouts
    if (!isOwner) {
      query = query.eq('visibility', 'public')
    }

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