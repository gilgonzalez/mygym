import { Button } from '@/components/Button'
import { ChevronLeft } from 'lucide-react'
import { LocalWorkout } from '@/types/workout/viewTypes'
import { RestView } from './RestView'
import { ExerciseView } from './ExerciseView'
import { useEffect } from 'react'
import { useWorkoutStore } from '@/store/workOutStore'
import { MusicPlayer } from './MusicPlayer'

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
  const { setSpeaking } = useWorkoutStore()
  const currentSection = workout.sections[currentSectionIndex]
  const currentExercise = currentSection?.exercises[currentExerciseIndex]

  // Text to Speech Effect
  useEffect(() => {
    if (!currentExercise || isResting) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }

    // Cancel any previous speech to avoid overlap
    window.speechSynthesis.cancel()
    setSpeaking(true)

    // Construct the message
    let details = ''
    if (currentExercise.type === 'time') {
      details = `${currentExercise.duration} segundos`
    } else if (currentExercise.type === 'reps') {
      // Handle "5-8" or "12/leg" formats broadly
      const cleanReps = currentExercise.reps.toString().replace('/', ' por ')
      details = `${cleanReps} repeticiones`
    }

    const text = `${currentExercise.name}. ${details}. `
    
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
    <div className="h-screen flex flex-col bg-background overflow-hidden relative">
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 border border-white/10" 
            onClick={onExit}
          >
             <ChevronLeft className="w-5 h-5" />
          </Button>

          <MusicPlayer 
             playlist={workout.audio || []} 
             className="!fixed-none !top-auto !left-auto !translate-x-0"
          />
        </div>
        
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 text-white/90">
             <span className="text-xs font-medium uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">
               Section {currentSectionIndex + 1}/{workout.sections.length}
             </span>
          </div>
          <p className="text-white/80 text-xs mt-1 font-medium drop-shadow-md">{currentSection.name}</p>
        </div>
      </header>

      <div className="absolute top-0 left-0 right-0 h-1 z-50 bg-white/10">
        <div 
          className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] transition-all duration-700 ease-out"
          style={{ width: `${((currentSectionIndex * 100) + (currentExerciseIndex / currentSection.exercises.length) * 100) / workout.sections.length}%` }}
        />
      </div>

      <main className="flex-1 w-full h-full relative">
        {isResting ? (
          <RestView 
            currentExercise={currentExercise}
            currentExerciseIndex={currentExerciseIndex}
            currentSection={currentSection}
            workout={workout}
            currentSectionIndex={currentSectionIndex}
            currentSet={currentSet}
            onComplete={onNextStep}
          />
        ) : (
          <ExerciseView 
            currentExercise={currentExercise!}
            currentExerciseIndex={currentExerciseIndex}
            currentSection={currentSection}
            currentSet={currentSet}
            onComplete={onNextStep}
          />
        )}
      </main>
    </div>
  )
}