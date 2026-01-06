'use server'

import { createClient } from '@/lib/supabase/server'
import { Workout } from '@/types/workout/composite'

export async function getWorkoutById(id: string): Promise<{ success: boolean, data?: Workout, error?: string }> {
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
            section_exercises(
              id,
              order_index,
              reps,
              sets,
              duration,
              rest,
              exercises(
                *,
                media(
                  url,
                  type,
                  filename,
                  bucket_path
                )
              )
            )
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) throw new Error('Workout not found')

    // Transform deeply nested response to flat UI structure
    const workout: Workout = {
      ...data,
      user: data.user,
      sections: (data.workout_sections || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((ws: any) => ({
          ...ws.sections,
          total_exercises: ws.sections.section_exercises?.length || 0,
          exercises: (ws.sections.section_exercises || [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((se: any) => ({
              ...se.exercises,
              link_id: se.id,
              reps: se.reps ?? 0,
              sets: se.sets ?? 0,
              duration: se.duration ?? 0,
              rest: se.rest ?? 0,
              media_url: se.exercises.media?.url || undefined,
              filename: se.exercises.media?.filename || undefined,
              bucket_path: se.exercises.media?.bucket_path || undefined,
            }))
        }))
    }

    return { success: true, data: workout }
  } catch (error: any) {
    console.error('Error fetching workout:', error)
    return { success: false, error: error.message }
  }
}