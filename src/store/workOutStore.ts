import { LocalWorkout } from '@/types/workout/viewTypes'
import { create } from 'zustand'

interface WorkoutState {
  activeWorkout: LocalWorkout | null
  hasStarted: boolean
  isCompleted: boolean
  
  // Progress tracking
  currentSectionIndex: number
  currentExerciseIndex: number
  isResting: boolean
  
  // Actions
  initializeWorkout: (workout: LocalWorkout) => void
  startSession: () => void
  endSession: () => void
  nextStep: () => void
  restartWorkout: () => void
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeWorkout: null,
  hasStarted: false,
  isCompleted: false,
  currentSectionIndex: 0,
  currentExerciseIndex: 0,
  isResting: false,

  initializeWorkout: (workout) => {
    set({
      activeWorkout: workout,
      hasStarted: false,
      isCompleted: false,
      currentSectionIndex: 0,
      currentExerciseIndex: 0,
      isResting: false
    })
  },

  startSession: () => set({ hasStarted: true }),

  endSession: () => set({ hasStarted: false }),

  restartWorkout: () => set({
    hasStarted: true,
    isCompleted: false,
    currentSectionIndex: 0,
    currentExerciseIndex: 0,
    isResting: false
  }),

  nextStep: () => {
    const state = get()
    const { 
      activeWorkout, 
      currentSectionIndex, 
      currentExerciseIndex, 
      isResting 
    } = state

    if (!activeWorkout) return

    const currentSection = activeWorkout.sections[currentSectionIndex]
    
    // Logic for transitioning between states
    if (isResting) {
      // Finished Rest -> Go to next exercise
      if (currentExerciseIndex < currentSection.exercises.length - 1) {
        // Next exercise in same section
        set({ 
          isResting: false, 
          currentExerciseIndex: currentExerciseIndex + 1 
        })
      } else if (currentSectionIndex < activeWorkout.sections.length - 1) {
        // Next section
        set({ 
          isResting: false, 
          currentSectionIndex: currentSectionIndex + 1,
          currentExerciseIndex: 0 
        })
      } else {
        // Workout Complete
        set({ isCompleted: true, hasStarted: false })
      }
    } else {
      // Finished Exercise -> Go to Rest (or finish if it's the very last thing)
      const isLastExerciseInSection = currentExerciseIndex === currentSection.exercises.length - 1
      const isLastSection = currentSectionIndex === activeWorkout.sections.length - 1

      if (isLastExerciseInSection && isLastSection) {
        // Immediately finish if it's the last exercise of the last section
        set({ isCompleted: true, hasStarted: false })
      } else {
        // Go to rest mode
        set({ isResting: true })
      }
    }
  }
}))