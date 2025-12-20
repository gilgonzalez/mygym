export interface LocalExercise {
  id: string
  name: string
  type: 'reps' | 'time'
  reps?: number | string
  sets?: number
  duration?: number // seconds
  rest: number // seconds
  media_url?: string
  tutorial?: {
    type: 'image' | 'video' | 'audio'
    url: string
  }
  description?: string
}

export interface LocalSection {
  id: string
  name: string
  orderType?: 'linear' | 'single'
  exercises: LocalExercise[]
}

export interface LocalWorkout {
  id: string
  title: string
  cover?: string
  description: string
  audio?: string[] // YouTube URLs
  sections: LocalSection[]
}