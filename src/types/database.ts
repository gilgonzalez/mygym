export interface User {
  id: string
  email: string
  username: string
  name: string
  bio?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Workout {
  id: string
  user_id: string
  title: string
  description?: string
  category: 'cardio' | 'strength' | 'flexibility' | 'mixed'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration_minutes?: number
  is_public: boolean
  created_at: string
  updated_at: string
  user?: User
  sections?: Section[]
  likes_count?: number
  is_liked?: boolean
}

export interface Section {
  id: string
  workout_id: string
  name: string
  order: number
  created_at: string
  exercises?: Exercise[]
}

export interface Exercise {
  id: string
  section_id: string
  name: string
  repetitions?: number
  sets?: number
  duration_seconds?: number
  rest_seconds?: number
  type: 'reps' | 'time'
  media_url?: string
  description?: string
  equipment?: string[]
  target_rpe?: number // Rate of Perceived Exertion (1-10)
  order: number
  created_at: string
}

export interface Follower {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface Like {
  id: string
  user_id: string
  workout_id: string
  created_at: string
}