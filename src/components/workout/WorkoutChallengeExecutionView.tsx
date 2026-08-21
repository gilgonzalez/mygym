'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { LocalWorkout, LocalWorkoutChallengeResult } from '@/types/workout/viewTypes'
import { ChevronLeft, Dumbbell, Pause, Play, Trophy, Zap } from 'lucide-react'
import { formatDuration } from '@mygym/shared'
import { useWorkoutStore } from '@/store/workOutStore'
import { isGifUrl } from '@/lib/workout/segmentKind'

interface WorkoutChallengeExecutionViewProps {
  workout: LocalWorkout
  canAccessTutorial: boolean
  onExit: () => void
  onComplete: (result: LocalWorkoutChallengeResult, elapsedSeconds: number) => void
}

export function WorkoutChallengeExecutionView({
  workout,
  onExit,
  onComplete,
}: WorkoutChallengeExecutionViewProps) {
  const pauseSessionClock = useWorkoutStore((state) => state.pauseSessionClock)
  const resumeSessionClock = useWorkoutStore((state) => state.resumeSessionClock)

  const challenge = workout.challenge
  const challengeSection = useMemo(
    () => workout.sections.find((section) => section.id === challenge?.challengeSectionId) || workout.sections[0],
    [challenge?.challengeSectionId, workout.sections]
  )
  const exercises = challengeSection?.exercises || []

  const [phase, setPhase] = useState<'prepare' | 'active'>('prepare')
  const [timeLeft, setTimeLeft] = useState(5)
  const [isPaused, setIsPaused] = useState(false)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [roundsCompleted, setRoundsCompleted] = useState(0)
  const isCompletingRef = useRef(false)
  const exerciseItemRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const currentExercise = exercises[currentExerciseIndex]
  const displayMediaUrl = useMemo(() => {
    const tutorialMediaUrl = currentExercise?.tutorial?.media?.url
    if (isGifUrl(tutorialMediaUrl)) {
      return tutorialMediaUrl
    }

    return currentExercise?.thumbnail_url
  }, [currentExercise])

  useEffect(() => {
    if (!challenge) return

    setPhase('prepare')
    setTimeLeft(5)
    setIsPaused(false)
    setCurrentExerciseIndex(0)
    setRoundsCompleted(0)
    isCompletingRef.current = false
  }, [challenge, workout.id])

  useEffect(() => {
    if (!challenge || !exercises.length) return
    if (isPaused) return
    if (timeLeft <= 0) return

    const interval = window.setInterval(() => {
      setTimeLeft((previous) => previous - 1)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [challenge, exercises.length, isPaused, phase, timeLeft])

  const finalizeChallenge = useCallback((elapsedSeconds: number) => {
    if (!challenge || isCompletingRef.current) return

    isCompletingRef.current = true

    const result: LocalWorkoutChallengeResult = {
      mode: 'amrap_section',
      roundsCompleted,
      score: roundsCompleted,
      timeCapSeconds: challenge.timeCapSeconds,
    }

    onComplete(result, elapsedSeconds)
  }, [challenge, onComplete, roundsCompleted])

  useEffect(() => {
    if (!challenge || !exercises.length) return
    if (timeLeft > 0) return

    if (phase === 'prepare') {
      setPhase('active')
      setTimeLeft(challenge.timeCapSeconds)
      return
    }

    if (phase === 'active') {
      setIsPaused(true)
      finalizeChallenge(challenge.timeCapSeconds)
    }
  }, [challenge, exercises.length, finalizeChallenge, phase, timeLeft])

  useEffect(() => {
    if (phase !== 'active') return
    const id = currentExercise?.id
    if (!id) return

    const node = exerciseItemRefs.current[id]
    if (!node) return

    node.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [currentExercise?.id, currentExerciseIndex, phase])

  if (!challenge || !challengeSection || !currentExercise) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#040612] px-6 text-center text-white">
        <div className="space-y-3">
          <p className="text-lg font-semibold">Este reto no tiene una section valida.</p>
          <Button onClick={onExit}>Volver</Button>
        </div>
      </div>
    )
  }

  const totalExercises = exercises.length
  const elapsedSeconds = phase === 'prepare' ? 0 : challenge.timeCapSeconds - Math.max(timeLeft, 0)
  const urgencyRatio = phase === 'prepare' ? 0 : 1 - Math.max(timeLeft, 0) / challenge.timeCapSeconds
  const progressWidth = `${Math.max(Math.min(urgencyRatio, 1), 0) * 100}%`
  const scoreRoundsLabel = `${roundsCompleted} ronda${roundsCompleted === 1 ? '' : 's'}`
  const scorePoints = roundsCompleted * 100
  const timeDisplay = phase === 'prepare'
    ? formatDuration(timeLeft, { style: 'clock' })
    : formatDuration(Math.max(timeLeft, 0), { style: 'clock' })
  const timerDotClassName = phase === 'active' && isPaused
    ? 'bg-orange-500 shadow-[0_0_16px_rgba(249,115,22,0.8)]'
    : 'bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)]'
  const targetLabel =
    currentExercise.type === 'time'
      ? formatDuration(currentExercise.duration || 0)
      : currentExercise.type === 'emom'
        ? `${currentExercise.reps || 0} reps · ${formatDuration(currentExercise.duration || 0)}`
        : `${currentExercise.reps || 0} reps`
  const currentExerciseNumber = currentExerciseIndex + 1
  const nextExercise = exercises[currentExerciseIndex < totalExercises - 1 ? currentExerciseIndex + 1 : 0]

  const handleAdvance = () => {
    if (!exercises.length || phase !== 'active') return

    if (currentExerciseIndex === totalExercises - 1) {
      setRoundsCompleted((previous) => previous + 1)
      setCurrentExerciseIndex(0)
      return
    }

    setCurrentExerciseIndex((previous) => previous + 1)
  }

  const handleFinishNow = () => {
    if (phase !== 'active' || !challenge) return

    setIsPaused(true)
    finalizeChallenge(elapsedSeconds)
  }

  return (
    <div className="relative flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[#040612] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_30%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.08),transparent_24%),linear-gradient(180deg,#09111f_0%,#050816_55%,#040612_100%)]" />
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className="px-4 pb-3 pt-3 sm:px-6">
          <div className="mx-auto flex w-full max-w-6xl items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-full bg-white/10 text-white backdrop-blur-xl hover:bg-white/20"
                onClick={onExit}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${timerDotClassName}`} />
                  <p className="font-timer text-[1.7rem] leading-none tracking-[0.08em] text-white sm:text-[2rem]">
                    {timeDisplay}
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-semibold text-white/82">{workout.title}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                {challengeSection.name}
              </p>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6">
          <div className="mx-auto w-full max-w-6xl">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: progressWidth }}
              />
            </div>
          </div>
        </div>

        <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-3 overflow-hidden px-4 pb-3 pt-3 sm:gap-6 sm:px-6 sm:pb-6 sm:pt-5 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-stretch">
          <section className="flex min-h-0 min-w-0 flex-1 flex-col self-stretch">
            <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-5">
              <div className="mx-auto flex h-full min-h-0 w-full max-w-[840px] flex-1 flex-col gap-3 overflow-hidden rounded-[26px] bg-white/[0.04] p-3 sm:gap-5 sm:rounded-[34px] sm:p-5 lg:p-6">
                <div className="flex shrink-0 items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-200/55">
                      {phase === 'prepare' ? 'Preparate' : 'Ejercicio actual'}
                    </p>
                    <h1 className="mt-1.5 text-[clamp(1.25rem,5.4vw,3rem)] font-black leading-[0.95] tracking-[-0.04em] text-white lg:text-5xl">
                      {phase === 'prepare' ? 'Entra fuerte' : currentExercise.name}
                    </h1>
                    <p className="mt-2 text-base font-black text-emerald-300 sm:mt-3 sm:text-2xl">
                      {targetLabel}
                    </p>
                  </div>

                  <div className="shrink-0 text-right sm:hidden">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Pts</p>
                    <p className="mt-1 text-2xl font-black leading-none tracking-[-0.04em] text-emerald-300">
                      {scorePoints}
                    </p>
                  </div>
                </div>

                <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%),linear-gradient(180deg,rgba(15,23,42,0.5),rgba(2,6,23,0.18))] px-3 py-3 sm:rounded-[28px] sm:px-6 sm:py-8 lg:px-8">
                  <div className="pointer-events-none absolute inset-0 rounded-[30px] bg-[radial-gradient(circle,rgba(16,185,129,0.12),transparent_58%)] opacity-90" />
                  {displayMediaUrl ? (
                    <img
                      src={displayMediaUrl}
                      alt={currentExercise.name}
                      className="relative z-10 h-full max-h-full w-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="relative z-10 flex h-[min(40%,9rem)] w-[min(40%,9rem)] items-center justify-center rounded-full bg-white/[0.04]">
                      <Dumbbell className="h-1/2 w-1/2 text-white/25" />
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
                  <Button
                    className="h-10 min-w-0 flex-1 rounded-full bg-emerald-400 px-3 text-slate-950 shadow-[0_18px_50px_rgba(34,197,94,0.22)] hover:bg-emerald-300 sm:h-14 sm:px-7 sm:text-base"
                    onClick={handleAdvance}
                    disabled={phase !== 'active'}
                    aria-label="Siguiente ejercicio"
                  >
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <Zap className="h-5 w-5" />
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] sm:text-sm sm:tracking-[0.12em]">
                        Siguiente
                      </span>
                    </span>
                  </Button>

                  {phase === 'active' && (
                    <Button
                      className={`h-10 shrink-0 rounded-full px-3 text-white sm:h-14 sm:min-w-[150px] sm:px-5 sm:font-bold ${
                        isPaused
                          ? 'bg-emerald-500 hover:bg-emerald-400'
                          : 'bg-orange-500 hover:bg-orange-400'
                      }`}
                      onClick={() => {
                        // Tied to the overall session clock explicitly (rather than reactively
                        // via an effect on isPaused) so it never races with the isPaused(true)
                        // set inside finalizeChallenge when the time cap runs out.
                        setIsPaused((previous) => {
                          const next = !previous
                          if (next) {
                            pauseSessionClock()
                          } else {
                            resumeSessionClock()
                          }
                          return next
                        })
                      }}
                      aria-label={isPaused ? 'Reanudar reto' : 'Pausar reto'}
                    >
                      {isPaused ? <Play className="h-4 w-4 sm:mr-2" /> : <Pause className="h-4 w-4 sm:mr-2" />}
                      <span className="sr-only sm:not-sr-only">{isPaused ? 'Reanudar' : 'Pausar'}</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <aside className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 self-stretch sm:gap-5 lg:h-full lg:flex-none">
            <div className="hidden rounded-[30px] bg-white/[0.04] p-5 sm:block sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Puntuación actual</p>
              <p className="mt-3 text-3xl font-black leading-none tracking-[-0.04em] text-emerald-300 sm:text-4xl">
                {scorePoints} pts
              </p>
              <p className="mt-3 hidden text-sm leading-relaxed text-white/55 sm:block">
                {scoreRoundsLabel}
              </p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[26px] bg-white/[0.04] p-4 sm:min-h-[360px] sm:rounded-[30px] sm:p-6 lg:min-h-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Seguimiento</p>

                <div className="mt-3 flex min-h-0 flex-1 flex-col sm:mt-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
                      <span>Progreso de la vuelta</span>
                      <span>{currentExerciseNumber}/{totalExercises}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                        style={{ width: `${(currentExerciseNumber / Math.max(totalExercises, 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col pt-3 sm:pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
                      Circuito
                    </p>

                    <div
                      className="mt-2.5 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:mt-3 sm:space-y-2"
                    >
                      {exercises.map((exercise) => {
                        const isActiveExercise = phase === 'active' && exercise.id === currentExercise.id
                        const subtitle =
                          exercise.type === 'time'
                            ? formatDuration(exercise.duration || 0)
                            : exercise.type === 'emom'
                              ? `${exercise.reps || 0} reps · ${formatDuration(exercise.duration || 0)}`
                              : `${exercise.reps || 0} reps`

                        return (
                          <div
                            key={exercise.id}
                            ref={(node) => {
                              exerciseItemRefs.current[exercise.id] = node
                            }}
                            className={`flex items-center justify-between gap-2 rounded-[16px] px-2.5 py-2 transition-colors sm:gap-3 sm:rounded-[20px] sm:px-3 sm:py-2.5 ${
                              isActiveExercise
                                ? 'bg-emerald-400/12 text-white'
                                : 'bg-white/[0.03] text-white/70'
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className={`h-2 w-2 shrink-0 rounded-full ${
                                  isActiveExercise
                                    ? 'bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.65)]'
                                    : 'bg-white/15'
                                }`}
                              />
                              <p className="min-w-0 truncate text-xs font-semibold sm:text-sm">{exercise.name}</p>
                            </div>
                            <p
                              className={`shrink-0 text-[11px] font-semibold tabular-nums sm:text-xs ${
                                isActiveExercise ? 'text-emerald-200' : 'text-white/40'
                              }`}
                            >
                              {subtitle}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="pt-3 sm:pt-4">
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
                        Siguiente cambio
                      </p>
                    </div>

                    <div className="mt-2.5 flex min-w-0 items-end justify-between gap-3 sm:mt-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.05] sm:h-14 sm:w-14 sm:rounded-2xl">
                        {nextExercise?.thumbnail_url ? (
                          <img
                            src={nextExercise.thumbnail_url}
                            alt={nextExercise.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Dumbbell className="h-5 w-5 text-white/25" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white sm:text-base">
                          {nextExercise?.name || currentExercise.name}
                        </p>
                        <p className="mt-0.5 text-xs text-white/52 sm:mt-1 sm:text-sm">
                          {nextExercise?.type === 'time'
                            ? formatDuration(nextExercise.duration || 0)
                            : nextExercise?.type === 'emom'
                              ? `${nextExercise?.reps || 0} reps · ${formatDuration(nextExercise?.duration || 0)}`
                              : `${nextExercise?.reps || 0} reps`}
                        </p>
                      </div>

                      {phase === 'active' && (
                        <Button
                          className="ml-auto h-10 shrink-0 self-end rounded-full bg-amber-500 px-3 text-xs font-bold text-slate-950 hover:bg-amber-400 sm:h-12 sm:px-4 sm:text-sm"
                          onClick={handleFinishNow}
                        >
                          <span className="flex items-center gap-1.5 sm:gap-2">
                            <Trophy className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.18em] sm:text-sm sm:tracking-[0.12em]">
                              Finalizar
                            </span>
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
          </aside>
        </main>
      </div>
    </div>
  )
}
