import { Database } from '@/types/database'

type DbWorkout = Database['public']['Tables']['workouts']['Row']
type DbUser = Database['public']['Tables']['users']['Row']
type DbSection = Database['public']['Tables']['sections']['Row']
type DbExercise = Database['public']['Tables']['exercises']['Row']

// Type for the API Response (Deeply nested)
export interface WorkoutApiResponse extends DbWorkout {
  workout_user: {
    user: Pick<DbUser, 'id' | 'username' | 'name' | 'avatar_url'> | null
  } | null
  workout_sections: Array<{
    order_index: number
    sections: DbSection & {
      section_exercises: Array<{
        order_index: number
        sets?: number | null
        reps?: number | null
        rest_seconds?: number | null
        weight_kg?: number | null
        duration_seconds?: number | null
        notes?: string | null
        exercises: DbExercise
      }>
    }
  }>
}

// Type for the UI (Flattened)
export interface Workout extends DbWorkout {
  user: Pick<DbUser, 'id' | 'username' | 'name' | 'avatar_url'> | null
  sections: Array<DbSection & {
    exercises: Array<DbExercise & {
      sets?: number | null
      reps?: number | null
      rest?: number | null // mapped from rest_seconds
      weight_kg?: number | null
      duration?: number | null // mapped from duration_seconds
    }>
  }>
  likes_count?: number
  is_liked?: boolean
}