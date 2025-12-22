import React, { useState, useMemo } from 'react'
import { Play, Dumbbell, TimerIcon, Info, ChevronLeft, Clock } from 'lucide-react'
import { Button } from '@/components/Button'
import { PreviewActivity } from './PreviewActivity'
import { LocalWorkout } from '@/types/workout/viewTypes'

interface PreviewWorkoutProps {
  data: any
  onClose: () => void
}

export function PreviewWorkout({ data, onClose }: PreviewWorkoutProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  // Map form data to LocalWorkout structure
  const workout: LocalWorkout = useMemo(() => {
    return {
      id: 'preview',
      title: data.title || 'Untitled Workout',
      description: data.description || 'No description provided.',
      cover: data.cover || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
      tags: data.tags,
      difficulty: data.difficulty,
      audio: Array.isArray(data.audio) ? data.audio : (data.audio ? [data.audio] : []),
      sections: (data.sections || []).map((s: any) => ({
        id: s.id,
        name: s.name || 'Untitled Section',
        orderType: s.orderType || 'single',
        exercises: (s.exercises || []).map((e: any) => ({
          id: e.id,
          name: e.name || 'Untitled Exercise',
          type: e.type || 'reps',
          reps: e.reps,
          sets: e.sets,
          rest: e.rest || 60,
          description: e.description,
          media_url: e.media_url,
          muscle_groups: e.muscle_groups,
          equipment: e.equipment
        }))
      }))
    }
  }, [data])

  // Flatten structure for linear navigation (Playing Mode)
  const flatSteps = useMemo(() => {
    const steps: any[] = []
    workout.sections.forEach((section) => {
      section.exercises.forEach((ex) => {
        steps.push({ ...ex, sectionName: section.name })
      })
    })
    return steps
  }, [workout])

  if (isPlaying) {
    return (
      <PreviewActivity
        exercise={flatSteps[currentStep]}
        stepIndex={currentStep}
        totalSteps={flatSteps.length}
        sectionName={flatSteps[currentStep]?.sectionName}
        onNext={() => {
            if (currentStep < flatSteps.length - 1) {
                setCurrentStep(prev => prev + 1)
            } else {
                setIsPlaying(false) // Finish
                setCurrentStep(0)
            }
        }}
        onPrev={() => setCurrentStep(prev => Math.max(0, prev - 1))}
        onClose={() => setIsPlaying(false)}
      />
    )
  }

  // OVERVIEW MODE (Similar to WorkoutOverview)
  return (
    <div className="h-full w-full bg-background flex flex-col relative overflow-y-auto scrollbar-hide">
      {/* Hero Section */}
      <div className="relative h-[45%] min-h-[300px] w-full shrink-0">
         <div className="absolute top-4 left-4 z-50">
           <Button 
             variant="ghost" 
             size="icon" 
             className="h-10 w-10 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 border border-white/10" 
             onClick={onClose}
           >
             <ChevronLeft className="w-6 h-6" />
           </Button>
         </div>

         <div className="absolute inset-0">
           <img 
             src={workout.cover} 
             alt="Workout Cover" 
             className="w-full h-full object-cover opacity-90"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/30" />
         </div>
         
         <div className="absolute bottom-0 left-0 right-0 p-6 w-full z-10">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md text-primary text-xs font-medium mb-3 border border-primary/20">
             <Dumbbell className="w-3 h-3" /> {data.category || 'Strength Training'}
           </div>
           <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-2 drop-shadow-sm leading-tight">
             {workout.title}
           </h1>
           <div className="flex items-center gap-4 text-xs md:text-sm text-muted-foreground font-medium">
             <span className="flex items-center gap-1">
               <TimerIcon className="w-3 h-3 md:w-4 md:h-4" /> ~45 mins
             </span>
             <span className="flex items-center gap-1">
               <Info className="w-3 h-3 md:w-4 md:h-4" /> {data.difficulty || 'Intermediate'}
             </span>
           </div>
         </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 w-full px-4 md:px-6 py-6 space-y-8 bg-background">
         <div className="prose prose-sm prose-invert max-w-none">
           <p className="text-muted-foreground leading-relaxed">
             {workout.description}
           </p>
         </div>

         <div className="space-y-8 pb-24">
           {workout.sections.map((section, idx) => (
             <div key={idx} className="space-y-4">
               <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                 <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-xs font-bold text-primary ring-1 ring-border">
                   {idx + 1}
                 </span>
                 <h3 className="text-lg font-bold tracking-tight">{section.name}</h3>
               </div>
               
               <div className="grid gap-3 grid-cols-1">
                 {section.exercises.map((ex, exIdx) => (
                   <div 
                     key={exIdx} 
                     className="group relative flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all cursor-default"
                   >
                     <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-border/30 flex items-center justify-center">
                       {ex.media_url ? (
                         <img src={ex.media_url} alt={ex.name} className="w-full h-full object-cover" />
                       ) : (
                         <Dumbbell className="w-5 h-5 text-muted-foreground/40" />
                       )}
                     </div>
                     
                     <div className="flex-1 min-w-0">
                       <h4 className="font-semibold text-sm text-foreground truncate pr-2">{ex.name}</h4>
                       <div className="flex items-center gap-2 mt-1 text-[10px] md:text-xs text-muted-foreground">
                         <span className="bg-secondary px-1.5 py-0.5 rounded-md font-medium">
                           {ex.type === 'reps' ? `${ex.reps || 0} reps` : `${ex.duration || 0}s`}
                         </span>
                         {ex.sets && <span>{ex.sets} sets</span>}
                         {ex.rest && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {ex.rest}s</span>}
                       </div>
                     </div>
                   </div>
                 ))}
                 {section.exercises.length === 0 && (
                    <div className="text-center py-4 text-xs text-muted-foreground italic">
                        No exercises added yet.
                    </div>
                 )}
               </div>
             </div>
           ))}
         </div>
      </div>

      {/* Floating Start Button */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent z-50">
         <Button 
           className="w-full h-12 text-base font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl" 
           onClick={() => setIsPlaying(true)}
           disabled={flatSteps.length === 0}
         >
           <Play className="w-5 h-5 mr-2 fill-current" /> 
           Start Preview
         </Button>
      </div>
    </div>
  )
}