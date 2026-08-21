'use client'

import { Controller, useFieldArray } from 'react-hook-form'
import { Draggable, Droppable } from '@hello-pangea/dnd'
import {
  Activity,
  BedDouble,
  Dna,
  GripVertical,
  Image as ImageIcon,
  Info,
  Infinity as InfinityIcon,
  List,
  Package,
  Plus,
  Repeat,
  Timer,
  Trash2,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/form/TextArea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Exercise } from '@/app/actions/exercises/list'
import { createEmptyExercise, inferMediaType, sanitizeTutorial } from '../create/formHelpers'
import { ActivityTutorialEditor } from './ActivityTutorialEditor'
import { ExercisesVault } from './ExercisesVault'
import { MediaInput } from './MediaInput'
import { TagInput } from './TagInput'

// Extraído de create/page.tsx (ver ese archivo para el porqué de la
// separación). El field array de ejercicios de una sección: cada ejercicio
// es una card arrastrable (drag handle + drop de @hello-pangea/dnd) con su
// propio bloque de contenido/miniatura/formato/contexto, más los dos
// botones para agregar un ejercicio nuevo o desde el vault del catálogo.
//
// control/register/setValue/watch quedan como `any` (mismo criterio que ya
// tenía este componente en page.tsx) porque tipar bien un path anidado tipo
// `sections.${n}.exercises.${k}.type` con react-hook-form requiere plantillas
// de tipos que no valen la pena para un componente que ya solo se usa acá.
interface ExercisesFieldArrayProps {
  nestIndex: number
  control: any
  register: any
  setValue: any
  watch: any
  // No se usa acá dentro (los errores de validación se muestran a nivel del
  // form completo, ver summarizeFormErrors) — se mantiene en la firma porque
  // los call sites ya lo pasan.
  errors: any
  isCompactMobile?: boolean
  isAmrapSection?: boolean
}

