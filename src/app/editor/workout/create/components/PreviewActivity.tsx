import React from 'react'
import { X, ChevronLeft, ChevronRight, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/Button'

interface PreviewActivityProps {
  exercise: any
  stepIndex: number
  totalSteps: number
  sectionName: string
  onNext: () => void
  onPrev: () => void
  onClose: () => void
}

export function PreviewActivity({
  exercise,
  stepIndex,
  totalSteps,
  sectionName,
  onNext,
  onPrev,
  onClose
}: PreviewActivityProps) {
  const progress = ((stepIndex + 1) / totalSteps) * 100

  return (
    <div className="absolute inset-0 z-20 bg-black text-white flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase tracking-wider">{sectionName}</span>
          <span className="font-bold text-sm">Step {stepIndex + 1} of {totalSteps}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-white/10 shrink-0">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 overflow-y-auto">
        {exercise ? (
          <>
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary animate-pulse shrink-0">
              <Clock className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold">{exercise.name}</h2>
              <p className="text-xl text-gray-400">
                {exercise.sets} Sets × {exercise.reps} Reps
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-8">
              <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-3xl font-bold">{exercise.weight || '-'}</span>
                <span className="text-xs text-gray-400 uppercase">Kg</span>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-3xl font-bold text-green-400">{exercise.rest || '60'}</span>
                <span className="text-xs text-gray-400 uppercase">Rest (s)</span>
              </div>
            </div>

            {exercise.notes && (
              <div className="bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-lg text-sm max-w-xs mt-4">
                Note: {exercise.notes}
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold">Workout Complete!</h2>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="h-24 border-t border-white/10 flex items-center justify-between px-8 bg-black/50 backdrop-blur shrink-0 safe-area-bottom">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full border-white/20 hover:bg-white/10 text-white"
          onClick={onPrev}
          disabled={stepIndex === 0}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <div className="text-center">
          <span className="block text-xs text-gray-500 uppercase tracking-widest mb-1">Timer</span>
          <span className="font-mono text-2xl font-bold">00:00</span>
        </div>

        <Button
          variant="default"
          size="icon"
          className="h-14 w-14 rounded-full bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/10"
          onClick={onNext}
        >
          {stepIndex >= totalSteps ? <CheckCircle2 className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
        </Button>
      </div>
    </div>
  )
}