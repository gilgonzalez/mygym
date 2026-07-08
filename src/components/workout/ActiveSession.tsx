import { LocalWorkout } from '@/types/workout/viewTypes'
import { useEffect } from 'react'
import { useWorkoutStore } from '@/store/workOutStore'
import { WorkoutExecutionView } from './WorkoutExecutionView'
import { getNextWorkoutCursor, getStepInfo } from '@/lib/workout/sessionNavigation'

interface ActiveSessionProps {
  workout: LocalWorkout
  currentSectionIndex: number
  currentExerciseIndex: number
  currentSet: number
  isResting: boolean
  canAccessTutorial: boolean
  onExit: () => void
  onNextStep: () => void
}

export function ActiveSession({
  workout,
  currentSectionIndex,
  currentExerciseIndex,
  currentSet,
  isResting,
  canAccessTutorial,
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

    const nextCursor = getNextWorkoutCursor(workout, {
      sectionIndex: currentSectionIndex,
      exerciseIndex: currentExerciseIndex,
      set: currentSet,
    })
    const nextStep = nextCursor ? getStepInfo(workout, nextCursor) : null

    if (nextStep) {
      const currentOrderType = currentSection.orderType || 'single'
      const isNewSection = nextStep.sectionIndex !== currentSectionIndex
      const isNewSet = nextStep.set !== currentSet
      const isSameExercise = nextStep.exerciseIndex === currentExerciseIndex && nextStep.sectionIndex === currentSectionIndex

      if (isNewSection) {
        text = `Siguiente sección: ${nextStep.section.name}. Primer ejercicio: ${nextStep.exercise.name}. ${formatDetails(nextStep.exercise)}.`
      } else if (currentOrderType === 'single' && isSameExercise && isNewSet) {
        text = `Siguiente serie. ${nextStep.exercise.name}. Serie ${nextStep.set}.`
      } else if (currentOrderType === 'linear' && isNewSet) {
        text = `Siguiente ronda. ${nextStep.exercise.name}. Serie ${nextStep.set}.`
      } else {
        text = `Siguiente ejercicio: ${nextStep.exercise.name}. ${formatDetails(nextStep.exercise)}.`
      }
    } else {
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
  }, [currentExercise, currentExerciseIndex, currentSection, currentSectionIndex, currentSet, isResting, setSpeaking, workout])

  return (
    <WorkoutExecutionView
      workout={workout}
      currentSectionIndex={currentSectionIndex}
      currentExerciseIndex={currentExerciseIndex}
      currentSet={currentSet}
      isResting={isResting}
      canAccessTutorial={canAccessTutorial}
      onExit={onExit}
      onNextStep={onNextStep}
      onPrev={prevStep}
    />
  )
}
