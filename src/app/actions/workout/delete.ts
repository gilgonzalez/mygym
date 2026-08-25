'use server'

import { createClient } from '@/lib/supabase/server'
import { deleteWorkoutForUser } from '@/lib/workout/deleteWorkout'

export async function deleteWorkoutAction(workoutId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('No autorizado')
    }

    await deleteWorkoutForUser(supabase, workoutId, user.id)

    return { success: true }
  } catch (error: any) {
    console.error('Delete Workout Error:', error)
    return { success: false, error: error.message }
  }
}
