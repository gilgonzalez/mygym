export interface ExerciseTutorialStep {
  id?: string
  title: string
  description: string
}

export interface ExerciseTutorial {
  media?: {
    type: 'image' | 'video' | 'audio'
    url: string
  }
  steps: ExerciseTutorialStep[]
}

export interface LocalExercise {
  id: string
  name: string
  type: 'reps' | 'time'
  reps?: number | string
  sets?: number
  duration?: number // seconds
  rest: number // seconds
  thumbnail_url?: string
  tutorial?: ExerciseTutorial
  description?: string
  muscle_groups?: string[]
  equipment?: string[]
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
  tags?: string[]
  difficulty?: string
  audio?: string[] // YouTube URLs
  sections: LocalSection[]
}
