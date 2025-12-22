import React, { useState, useMemo } from 'react'
import { X, Play, Dumbbell } from 'lucide-react'
import { Button } from '@/components/Button'
import { PreviewActivity } from './PreviewActivity'

interface PreviewWorkoutProps {
  data: any
  onClose: () => void
}

export function PreviewWorkout({ data, onClose }: PreviewWorkoutProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  // Flatten structure for linear navigation
  const flatSteps = useMemo(() => {
    const steps: any[] = []
    data.sections?.forEach((section: any) => {
      section.exercises?.forEach((ex: any) => {
        steps.push({ ...ex, sectionName: section.name })
      })
    })
    return steps
  }, [data])

  if (isPlaying) {
    return (
      <PreviewActivity
        exercise={flatSteps[currentStep]}
        stepIndex={currentStep}
        totalSteps={flatSteps.length}
        sectionName={flatSteps[currentStep]?.sectionName}
        onNext={() => {
            if (currentStep < flatSteps.length) {
                setCurrentStep(prev => prev + 1)
            } else {
                setIsPlaying(false) // Finish
            }
        }}
        onPrev={() => setCurrentStep(prev => Math.max(0, prev - 1))}
        onClose={() => setIsPlaying(false)}
      />
    )
  }

  // OVERVIEW MODE
  return (
    <div className="h-full w-full bg-background flex flex-col relative">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 shrink-0 bg-background/50 backdrop-blur z-10">
        <h2 className="font-bold text-sm">Workout Preview</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 w-full pb-20 scrollbar-hide">
         <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-3">
                <Dumbbell className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold mb-1 leading-tight">{data.title || 'Untitled Workout'}</h1>
            <p className="text-xs text-muted-foreground line-clamp-2">{data.description || 'No description provided.'}</p>
            
            <div className="flex justify-center gap-2 mt-4">
                <div className="flex flex-col items-center bg-muted/50 px-3 py-1.5 rounded-lg min-w-[70px]">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Category</span>
                    <span className="font-medium capitalize text-xs">{data.category}</span>
                </div>
                <div className="flex flex-col items-center bg-muted/50 px-3 py-1.5 rounded-lg min-w-[70px]">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Level</span>
                    <span className="font-medium capitalize text-xs">{data.difficulty}</span>
                </div>
            </div>
         </div>

         <div className="space-y-4">
            {data.sections?.map((section: any, idx: number) => (
                <div key={idx} className="space-y-2">
                    <h3 className="font-bold flex items-center gap-2 text-sm border-b pb-1">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                            {idx + 1}
                        </span>
                        {section.name || 'Section'}
                    </h3>
                    <div className="space-y-2 pl-1">
                        {section.exercises?.map((ex: any, eIdx: number) => (
                            <div key={eIdx} className="bg-card border rounded-lg p-2.5 flex justify-between items-center shadow-sm">
                                <div className="flex items-center gap-2.5">
                                    <div className="h-6 w-1 bg-primary/20 rounded-full" />
                                    <div>
                                        <p className="font-semibold text-xs">{ex.name || 'New Exercise'}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {ex.sets}×{ex.reps} • {ex.rest}s
                                        </p>
                                    </div>
                                </div>
                                {ex.weight && (
                                    <span className="font-mono text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded">
                                        {ex.weight}kg
                                    </span>
                                )}
                            </div>
                        ))}
                        {(!section.exercises || section.exercises.length === 0) && (
                            <p className="text-xs text-muted-foreground italic pl-3">No exercises added yet.</p>
                        )}
                    </div>
                </div>
            ))}
         </div>
      </div>

      <div className="p-4 bg-background/80 backdrop-blur absolute bottom-0 w-full border-t z-10">
          <Button 
            className="w-full text-sm h-10 rounded-full shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform" 
            onClick={() => setIsPlaying(true)}
            disabled={flatSteps.length === 0}
        >
              <Play className="h-4 w-4 mr-2 fill-current" /> Start Workout
          </Button>
      </div>
    </div>
  )
}