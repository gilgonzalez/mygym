import { LocalWorkout } from '@/types/workout/viewTypes'
import { create } from 'zustand'

interface WorkoutState {
  activeWorkout: LocalWorkout | null
  hasStarted: boolean
  isCompleted: boolean
  
  // Progress tracking
  currentSectionIndex: number
  currentExerciseIndex: number
  currentSet: number
  isResting: boolean
  
  // Voice State
  isSpeaking: boolean
  setSpeaking: (speaking: boolean) => void

  // Actions
  initializeWorkout: (workout: LocalWorkout) => void
  startSession: () => void
  endSession: () => void
  nextStep: () => void
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
    currentSet: 1,
    isResting: false
  }),

  jumpToStep: (sectionIndex, exerciseIndex) => set({
    hasStarted: true,
    isCompleted: false,
    currentSectionIndex: sectionIndex,
    currentExerciseIndex: exerciseIndex,
    currentSet: 1,
    isResting: false
  }),

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

    const currentSection = activeWorkout.sections[currentSectionIndex]
    const currentExercise = currentSection.exercises[currentExerciseIndex]
    const totalSets = currentExercise.sets || 1
    const orderType = currentSection.orderType || 'single'
    
    // Logic for transitioning between states
    if (isResting) {
      // Finished Rest -> Go to next step
      
      if (orderType === 'single') {
        // Standard behavior: Finish all sets of current exercise first
        if (currentSet < totalSets) {
          set({ 
            isResting: false, 
            currentSet: currentSet + 1 
          })
          return
        }

        // No more sets, go to next exercise
        if (currentExerciseIndex < currentSection.exercises.length - 1) {
          // Next exercise in same section
          set({ 
            isResting: false, 
            currentExerciseIndex: currentExerciseIndex + 1,
            currentSet: 1
          })
        } else if (currentSectionIndex < activeWorkout.sections.length - 1) {
          // Next section
          set({ 
            isResting: false, 
            currentSectionIndex: currentSectionIndex + 1,
            currentExerciseIndex: 0,
            currentSet: 1
          })
        } else {
          // Workout Complete
          set({ isCompleted: true, hasStarted: false })
        }
      } else {
        // Linear/Circuit behavior: Move to next exercise immediately
        
        // 1. Try to find next exercise in current round (Set)
        let nextExIdx = -1;
        for (let i = currentExerciseIndex + 1; i < currentSection.exercises.length; i++) {
            const ex = currentSection.exercises[i];
            const exSets = ex.sets || 1;
            if (currentSet <= exSets) {
                nextExIdx = i;
                break;
            }
        }

        if (nextExIdx !== -1) {
            // Found next exercise in this round
            set({
                isResting: false,
                currentExerciseIndex: nextExIdx,
                // Keep currentSet same
            })
            return;
        }

        // 2. End of list reached for this round. Check if we need another round.
        let nextRoundExIdx = -1;
        const nextSet = currentSet + 1;
        
        for (let i = 0; i < currentSection.exercises.length; i++) {
             const ex = currentSection.exercises[i];
             const exSets = ex.sets || 1;
             if (nextSet <= exSets) {
                 nextRoundExIdx = i;
                 break;
             }
        }
        
        if (nextRoundExIdx !== -1) {
            // Start new round
            set({
                isResting: false,
                currentExerciseIndex: nextRoundExIdx,
                currentSet: nextSet
            })
            return;
        }

        // 3. No more rounds needed in this section. Move to Next Section.
        if (currentSectionIndex < activeWorkout.sections.length - 1) {
             set({ 
                isResting: false, 
                currentSectionIndex: currentSectionIndex + 1,
                currentExerciseIndex: 0,
                currentSet: 1
             })
        } else {
             set({ isCompleted: true, hasStarted: false })
        }
      }
    } else {
      // Finished Exercise -> Go to Rest (or finish if it's the very last thing)
      let isFinished = false

      if (orderType === 'single') {
        const isLastExerciseInSection = currentExerciseIndex === currentSection.exercises.length - 1
        const isLastSection = currentSectionIndex === activeWorkout.sections.length - 1
        const isLastSet = currentSet >= totalSets
        isFinished = isLastExerciseInSection && isLastSection && isLastSet
      } else {
        // Linear: Finished if last section AND no more exercises in this round AND no more rounds
        if (currentSectionIndex === activeWorkout.sections.length - 1) {
            // Check remaining in current round
            let hasMoreInRound = false;
            for(let i = currentExerciseIndex + 1; i < currentSection.exercises.length; i++) {
                if ((currentSection.exercises[i].sets || 1) >= currentSet) {
                    hasMoreInRound = true; break;
                }
            }
            
            // Check next round
            let hasMoreNextRound = false;
            if (!hasMoreInRound) {
                const nextSet = currentSet + 1;
                for(let i = 0; i < currentSection.exercises.length; i++) {
                    if ((currentSection.exercises[i].sets || 1) >= nextSet) {
                        hasMoreNextRound = true; break;
                    }
                }
            }
            
            if (!hasMoreInRound && !hasMoreNextRound) {
                isFinished = true;
            }
        }
      }

      if (isFinished) {
        // Immediately finish if it's the last set of the last exercise of the last section
        set({ isCompleted: true, hasStarted: false })
      } else {
        // Go to rest mode
        set({ isResting: true })
      }
    }
  }
}))