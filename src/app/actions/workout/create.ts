'use server'

import { createClient } from "@/lib/supabase/server"
import { Database } from "@/types/database"
import { syncWorkoutChallengeConfig, WorkoutChallengeInput } from "./challenge"

type DbWorkout = Database['public']['Tables']['workouts']['Insert']
type DbExercise = Database['public']['Tables']['exercises']['Insert']
type DbSection = Database['public']['Tables']['sections']['Insert']

type ExerciseTutorialInput = {
    media_url?: string | null
    media_id?: string | null
    filename?: string | null
    bucket_path?: string | null
    media_type?: 'image' | 'video' | 'audio' | null
    steps?: Array<{
        title: string
        description: string
    }>
}

type ExerciseInput = Omit<DbExercise, 'id' | 'created_at' | 'thumbnail_media_id' | 'is_public'> & {
    id?: string
    type: 'reps' | 'time' | 'emom'
    thumbnail_url?: string | null
    thumbnail_media_id?: string | null
    filename?: string | null
    bucket_path?: string | null
    tutorial?: ExerciseTutorialInput | null
    is_new_exercise?: boolean
    link_id?: string
    sets?: number | null
    reps?: number | null
    rest?: number | null
    duration?: number | null
    weight_kg?: number | null
}

type SectionInput = Omit<DbSection, 'id' | 'created_at'> & {
    id?: string
    orderType: DbSection['type']
    exercises: ExerciseInput[]
}
export type WorkoutInput = Omit<DbWorkout, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'is_public'> & {
    exp_earned?: number
    stats?: Record<string, number>
    sections: SectionInput[]
    challenge?: WorkoutChallengeInput | null
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

    if (!workoutId) {
      throw new Error('Workout ID missing after creation')
    }

    await syncWorkoutChallengeConfig(supabase, workoutId, data.challenge)

    return { success: true, workoutId }
  } catch (error: any) {
    console.error('Server Action Error:', error)
    return { success: false, error: error.message }
  }
}
