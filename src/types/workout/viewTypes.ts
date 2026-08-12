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
  type: 'reps' | 'time' | 'emom'
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

export interface LocalWorkoutChallenge {
  mode: 'amrap_section'
  challengeSectionId: string
  timeCapSeconds: number
  scoreType: 'rounds_plus_reps'
}

export interface LocalWorkoutChallengeResult {
  mode: 'amrap_section'
  roundsCompleted: number
  score: number
  timeCapSeconds: number
  isPr?: boolean
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
  challenge?: LocalWorkoutChallenge | null
}
