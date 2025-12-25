'use server'

import { createClient } from "@/lib/supabase/server"
import { Database } from "@/types/database"

type DbWorkout = Database['public']['Tables']['workouts']['Insert']
type DbExercise = Database['public']['Tables']['exercises']['Insert']
type DbSection = Database['public']['Tables']['sections']['Insert']

type ExerciseInput = Omit<DbExercise, 'id' | 'created_at' | 'created_by' | 'media_id' | 'is_public'> & {
    media_url?: string | null 
    media_id?: string | null
}

type SectionInput = Omit<DbSection, 'id' | 'created_at'> & {
    orderType: DbSection['type'] 
    exercises: ExerciseInput[]
}
export type WorkoutInput = Omit<DbWorkout, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'audio'> & {
    audio?: string[]
    sections: SectionInput[]
}

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