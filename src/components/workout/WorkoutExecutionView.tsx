'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { PremiumFeatureDialog } from '@/components/premium/PremiumFeatureDialog'
import { ExerciseTutorialDialog } from './ExerciseTutorialDialog'
import { MusicPlayer } from './MusicPlayer'
import { LocalWorkout, ExerciseTutorial } from '@/types/workout/viewTypes'
import { CheckCircle2, ChevronLeft, Clock, Dumbbell, Info, Pause, Play, Plus, SkipForward } from 'lucide-react'
import { getNextWorkoutCursor, getStepInfo } from '@/lib/workout/sessionNavigation'
import { getWorkoutSegmentKind, WorkoutSegmentKind } from '@/lib/workout/segmentKind'
import { formatDuration } from '@/lib/time'
import { useWorkoutStore } from '@/store/workOutStore'

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

// Copy shown during the rest that follows the very last exercise/round of a section, when
// the section coming next plays by different rules than the one just finished (e.g. handing
// off into the AMRAP circuit). Keyed by the upcoming section's kind so a future mode (EMOM…)
// just needs a new case here.
function getRestTransitionTheme(upcomingKind: WorkoutSegmentKind, sectionName?: string) {
  if (upcomingKind === 'amrap') {
    return {
      badge: 'Después del descanso',
      badgeClass: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
      headline: 'Se acerca un reto AMRAP',
      subline: sectionName
        ? `${sectionName}: aguanta el ritmo, viene contrarreloj`
        : 'Aguanta el ritmo, viene contrarreloj',
    }
  }

  return {
    badge: 'Después del descanso',
    badgeClass: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
    headline: 'Cambia el formato del entrenamiento',
    subline: sectionName ? `A continuación: ${sectionName}` : 'Prepárate para el nuevo formato',
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
  const elapsedMs = useWorkoutStore((state) => state.elapsedMs)
  const lastActiveAt = useWorkoutStore((state) => state.lastActiveAt)
  const pauseSessionClock = useWorkoutStore((state) => state.pauseSessionClock)
  const resumeSessionClock = useWorkoutStore((state) => state.resumeSessionClock)
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
  const audioContextRef = useRef<AudioContext | null>(null)
  const lastCountdownBeepRef = useRef<number | null>(null)
  const [isCompactMobileViewport, setIsCompactMobileViewport] = useState(false)
  const [elapsedClockNow, setElapsedClockNow] = useState(() => Date.now())

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

  // True only for the rest right after the last exercise of the last round of the current
  // section — i.e. the point where getNextWorkoutCursor has to cross into another section —
  // and only when that next section plays by different rules (see getWorkoutSegmentKind).
  // Lets the rest screen warn about the format change before WorkoutChangeTypeView takes over.
  const currentSectionKind = useMemo(
    () => getWorkoutSegmentKind(workout, currentSectionIndex),
    [workout, currentSectionIndex]
  )
  const upcomingSectionKind = useMemo(
    () => (upcomingCursor ? getWorkoutSegmentKind(workout, upcomingCursor.sectionIndex) : null),
    [upcomingCursor, workout]
  )
  const isRestBeforeModeChange =
    isResting &&
    Boolean(upcomingCursor) &&
    upcomingCursor?.sectionIndex !== currentSectionIndex &&
    upcomingSectionKind !== null &&
    upcomingSectionKind !== currentSectionKind

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
      : (displayExercise?.type === 'time' || displayExercise?.type === 'emom')
        ? 'exercise-timed'
        : 'exercise-reps'

  const stageTheme =
    stage === 'rest' && isRestBeforeModeChange && upcomingSectionKind
      ? getRestTransitionTheme(upcomingSectionKind, upcomingStep?.section?.name)
      : getStageTheme(stage)
  const hasTimer = stage !== 'exercise-reps'
  const totalDuration = useMemo(() => {
    if (stage === 'prepare') return 5
    if (stage === 'rest') {
      // Exercises with no configured rest still get a few courtesy seconds to reposition —
      // except right before handing off into a different-mode section (e.g. AMRAP): that
      // handoff already goes through WorkoutChangeTypeView, whose own "Comenzar" button is
      // the pacing point, so there's nothing to wait for here when there was no real rest.
      if (isRestBeforeModeChange && !currentExercise?.rest) return 0
      return Math.max(currentExercise?.rest || 5, 1)
    }
    if (stage === 'exercise-timed') return Math.max(displayExercise?.duration || 60, 1)
    return 0
  }, [stage, currentExercise?.rest, displayExercise?.duration, isRestBeforeModeChange])

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

  const ensureAudioContext = useCallback(async () => {
    const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextConstructor) return null

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor()
    }

    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume()
      } catch {
        return audioContextRef.current
      }
    }

    return audioContextRef.current
  }, [])

  const playBeep = useCallback((freq = 880, type: OscillatorType = 'sine') => {
    void ensureAudioContext().then((ctx) => {
      if (!ctx) return

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)

      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.1)
    })
  }, [ensureAudioContext])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const unlock = () => {
      void ensureAudioContext()
    }

    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })

    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [ensureAudioContext])

  useEffect(() => {
    lastCountdownBeepRef.current = null
  }, [timerKey])

  useEffect(() => {
    if (stage !== 'exercise-timed') return
    if (!hasTimer || isPaused || isTutorialOpen) return

    if (timeLeft === 0) {
      if (lastCountdownBeepRef.current === 0) return
      lastCountdownBeepRef.current = 0
      playBeep(1760, 'square')
      return
    }

    if (timeLeft > 0 && timeLeft <= 5) {
      if (lastCountdownBeepRef.current === timeLeft) return
      lastCountdownBeepRef.current = timeLeft
      playBeep(880)
    }
  }, [hasTimer, isPaused, isTutorialOpen, playBeep, stage, timeLeft])

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

  // The effect above only reacts to timeLeft *crossing* down to 0, so it never fires for a
  // rest whose totalDuration is already 0 (see isRestBeforeModeChange above) — timeLeft
  // starts at 0 and never "crosses" anything. Advance explicitly instead, once per rest
  // instance (timerKey), so this handoff has no visible wait at all.
  useEffect(() => {
    if (stage !== 'rest' || !isRestBeforeModeChange || currentExercise?.rest) return

    onNextStep()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerKey])

  useEffect(() => {
    previousTimeLeftRef.current = timeLeft
  }, [timeLeft])

  useEffect(() => {
    if (isPaused || isTutorialOpen) {
      pauseSessionClock()
      return
    }

    resumeSessionClock()
  }, [isPaused, isTutorialOpen, pauseSessionClock, resumeSessionClock])

  useEffect(() => {
    setElapsedClockNow(Date.now())

    if (!lastActiveAt) return

    const interval = window.setInterval(() => {
      setElapsedClockNow(Date.now())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [lastActiveAt])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateViewportFlags = () => {
      const compactViewport = window.innerWidth < 360 || window.innerHeight < 620
      setIsCompactMobileViewport(compactViewport)
    }

    updateViewportFlags()
    window.addEventListener('resize', updateViewportFlags)
    window.visualViewport?.addEventListener('resize', updateViewportFlags)

    return () => {
      window.removeEventListener('resize', updateViewportFlags)
      window.visualViewport?.removeEventListener('resize', updateViewportFlags)
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
  const workoutDurationSeconds = Math.floor(
    (elapsedMs + (lastActiveAt ? Math.max(elapsedClockNow - lastActiveAt, 0) : 0)) / 1000
  )
  const workoutDurationLabel = formatDuration(workoutDurationSeconds, { style: 'clock' })
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
  const circleClassName = 'h-full w-full'
  const baseInnerInset = circleSize / 2 - (radius - strokeWidth / 2) + 2
  const circleInnerInset = `${(baseInnerInset / circleSize) * 100}%`
  const innerCircleStyle = {
    inset: circleInnerInset,
  }
  const desktopInnerCircleStyle = {
    inset: circleInnerInset,
  }
  const fluidCircleFrameStyle = {
    aspectRatio: '1 / 1',
  } as const

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
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-[#050816] text-white animate-reveal-vertical">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(168,85,247,0.18),_transparent_30%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_20%,transparent_80%,rgba(255,255,255,0.02))]" />

      <header className="relative z-20 px-4 pb-2 pt-3 sm:px-6 lg:px-5">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:max-w-none">
          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
              onClick={onExit}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
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
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <p className="flex flex-row items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
                            {totalExercisesBeforeActive + 1} / {totalExerciseCount}
                          </p>
                          <span  className='flex flex-row gap-2 rounded-full justify-center items-center border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] tracking-[0.08em] text-emerald-200'>
                          <Clock className='w-4'/>
                          <p className="font-timer ">
                            {workoutDurationLabel}
                          </p>
                          </span>
                        </div>
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
                        <div className="flex flex-wrap items-center gap-1.5 py-2">
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
                              <div key={`${section.id}-series-${seriesNumber}`} className="flex flex-wrap items-center gap-1.5">
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

                      {sectionIndex < flattenedRoadmap.length - 1 ? (
                        <div className="hidden h-6 w-px bg-white/10 xl:block" />
                      ) : null}
                    </div>
                  ))}
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

          <div className="hidden shrink-0 lg:flex">
            <div className="flex min-w-[156px] flex-col items-center rounded-[18px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-center shadow-[0_18px_50px_rgba(16,185,129,0.12)]">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-200/70">
                Sesion total
              </span>
              <span className="font-timer mt-1 text-2xl tracking-[0.08em] text-emerald-200">
                {workoutDurationLabel}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-3 sm:justify-center sm:px-6 sm:pb-4 sm:pt-6 lg:px-5 lg:pt-4">
        <div className="mx-auto hidden h-full w-full min-h-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:block">
          <div className="mx-auto flex min-h-full w-full max-w-[1520px] flex-col items-center justify-center py-4">
            <div className="mb-8 pt-2 text-center">
              <h1 className="text-[clamp(2rem,3vw,2.9rem)] font-black tracking-tight text-white">
                {displayExercise?.name || stageTheme.headline}
              </h1>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <span className={`rounded-[16px] border px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] ${stageTheme.badgeClass}`}>
                  {stageTheme.badge}
                </span>
                <span className={`rounded-[16px] border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-white/78 ${hasTimer ? 'font-timer normal-case tracking-[0.08em]' : ''}`}>
                  {timerLabel}
                </span>
              </div>
            </div>

              <div
                ref={visualStageRef}
                className="mx-auto flex h-[min(60vh,720px)] w-fit max-w-full items-center justify-center gap-10 xl:gap-12"
              >
                <div className="flex h-full shrink-0 items-center justify-center">
                  <div
                    className="relative aspect-square h-full w-auto max-w-[min(calc(100vw-20rem),74vh)]"
                    style={fluidCircleFrameStyle}
                  >
                    <div className="absolute inset-0 rounded-full blur-3xl" style={{ backgroundColor: `${strokeColor}22` }} />
                    <svg
                      width={circleSize}
                      height={circleSize}
                      viewBox={`0 0 ${circleSize} ${circleSize}`}
                      className={circleClassName}
                      style={{
                        width: '100%',
                        height: '100%',
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
                      style={desktopInnerCircleStyle}
                    >
                      {executionCircleMediaUrl ? (
                        <div className="flex h-full w-full items-center justify-center">
                          <img
                            src={executionCircleMediaUrl}
                            alt={displayExercise?.name || 'Vista previa del ejercicio'}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-white">
                          <Dumbbell className="h-20 w-20 text-slate-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(15,23,42,0.08))]" />
                      {stage === 'rest' ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.28),rgba(251,191,36,0.42)_58%,rgba(180,83,9,0.56))]">
                          <div className="animate-pulse text-center text-[4.8rem] font-black uppercase leading-none tracking-[0.34em] text-amber-600 drop-shadow-[0_2px_12px_rgba(251,191,36,0.35)]">
                            REST
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex h-full w-[300px] flex-none flex-col items-center justify-center xl:w-[320px]">
                <div className="mb-6 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/35">
                    En curso
                  </p>
                  <p className="mt-2 text-2xl font-black tracking-tight text-white">
                    {displaySection?.name || workout.title}
                  </p>
                </div>

                <div className="w-full">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Act</p>
                      <p className="mt-2 text-sm font-semibold text-white/80">
                        {totalExercisesBeforeActive + 1} / {totalExerciseCount}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Serie</p>
                      <p className="mt-2 text-sm font-semibold text-white/80">
                        {displaySet} / {totalSets}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <Button
                      className="h-14 w-full rounded-[18px] font-semibold shadow-[0_18px_40px_rgba(59,130,246,0.28)]"
                      onClick={() => setIsPaused((value) => !value)}
                      disabled={!hasTimer}
                    >
                      {isPaused ? <Play className="mr-2 h-5 w-5 fill-current" /> : <Pause className="mr-2 h-5 w-5 fill-current" />}
                      {isPaused ? 'Reanudar' : 'Pausar'}
                    </Button>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-center gap-3">
                  {onPrev ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 rounded-[14px] border border-white/10 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
                      onClick={onPrev}
                      disabled={stage === 'prepare'}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="h-11 w-11" />
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-[14px] border border-white/10 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
                    onClick={() => setTimeLeft((value) => value + 10)}
                    disabled={!hasTimer}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-[14px] border border-white/10 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
                    onClick={onNextStep}
                  >
                    {stage === 'prepare' ? (
                      <Play className="h-4 w-4 fill-current" />
                    ) : stage === 'exercise-reps' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <SkipForward className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
                    onClick={handleTutorialOpen}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>

                <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white/38">
                  {nextButtonLabel}
                </p>

                {workout.audio?.length ? (
                  <div className="mt-5 flex justify-center">
                    <MusicPlayer playlist={workout.audio || []} className="!fixed-none !top-auto !left-auto !translate-x-0" />
                  </div>
                ) : null}
              </div>
            </div>

              <div className="mt-8 w-full max-w-6xl px-6 text-center">
              <p className="text-base leading-7 text-white/62 xl:text-lg xl:leading-8">
                {exerciseDescription || stageTheme.subline}
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto flex h-full w-full max-w-6xl flex-col items-center gap-3 sm:justify-center sm:gap-6 lg:hidden">
          <div className="shrink-0 pt-1 text-center sm:mb-3 sm:pt-0">
            <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${stageTheme.badgeClass}`}>
                {stageTheme.badge}
              </span>
              {displayExercise && (
                <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                  {displayExercise.type === 'emom'
                    ? `${displayExercise.reps || 0} reps · ${formatDuration(displayExercise.duration || 0)}`
                    : displayExercise.type === 'time'
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
                className={`${hasTimer ? 'font-timer tracking-[0.08em]' : 'font-black tracking-[-0.06em]'} sm:text-5xl md:text-6xl lg:text-7xl ${
                  isCompactMobileViewport ? 'text-[clamp(1.75rem,8vw,2.25rem)]' : 'text-[clamp(2.25rem,10vw,3.4rem)]'
                }`}
              >
                {timerLabel}
              </p>
            ) : null}
          </div>
 
          <div ref={visualStageRef} className="flex w-full min-h-0 flex-1 flex-col items-center justify-center py-1 sm:py-0">
            <div className="flex min-h-0 w-full flex-1 items-center justify-center">
              <div
                className="relative h-auto max-h-full max-w-full [container-type:inline-size]"
                style={fluidCircleFrameStyle}
              >
              <div className="absolute inset-0 rounded-full blur-3xl" style={{ backgroundColor: `${strokeColor}22` }} />
              <svg
                width={circleSize}
                height={circleSize}
                viewBox={`0 0 ${circleSize} ${circleSize}`}
                className={circleClassName}
                style={{
                  width: '100%',
                  height: '100%',
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
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.28),rgba(251,191,36,0.42)_58%,rgba(180,83,9,0.56))] px-[6%]">
                    {/* Sized in cqw (relative to the circle's own rendered width, via the
                        [container-type:inline-size] ancestor) instead of vw — the circle can
                        be much smaller than the viewport would suggest on compact phones, and
                        vw-based sizing made this overflow and clip down to just "ES". */}
                    <div className="animate-pulse text-center text-[clamp(1rem,15cqw,3.25rem)] font-black uppercase leading-none tracking-[0.12em] text-amber-600 drop-shadow-[0_2px_12px_rgba(251,191,36,0.35)]">
                      REST
                    </div>
                  </div>
                ) : null}
              </div>
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
