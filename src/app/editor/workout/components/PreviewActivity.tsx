import React from 'react'
import { X, ChevronLeft, ChevronRight, Clock, CheckCircle2, Info } from 'lucide-react'
import { Button } from '@/components/Button'
import { ExerciseTutorialDialog } from '@/components/workout/ExerciseTutorialDialog'
import { formatDuration } from '@/lib/time'

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
  const [isTutorialOpen, setIsTutorialOpen] = React.useState(false)

  const getMediaType = (url?: string) => {
    if (!url) return null
    const ext = url.split('.').pop()?.toLowerCase()
    if (['mp4', 'mov', 'webm', 'mkv'].includes(ext || '')) return 'video'
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image'
    return 'video' // Default to video for unknown (e.g. blob) as it's a workout app
  }

  const mediaType = getMediaType(exercise?.thumbnail_url)

  return (
    <div className="absolute inset-0 z-20 bg-black text-white flex flex-col min-h-0 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] border-b border-white/10 shrink-0">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 uppercase tracking-wider">{sectionName}</span>
          <span className="font-bold text-sm">Step {stepIndex + 1} of {totalSteps}</span>
        </div>
        <div className="flex items-center gap-2">
          {exercise?.tutorial && (
            <Button variant="ghost" size="icon" onClick={() => setIsTutorialOpen(true)} className="text-white hover:bg-white/10">
              <Info className="h-5 w-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-white/10 shrink-0">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-start sm:justify-center px-5 py-6 sm:p-8 text-center gap-6 sm:gap-8 overflow-y-auto">
        {exercise ? (
          <>
            <div className="w-full max-w-[320px] sm:max-w-sm aspect-video rounded-2xl bg-zinc-900 overflow-hidden shadow-2xl shrink-0 border border-white/10 relative">
              {mediaType === 'video' ? (
                <video 
                    src={exercise.thumbnail_url} 
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                />
              ) : mediaType === 'image' ? (
                <img 
                    src={exercise.thumbnail_url} 
                    alt={exercise.name}
                    className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary/20">
                    <Clock className="h-20 w-20" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">{exercise.name}</h2>
              <p className="text-base sm:text-xl text-gray-400">
                {exercise.type === 'time'
                  ? `${exercise.sets} Sets × ${formatDuration(exercise.duration || 0)}`
                  : `${exercise.sets} Sets × ${exercise.reps} Reps`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-[320px] sm:max-w-xs">
              <div className="bg-white/5 rounded-2xl p-3 sm:p-4 flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-bold">{exercise.weight || '-'}</span>
                <span className="text-xs text-gray-400 uppercase">Kg</span>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 sm:p-4 flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-bold text-green-400">{formatDuration(exercise.rest || 60)}</span>
                <span className="text-xs text-gray-400 uppercase">Rest</span>
              </div>
            </div>

            {exercise.notes && (
              <div className="bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-lg text-sm max-w-[320px] sm:max-w-xs">
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
      <div className="border-t border-white/10 flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] bg-black/50 backdrop-blur shrink-0">
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 sm:h-12 sm:w-12 rounded-full border-white/20 hover:bg-white/10 text-white"
          onClick={onPrev}
          disabled={stepIndex === 0}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <div className="text-center">
          <span className="block text-xs text-gray-500 uppercase tracking-widest mb-1">Timer</span>
          <span className="font-mono text-xl sm:text-2xl font-bold">{formatDuration(0, { style: 'clock' })}</span>
        </div>

        <Button
          variant="default"
          size="icon"
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/10"
          onClick={onNext}
        >
          {stepIndex >= totalSteps - 1 ? <CheckCircle2 className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
        </Button>
      </div>
      <ExerciseTutorialDialog
        open={isTutorialOpen}
        onOpenChange={setIsTutorialOpen}
        exerciseName={exercise?.name || 'Ejercicio'}
        tutorial={exercise?.tutorial}
      />
    </div>
  )
}
