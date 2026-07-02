import { LocalWorkout } from '@/types/workout/viewTypes'
import { create } from 'zustand'
import { getNextWorkoutCursor, getPreviousWorkoutCursor } from '@/lib/workout/sessionNavigation'

interface WorkoutState {
  activeWorkout: LocalWorkout | null
  hasStarted: boolean
  isCompleted: boolean
  
  // Progress tracking
  currentSectionIndex: number
  currentExerciseIndex: number
  currentSet: number
  isResting: boolean
  
  // Time Tracking
  startTime: number | null
  endTime: number | null

  // Voice State
  isSpeaking: boolean
  setSpeaking: (speaking: boolean) => void

  // Actions
  initializeWorkout: (workout: LocalWorkout) => void
  startSession: () => void
  endSession: () => void
  nextStep: () => void
  prevStep: () => void
  restartWorkout: () => void
  jumpToStep: (sectionIndex: number, exerciseIndex: number) => void
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeWorkout: null,
  hasStarted: false,
  isCompleted: false,
  currentSectionIndex: 0,
  currentExerciseIndex: 0,
  currentSet: 1,
  isResting: false,
  startTime: null,
  endTime: null,
  isSpeaking: false,

  setSpeaking: (speaking) => set({ isSpeaking: speaking }),

  initializeWorkout: (workout) => {
    set({
      activeWorkout: workout,
      hasStarted: false,
      isCompleted: false,
      currentSectionIndex: 0,
      currentExerciseIndex: 0,
      currentSet: 1,
      isResting: false,
      startTime: null,
      endTime: null
    })
  },

  startSession: () => set({ hasStarted: true, startTime: Date.now(), endTime: null }),

  endSession: () => set({ hasStarted: false }), // Does not reset time, just pauses/stops UI

  restartWorkout: () => set({
    hasStarted: true,
    isCompleted: false,
    currentSectionIndex: 0,
    currentExerciseIndex: 0,
    currentSet: 1,
    isResting: false,
    startTime: Date.now(),
    endTime: null
  }),

  jumpToStep: (sectionIndex, exerciseIndex) => set({
    hasStarted: true,
    isCompleted: false,
    currentSectionIndex: sectionIndex,
    currentExerciseIndex: exerciseIndex,
    currentSet: 1,
    isResting: false,
    // Keep original start time if exists, otherwise set it? 
    // Usually jumpToStep implies we are in a session.
  }),

  prevStep: () => {
    const state = get()
    const { activeWorkout, currentSectionIndex, currentExerciseIndex, currentSet, isResting } = state
    if (!activeWorkout) return

    if (isResting) {
      set({ isResting: false })
      return
    }

    const previousCursor = getPreviousWorkoutCursor(activeWorkout, {
      sectionIndex: currentSectionIndex,
      exerciseIndex: currentExerciseIndex,
      set: currentSet,
    })

    if (previousCursor) {
      set({
        currentSectionIndex: previousCursor.sectionIndex,
        currentExerciseIndex: previousCursor.exerciseIndex,
        currentSet: previousCursor.set,
        isResting: false,
      })
    }
  },

  nextStep: () => {
    const state = get()
    const { 
      activeWorkout, 
      currentSectionIndex, 
      currentExerciseIndex,
      currentSet,
      isResting 
    } = state

    if (!activeWorkout) return

    const nextCursor = getNextWorkoutCursor(activeWorkout, {
      sectionIndex: currentSectionIndex,
      exerciseIndex: currentExerciseIndex,
      set: currentSet,
    })
    
    if (isResting) {
      if (nextCursor) {
        set({
          currentSectionIndex: nextCursor.sectionIndex,
          currentExerciseIndex: nextCursor.exerciseIndex,
          currentSet: nextCursor.set,
          isResting: false,
        })
      } else {
        set({ isCompleted: true, hasStarted: false, endTime: Date.now() })
      }
    } else {
      if (nextCursor) {
        set({ isResting: true })
      } else {
        set({ isCompleted: true, hasStarted: false, endTime: Date.now() })
      }
    }
  }
}))
