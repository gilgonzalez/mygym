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
  currentSet: number
  onComplete: () => void
}

export function RestView({ 
  currentExercise, 
  currentExerciseIndex, 
  currentSection, 
  workout, 
  currentSectionIndex, 
  currentSet,
  onComplete 
}: RestViewProps) {
  const totalSets = currentExercise?.sets || 1
  const orderType = currentSection.orderType || 'single'

  // Determine what is up next
  let nextStepInfo: { type: 'same' | 'next' | 'section' | 'finish', exercise?: LocalExercise, set?: number } = { type: 'finish' }

  if (orderType === 'single') {
      if (currentSet < totalSets) {
          nextStepInfo = { type: 'same', exercise: currentExercise, set: currentSet + 1 }
      } else if (currentExerciseIndex < currentSection.exercises.length - 1) {
          nextStepInfo = { type: 'next', exercise: currentSection.exercises[currentExerciseIndex + 1], set: 1 }
      } else if (currentSectionIndex < workout.sections.length - 1) {
          nextStepInfo = { type: 'section' }
      }
  } else {
      // Linear/Circuit
      // 1. Check next exercise in current round
      let nextExIdx = -1;
      for (let i = currentExerciseIndex + 1; i < currentSection.exercises.length; i++) {
            if (currentSet <= (currentSection.exercises[i].sets || 1)) {
                nextExIdx = i;
                break;
            }
      }

      if (nextExIdx !== -1) {
          const nextEx = currentSection.exercises[nextExIdx]
          // If next is same (unlikely in linear unless 1 exercise), treat as same
          if (nextEx.id === currentExercise?.id) {
             nextStepInfo = { type: 'same', exercise: nextEx, set: currentSet }
          } else {
             nextStepInfo = { type: 'next', exercise: nextEx, set: currentSet }
          }
      } else {
          // 2. Check next round
          const nextSet = currentSet + 1;
          let nextRoundExIdx = -1;
           for (let i = 0; i < currentSection.exercises.length; i++) {
                 if (nextSet <= (currentSection.exercises[i].sets || 1)) {
                     nextRoundExIdx = i;
                     break;
                 }
            }

            if (nextRoundExIdx !== -1) {
                 const nextEx = currentSection.exercises[nextRoundExIdx]
                 if (nextEx.id === currentExercise?.id) {
                    nextStepInfo = { type: 'same', exercise: nextEx, set: nextSet }
                 } else {
                    // Show set number for circuit next item
                    nextStepInfo = { type: 'next', exercise: nextEx, set: nextSet }
                 }
            } else if (currentSectionIndex < workout.sections.length - 1) {
                 nextStepInfo = { type: 'section' }
            }
      }
  }

  const isNextSetSameExercise = nextStepInfo.type === 'same'
  const nextExercise = nextStepInfo.exercise

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
            duration={currentExercise?.rest || 5}
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
           
           {isNextSetSameExercise ? (
             <div className="space-y-3">
               <h3 className="text-xl font-bold leading-tight">{currentExercise?.name}</h3>
               <div className="inline-block px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider border border-orange-500/20">
                  Set {nextStepInfo.set} of {currentExercise?.sets || 1}
               </div>
               <p className="text-sm text-muted-foreground mt-1">{currentExercise?.description}</p>
             </div>
           ) : nextStepInfo.type === 'next' && nextExercise ? (
             <div className="space-y-3">
               <h3 className="text-xl font-bold leading-tight">{nextExercise.name}</h3>
               
               {/* Show Set info for Circuit mode */}
               {orderType === 'linear' && (
                 <div className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/20 mb-2">
                    Round {nextStepInfo.set}
                 </div>
               )}

               {nextExercise.tutorial && (
                 <div className="rounded-lg overflow-hidden bg-black/5 border border-border/50">
                   {nextExercise.tutorial?.type === 'image' && (
                     <img 
                       src={nextExercise.tutorial?.url} 
                       alt="Tutorial" 
                       className="w-full h-40 object-cover"
                     />
                   )}
                   {nextExercise.tutorial?.type === 'video' && (
                     <video 
                       src={nextExercise.tutorial?.url} 
                       controls 
                       className="w-full max-h-48"
                     />
                   )}
                   {nextExercise.tutorial?.type === 'audio' && (
                     <div className="p-3 flex items-center justify-center bg-secondary">
                       <audio 
                         src={nextExercise.tutorial?.url} 
                         controls 
                         className="w-full h-8"
                       />
                     </div>
                   )}
                 </div>
               )}

               <p className="text-sm text-muted-foreground">{nextExercise.description}</p>
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