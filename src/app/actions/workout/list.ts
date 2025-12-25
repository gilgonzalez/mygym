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
          sections(*)
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    const workouts: Workout[] = (data as any).map((workout: any) => ({
      ...workout,
      user: workout.user,
      sections: (workout.workout_sections || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((ws: any) => ({
          ...ws.sections,
          exercises: (ws.sections.section_exercises || [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((se: any) => ({
              ...se.exercises,
              sets: se.sets,
              reps: se.reps,
              rest: se.rest_seconds,
              weight_kg: se.weight_kg,
              duration: se.duration_seconds
            }))
        }))
    }))

    return { success: true, data: workouts }
  } catch (error: any) {
    console.error('Error fetching workouts:', error)
    return { success: false, error: error.message }
  }
}