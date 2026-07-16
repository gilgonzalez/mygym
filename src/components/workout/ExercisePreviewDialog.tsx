'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDuration } from '@/lib/time'
import { LocalExercise } from '@/types/workout/viewTypes'
import { Clock3, Dumbbell, ImageOff, Layers3, Lock, PlayCircle, Target, Wrench } from 'lucide-react'
import { PremiumFeatureDialog } from '@/components/premium/PremiumFeatureDialog'
import { Button } from '@/components/Button'

interface ExercisePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercise: LocalExercise | null
  sectionName?: string
  canViewTutorial?: boolean
}

function getMediaType(url?: string) {
  if (!url) return null
  if (/\.(mp4|webm|ogg|mov)($|\?)/i.test(url)) return 'video'
  return 'image'
}

function PrimaryMedia({ exercise }: { exercise: LocalExercise }) {
  const mediaType = getMediaType(exercise.thumbnail_url)

  if (!exercise.thumbnail_url) {
    return (
      <div className="flex h-full min-h-[340px] w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.12),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.84),rgba(2,6,23,0.98))]">
        <div className="flex max-w-sm flex-col items-center gap-4 px-6 text-center text-white/78">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur-xl">
            <ImageOff className="h-7 w-7" />
          </div>
          <div>
            <p className="text-base font-semibold text-white">Sin imagen de referencia</p>
            <p className="mt-1 text-sm leading-6">
              Este ejercicio todavia no tiene una imagen o video asociado.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (mediaType === 'video') {
    return (
      <video
        src={exercise.thumbnail_url}
        controls
        autoPlay
        muted
        loop
        playsInline
        className="h-full min-h-[340px] w-full object-cover"
      />
    )
  }

  return <img src={exercise.thumbnail_url} alt={exercise.name} className="h-full min-h-[340px] w-full object-cover" />
}

function TutorialMedia({ exercise }: { exercise: LocalExercise }) {
  const tutorialMedia = exercise.tutorial?.media

  if (!tutorialMedia?.url) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-[28px] border border-dashed border-border/60 bg-muted/20 p-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PlayCircle className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">Sin recurso multimedia</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            El tutorial no incluye video ni imagen, pero puede tener pasos tecnicos.
          </p>
        </div>
      </div>
    )
  }

  if (tutorialMedia.type === 'video') {
    return (
      <video
        src={tutorialMedia.url}
        controls
        className="aspect-video w-full rounded-[28px] border border-border/60 bg-black object-cover"
      />
    )
  }

  if (tutorialMedia.type === 'audio') {
    return (
      <div className="rounded-[28px] border border-border/60 bg-muted/20 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <PlayCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium text-foreground">Audio explicativo</p>
            <p className="text-sm text-muted-foreground">Guia tecnica en audio.</p>
          </div>
        </div>
        <audio src={tutorialMedia.url} controls className="w-full" />
      </div>
    )
  }

  return (
    <img
      src={tutorialMedia.url}
      alt={`Tutorial de ${exercise.name}`}
      className="aspect-video w-full rounded-[28px] border border-border/60 object-cover"
    />
  )
}

