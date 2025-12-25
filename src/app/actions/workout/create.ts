'use server'

import { createClient } from "@/lib/supabase/server"
import { WorkoutInput } from "@/services/workout"

export async function createWorkoutAction(data: WorkoutInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated, you cannot create anything, just watch')
    }

    const { data: workoutId, error } = await supabase.rpc('create_complete_workout', {
      p_user_id: user.id,
      p_workout_data: data
    })

    if (error) {
      console.error('RPC Error:', error)
      throw new Error(`Transaction failed: ${error.message}`)
    }

    return { success: true, workoutId }
  } catch (error: any) {
    console.error('Server Action Error:', error)
    return { success: false, error: error.message }
  }
}