export function ExercisesFieldArray({ nestIndex, control, register, setValue, watch, isCompactMobile = false, isAmrapSection = false }: ExercisesFieldArrayProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sections.${nestIndex}.exercises`
  })

  const renderHint = (text: string, className?: string) => {
    if (isCompactMobile) return null

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "rounded-full border border-border/60 bg-background/80 p-1.5 text-muted-foreground transition-colors hover:text-foreground",
              className
            )}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    )
  }

  const handleAddFromVault = (exercise: Exercise) => {
    const tutorialData = Array.isArray(exercise.tutorial) ? exercise.tutorial[0] : exercise.tutorial

    append({
        id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        db_id: exercise.id,
        name: exercise.name,
        type: (exercise.type === 'time' ? 'time' : 'reps'),
        reps: exercise.reps || 0,
        sets: exercise.sets || 3,
        rest: exercise.rest || 60,
        duration: exercise.duration || 0,
        description: exercise.description || '',
        difficulty: (exercise.difficulty as any) || 'beginner',
        muscle_groups: exercise.muscle_group || [],
        equipment: exercise.equipment || [],
        thumbnail_media_id: exercise.thumbnail_media_id,
        thumbnail_url: exercise.thumbnail?.url,
        tutorial: sanitizeTutorial(tutorialData ? {
          media_url: tutorialData.media?.url || '',
          media_id: null,
          filename: null,
          bucket_path: null,
          media_type: (tutorialData.media?.type as 'image' | 'video' | 'audio' | null) || inferMediaType(tutorialData.media?.url),
          steps: (tutorialData.steps || []).map((step: { id?: string; title: string; description: string }) => ({
            id: step.id,
            title: step.title,
            description: step.description,
          })),
        } : undefined) || undefined,
    })
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <Droppable droppableId={`exercises-${nestIndex}`} type="EXERCISE">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 sm:space-y-4">
            {fields.map((item, k) => {
              const exercisePath = `sections.${nestIndex}.exercises.${k}` as const
              const watchedType = watch(`${exercisePath}.type`)
              const selectedType = watchedType === 'time' ? 'time' : watchedType === 'emom' ? 'emom' : 'reps'
              const hasTutorial = Boolean(watch(`${exercisePath}.tutorial`))
              const exerciseSets = watch(`${exercisePath}.sets`) ?? 1

              return (
                <Draggable key={item.id} draggableId={item.id} index={k}>
                    {(provided) => (
                        <article
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "group relative overflow-hidden rounded-[20px] border p-2.5 shadow-sm transition-all duration-300 hover:shadow-lg sm:p-4 md:rounded-[30px] md:p-6",
                              isAmrapSection
                                ? "border-emerald-300/40 bg-gradient-to-br from-white via-emerald-50/30 to-white shadow-emerald-500/5 dark:from-zinc-950 dark:via-emerald-950/20 dark:to-zinc-950"
                                : "border-border/60 bg-gradient-to-br from-white via-white to-muted/20 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900/80"
                            )}
                        >
                            {isAmrapSection && (
                              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
                            )}
                            {!isAmrapSection && (
                              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                            )}

                            {/* Drag Handle */}
                            <div
                                {...provided.dragHandleProps}
                                className={cn(
                                  "absolute left-2 top-2.5 z-10 rounded-xl p-1.5 transition-colors hover:bg-black/5 hover:text-foreground sm:left-3 sm:top-4 sm:p-2",
                                  isAmrapSection ? "text-emerald-500/25 hover:text-emerald-600" : "text-muted-foreground/30"
                                )}
                            >
                                <GripVertical className="h-5 w-5" />
                            </div>

                            {/* Delete Button (Absolute Top Right) */}
                            <div className="absolute right-2.5 top-2.5 z-10 sm:right-4 sm:top-4">
                                <Button
                                    type="button" variant="ghost" size="icon"
                                    onClick={() => remove(k)}
                                    className="h-7 w-7 rounded-full text-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive sm:h-8 sm:w-8"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="pt-10 pl-2.5 pr-2.5 sm:pt-0 sm:pl-10 sm:pr-10">
                              <div className="flex flex-col items-stretch gap-2 border-b border-border/60 pb-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:pb-5">
                                <div className="flex flex-1 flex-wrap items-center gap-1.5 sm:gap-2">
                                  <span className={cn(
                                    "rounded-full border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.18em] sm:px-3 sm:py-1 sm:text-[10px]",
                                    isAmrapSection
                                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                      : "border-primary/20 bg-primary/10 text-primary"
                                  )}>
                                    {isAmrapSection ? `Vuelta · Paso ${k + 1}` : `Ejercicio ${k + 1}`}
                                  </span>
                                  {isAmrapSection ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-gradient-to-r from-emerald-500/15 to-teal-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300 sm:px-3 sm:text-[10px]">
                                      <InfinityIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                      x∞ sets
                                    </span>
                                  ) : (
                                    <span className="rounded-full border border-border/70 bg-background/80 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground sm:px-3 sm:text-[10px]">
                                      {selectedType === 'time' ? 'Por tiempo' : selectedType === 'emom' ? 'EMOM' : 'Por repeticiones'}
                                    </span>
                                  )}
                                  {!isAmrapSection && selectedType === 'emom' && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-gradient-to-r from-amber-500/15 to-orange-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300 sm:px-3 sm:text-[10px]">
                                      <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                      Cada minuto en punto
                                    </span>
                                  )}
                                  {isAmrapSection && exerciseSets > 1 && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300 sm:px-3 sm:text-[10px]">
                                      <Info className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                      Sets: {exerciseSets} (1 recomendado)
                                    </span>
                                  )}
                                  {hasTutorial && (
                                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400 sm:px-3 sm:text-[10px]">
                                      Tutorial listo
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="mt-3 space-y-3 sm:mt-6 sm:space-y-5">
                                <div className="grid gap-3 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-stretch">
                                  <div className="rounded-[20px] border border-border/60 bg-background/75 p-3 shadow-sm sm:rounded-[28px] sm:p-4 md:p-5">
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Contenido</p>
                                      </div>
                                      {renderHint('Usa un nombre corto y una descripción breve con cues o aclaraciones útiles para entender el ejercicio de un vistazo.')}
                                    </div>

                                    <Input
                                      {...register(`sections.${nestIndex}.exercises.${k}.name`)}
                                      placeholder="Nombre del ejercicio"
                                      className="h-auto border-none bg-transparent px-0 text-[1.1rem] font-black tracking-tight shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/30 sm:text-2xl"
                                    />
                                    <input type="hidden" {...register(`sections.${nestIndex}.exercises.${k}.id`)} />
                                    <input type="hidden" {...register(`sections.${nestIndex}.exercises.${k}.db_id`)} />
                                    <input type="hidden" {...register(`sections.${nestIndex}.exercises.${k}.link_id`)} />

                                    <Textarea
                                      {...register(`sections.${nestIndex}.exercises.${k}.description`)}
                                      placeholder={isCompactMobile ? "Notas breves..." : "Ej. Mantén el core activo, baja controlado y evita encoger los hombros."}
                                      className="mt-3 min-h-[72px] resize-none rounded-[20px] border-border/60 bg-muted/20 text-sm shadow-none sm:mt-4 sm:min-h-[108px]"
                                    />
                                  </div>

                                  <div className="rounded-[20px] border border-border/60 bg-background/75 p-3 shadow-sm sm:rounded-[28px] sm:p-4">
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                      <div className="flex items-center gap-2">
                                        <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                                          <ImageIcon className="h-4 w-4" />
                                        </div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                          Miniatura
                                        </label>
                                      </div>
                                      {renderHint('Sube una imagen o gif que identifique visualmente el ejercicio. Se usa como vista previa en tarjetas y listados.')}
                                    </div>

                                    <Controller
                                      control={control}
                                      name={`sections.${nestIndex}.exercises.${k}.thumbnail_url`}
                                      render={({ field }) => (
                                        <div className="min-h-[112px] overflow-hidden rounded-[20px] border-2 border-dashed border-border/50 bg-muted/30 shadow-inner transition-colors hover:border-primary/20 sm:min-h-[168px] lg:min-h-[212px]">
                                          <MediaInput
                                            value={field.value}
                                            onChange={(value) => {
                                              field.onChange(value)
                                              setValue(`sections.${nestIndex}.exercises.${k}.thumbnail_media_id`, null, { shouldDirty: true })
                                              setValue(`sections.${nestIndex}.exercises.${k}.filename`, null, { shouldDirty: true })
                                              setValue(`sections.${nestIndex}.exercises.${k}.bucket_path`, null, { shouldDirty: true })
                                            }}
                                            type="thumbnail"
                                            variant="thumbnail"
                                            compact={isCompactMobile}
                                          />
                                        </div>
                                      )}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-5">
                                  {isAmrapSection ? (
                                    <div className="rounded-[20px] border border-border/60 bg-background/75 p-3 shadow-sm sm:rounded-[28px] sm:p-4 lg:p-5">
                                      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4 md:gap-5">
                                        <div className="flex shrink-0 items-center gap-3 sm:gap-0 sm:justify-center">
                                          <div className="shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-2.5 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-300 sm:p-3">
                                            <Repeat className="h-5 w-5 sm:h-5 sm:w-5" />
                                          </div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-col gap-1.5 sm:gap-2">
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300 sm:text-xs">
                                                Reps por vuelta
                                              </p>
                                              <div className="flex flex-wrap gap-1">
                                                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-muted-foreground sm:px-2 sm:text-[9px]">
                                                  <List className="h-2.5 w-2.5" />
                                                  1 set
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-muted-foreground sm:px-2 sm:text-[9px]">
                                                  <BedDouble className="h-2.5 w-2.5" />
                                                  0s rest
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-muted-foreground sm:px-2 sm:text-[9px]">
                                                  <InfinityIcon className="h-2.5 w-2.5" />
                                                  Rondas ∞
                                                </span>
                                              </div>
                                            </div>
                                            <p className="text-[11px] leading-tight text-muted-foreground/80 sm:text-[12px]">
                                              Este número se repite en cada vuelta, sin parar, hasta que suene el timecap.
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex shrink-0 justify-center sm:justify-end pb-1">
                                          <div className="relative pt-1">
                                            <Input
                                              {...register(`sections.${nestIndex}.exercises.${k}.reps`)}
                                              type="number"
                                              inputMode="numeric"
                                              pattern="[0-9]*"
                                              min={0}
                                              placeholder="0"
                                              className="h-12 w-24 rounded-2xl border-2 border-emerald-400/35 bg-gradient-to-b from-white to-emerald-50/70 text-center text-2xl font-black tracking-tight text-emerald-800 shadow-sm focus-visible:border-emerald-500/60 focus-visible:ring-emerald-500/20 dark:from-zinc-900 dark:to-emerald-950/40 dark:text-emerald-200 sm:h-14 sm:w-28 sm:text-3xl"
                                            />
                                            <span className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] -translate-x-1/2 whitespace-nowrap text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600/80 dark:text-emerald-400/80 sm:text-[10px]">
                                              repeticiones
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                  <div className="rounded-[20px] border border-border/60 bg-background/75 p-3 shadow-sm sm:rounded-[28px] sm:p-3 lg:p-3.5">
                                    <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-start sm:justify-between">
                                      <div className="space-y-1">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{isCompactMobile ? 'Formato' : 'Cómo se realiza'}</p>
                                        <p className="text-[11px] leading-5 text-muted-foreground sm:hidden">
                                          Elige cómo se mide el ejercicio y completa sus valores esenciales.
                                        </p>
                                      </div>
                                      <div className="flex items-center justify-between gap-2 sm:justify-start">
                                        <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                                          <Activity className="h-4 w-4" />
                                        </div>
                                        {renderHint('Define si el ejercicio se mide por repeticiones o por tiempo, y configura sus valores principales desde este bloque.')}
                                      </div>
                                    </div>

                                    <div className="mt-1.5 space-y-1.5 sm:mt-2 sm:space-y-2 lg:grid lg:grid-cols-[0.68fr_repeat(3,minmax(0,1fr))] lg:items-stretch lg:gap-1 lg:space-y-0">
                                      <Controller
                                        control={control}
                                        name={`sections.${nestIndex}.exercises.${k}.type`}
                                        render={({ field }) => (
                                          <div className="grid grid-cols-3 gap-1.5 lg:grid-cols-1 lg:grid-rows-3 lg:gap-1 lg:self-start">
                                            <button
                                              type="button"
                                              onClick={() => field.onChange('reps')}
                                              className={cn(
                                                'relative rounded-[14px] border p-2 text-left transition-all sm:rounded-[16px] sm:p-2 lg:p-1.5',
                                                field.value === 'reps'
                                                  ? 'border-primary/40 bg-primary/[0.08] shadow-sm'
                                                  : 'border-border/60 bg-muted/20 hover:border-primary/20 hover:bg-background'
                                              )}
                                            >
                                              {renderHint('Mide el ejercicio por número de repeticiones en cada serie.', 'absolute right-1 top-1 sm:right-1.5 sm:top-1.5')}
                                              <div className={cn('flex items-start gap-2 lg:gap-1.5', isCompactMobile && 'justify-center')}>
                                                <div className={cn('rounded-xl bg-background/90 p-1.5 text-primary shadow-sm lg:p-1.25', isCompactMobile && 'p-2')}>
                                                  <Repeat className={cn('h-3 w-3', isCompactMobile && 'h-3.5 w-3.5')} />
                                                </div>
                                                <div className={cn('min-w-0 flex-1 pr-6 sm:pr-7', isCompactMobile && 'sr-only')}>
                                                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:text-[9px]">
                                                    Rep
                                                  </span>
                                                </div>
                                              </div>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => field.onChange('time')}
                                              className={cn(
                                                'relative rounded-[14px] border p-2 text-left transition-all sm:rounded-[16px] sm:p-2 lg:p-1.5',
                                                field.value === 'time'
                                                  ? 'border-primary/40 bg-primary/[0.08] shadow-sm'
                                                  : 'border-border/60 bg-muted/20 hover:border-primary/20 hover:bg-background'
                                              )}
                                            >
                                              {renderHint('Mide el ejercicio por duración en segundos para cada serie.', 'absolute right-1 top-1 sm:right-1.5 sm:top-1.5')}
                                              <div className={cn('flex items-start gap-2 lg:gap-1.5', isCompactMobile && 'justify-center')}>
                                                <div className={cn('rounded-xl bg-background/90 p-1.5 text-primary shadow-sm lg:p-1.25', isCompactMobile && 'p-2')}>
                                                  <Timer className={cn('h-3 w-3', isCompactMobile && 'h-3.5 w-3.5')} />
                                                </div>
                                                <div className={cn('min-w-0 flex-1 pr-6 sm:pr-7', isCompactMobile && 'sr-only')}>
                                                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:text-[9px]">
                                                    Tiempo
                                                  </span>
                                                </div>
                                              </div>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => {
                                                field.onChange('emom')
                                                // EMOM never has its own rest — the leftover time in the window is the rest.
                                                setValue(`sections.${nestIndex}.exercises.${k}.rest`, 0, { shouldDirty: true })
                                              }}
                                              className={cn(
                                                'relative rounded-[14px] border p-2 text-left transition-all sm:rounded-[16px] sm:p-2 lg:p-1.5',
                                                field.value === 'emom'
                                                  ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/[0.12] to-orange-500/[0.08] shadow-sm'
                                                  : 'border-border/60 bg-muted/20 hover:border-amber-500/30 hover:bg-background'
                                              )}
                                            >
                                              {renderHint(
                                                'EMOM: cada serie tiene un tiempo y una meta de repeticiones. Complétalas dentro de esa ventana — lo que sobre hasta que acabe es tu descanso, sin un campo de rest aparte.',
                                                'absolute right-1 top-1 sm:right-1.5 sm:top-1.5'
                                              )}
                                              <div className={cn('flex items-start gap-2 lg:gap-1.5', isCompactMobile && 'justify-center')}>
                                                <div className={cn('rounded-xl bg-background/90 p-1.5 text-amber-600 shadow-sm lg:p-1.25 dark:text-amber-400', isCompactMobile && 'p-2')}>
                                                  <Zap className={cn('h-3 w-3', isCompactMobile && 'h-3.5 w-3.5')} />
                                                </div>
                                                <div className={cn('min-w-0 flex-1 pr-6 sm:pr-7', isCompactMobile && 'sr-only')}>
                                                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300 sm:text-[9px]">
                                                    EMOM
                                                  </span>
                                                </div>
                                              </div>
                                            </button>
                                          </div>
                                        )}
                                      />

                                      <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,1.15fr)] gap-2 sm:grid-cols-3 lg:contents">
                                        <div className="relative min-w-0 rounded-[18px] border border-border/60 bg-muted/20 p-2 sm:rounded-[20px] sm:p-1.5 lg:flex lg:h-full lg:flex-col lg:justify-between">
                                          {renderHint(
                                            selectedType === 'time'
                                              ? 'Indica los segundos que dura cada serie del ejercicio.'
                                              : selectedType === 'emom'
                                                ? 'Indica cuántas repeticiones debe completar el usuario dentro de cada ventana de tiempo.'
                                                : 'Indica cuántas repeticiones debe completar el usuario en cada serie.',
                                            'absolute right-2 top-1.5 sm:right-1.5 sm:top-1.5'
                                          )}
                                          <div className="flex items-center gap-1.5">
                                            <div className="rounded-xl bg-background/90 p-1.5 text-primary shadow-sm sm:p-1">
                                              {(selectedType === 'time')
                                                ? <Timer className="h-3 w-3 sm:h-2.5 sm:w-2.5" />
                                                : <Repeat className="h-3 w-3 sm:h-2.5 sm:w-2.5" />}
                                            </div>
                                            <div className={cn('flex items-center gap-1 pr-7 sm:pr-6', isCompactMobile && 'sr-only')}>
                                              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:text-[9px]">
                                                {selectedType === 'time' ? 'Segundos' : 'Repeticiones'}
                                              </span>
                                            </div>
                                          </div>
                                          <Controller
                                            control={control}
                                            name={`sections.${nestIndex}.exercises.${k}.type`}
                                            render={({ field: typeField }) => (
                                              <Input
                                                {...register(
                                                  // 'reps' and 'emom' both need a reps target here; only 'time'
                                                  // uses this cell for duration (emom's own duration lives in
                                                  // the dedicated window cell that replaces rest below).
                                                  typeField.value === 'time'
                                                    ? `sections.${nestIndex}.exercises.${k}.duration`
                                                    : `sections.${nestIndex}.exercises.${k}.reps`
                                                )}
                                                type="number"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                min={0}
                                                placeholder="0"
                                                className="mt-1.5 h-9 rounded-xl border-border/60 bg-background px-2 text-sm font-bold shadow-none sm:mt-1 sm:h-7 sm:px-2"
                                              />
                                            )}
                                          />
                                        </div>

                                        <div className="relative min-w-0 rounded-[18px] border border-border/60 bg-muted/20 p-2 sm:rounded-[20px] sm:p-1.5 lg:flex lg:h-full lg:flex-col lg:justify-between">
                                          {renderHint(
                                            selectedType === 'emom'
                                              ? 'Número total de minutos (vueltas) que se deben completar en este ejercicio EMOM.'
                                              : 'Número total de series o vueltas que se deben completar en este ejercicio.',
                                            'absolute right-2 top-1.5 sm:right-1.5 sm:top-1.5'
                                          )}
                                          <div className="flex items-center gap-1.5">
                                            <div className="rounded-xl bg-background/90 p-1.5 text-primary shadow-sm sm:p-1">
                                              <List className="h-3 w-3 sm:h-2.5 sm:w-2.5" />
                                            </div>
                                            <div className={cn('flex items-center gap-1 pr-7 sm:pr-6', isCompactMobile && 'sr-only')}>
                                              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:text-[9px]">
                                                {selectedType === 'emom' ? 'Minutos' : 'Series'}
                                              </span>
                                            </div>
                                          </div>
                                          <Input
                                            {...register(`sections.${nestIndex}.exercises.${k}.sets`)}
                                            placeholder="0"
                                            type="number"
                                            min={0}
                                            className="mt-1.5 h-9 rounded-xl border-border/60 bg-background px-2 text-sm font-bold shadow-none sm:mt-1 sm:h-7 sm:px-2"
                                          />
                                        </div>

                                        <div className="relative min-w-0 rounded-[18px] border border-border/60 bg-muted/20 p-2 sm:rounded-[20px] sm:p-1.5 lg:flex lg:h-full lg:flex-col lg:justify-between">
                                          {renderHint(
                                            selectedType === 'emom'
                                              ? 'Tiempo de cada ventana en segundos. Lo que sobre después de las repeticiones es el descanso; no hay un campo de rest aparte.'
                                              : 'Tiempo de recuperación entre una serie y la siguiente, expresado en segundos.',
                                            'absolute right-2 top-1.5 sm:right-1.5 sm:top-1.5'
                                          )}
                                          <div className="flex items-center gap-1.5">
                                            <div className="rounded-xl bg-background/90 p-1.5 text-primary shadow-sm sm:p-1">
                                              {selectedType === 'emom'
                                                ? <Timer className="h-3 w-3 sm:h-2.5 sm:w-2.5" />
                                                : <BedDouble className="h-3 w-3 sm:h-2.5 sm:w-2.5" />}
                                            </div>
                                            <div className={cn('flex items-center gap-1 pr-7 sm:pr-6', isCompactMobile && 'sr-only')}>
                                              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:text-[9px]">
                                                {selectedType === 'emom' ? 'Ventana' : isCompactMobile ? 'Descanso' : 'Rest'}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="relative mt-1.5 sm:mt-1">
                                            {selectedType === 'emom' ? (
                                              <>
                                                <input
                                                  type="hidden"
                                                  {...register(`sections.${nestIndex}.exercises.${k}.rest`)}
                                                  value={0}
                                                />
                                                <Input
                                                  {...register(`sections.${nestIndex}.exercises.${k}.duration`)}
                                                  placeholder="0"
                                                  type="number"
                                                  inputMode="numeric"
                                                  pattern="[0-9]*"
                                                  min={0}
                                                  className="h-9 rounded-xl border-border/60 bg-background pr-9 pl-2 text-sm font-bold shadow-none sm:h-7 sm:pr-8 sm:pl-2"
                                                />
                                                <span className={cn('absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-muted-foreground sm:right-2.5 sm:text-[10px]', isCompactMobile && 'hidden')}>
                                                  seg
                                                </span>
                                              </>
                                            ) : (
                                              <>
                                                <Input
                                                  {...register(`sections.${nestIndex}.exercises.${k}.rest`)}
                                                  placeholder="0"
                                                  type="number"
                                                  min={0}
                                                  className="h-9 rounded-xl border-border/60 bg-background pr-9 pl-2 text-sm font-bold shadow-none sm:h-7 sm:pr-8 sm:pl-2"
                                                />
                                                <span className={cn('absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-muted-foreground sm:right-2.5 sm:text-[10px]', isCompactMobile && 'hidden')}>
                                                  seg
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  )}

                                  <div className="rounded-[20px] border border-border/60 bg-background/75 p-3 shadow-sm sm:rounded-[28px] sm:p-4 md:p-5">
                                    <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{isCompactMobile ? 'Contexto' : 'Contexto del ejercicio'}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="rounded-2xl bg-muted p-2 text-muted-foreground">
                                          <Dna className="h-4 w-4" />
                                        </div>
                                        {renderHint('Añade dificultad, grupos musculares y equipamiento para documentar mejor el ejercicio y mejorar los filtros.')}
                                      </div>
                                    </div>

                                    <div className="grid gap-2.5 md:grid-cols-3 md:gap-3">
                                      <div className="space-y-2">
                                        <label className="pl-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                          {isCompactMobile ? 'Nivel' : 'Dificultad'}
                                        </label>
                                        <Controller
                                          control={control}
                                          name={`sections.${nestIndex}.exercises.${k}.difficulty`}
                                          render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value || 'beginner'}>
                                              <SelectTrigger className="h-9 rounded-2xl border-border/60 bg-muted/20 text-sm font-medium shadow-none sm:h-11">
                                                <SelectValue placeholder={isCompactMobile ? 'Nivel' : 'Seleccionar dificultad'} />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="beginner">Principiante</SelectItem>
                                                <SelectItem value="intermediate">Intermedio</SelectItem>
                                                <SelectItem value="advanced">Avanzado</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          )}
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <label className="pl-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                          {isCompactMobile ? 'Músculos' : 'Músculos objetivo'}
                                        </label>
                                        <Controller
                                          control={control}
                                          name={`sections.${nestIndex}.exercises.${k}.muscle_groups`}
                                          render={({ field }) => (
                                            <TagInput
                                              value={field.value || []}
                                              onChange={field.onChange}
                                              placeholder={isCompactMobile ? "Músculos..." : "Añadir músculos..."}
                                              variant="orange"
                                              compact={isCompactMobile}
                                            />
                                          )}
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <label className="pl-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                          {isCompactMobile ? 'Equip' : 'Equipment'}
                                        </label>
                                        <Controller
                                          control={control}
                                          name={`sections.${nestIndex}.exercises.${k}.equipment`}
                                          render={({ field }) => (
                                            <TagInput
                                              value={field.value || []}
                                              onChange={field.onChange}
                                              placeholder={isCompactMobile ? "Equip..." : "Add equipment..."}
                                              variant="blue"
                                              compact={isCompactMobile}
                                            />
                                          )}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <ActivityTutorialEditor
                                    setValue={setValue}
                                    watch={watch}
                                    nestIndex={nestIndex}
                                    exerciseIndex={k}
                                  />
                                </div>
                              </div>
                            </div>
                        </article>
                    )}
                </Draggable>
              )})}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <Button
            type="button" variant="ghost" size="sm"
            className="group h-10 w-full rounded-xl border border-dashed border-border/40 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary sm:h-12 sm:text-xs"
            onClick={() => append(createEmptyExercise())}
        >
            <span className="flex items-center gap-2 group-hover:gap-3 transition-all">
                <Plus className="h-3.5 w-3.5" />
                Agregar ejercicio
            </span>
        </Button>

        <ExercisesVault
            onSelect={handleAddFromVault}
            trigger={
                <Button
                    type="button" variant="ghost" size="sm"
                    className="group h-10 w-full rounded-xl border border-dashed border-orange-500/20 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 transition-all hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-500 sm:h-12 sm:text-xs"
                >
                    <span className="flex items-center gap-2 group-hover:gap-3 transition-all">
                        <Package className="h-3.5 w-3.5" />
                        Agregar desde vault
                    </span>
                </Button>
            }
        />
      </div>
    </div>
  )
}
