'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/Button'
import { ExerciseTutorialDialog } from './ExerciseTutorialDialog'
import { MusicPlayer } from './MusicPlayer'
import { LocalExercise, LocalSection, LocalWorkout, ExerciseTutorial } from '@/types/workout/viewTypes'
import { CheckCircle2, ChevronLeft, Dumbbell, Info, Pause, Play, Plus, SkipForward } from 'lucide-react'

type SessionStage = 'prepare' | 'rest' | 'exercise-timed' | 'exercise-reps'

interface WorkoutExecutionViewProps {
  workout: LocalWorkout
  currentSectionIndex: number
  currentExerciseIndex: number
  currentSet: number
  isResting: boolean
  onExit: () => void
  onNextStep: () => void
  onPrev?: () => void
}

interface UpcomingStepInfo {
  type: 'same' | 'next' | 'section' | 'finish'
  exercise?: LocalExercise
  section?: LocalSection
  sectionIndex?: number
  exerciseIndex?: number
  set?: number
}

function getUpcomingStep(
  workout: LocalWorkout,
  currentSectionIndex: number,
  currentExerciseIndex: number,
  currentSet: number
): UpcomingStepInfo {
  const currentSection = workout.sections[currentSectionIndex]
  const currentExercise = currentSection?.exercises[currentExerciseIndex]

  if (!currentSection || !currentExercise) {
    return { type: 'finish' }
  }

  const totalSets = currentExercise.sets || 1
  const orderType = currentSection.orderType || 'single'

  if (orderType === 'single') {
    if (currentSet < totalSets) {
      return {
        type: 'same',
        exercise: currentExercise,
        section: currentSection,
        sectionIndex: currentSectionIndex,
        exerciseIndex: currentExerciseIndex,
        set: currentSet + 1,
      }
    }

    if (currentExerciseIndex < currentSection.exercises.length - 1) {
      return {
        type: 'next',
        exercise: currentSection.exercises[currentExerciseIndex + 1],
        section: currentSection,
        sectionIndex: currentSectionIndex,
        exerciseIndex: currentExerciseIndex + 1,
        set: 1,
      }
    }

    if (currentSectionIndex < workout.sections.length - 1) {
      const nextSection = workout.sections[currentSectionIndex + 1]
      return {
        type: 'section',
        exercise: nextSection.exercises[0],
        section: nextSection,
        sectionIndex: currentSectionIndex + 1,
        exerciseIndex: 0,
        set: 1,
      }
    }

    return { type: 'finish' }
  }

  for (let i = currentExerciseIndex + 1; i < currentSection.exercises.length; i++) {
    const exercise = currentSection.exercises[i]
    if (currentSet <= (exercise.sets || 1)) {
      return {
        type: 'next',
        exercise,
        section: currentSection,
        sectionIndex: currentSectionIndex,
        exerciseIndex: i,
        set: currentSet,
      }
    }
  }

  const nextSet = currentSet + 1
  for (let i = 0; i < currentSection.exercises.length; i++) {
    const exercise = currentSection.exercises[i]
    if (nextSet <= (exercise.sets || 1)) {
      return {
        type: i === currentExerciseIndex ? 'same' : 'next',
        exercise,
        section: currentSection,
        sectionIndex: currentSectionIndex,
        exerciseIndex: i,
        set: nextSet,
      }
    }
  }

  if (currentSectionIndex < workout.sections.length - 1) {
    const nextSection = workout.sections[currentSectionIndex + 1]
    return {
      type: 'section',
      exercise: nextSection.exercises[0],
      section: nextSection,
      sectionIndex: currentSectionIndex + 1,
      exerciseIndex: 0,
      set: 1,
    }
  }

  return { type: 'finish' }
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function createMockTutorial(exercise: LocalExercise): ExerciseTutorial {
  const detailLine =
    exercise.type === 'time'
      ? `Mantén la ejecución durante ${exercise.duration || 0} segundos con control y ritmo constante.`
      : `Completa ${exercise.reps || 0} repeticiones manteniendo la técnica estable en cada una.`

  const equipmentLine =
    exercise.equipment && exercise.equipment.length > 0
      ? `Material recomendado: ${exercise.equipment.join(', ')}.`
      : 'No necesitas material específico para probar este flujo.'

  return {
    steps: [
      {
        title: 'Posición inicial',
        description:
          exercise.description ||
          `Colócate con buena postura antes de empezar ${exercise.name.toLowerCase()}.`,
      },
      {
        title: 'Ejecución',
        description: detailLine,
      },
      {
        title: 'Atención',
        description: equipmentLine,
      },
    ],
  }
}

function getStrokeColor(stage: SessionStage) {
  switch (stage) {
    case 'prepare':
      return '#38bdf8'
    case 'rest':
      return '#f97316'
    case 'exercise-timed':
      return '#22c55e'
    default:
      return '#8b5cf6'
  }
}

function getStageTheme(stage: SessionStage) {
  switch (stage) {
    case 'prepare':
      return {
        badge: 'Prepárate',
        badgeClass: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
        headline: 'Prepárate',
        subline: 'Comenzamos en 5 segundos',
      }
    case 'rest':
      return {
        badge: 'Descanso',
        badgeClass: 'border-orange-400/30 bg-orange-400/10 text-orange-300',
        headline: 'Recupera y prepárate',
        subline: 'La siguiente actividad ya está lista',
      }
    case 'exercise-timed':
      return {
        badge: 'Actividad',
        badgeClass: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
        headline: 'Mantén el ritmo',
        subline: 'Sigue el temporizador y controla la técnica',
      }
    default:
      return {
        badge: 'Actividad',
        badgeClass: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
        headline: 'Completa la serie',
        subline: 'Marca la serie cuando termines',
      }
  }
}

export function WorkoutExecutionView({
  workout,
  currentSectionIndex,
  currentExerciseIndex,
  currentSet,
  isResting,
  onExit,
  onNextStep,
  onPrev,
}: WorkoutExecutionViewProps) {
  const [isPreparing, setIsPreparing] = useState(true)
  const [timeLeft, setTimeLeft] = useState(5)
  const [isPaused, setIsPaused] = useState(false)
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)

  const currentSection = workout.sections[currentSectionIndex]
  const currentExercise = currentSection?.exercises[currentExerciseIndex]
  const upcomingStep = useMemo(
    () => getUpcomingStep(workout, currentSectionIndex, currentExerciseIndex, currentSet),
    [workout, currentSectionIndex, currentExerciseIndex, currentSet]
  )

  const displaySection = isResting ? upcomingStep.section || currentSection : currentSection
  const displayExercise = isResting ? upcomingStep.exercise || currentExercise : currentExercise
  const displaySet = isResting ? upcomingStep.set || currentSet : currentSet
  const totalSets = displayExercise?.sets || 1

  const stage: SessionStage = isPreparing
    ? 'prepare'
    : isResting
      ? 'rest'
      : displayExercise?.type === 'time'
        ? 'exercise-timed'
        : 'exercise-reps'

  const stageTheme = getStageTheme(stage)
  const hasTimer = stage !== 'exercise-reps'
  const totalDuration = useMemo(() => {
    if (stage === 'prepare') return 5
    if (stage === 'rest') return Math.max(currentExercise?.rest || 5, 1)
    if (stage === 'exercise-timed') return Math.max(displayExercise?.duration || 60, 1)
    return 0
  }, [stage, currentExercise?.rest, displayExercise?.duration])

  const timerKey = `${stage}-${currentSectionIndex}-${currentExerciseIndex}-${currentSet}`

  useEffect(() => {
    if (hasTimer) {
      setTimeLeft(totalDuration)
      setIsPaused(false)
      return
    }

    setTimeLeft(0)
    setIsPaused(false)
  }, [timerKey, hasTimer, totalDuration])

  useEffect(() => {
    if (!hasTimer || isPaused || isTutorialOpen) return
    if (timeLeft <= 0) return

    const interval = setInterval(() => {
      setTimeLeft((previous) => previous - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [hasTimer, isPaused, isTutorialOpen, timeLeft])

  useEffect(() => {
    if (!hasTimer || timeLeft > 0) return

    if (stage === 'prepare') {
      setIsPreparing(false)
      return
    }

    onNextStep()
  }, [hasTimer, onNextStep, stage, timeLeft])

  const tutorialData = displayExercise ? displayExercise.tutorial || createMockTutorial(displayExercise) : undefined

  const flattenedRoadmap = useMemo(() => {
    return workout.sections.map((section, sectionIndex) => ({
      section,
      sectionIndex,
      exercises: section.exercises.map((exercise, exerciseIndex) => ({
        exercise,
        exerciseIndex,
      })),
    }))
  }, [workout.sections])

  const activeRoadmapPosition = {
    sectionIndex: isResting ? upcomingStep.sectionIndex ?? currentSectionIndex : currentSectionIndex,
    exerciseIndex: isResting ? upcomingStep.exerciseIndex ?? currentExerciseIndex : currentExerciseIndex,
  }

  const totalExercisesBeforeActive = useMemo(() => {
    let count = 0
    workout.sections.forEach((section, sectionIndex) => {
      section.exercises.forEach((_, exerciseIndex) => {
        if (
          sectionIndex < activeRoadmapPosition.sectionIndex ||
          (sectionIndex === activeRoadmapPosition.sectionIndex && exerciseIndex < activeRoadmapPosition.exerciseIndex)
        ) {
          count += 1
        }
      })
    })
    return count
  }, [workout.sections, activeRoadmapPosition.exerciseIndex, activeRoadmapPosition.sectionIndex])

  const totalExerciseCount = useMemo(
    () => workout.sections.reduce((sum, section) => sum + section.exercises.length, 0),
    [workout.sections]
  )

  const progress = hasTimer && totalDuration > 0 ? 1 - timeLeft / totalDuration : 1
  const ringProgress = Math.max(0, Math.min(progress, 1))
  const circleSize = 320
  const radius = 148
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - ringProgress)
  const strokeColor = getStrokeColor(stage)
  const timerLabel = hasTimer ? formatTime(timeLeft) : `${displayExercise?.reps || 0} reps`
  const centerLabel =
    stage === 'prepare'
      ? 'Preparate'
      : stage === 'rest'
        ? 'Descanso'
        : displayExercise?.type === 'time'
          ? `${displayExercise.duration || 0}s`
          : `${displayExercise?.reps || 0} reps`

  const nextButtonLabel =
    stage === 'prepare'
      ? 'Empezar ya'
      : stage === 'rest'
        ? 'Saltar descanso'
        : stage === 'exercise-reps'
          ? 'Completar serie'
          : currentSet < totalSets
            ? 'Siguiente serie'
            : 'Siguiente ejercicio'

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(168,85,247,0.18),_transparent_30%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_20%,transparent_80%,rgba(255,255,255,0.02))]" />

      <header className="relative z-20 flex items-start justify-between gap-4 px-4 pb-3 pt-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
            onClick={onExit}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <MusicPlayer playlist={workout.audio || []} className="!fixed-none !top-auto !left-auto !translate-x-0" />
        </div>

        <div className="min-w-0 text-right">
          <div className="mb-1 flex justify-end">
            <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${stageTheme.badgeClass}`}>
              {stageTheme.badge}
            </span>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/45">
            {totalExercisesBeforeActive + 1} / {totalExerciseCount}
          </p>
          <p className="truncate text-sm font-semibold text-white/80">{displaySection?.name || workout.title}</p>
        </div>
      </header>

      <div className="relative z-20 px-4 sm:px-6">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-3 py-3 backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">Roadmap</p>
              <p className="text-xs text-white/65">Sigue el progreso del workout por secciones.</p>
            </div>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex min-w-max items-center gap-5 pr-2">
              {flattenedRoadmap.map(({ section, sectionIndex, exercises }) => (
                <div key={section.id} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                      {section.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {exercises.map(({ exercise, exerciseIndex }) => {
                        const isCompleted =
                          sectionIndex < activeRoadmapPosition.sectionIndex ||
                          (sectionIndex === activeRoadmapPosition.sectionIndex &&
                            exerciseIndex < activeRoadmapPosition.exerciseIndex)
                        const isActive =
                          sectionIndex === activeRoadmapPosition.sectionIndex &&
                          exerciseIndex === activeRoadmapPosition.exerciseIndex

                        return (
                          <div key={exercise.id} className="flex items-center gap-2">
                            <div
                              className={`h-3.5 w-3.5 rounded-full border transition-all ${
                                isActive
                                  ? 'scale-125 border-white bg-white shadow-[0_0_16px_rgba(255,255,255,0.55)]'
                                  : isCompleted
                                    ? 'border-emerald-300/40 bg-emerald-400'
                                    : 'border-white/20 bg-white/10'
                              }`}
                              title={exercise.name}
                            />
                            {exerciseIndex < exercises.length - 1 && (
                              <div className="h-px w-4 bg-white/15" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  {sectionIndex < flattenedRoadmap.length - 1 && (
                    <div className="h-6 w-px bg-white/10" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-6 pt-4 sm:px-6">
        <div className="w-full max-w-5xl">
          <div className="mb-5 text-center">
            <p className="text-5xl font-black tabular-nums tracking-[-0.06em] sm:text-6xl">{timerLabel}</p>
            <p className="mt-2 text-sm uppercase tracking-[0.28em] text-white/45">{stageTheme.headline}</p>
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="order-2 space-y-5 lg:order-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                <span>{displayExercise?.type === 'time' ? 'Tiempo' : 'Repeticiones'}</span>
                <span className="h-1 w-1 rounded-full bg-white/30" />
                <span>
                  {displayExercise?.type === 'time'
                    ? `${displayExercise?.duration || 0}s`
                    : `${displayExercise?.reps || 0} reps`}
                </span>
              </div>

              {totalSets > 1 && (
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/15 bg-orange-400/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-200">
                  <span>Serie {displaySet}</span>
                  <span className="h-1 w-1 rounded-full bg-orange-200/60" />
                  <span>de {totalSets}</span>
                </div>
              )}

              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{displayExercise?.name || 'Entrenamiento'}</h1>
                <p className="max-w-2xl text-base leading-relaxed text-white/68">
                  {stage === 'prepare'
                    ? 'Prepárate para empezar el workout. Enseguida verás la primera actividad lista para ejecutar.'
                    : stage === 'rest'
                      ? stageTheme.subline
                      : displayExercise?.description || stageTheme.subline}
                </p>
              </div>

              {stage === 'rest' && upcomingStep.type !== 'finish' && (
                <div className="rounded-[28px] border border-orange-300/15 bg-orange-400/10 p-5 shadow-[0_20px_80px_rgba(249,115,22,0.12)]">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-200/75">
                    Siguiente actividad
                  </p>
                  <p className="text-2xl font-bold text-white">{displayExercise?.name}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">
                    {displayExercise?.description || 'Respira, colócate y prepárate para la siguiente actividad.'}
                  </p>
                </div>
              )}
            </div>

            <div className="order-1 flex flex-col items-center lg:order-2">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full blur-3xl" style={{ backgroundColor: `${strokeColor}20` }} />
                <svg
                  width={circleSize}
                  height={circleSize}
                  viewBox={`0 0 ${circleSize} ${circleSize}`}
                  className="-rotate-90 drop-shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
                >
                  <circle
                    cx={circleSize / 2}
                    cy={circleSize / 2}
                    r={radius}
                    fill="transparent"
                    stroke="rgba(255,255,255,0.10)"
                    strokeWidth="10"
                  />
                  <circle
                    cx={circleSize / 2}
                    cy={circleSize / 2}
                    r={radius}
                    fill="transparent"
                    stroke={strokeColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                  />
                </svg>

                <div className="absolute inset-[24px] overflow-hidden rounded-full border border-white/10 bg-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  {displayExercise?.thumbnail_url ? (
                    <img
                      src={displayExercise.thumbnail_url}
                      alt={displayExercise.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/[0.04]">
                      <Dumbbell className="h-16 w-16 text-white/25" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/5" />
                  <div className="absolute inset-x-0 bottom-8 flex flex-col items-center text-center">
                    <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/75 backdrop-blur-xl">
                      {centerLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {onPrev && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
                    onClick={onPrev}
                    disabled={stage === 'prepare'}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
                  onClick={() => setIsPaused((value) => !value)}
                  disabled={!hasTimer}
                >
                  {isPaused ? <Play className="h-5 w-5 fill-current" /> : <Pause className="h-5 w-5 fill-current" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
                  onClick={() => setTimeLeft((value) => value + 10)}
                  disabled={!hasTimer}
                >
                  <Plus className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  className="h-12 rounded-full border border-white/10 bg-white/10 px-5 text-white backdrop-blur-xl hover:bg-white/20"
                  onClick={() => setIsTutorialOpen(true)}
                >
                  <Info className="mr-2 h-4 w-4" />
                  Tutorial
                </Button>

                <Button
                  className="h-12 rounded-full px-5 font-semibold shadow-[0_18px_40px_rgba(59,130,246,0.28)]"
                  onClick={onNextStep}
                >
                  {stage === 'exercise-reps' ? (
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                  ) : (
                    <SkipForward className="mr-2 h-5 w-5" />
                  )}
                  {nextButtonLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ExerciseTutorialDialog
        open={isTutorialOpen}
        onOpenChange={setIsTutorialOpen}
        exerciseName={displayExercise?.name || 'Ejercicio'}
        tutorial={tutorialData}
      />
    </div>
  )
}