function MetricChip({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 px-3 py-3 backdrop-blur-md">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/90">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/55">{label}</p>
          <p className="mt-1 break-words text-sm font-semibold leading-5 text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

function TutorialLockedCard({ onOpenPremium }: { onOpenPremium: () => void }) {
  return (
    <div className="rounded-[28px] border border-amber-500/20 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.10),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.75),rgba(255,255,255,0.95))] p-6 dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.98))]">
      <div className="max-w-2xl">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Lock className="h-6 w-6" />
        </div>
        <h4 className="text-lg font-semibold text-foreground">Tutorial premium</h4>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          La guia detallada de ejecucion, junto con su recurso multimedia y los pasos tecnicos, solo se puede visualizar con una cuenta premium.
        </p>
        <Button className="mt-5" onClick={onOpenPremium}>
          Ver informacion premium
        </Button>
      </div>
    </div>
  )
}

export function ExercisePreviewDialog({
  open,
  onOpenChange,
  exercise,
  sectionName,
  canViewTutorial = false,
}: ExercisePreviewDialogProps) {
  const tutorialSteps = exercise?.tutorial?.steps ?? []
  const [showPremiumDialog, setShowPremiumDialog] = useState(false)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden rounded-[32px] border-border/60 bg-background p-0 [&>[data-slot=dialog-close]]:top-4 [&>[data-slot=dialog-close]]:right-4 [&>[data-slot=dialog-close]]:flex [&>[data-slot=dialog-close]]:h-10 [&>[data-slot=dialog-close]]:w-10 [&>[data-slot=dialog-close]]:items-center [&>[data-slot=dialog-close]]:justify-center [&>[data-slot=dialog-close]]:rounded-full [&>[data-slot=dialog-close]]:border [&>[data-slot=dialog-close]]:border-white/15 [&>[data-slot=dialog-close]]:bg-black/70 [&>[data-slot=dialog-close]]:p-0 [&>[data-slot=dialog-close]]:text-white [&>[data-slot=dialog-close]]:opacity-100 [&>[data-slot=dialog-close]]:shadow-lg [&>[data-slot=dialog-close]]:backdrop-blur-md hover:[&>[data-slot=dialog-close]]:bg-black/85 hover:[&>[data-slot=dialog-close]]:text-white [&>[data-slot=dialog-close]>svg]:h-4 [&>[data-slot=dialog-close]>svg]:w-4">
          {exercise ? (
            <div className="max-h-[92vh] overflow-x-hidden overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <DialogHeader className="sr-only">
                <DialogTitle>{exercise.name}</DialogTitle>
                <DialogDescription>
                  Vista previa del ejercicio con detalles, metricas y tutorial.
                </DialogDescription>
              </DialogHeader>

              <section className="overflow-hidden bg-black">
                <div className="relative h-[620px] min-h-[340px] sm:h-auto sm:min-h-[340px]">
                  <PrimaryMedia exercise={exercise} />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.08)_0%,rgba(2,6,23,0.26)_36%,rgba(2,6,23,0.92)_100%)]" />

                  <div className="absolute inset-x-0 bottom-0 hidden p-6 sm:block sm:p-8">
                    <div className="mb-4 flex max-w-full flex-wrap gap-2">
                      {sectionName ? (
                        <Badge className="max-w-full border-white/10 bg-white/12 text-white hover:bg-white/12">
                          {sectionName}
                        </Badge>
                      ) : null}
                      <Badge variant="outline" className="max-w-full border-white/15 bg-black/20 text-white">
                        {exercise.type === 'time' ? 'Por tiempo' : 'Por repeticiones'}
                      </Badge>
                    </div>

                    <DialogHeader className="text-left">
                      <DialogTitle className="max-w-3xl break-words text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                        {exercise.name}
                      </DialogTitle>
                      {exercise.description?.trim() ? (
                        <DialogDescription className="mt-3 max-w-3xl rounded-2xl border border-white/10 bg-black/30 px-4 py-3 break-words text-sm font-medium leading-7 text-white/90 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-md sm:text-[15px]">
                          {exercise.description.trim()}
                        </DialogDescription>
                      ) : null}
                    </DialogHeader>

                    <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
                      <MetricChip
                        icon={<Layers3 className="h-4 w-4" />}
                        label="Series"
                        value={`${exercise.sets || 0}`}
                      />
                      <MetricChip
                        icon={<Target className="h-4 w-4" />}
                        label="Trabajo"
                        value={
                          exercise.type === 'time'
                            ? `${formatDuration(exercise.duration || 0)} / serie`
                            : `${exercise.reps || 0} reps / serie`
                        }
                      />
                      <MetricChip
                        icon={<Clock3 className="h-4 w-4" />}
                        label="Descanso"
                        value={formatDuration(exercise.rest || 0)}
                      />
                    </div>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-4 sm:hidden">
                    <div>
                      <div className="mb-4 flex max-w-full flex-wrap gap-2">
                        {sectionName ? (
                          <Badge className="max-w-full border-white/10 bg-white/12 text-white hover:bg-white/12">
                            {sectionName}
                          </Badge>
                        ) : null}
                        <Badge variant="outline" className="max-w-full border-white/15 bg-black/20 text-white">
                          {exercise.type === 'time' ? 'Por tiempo' : 'Por repeticiones'}
                        </Badge>
                      </div>

                      <DialogHeader className="text-left">
                        <DialogTitle className="max-w-3xl break-words text-3xl font-semibold leading-tight tracking-tight text-white">
                          {exercise.name}
                        </DialogTitle>
                        {exercise.description?.trim() ? (
                          <DialogDescription className="mt-3 max-w-3xl rounded-2xl border border-white/10 bg-black/30 px-4 py-3 break-words text-sm font-medium leading-7 text-white/90 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-md">
                            {exercise.description.trim()}
                          </DialogDescription>
                        ) : null}
                      </DialogHeader>

                      <div className="mt-5 grid gap-2.5">
                        <MetricChip
                          icon={<Layers3 className="h-4 w-4" />}
                          label="Series"
                          value={`${exercise.sets || 0}`}
                        />
                        <MetricChip
                          icon={<Target className="h-4 w-4" />}
                          label="Trabajo"
                          value={
                            exercise.type === 'time'
                              ? `${formatDuration(exercise.duration || 0)} / serie`
                              : `${exercise.reps || 0} reps / serie`}
                        />
                        <MetricChip
                          icon={<Clock3 className="h-4 w-4" />}
                          label="Descanso"
                          value={formatDuration(exercise.rest || 0)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
                <div className="rounded-[28px] border border-border/60 bg-card/70 p-5 sm:p-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="min-w-0">
                      <div className="mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <h4 className="font-medium text-foreground">Musculos objetivo</h4>
                      </div>
                      {exercise.muscle_groups?.length ? (
                        <div className="flex max-w-full flex-wrap gap-2">
                          {exercise.muscle_groups.map((muscle) => (
                            <Badge
                              key={muscle}
                              variant="secondary"
                              className="max-w-full rounded-full px-3 py-1 capitalize"
                            >
                              {muscle.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm leading-6 text-muted-foreground">
                          No hay grupos musculares especificados para este ejercicio.
                        </p>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="mb-3 flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-primary" />
                        <h4 className="font-medium text-foreground">Equipamiento</h4>
                      </div>
                      {exercise.equipment?.length ? (
                        <div className="flex max-w-full flex-wrap gap-2">
                          {exercise.equipment.map((item) => (
                            <Badge
                              key={item}
                              variant="outline"
                              className="max-w-full rounded-full px-3 py-1 capitalize"
                            >
                              {item.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                          <Dumbbell className="h-4 w-4 shrink-0" />
                          <span className="break-words">Sin equipamiento especificado.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-border/60 bg-card/70 p-5 sm:p-6">
                  <div className="mb-5 flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Tutorial de ejecucion</h3>
                  </div>

                  {canViewTutorial ? (
                    exercise.tutorial ? (
                      <div className="space-y-6">
                        <TutorialMedia exercise={exercise} />

                        {tutorialSteps.length ? (
                          <div className="grid gap-4 md:grid-cols-2">
                            {tutorialSteps.map((step, index) => (
                              <div
                                key={step.id || `${step.title}-${index}`}
                                className="min-w-0 rounded-[24px] border border-border/60 bg-background/80 p-4 sm:p-5"
                              >
                                <div className="mb-3 flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                                    {index + 1}
                                  </div>
                                  <h4 className="min-w-0 break-words text-base font-semibold text-foreground">
                                    {step.title}
                                  </h4>
                                </div>
                                <p className="break-words text-sm leading-7 text-muted-foreground">
                                  {step.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-[24px] border border-dashed border-border/60 bg-muted/20 px-5 py-8 text-center">
                            <p className="text-sm font-medium text-foreground">Tutorial sin pasos detallados</p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              Este tutorial existe, pero aun no tiene instrucciones paso a paso cargadas.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-border/60 bg-muted/20 px-5 py-10 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <PlayCircle className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">Este ejercicio aun no tiene tutorial</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Cuando exista contenido tecnico, aparecera aqui de forma visual y ordenada.
                        </p>
                      </div>
                    )
                  ) : (
                    <TutorialLockedCard onOpenPremium={() => setShowPremiumDialog(true)} />
                  )}
                </div>
              </section>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <PremiumFeatureDialog
        open={showPremiumDialog}
        onOpenChange={setShowPremiumDialog}
        title="Tutorial premium"
        description="Los tutoriales detallados de ejercicios estan reservados para usuarios premium. Incluyen recursos multimedia y pasos tecnicos completos para mejorar la ejecucion."
      />
    </>
  )
}
