import { Database } from '@/types/database'
import type { FollowStatus } from '@/types/social'

type DbWorkout = Database['public']['Tables']['workouts']['Row']
type DbUser = Database['public']['Tables']['users']['Row']
type DbSection = Database['public']['Tables']['sections']['Row']
type DbExercise = Database['public']['Tables']['exercises']['Row']
type DbWorkoutChallenge = Database['public']['Tables']['workout_challenges']['Row']

// Type for the API Response (Deeply nested)
export interface WorkoutApiResponse extends DbWorkout {
  challenge?: DbWorkoutChallenge | null
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

export interface WorkoutLikerPreview {
  id: string
  username: string | null
  name: string | null
  avatar_url: string | null
}

// Type for the UI (Flattened)
export interface Workout extends DbWorkout {
  user: Pick<DbUser, 'id' | 'username' | 'name' | 'avatar_url'> | null
  challenge?: DbWorkoutChallenge | null
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
  likes_preview?: WorkoutLikerPreview[]
  viewer_follow_status?: FollowStatus
  rating: number | null
  comments_count?: number
}
