export interface LocalExercise {
  id: string
  name: string
  type: 'reps' | 'time'
  reps?: number | string
  sets?: number
  duration?: number // seconds
  rest: number // seconds
  media_url?: string
  description?: string
}

export interface LocalSection {
  id: string
  name: string
  exercises: LocalExercise[]
}

export interface LocalWorkout {
  id: string
  title: string
  description: string
  sections: LocalSection[]
}