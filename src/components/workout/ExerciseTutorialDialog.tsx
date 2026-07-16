'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ExerciseTutorial } from '@/types/workout/viewTypes'
import { Play } from 'lucide-react'

interface ExerciseTutorialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exerciseName: string
  tutorial?: ExerciseTutorial
}

function renderTutorialMedia(tutorial?: ExerciseTutorial, exerciseName?: string) {
  const media = tutorial?.media

  if (!media?.url) {
    return (
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-lg backdrop-blur-xl">
            <Play className="ml-1 h-6 w-6 fill-current" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Sin recurso multimedia</p>
            <p className="text-xs text-white/70">
              Este tutorial de {exerciseName || 'este ejercicio'} no incluye video, imagen ni audio.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (media.type === 'video') {
    return (
      <video
        src={media.url}
        controls
        className="w-full rounded-2xl border border-border/50 bg-black"
      />
    )
  }

  if (media.type === 'audio') {
    return (
      <div className="rounded-2xl border border-border/50 bg-muted/30 p-4">
        <audio src={media.url} controls className="w-full" />
      </div>
    )
  }

  return (
    <img
      src={media.url}
      alt={`Tutorial de ${exerciseName || 'ejercicio'}`}
      className="w-full rounded-2xl border border-border/50 object-cover"
    />
  )
}

export function ExerciseTutorialDialog({
  open,
  onOpenChange,
  exerciseName,
  tutorial,
}: ExerciseTutorialDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tutorial: {exerciseName}</DialogTitle>
        </DialogHeader>

        {!tutorial ? (
          <p className="text-sm text-muted-foreground">Este ejercicio no tiene tutorial.</p>
        ) : (
          <div className="space-y-5">
            {renderTutorialMedia(tutorial, exerciseName)}

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Pasos</Badge>
                <span className="text-sm text-muted-foreground">
                  {tutorial.steps.length} {tutorial.steps.length === 1 ? 'paso' : 'pasos'}
                </span>
              </div>

              <div className="space-y-3">
                {tutorial.steps.map((step, index) => (
                  <div key={step.id || `${step.title}-${index}`} className="rounded-2xl border border-border/50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <h3 className="font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
