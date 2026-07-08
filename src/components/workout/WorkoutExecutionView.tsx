'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/Button'
import { PremiumFeatureDialog } from '@/components/premium/PremiumFeatureDialog'
import { ExerciseTutorialDialog } from './ExerciseTutorialDialog'
import { MusicPlayer } from './MusicPlayer'
import { LocalExercise, LocalWorkout, ExerciseTutorial } from '@/types/workout/viewTypes'
import { CheckCircle2, ChevronLeft, Dumbbell, Info, Pause, Play, Plus, SkipForward } from 'lucide-react'
import { getNextWorkoutCursor, getStepInfo } from '@/lib/workout/sessionNavigation'

type SessionStage = 'prepare' | 'rest' | 'exercise-timed' | 'exercise-reps'

interface WorkoutExecutionViewProps {
  workout: LocalWorkout
  currentSectionIndex: number
  currentExerciseIndex: number
  currentSet: number
  isResting: boolean
  canAccessTutorial: boolean
  onExit: () => void
  onNextStep: () => void
  onPrev?: () => void
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
  canAccessTutorial,
  onExit,
  onNextStep,
  onPrev,
}: WorkoutExecutionViewProps) {
  const [isPreparing, setIsPreparing] = useState(true)
  const [timeLeft, setTimeLeft] = useState(5)
  const [isPaused, setIsPaused] = useState(false)
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)
  const [isPremiumDialogOpen, setIsPremiumDialogOpen] = useState(false)
  const previousTimeLeftRef = useRef(timeLeft)

  const currentSection = workout.sections[currentSectionIndex]
  const currentExercise = currentSection?.exercises[currentExerciseIndex]
  const currentCursor = useMemo(
    () => ({
      sectionIndex: currentSectionIndex,
      exerciseIndex: currentExerciseIndex,
      set: currentSet,
    }),
    [currentExerciseIndex, currentSectionIndex, currentSet]
  )
  const upcomingCursor = useMemo(
    () => getNextWorkoutCursor(workout, currentCursor),
    [workout, currentCursor]
  )
  const upcomingStep = useMemo(
    () => (upcomingCursor ? getStepInfo(workout, upcomingCursor) : null),
    [upcomingCursor, workout]
  )
  const activeCursor = useMemo(
    () => (isResting && upcomingCursor ? upcomingCursor : currentCursor),
    [currentCursor, isResting, upcomingCursor]
  )

  const displaySection = isResting ? upcomingStep?.section || currentSection : currentSection
  const displayExercise = isResting ? upcomingStep?.exercise || currentExercise : currentExercise

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
    const previousTimeLeft = previousTimeLeftRef.current

    if (!hasTimer || timeLeft > 0) return
    if (previousTimeLeft <= 0) return

    if (stage === 'prepare') {
      setIsPreparing(false)
      return
    }

    onNextStep()
  }, [hasTimer, onNextStep, stage, timeLeft])

  useEffect(() => {
    previousTimeLeftRef.current = timeLeft
  }, [timeLeft])

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

  const totalExercisesBeforeActive = useMemo(() => {
    let count = 0
    workout.sections.forEach((section, sectionIndex) => {
      section.exercises.forEach((_, exerciseIndex) => {
        if (
          sectionIndex < activeCursor.sectionIndex ||
          (sectionIndex === activeCursor.sectionIndex && exerciseIndex < activeCursor.exerciseIndex)
        ) {
          count += 1
        }
      })
    })
    return count
  }, [workout.sections, activeCursor.exerciseIndex, activeCursor.sectionIndex])

  const totalExerciseCount = useMemo(
    () => workout.sections.reduce((sum, section) => sum + section.exercises.length, 0),
    [workout.sections]
  )
  const activeRoadmapSection = flattenedRoadmap[activeCursor.sectionIndex]

  const getVisibleSeriesNumber = (sectionIndex: number, exercises: typeof flattenedRoadmap[number]['exercises']) => {
    const maxSets = Math.max(...exercises.map(({ exercise }) => exercise.sets || 1), 1)

    if (sectionIndex < activeCursor.sectionIndex) {
      return maxSets
    }

    if (sectionIndex > activeCursor.sectionIndex) {
      return 1
    }

    return Math.min(activeCursor.set, maxSets)
  }

  const progress = hasTimer && totalDuration > 0 ? 1 - timeLeft / totalDuration : 1
  const ringProgress = Math.max(0, Math.min(progress, 1))
  const circleSize = 420
  const radius = 194
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - ringProgress)
  const strokeColor = getStrokeColor(stage)
  const timerLabel = hasTimer ? formatTime(timeLeft) : `${displayExercise?.reps || 0} reps`
  const exerciseDescription = displayExercise?.description?.trim()

  const nextButtonLabel =
    stage === 'prepare'
      ? 'Iniciar'
      : stage === 'exercise-reps'
        ? 'Hecho'
        : 'Seguir'

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(168,85,247,0.18),_transparent_30%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_20%,transparent_80%,rgba(255,255,255,0.02))]" />

      <header className="relative z-20 px-4 pb-2 pt-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
              onClick={onExit}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <MusicPlayer playlist={workout.audio || []} className="!fixed-none !top-auto !left-auto !translate-x-0" />
          </div>

          <div className="w-full min-w-0 rounded-[22px] border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur-xl sm:flex-1">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 flex-wrap gap-2 lg:hidden">
                  {flattenedRoadmap.map(({ section, sectionIndex, exercises }) => {
                    const isSectionCompleted = sectionIndex < activeCursor.sectionIndex
                    const isSectionActive = sectionIndex === activeCursor.sectionIndex

                    return (
                      <div
                        key={`${section.id}-mobile`}
                        className={`flex min-w-0 items-center gap-2 rounded-full border px-2.5 py-1.5 ${
                          isSectionActive
                            ? 'border-orange-300/40 bg-orange-400/12'
                            : isSectionCompleted
                              ? 'border-emerald-300/30 bg-emerald-400/12'
                              : 'border-white/15 bg-white/[0.03]'
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isSectionActive
                              ? 'animate-pulse bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.45)]'
                              : isSectionCompleted
                                ? 'bg-emerald-400'
                                : 'bg-white'
                          }`}
                        />
                        <span className="max-w-[88px] truncate text-[9px] font-bold uppercase tracking-[0.16em] text-white/75">
                          {section.name}
                        </span>
                        <span className="rounded-full bg-white/8 px-1.5 py-0.5 text-[8px] font-semibold text-white/55">
                          {exercises.length}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-3 lg:flex">
                  {flattenedRoadmap.map(({ section, sectionIndex, exercises }) => (
                    <div key={section.id} className="flex items-center gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-2.5 py-2">
                        <span className="block truncate text-[9px] font-bold uppercase tracking-[0.18em] text-white/45">
                          {section.name}
                        </span>

                        <div className="mt-2 flex items-center gap-1.5">
                          {Array.from({ length: Math.max(...exercises.map(({ exercise }) => exercise.sets || 1), 1) }).map((_, seriesIndex) => {
                            const seriesNumber = seriesIndex + 1
                            const exercisesInSeries = exercises
                              .map((item, originalExerciseIndex) => ({ ...item, originalExerciseIndex }))
                              .filter(({ exercise }) => (exercise.sets || 1) >= seriesNumber)
                            const isSeriesCompleted =
                              sectionIndex < activeCursor.sectionIndex ||
                              (sectionIndex === activeCursor.sectionIndex && activeCursor.set > seriesNumber)
                            const isSeriesActive =
                              sectionIndex === activeCursor.sectionIndex && activeCursor.set === seriesNumber

                            return (
                              <div key={`${section.id}-series-${seriesNumber}`} className="flex items-center gap-1.5">
                                <div
                                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-bold transition-all ${
                                    isSeriesActive
                                      ? 'animate-pulse border-orange-300/50 bg-orange-400 text-slate-950 shadow-[0_0_16px_rgba(249,115,22,0.45)]'
                                      : isSeriesCompleted
                                        ? 'border-emerald-300/40 bg-emerald-400 text-slate-950'
                                        : 'border-white/70 bg-white text-slate-950'
                                  }`}
                                >
                                  {seriesNumber}
                                </div>

                                {exercisesInSeries.map(({ exercise, originalExerciseIndex }) => {
                                  const isExerciseCompleted =
                                    sectionIndex < activeCursor.sectionIndex ||
                                    (sectionIndex === activeCursor.sectionIndex &&
                                      (activeCursor.set > seriesNumber ||
                                        (activeCursor.set === seriesNumber && originalExerciseIndex < activeCursor.exerciseIndex)))
                                  const isExerciseActive =
                                    sectionIndex === activeCursor.sectionIndex &&
                                    activeCursor.set === seriesNumber &&
                                    originalExerciseIndex === activeCursor.exerciseIndex

                                  return (
                                    <div key={`${section.id}-${exercise.id}-${seriesNumber}`} className="flex items-center gap-1.5">
                                      <div className="h-px w-2 bg-white/15" />
                                      <div
                                        className={`h-2.5 w-2.5 rounded-full transition-all ${
                                          isExerciseActive
                                            ? 'animate-pulse bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.45)]'
                                            : isExerciseCompleted
                                              ? 'bg-emerald-400'
                                              : 'bg-white'
                                        }`}
                                        title={exercise.name}
                                      />
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {sectionIndex < flattenedRoadmap.length - 1 ? (
                        <div className="hidden h-6 w-px bg-white/10 xl:block" />
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/45">
                    {totalExercisesBeforeActive + 1} / {totalExerciseCount}
                  </p>
                  <p className="max-w-[180px] truncate text-sm font-semibold text-white/80">
                    {displaySection?.name || workout.title}
                  </p>
                </div>
              </div>

              {activeRoadmapSection ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-2.5 py-2 lg:hidden">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[9px] font-bold uppercase tracking-[0.18em] text-white/55">
                      {activeRoadmapSection.section.name}
                    </span>
                    <span className="text-[9px] font-semibold text-white/45">
                      {activeCursor.sectionIndex + 1}/{flattenedRoadmap.length}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 overflow-hidden">
                    {(() => {
                      const seriesNumber = getVisibleSeriesNumber(activeCursor.sectionIndex, activeRoadmapSection.exercises)
                      const exercisesInSeries = activeRoadmapSection.exercises
                        .map((item, originalExerciseIndex) => ({ ...item, originalExerciseIndex }))
                        .filter(({ exercise }) => (exercise.sets || 1) >= seriesNumber)

                      return (
                        <div key={`${activeRoadmapSection.section.id}-mobile-series-${seriesNumber}`} className="flex items-center gap-1.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-orange-300/50 bg-orange-400 text-[9px] font-bold text-slate-950 shadow-[0_0_16px_rgba(249,115,22,0.45)]">
                            {seriesNumber}
                          </div>

                          {exercisesInSeries.map(({ exercise, originalExerciseIndex }) => {
                            const isExerciseCompleted =
                              activeCursor.set > seriesNumber ||
                              (activeCursor.set === seriesNumber && originalExerciseIndex < activeCursor.exerciseIndex)
                            const isExerciseActive =
                              activeCursor.set === seriesNumber && originalExerciseIndex === activeCursor.exerciseIndex

                            return (
                              <div
                                key={`${activeRoadmapSection.section.id}-${exercise.id}-mobile-${seriesNumber}`}
                                className="flex items-center gap-1.5"
                              >
                                <div className="h-px w-2 bg-white/15" />
                                <div
                                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                                    isExerciseActive
                                      ? 'animate-pulse bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.45)]'
                                      : isExerciseCompleted
                                        ? 'bg-emerald-400'
                                        : 'bg-white'
                                  }`}
                                  title={exercise.name}
                                />
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col justify-between px-4 pb-28 pt-4 sm:justify-center sm:px-6 sm:pb-4 sm:pt-6">
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-between sm:justify-center">
          <div className="pt-1 text-center sm:mb-3 sm:pt-0">
            <p className="text-4xl font-black tabular-nums tracking-[-0.06em] sm:text-5xl md:text-6xl lg:text-7xl">{timerLabel}</p>
          </div>
 
          <div className="flex w-full min-h-0 flex-1 flex-col items-center justify-center py-4 sm:py-0">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full blur-3xl" style={{ backgroundColor: `${strokeColor}22` }} />
              <svg
                width={circleSize}
                height={circleSize}
                viewBox={`0 0 ${circleSize} ${circleSize}`}
                className="-rotate-90 drop-shadow-[0_18px_50px_rgba(0,0,0,0.45)] h-[min(40vh,76vw,22rem)] w-[min(40vh,76vw,22rem)] sm:h-[min(46vh,62vw,28rem)] sm:w-[min(46vh,62vw,28rem)] lg:h-[min(50vh,32rem)] lg:w-[min(50vh,32rem)]"
              >
                <circle
                  cx={circleSize / 2}
                  cy={circleSize / 2}
                  r={radius}
                  fill="transparent"
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth="12"
                />
                <circle
                  cx={circleSize / 2}
                  cy={circleSize / 2}
                  r={radius}
                  fill="transparent"
                  stroke={strokeColor}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                />
              </svg>

              <div className="absolute inset-[28px] overflow-hidden rounded-full border border-white/10 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:inset-[32px] lg:inset-[36px]">
                {displayExercise?.thumbnail_url ? (
                  <div className="flex h-full w-full items-center justify-center p-[7%] sm:p-[8%]">
                    <div className="flex h-full w-full items-center justify-center">
                      <img
                        src={displayExercise.thumbnail_url}
                        alt={displayExercise.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white">
                    <Dumbbell className="h-16 w-16 text-slate-300 sm:h-20 sm:w-20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(15,23,42,0.08))]" />
                {stage === 'rest' ? (
                  <div className="absolute inset-0 flex items-end justify-center bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.28),rgba(251,191,36,0.42)_58%,rgba(180,83,9,0.56))] pb-[13%] sm:pb-[12%]">
                    <div className="animate-pulse text-center text-[2.35rem] font-black uppercase tracking-[0.42em] text-amber-600 drop-shadow-[0_2px_12px_rgba(251,191,36,0.35)] sm:text-[2.6rem]">
                      REST
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              {workout.audio?.length ? (
                <div className="w-full sm:hidden">
                  <MusicPlayer playlist={workout.audio || []} className="!fixed-none !top-auto !left-auto !translate-x-0" />
                </div>
              ) : null}

              {onPrev && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
                  onClick={onPrev}
                  disabled={stage === 'prepare'}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
                onClick={() => setIsPaused((value) => !value)}
                disabled={!hasTimer}
              >
                {isPaused ? <Play className="h-5 w-5 fill-current" /> : <Pause className="h-5 w-5 fill-current" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
                onClick={() => setTimeLeft((value) => value + 10)}
                disabled={!hasTimer}
              >
                <Plus className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
                onClick={() => {
                  if (!canAccessTutorial) {
                    setIsPremiumDialogOpen(true)
                    return
                  }
                  setIsTutorialOpen(true)
                }}
              >
                <Info className="h-4 w-4" />
              </Button>

              <Button
                className="h-11 rounded-full px-4 font-semibold shadow-[0_18px_40px_rgba(59,130,246,0.28)]"
                onClick={onNextStep}
              >
                {stage === 'prepare' ? (
                  <Play className="mr-2 h-5 w-5 fill-current" />
                ) : stage === 'exercise-reps' ? (
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                ) : (
                  <SkipForward className="mr-2 h-5 w-5" />
                )}
                {nextButtonLabel}
              </Button>
            </div>

            <div className="mt-4 text-center">
              <h1 className="text-xl font-black tracking-tight sm:text-2xl md:text-3xl">
                {displayExercise?.name || stageTheme.headline}
              </h1>
              <div className="mt-2 hidden max-w-2xl sm:block">
                <p className="text-sm leading-6 text-white/60">
                  {exerciseDescription || stageTheme.subline}
                </p>
              </div>
              <div className="mt-2 h-14 w-full max-w-[22rem] overflow-y-auto px-2 sm:hidden">
                <p className="text-sm leading-5 text-white/60">
                  {exerciseDescription || stageTheme.subline}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-4 left-4 right-4 z-30 sm:hidden">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.88),rgba(6,12,28,0.84))] shadow-[0_24px_60px_rgba(0,0,0,0.38)] backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.14),transparent_28%)]" />
          <div className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 gap-y-2 px-3 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="row-span-2 h-11 w-11 shrink-0 self-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-[0_14px_30px_rgba(0,0,0,0.24)] backdrop-blur-xl hover:bg-white/20"
              onClick={onExit}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="min-w-0 self-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                Seccion actual
              </p>
              <p className="truncate text-sm font-semibold leading-tight text-white/88">
                {displaySection?.name || workout.title}
              </p>
            </div>

            <div className="justify-self-end self-center text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                Progreso
              </p>
              <p className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
                {totalExercisesBeforeActive + 1} / {totalExerciseCount}
              </p>
            </div>

            <div className="col-start-2 col-end-4 min-w-0 self-center">
              <p className="mt-0.5 truncate text-xs leading-tight text-white/45">
                {displayExercise?.name || stageTheme.headline}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ExerciseTutorialDialog
        open={isTutorialOpen}
        onOpenChange={setIsTutorialOpen}
        exerciseName={displayExercise?.name || 'Ejercicio'}
        tutorial={tutorialData}
      />
      <PremiumFeatureDialog
        open={isPremiumDialogOpen}
        onOpenChange={setIsPremiumDialogOpen}
        title="Tutorial premium"
        description="Los tutoriales guiados durante la sesion estan disponibles solo para usuarios premium. Actualiza tu plan para desbloquear esta ayuda visual."
      />
    </div>
  )
}
