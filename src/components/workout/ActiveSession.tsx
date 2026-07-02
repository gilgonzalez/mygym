import { LocalWorkout } from '@/types/workout/viewTypes'
import { useEffect } from 'react'
import { useWorkoutStore } from '@/store/workOutStore'
import { WorkoutExecutionView } from './WorkoutExecutionView'

interface ActiveSessionProps {
  workout: LocalWorkout
  currentSectionIndex: number
  currentExerciseIndex: number
  currentSet: number
  isResting: boolean
  onExit: () => void
  onNextStep: () => void
}

export function ActiveSession({
  workout,
  currentSectionIndex,
  currentExerciseIndex,
  currentSet,
  isResting,
  onExit,
  onNextStep
}: ActiveSessionProps) {
  const { setSpeaking, prevStep } = useWorkoutStore()
  const currentSection = workout.sections[currentSectionIndex]
  const currentExercise = currentSection?.exercises[currentExerciseIndex]

  // Text to Speech Effect
  useEffect(() => {
    // Only speak during rest (announcing next step)
    if (!isResting) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }

    // Cancel any previous speech to avoid overlap
    window.speechSynthesis.cancel()
    setSpeaking(true)

    // Determine what comes next to announce it
    let text = ''
    
    const totalSets = currentExercise?.sets || 1
    const orderType = currentSection.orderType || 'single'

    const formatDetails = (ex: any) => {
      if (ex.type === 'time') {
        return `${ex.duration} segundos`
      } else if (ex.type === 'reps') {
        const repsValue = ex.reps || 0
        const cleanReps = repsValue.toString().replace('/', ' por ')
        return `${cleanReps} repeticiones`
      }
      return ''
    }

    let nextStepFound = false

    // 1. Single Mode Logic
    if (orderType === 'single') {
      if (currentSet < totalSets) {
        // Next set of same exercise
        text = `Siguiente serie. ${currentExercise?.name}. Serie ${currentSet + 1}.`
        nextStepFound = true
      } else {
        // Next exercise in section?
        if (currentExerciseIndex < currentSection.exercises.length - 1) {
           const nextEx = currentSection.exercises[currentExerciseIndex + 1]
           text = `Siguiente ejercicio: ${nextEx.name}. ${formatDetails(nextEx)}.`
           nextStepFound = true
        } else if (currentSectionIndex < workout.sections.length - 1) {
           // Next section
           const nextSec = workout.sections[currentSectionIndex + 1]
           if (nextSec.exercises.length > 0) {
              const nextEx = nextSec.exercises[0]
              text = `Siguiente sección: ${nextSec.name}. Primer ejercicio: ${nextEx.name}. ${formatDetails(nextEx)}.`
              nextStepFound = true
           }
        }
      }
    } else {
      // 2. Linear/Circuit Mode Logic
      // Try to find next exercise in current round
      for (let i = currentExerciseIndex + 1; i < currentSection.exercises.length; i++) {
        const ex = currentSection.exercises[i]
        const exSets = ex.sets || 1
        if (currentSet <= exSets) {
            text = `Siguiente ejercicio: ${ex.name}. ${formatDetails(ex)}.`
            nextStepFound = true
            break
        }
      }
      
      if (!nextStepFound) {
        // Try next round
        const nextSet = currentSet + 1
        for (let i = 0; i < currentSection.exercises.length; i++) {
             const ex = currentSection.exercises[i]
             const exSets = ex.sets || 1
             if (nextSet <= exSets) {
                 text = `Siguiente ronda. ${ex.name}. Serie ${nextSet}.`
                 nextStepFound = true
                 break
             }
        }
      }

      if (!nextStepFound && currentSectionIndex < workout.sections.length - 1) {
         // Next section
         const nextSec = workout.sections[currentSectionIndex + 1]
         if (nextSec.exercises.length > 0) {
            const nextEx = nextSec.exercises[0]
            text = `Siguiente sección: ${nextSec.name}. Primer ejercicio: ${nextEx.name}. ${formatDetails(nextEx)}.`
            nextStepFound = true
         }
      }
    }

    if (!nextStepFound) {
      text = "Entrenamiento casi completado."
    }
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-ES' // Force Spanish accent
    utterance.rate = 1.0
    utterance.pitch = 1.0

    utterance.onend = () => {
      setSpeaking(false)
    }

    utterance.onerror = () => {
      setSpeaking(false)
    }
    
    // Speak
    window.speechSynthesis.speak(utterance)

    // Cleanup on unmount
    return () => {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }, [currentExercise, currentSet, isResting])

  return (
    <WorkoutExecutionView
      workout={workout}
      currentSectionIndex={currentSectionIndex}
      currentExerciseIndex={currentExerciseIndex}
      currentSet={currentSet}
      isResting={isResting}
      onExit={onExit}
      onNextStep={onNextStep}
      onPrev={prevStep}
    />
  )
}
