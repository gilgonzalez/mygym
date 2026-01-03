'use server'

import { createClient } from "@/lib/supabase/server"
import { WorkoutInput } from "./create"

export async function updateWorkoutAction(workoutId: string, data: WorkoutInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase.rpc('update_complete_workout', {
        p_workout_id: workoutId,
        p_user_id: user.id,
        p_workout_data: data
    })

    if (error) {
        console.error('RPC Update Error:', error)
        throw new Error(`Update failed: ${error.message}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Update Workout Error:', error)
    return { success: false, error: error.message }
  }
}