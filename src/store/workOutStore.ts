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
  elapsedMs: number
  lastActiveAt: number | null

  // Voice State
  isSpeaking: boolean
  setSpeaking: (speaking: boolean) => void

  // Actions
  initializeWorkout: (workout: LocalWorkout) => void
  startSession: () => void
  endSession: () => void
  pauseSessionClock: () => void
  resumeSessionClock: () => void
  nextStep: () => void
  prevStep: () => void
  restartWorkout: () => void
  jumpToStep: (sectionIndex: number, exerciseIndex: number) => void
}

function getCommittedElapsedMs(elapsedMs: number, lastActiveAt: number | null, now = Date.now()) {
  if (!lastActiveAt) return elapsedMs
  return elapsedMs + Math.max(now - lastActiveAt, 0)
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
  elapsedMs: 0,
  lastActiveAt: null,
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
      endTime: null,
      elapsedMs: 0,
      lastActiveAt: null,
    })
  },

  startSession: () => {
    const state = get()
    const now = Date.now()

    set({
      hasStarted: true,
      isCompleted: false,
      startTime: state.startTime ?? now,
      endTime: null,
      lastActiveAt: state.lastActiveAt ?? now,
    })
  },

  endSession: () => {
    const state = get()
    const now = Date.now()

    set({
      hasStarted: false,
      elapsedMs: getCommittedElapsedMs(state.elapsedMs, state.lastActiveAt, now),
      lastActiveAt: null,
    })
  },

  pauseSessionClock: () => {
    const state = get()
    if (!state.lastActiveAt) return

    const now = Date.now()

    set({
      elapsedMs: getCommittedElapsedMs(state.elapsedMs, state.lastActiveAt, now),
      lastActiveAt: null,
    })
  },

  resumeSessionClock: () => {
    const state = get()
    if (!state.hasStarted || state.lastActiveAt) return

    set({
      endTime: null,
      lastActiveAt: Date.now(),
    })
  },

  restartWorkout: () => set({
    hasStarted: true,
    isCompleted: false,
    currentSectionIndex: 0,
    currentExerciseIndex: 0,
    currentSet: 1,
    isResting: false,
    startTime: Date.now(),
    endTime: null,
    elapsedMs: 0,
    lastActiveAt: Date.now(),
  }),

  jumpToStep: (sectionIndex, exerciseIndex) => {
    const state = get()
    const now = Date.now()

    set({
      hasStarted: true,
      isCompleted: false,
      currentSectionIndex: sectionIndex,
      currentExerciseIndex: exerciseIndex,
      currentSet: 1,
      isResting: false,
      startTime: state.startTime ?? now,
      endTime: null,
      elapsedMs: state.startTime ? state.elapsedMs : 0,
      lastActiveAt: now,
    })
  },

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
        const now = Date.now()
        set({
          isCompleted: true,
          hasStarted: false,
          endTime: now,
          elapsedMs: getCommittedElapsedMs(state.elapsedMs, state.lastActiveAt, now),
          lastActiveAt: null,
        })
      }
    } else {
      if (nextCursor) {
        set({ isResting: true })
      } else {
        const now = Date.now()
        set({
          isCompleted: true,
          hasStarted: false,
          endTime: now,
          elapsedMs: getCommittedElapsedMs(state.elapsedMs, state.lastActiveAt, now),
          lastActiveAt: null,
        })
      }
    }
  }
}))
