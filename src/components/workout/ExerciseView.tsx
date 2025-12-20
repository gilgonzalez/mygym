import { Button } from '@/components/Button'
import { WorkoutTimer } from '@/components/WorkoutTimer'
import { CheckCircle2, Dumbbell } from 'lucide-react'
import { LocalExercise, LocalSection } from '@/types/workout/viewTypes'

interface ExerciseViewProps {
  currentExercise: LocalExercise
  currentExerciseIndex: number
  currentSection: LocalSection
  onComplete: () => void
}

export function ExerciseView({ 
  currentExercise, 
  currentExerciseIndex, 
  currentSection, 
  onComplete 
}: ExerciseViewProps) {
  return (
    <div className="absolute inset-0 flex flex-col bg-black animate-in fade-in duration-500">
       <div className="relative flex-1 w-full h-full overflow-hidden">
          {currentExercise.media_url ? (
            <img 
              src={currentExercise.media_url} 
              alt={currentExercise.name} 
              className="w-full h-full object-cover opacity-90" 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-700">
              <Dumbbell className="w-24 h-24 mb-4 opacity-20" />
              <span className="font-mono text-sm opacity-40">No Media Available</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40 pointer-events-none" />

          {currentExercise.type === 'time' && (
            <div className="absolute top-20 left-6 z-30">
               <div className="bg-black/30 backdrop-blur-xl rounded-[2rem] pr-6 border border-white/10 shadow-2xl ring-1 ring-white/5">
                  <WorkoutTimer 
                    key={`exercise-${currentExercise.id}`}
                    duration={currentExercise.duration || 60}
                    mode="exercise"
                    onComplete={onComplete}
                  />
               </div>
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-20 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-6">
              <div className="flex-1 space-y-2 max-w-2xl">
                 <div className="flex items-center gap-2 mb-2">
                   <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary text-primary-foreground">
                     {currentExercise.type === 'time' ? 'Duration' : 'Reps'}
                   </span>
                   <span className="text-white/60 text-xs font-mono">
                     {currentExerciseIndex + 1} / {currentSection.exercises.length}
                   </span>
                 </div>
                 <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-[0.9] tracking-tight">
                   {currentExercise.name}
                 </h2>
                 {currentExercise.description && (
                   <p className="text-white/80 text-sm sm:text-base leading-relaxed line-clamp-2 sm:line-clamp-none max-w-xl font-light">
                     {currentExercise.description}
                   </p>
                 )}
              </div>

              {currentExercise.type === 'reps' && (
                 <Button 
                   size="lg" 
                   className="h-16 px-8 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform shrink-0 w-full sm:w-auto" 
                   onClick={onComplete}
                 >
                   <CheckCircle2 className="mr-3 w-6 h-6" /> 
                   Done ({currentExercise.reps})
                 </Button>
              )}
          </div>
       </div>
    </div>
  )
}