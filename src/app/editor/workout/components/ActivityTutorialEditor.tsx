'use client'

import { useState } from 'react'
import { ChevronDown, Info, Lock, Trash2 } from 'lucide-react'
import { Button } from '@/components/Button'
import { PremiumFeatureDialog } from '@/components/premium/PremiumFeatureDialog'

interface ActivityTutorialEditorProps {
  setValue: any
  watch: any
  nestIndex: number
  exerciseIndex: number
}

export function ActivityTutorialEditor({
  setValue,
  watch,
  nestIndex,
  exerciseIndex,
}: ActivityTutorialEditorProps) {
  const tutorialPath = `sections.${nestIndex}.exercises.${exerciseIndex}.tutorial`
  const tutorial = watch(tutorialPath)
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false)
  const stepCount = Array.isArray(tutorial?.steps) ? tutorial.steps.length : 0

  const handlePremiumAccess = () => {
    setIsPremiumModalOpen(true)
  }

  const removeTutorial = () => {
    setValue(tutorialPath, null, { shouldDirty: true })
  }

  return (
    <>
    <div className="rounded-[28px] border border-border/60 bg-gradient-to-br from-background to-muted/20 shadow-sm">
      {!tutorial ? (
        <button
          type="button"
          onClick={handlePremiumAccess}
          className="flex w-full items-center justify-between gap-4 rounded-[28px] border border-dashed border-border/70 bg-muted/[0.18] px-4 py-4 text-left transition-all hover:border-primary/40 hover:bg-primary/[0.04]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Agregar tutorial</p>
              <p className="text-xs text-muted-foreground">
                Disponible para usuarios premium.
              </p>
            </div>
          </div>
          <div className="hidden rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-600 sm:block dark:text-amber-400">
            Premium
          </div>
        </button>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3 p-4">
            <button
              type="button"
              className="flex flex-1 items-start gap-3 text-left"
              onClick={handlePremiumAccess}
            >
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Info className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">Tutorial del ejercicio</p>
                  <span className="rounded-full border border-border/60 bg-background/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {stepCount} paso{stepCount === 1 ? '' : 's'}
                  </span>
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
                    Premium
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  El tutorial permanece colapsado. Pulsa para conocer cómo desbloquear esta funcionalidad.
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handlePremiumAccess}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={removeTutorial}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
    <PremiumFeatureDialog
      open={isPremiumModalOpen}
      onOpenChange={setIsPremiumModalOpen}
      description="Los tutoriales de ejercicio estan disponibles solo para usuarios premium. Actualiza tu plan para crear, editar y gestionar media y pasos de realizacion."
    />
    </>
  )
}
