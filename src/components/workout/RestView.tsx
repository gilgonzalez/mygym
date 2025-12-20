import { Button } from '@/components/Button'
import { WorkoutTimer } from '@/components/WorkoutTimer'
import { Play } from 'lucide-react'
import { LocalExercise, LocalSection, LocalWorkout } from '@/types/workout/viewTypes'

interface RestViewProps {
  currentExercise: LocalExercise | undefined
  currentExerciseIndex: number
  currentSection: LocalSection
  workout: LocalWorkout
  currentSectionIndex: number
  onComplete: () => void
}

export function RestView({ 
  currentExercise, 
  currentExerciseIndex, 
  currentSection, 
  workout, 
  currentSectionIndex, 
  onComplete 
}: RestViewProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background text-foreground p-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-full max-w-md space-y-12 flex flex-col items-center">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary/50">REST</h2>
          <p className="text-lg text-muted-foreground font-medium">Breathe & Recover</p>
        </div>
        
        <div className="scale-125 transform transition-transform">
          <WorkoutTimer 
            key={`rest-${currentExerciseIndex}`}
            duration={currentExercise?.rest || 30}
            mode="rest"
            onComplete={onComplete}
            onSkip={onComplete}
          />
        </div>
        
        <div className="w-full bg-secondary/50 border border-border/50 rounded-2xl p-6 backdrop-blur-sm">
           <div className="flex items-center gap-2 mb-3">
             <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
             <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Up Next</span>
           </div>
           {currentExerciseIndex < currentSection.exercises.length - 1 ? (
             <div>
               <h3 className="text-xl font-bold leading-tight">{currentSection.exercises[currentExerciseIndex + 1].name}</h3>
               <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{currentSection.exercises[currentExerciseIndex + 1].description}</p>
             </div>
           ) : (
             <div>
               <h3 className="text-xl font-bold leading-tight">Next Section</h3>
               <p className="text-primary mt-1 font-medium">{workout.sections[currentSectionIndex + 1]?.name || "Finish Workout"}</p>
             </div>
           )}
           
           <Button className="w-full mt-6" onClick={onComplete}>
             Start Now <Play className="w-4 h-4 ml-2 fill-current" />
           </Button>
        </div>
      </div>
    </div>
  )
}