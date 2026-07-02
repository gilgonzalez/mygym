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
    total_exercises?: number
    exercises: Array<DbExercise & {
      sets?: number | null
      reps?: number | null
      rest?: number | null 
      duration?: number | null 
      thumbnail_url?: string | null
      thumbnail_media_id?: string | null
      filename?: string | null
      bucket_path?: string | null
      tutorial?: {
        media_id?: string | null
        media_url?: string | null
        media_type?: 'image' | 'video' | 'audio' | null
        filename?: string | null
        bucket_path?: string | null
        steps: Array<{
          id?: string
          title: string
          description: string
        }>
      } | null
      link_id?: string
    }>
  }>
  likes_count?: number
  is_liked?: boolean
  rating: number | null
}
