import { Button } from '@/components/Button'
import { ChevronLeft } from 'lucide-react'
import { LocalWorkout } from '@/types/workout/viewTypes'
import { RestView } from './RestView'
import { ExerciseView } from './ExerciseView'

interface ActiveSessionProps {
  workout: LocalWorkout
  currentSectionIndex: number
  currentExerciseIndex: number
  isResting: boolean
  onExit: () => void
  onNextStep: () => void
}

export function ActiveSession({
  workout,
  currentSectionIndex,
  currentExerciseIndex,
  isResting,
  onExit,
  onNextStep
}: ActiveSessionProps) {
  const currentSection = workout.sections[currentSectionIndex]
  const currentExercise = currentSection?.exercises[currentExerciseIndex]

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative">
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/60 to-transparent">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 border border-white/10" 
          onClick={onExit}
        >
           <ChevronLeft className="w-5 h-5" />
        </Button>
        
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
            onComplete={onNextStep}
          />
        ) : (
          <ExerciseView 
            currentExercise={currentExercise!}
            currentExerciseIndex={currentExerciseIndex}
            currentSection={currentSection}
            onComplete={onNextStep}
          />
        )}
      </main>
    </div>
  )
}