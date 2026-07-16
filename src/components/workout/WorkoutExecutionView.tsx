'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/Button'
import { PremiumFeatureDialog } from '@/components/premium/PremiumFeatureDialog'
import { ExerciseTutorialDialog } from './ExerciseTutorialDialog'
import { MusicPlayer } from './MusicPlayer'
import { LocalWorkout, ExerciseTutorial } from '@/types/workout/viewTypes'
import { CheckCircle2, ChevronLeft, Dumbbell, Info, Pause, Play, Plus, SkipForward } from 'lucide-react'
import { getNextWorkoutCursor, getStepInfo } from '@/lib/workout/sessionNavigation'
import { formatDuration } from '@/lib/time'

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

function hasRealTutorialContent(tutorial?: ExerciseTutorial) {
  if (!tutorial) return false

  const hasMedia = Boolean(tutorial.media?.url)
  const hasSteps = (tutorial.steps || []).some((step) => Boolean(step.title?.trim()) || Boolean(step.description?.trim()))

  return hasMedia || hasSteps
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

function isGifUrl(url?: string) {
  return Boolean(url && /\.gif($|\?)/i.test(url))
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
  const [premiumDialogTitle, setPremiumDialogTitle] = useState('Tutorial premium')
  const [premiumDialogDescription, setPremiumDialogDescription] = useState(
    'Los tutoriales guiados durante la sesion estan disponibles solo para usuarios premium. Actualiza tu plan para desbloquear esta ayuda visual.'
  )
  const previousTimeLeftRef = useRef(timeLeft)
  const visualStageRef = useRef<HTMLDivElement | null>(null)
  const [mobileCircleSize, setMobileCircleSize] = useState<number | null>(null)
  const [isCompactMobileViewport, setIsCompactMobileViewport] = useState(false)

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
  const executionCircleMediaUrl = useMemo(() => {
    const tutorialMediaUrl = displayExercise?.tutorial?.media?.url
    if (isGifUrl(tutorialMediaUrl)) {
      return tutorialMediaUrl
    }

    return displayExercise?.thumbnail_url
  }, [displayExercise])

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

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return

    const visualStage = visualStageRef.current
    if (!visualStage) return

    const measure = () => {
      if (window.innerWidth >= 640) {
        setMobileCircleSize((current) => (current === null ? current : null))
        setIsCompactMobileViewport(false)
        return
      }

      const bounds = visualStage.getBoundingClientRect()
      const compactViewport = window.innerWidth < 360 || window.innerHeight < 620
      const nextSize = compactViewport
        ? Math.max(128, Math.min(Math.floor(bounds.width * 0.56), Math.floor(bounds.height * 0.34), 196))
        : Math.max(168, Math.min(Math.floor(bounds.width * 0.7), Math.floor(bounds.height * 0.5), 308))

      setIsCompactMobileViewport(compactViewport)
      setMobileCircleSize((current) => (current === nextSize ? current : nextSize))
    }

    measure()

    const frameId = window.requestAnimationFrame(measure)
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(visualStage)
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
    }
  }, [])

  const tutorialData = hasRealTutorialContent(displayExercise?.tutorial) ? displayExercise?.tutorial : undefined
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
  const strokeWidth = 12
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - ringProgress)
  const strokeColor = getStrokeColor(stage)
  const timerLabel = hasTimer ? formatDuration(timeLeft, { style: 'clock' }) : `${displayExercise?.reps || 0} reps`
  const totalSets = Math.max(displayExercise?.sets || 1, 1)
  const displaySet = Math.min(Math.max(activeCursor.set, 1), totalSets)
  const exerciseDescription = displayExercise?.description?.trim() || ''
  const showCompactTimerLabel = !isCompactMobileViewport || hasTimer
  const resolvedCircleSize = mobileCircleSize || circleSize
  const circleFrameStyle = {
    width: `${resolvedCircleSize}px`,
    height: `${resolvedCircleSize}px`,
  }
  const circleClassName = 'h-full w-full'
  const baseInnerInset = circleSize / 2 - (radius - strokeWidth / 2) + 2
  const innerInset = Math.max(Math.round((resolvedCircleSize * baseInnerInset) / circleSize), 10)
  const innerCircleStyle = {
    inset: `${innerInset}px`,
  }

  const nextButtonLabel =
    stage === 'prepare'
      ? 'Iniciar'
      : stage === 'exercise-reps'
        ? 'Hecho'
        : 'Seguir'

  const handleTutorialOpen = () => {
    if (!displayExercise) return

    if (!hasRealTutorialContent(displayExercise.tutorial)) {
      setPremiumDialogTitle('Sin instrucciones disponibles')
      setPremiumDialogDescription('Este ejercicio todavia no tiene instrucciones, pasos tecnicos ni recurso multimedia asociado.')
      setIsPremiumDialogOpen(true)
      return
    }

    if (!canAccessTutorial) {
      setPremiumDialogTitle('Tutorial premium')
      setPremiumDialogDescription('Los tutoriales guiados durante la sesion estan disponibles solo para usuarios premium. Actualiza tu plan para desbloquear esta ayuda visual.')
      setIsPremiumDialogOpen(true)
      return
    }

    setIsTutorialOpen(true)
  }

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
                <div className="flex min-w-0 flex-1 items-start gap-3 lg:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-2xl border border-white/10 bg-white/10 text-white shadow-[0_14px_30px_rgba(0,0,0,0.24)] backdrop-blur-xl hover:bg-white/20"
                    onClick={onExit}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                          Seccion actual
                        </p>
                        <p className="truncate text-sm font-semibold leading-tight text-white/90">
                          {displaySection?.name || workout.title}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                          Progreso
                        </p>
                        <p className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
                          {totalExercisesBeforeActive + 1} / {totalExerciseCount}
                        </p>
                      </div>
                    </div>

                    <p className="mt-1 truncate text-xs leading-tight text-white/45">
                      {displayExercise?.name || stageTheme.headline}
                    </p>
                  </div>
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

      <main className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-3 sm:justify-center sm:px-6 sm:pb-4 sm:pt-6">
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col items-center gap-3 sm:justify-center sm:gap-6">
          <div className="shrink-0 pt-1 text-center sm:mb-3 sm:pt-0">
            <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${stageTheme.badgeClass}`}>
                {stageTheme.badge}
              </span>
              {displayExercise && (
                <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                  {displayExercise.type === 'time'
                    ? formatDuration(displayExercise.duration || 0)
                    : `${displayExercise.reps || 0} reps`}
                </span>
              )}
              {totalSets > 1 && (
                <span className="rounded-full border border-orange-300/15 bg-orange-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-200">
                  Serie {displaySet}/{totalSets}
                </span>
              )}
            </div>
            {showCompactTimerLabel ? (
              <p
                className={`font-black tabular-nums tracking-[-0.06em] sm:text-5xl md:text-6xl lg:text-7xl ${
                  isCompactMobileViewport ? 'text-[clamp(1.75rem,8vw,2.25rem)]' : 'text-[clamp(2.25rem,10vw,3.4rem)]'
                }`}
              >
                {timerLabel}
              </p>
            ) : null}
          </div>
 
          <div ref={visualStageRef} className="flex w-full min-h-0 flex-1 flex-col items-center justify-center py-1 sm:py-0">
            <div className="relative flex max-h-full items-center justify-center" style={circleFrameStyle}>
              <div className="absolute inset-0 rounded-full blur-3xl" style={{ backgroundColor: `${strokeColor}22` }} />
              <svg
                width={circleSize}
                height={circleSize}
                viewBox={`0 0 ${circleSize} ${circleSize}`}
                className={circleClassName}
                style={{
                  ...circleFrameStyle,
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%',
                }}
              >
                <circle
                  cx={circleSize / 2}
                  cy={circleSize / 2}
                  r={radius}
                  fill="transparent"
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth={strokeWidth}
                />
                <circle
                  cx={circleSize / 2}
                  cy={circleSize / 2}
                  r={radius}
                  fill="transparent"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                />
              </svg>

              <div
                className="absolute overflow-hidden rounded-full border border-white/10 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                style={innerCircleStyle}
              >
                {executionCircleMediaUrl ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <img
                      src={executionCircleMediaUrl}
                      alt={displayExercise?.name || 'Exercise preview'}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white">
                    <Dumbbell className="h-16 w-16 text-slate-300 sm:h-20 sm:w-20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(15,23,42,0.08))]" />
                {stage === 'rest' ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.28),rgba(251,191,36,0.42)_58%,rgba(180,83,9,0.56))]">
                    <div className="animate-pulse text-center text-[clamp(2rem,14vw,4.2rem)] font-black uppercase leading-none tracking-[0.22em] text-amber-600 drop-shadow-[0_2px_12px_rgba(251,191,36,0.35)] sm:text-[clamp(2.5rem,9vw,4.7rem)] sm:tracking-[0.3em] lg:text-[4.9rem] lg:tracking-[0.36em]">
                      REST
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 hidden flex-wrap items-center justify-center gap-2.5 sm:flex">
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
                onClick={handleTutorialOpen}
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

            <div className="mt-4 w-full text-center">
              {workout.audio?.length ? (
                <div className="mb-3 flex justify-center sm:hidden">
                  <MusicPlayer playlist={workout.audio || []} className="!fixed-none !top-auto !left-auto !translate-x-0" />
                </div>
              ) : null}

              <div className="grid w-full max-w-sm grid-cols-4 gap-2.5 sm:hidden">
                {onPrev ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
                    onClick={onPrev}
                    disabled={stage === 'prepare'}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                ) : (
                  <div />
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
                  onClick={() => setIsPaused((value) => !value)}
                  disabled={!hasTimer}
                >
                  {isPaused ? <Play className="h-5 w-5 fill-current" /> : <Pause className="h-5 w-5 fill-current" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
                  onClick={() => setTimeLeft((value) => value + 10)}
                  disabled={!hasTimer}
                >
                  <Plus className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
                  onClick={handleTutorialOpen}
                >
                  <Info className="h-4 w-4" />
                </Button>

                <Button
                  className="col-span-4 h-12 rounded-2xl px-4 font-semibold shadow-[0_18px_40px_rgba(59,130,246,0.28)]"
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

              {!isCompactMobileViewport && (
                <>
                  <h1 className="mt-4 text-xl font-black tracking-tight sm:mt-0 sm:text-2xl md:text-3xl">
                    {displayExercise?.name || stageTheme.headline}
                  </h1>
                  <div className="mt-2 hidden max-w-2xl sm:block">
                    <p className="text-sm leading-6 text-white/60">
                      {exerciseDescription || stageTheme.subline}
                    </p>
                  </div>
                  <div className="mx-auto mt-2 w-full max-w-sm px-2 sm:hidden">
                    <p className="line-clamp-3 text-sm leading-5 text-white/60">
                      {exerciseDescription || stageTheme.subline}
                    </p>
                  </div>
                </>
              )}
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
      <PremiumFeatureDialog
        open={isPremiumDialogOpen}
        onOpenChange={setIsPremiumDialogOpen}
        title={premiumDialogTitle}
        description={premiumDialogDescription}
      />
    </div>
  )
}
