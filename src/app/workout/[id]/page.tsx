'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WorkoutOverview } from '@/components/workout/WorkoutOverview'
import { ActiveSession } from '@/components/workout/ActiveSession'
import { WorkoutChallengeExecutionView } from '@/components/workout/WorkoutChallengeExecutionView'
import { WorkoutChangeTypeView } from '@/components/workout/WorkoutChangeTypeView'
import { WorkoutCompleted } from '@/components/workout/WorkoutCompleted'
import { WorkoutError } from '@/components/workout/WorkoutError'
import { LocalWorkout, LocalWorkoutChallengeResult } from '@/types/workout/viewTypes'
import { useWorkoutStore } from '@/store/workOutStore'
import { getFirstCursorFromSection } from '@/lib/workout/sessionNavigation'
import { getWorkoutSegmentKind } from '@/lib/workout/segmentKind'
import { useQuery } from '@tanstack/react-query'
import { getWorkoutById } from '@/app/actions/workout/get'
import { useAuthStore } from '@/store/authStore'
import { completeWorkoutAction } from '@/app/actions/user/completeWorkout'
import { calcWorkoutXP, type Difficulty } from '@mygym/shared'
import { useWakeLock } from '@/hooks/useWakeLock'

function normalizeExerciseKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function buildExerciseDescriptionMap(workoutDescription?: string | null) {
  const descriptionMap = new Map<string, string>()

  if (!workoutDescription) return descriptionMap

  workoutDescription
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const separatorIndex = line.indexOf(':')
      if (separatorIndex <= 0) return

      const rawKey = line.slice(0, separatorIndex).trim()
      const rawDescription = line.slice(separatorIndex + 1).trim()

      if (!rawKey || !rawDescription) return

      const normalizedKey = normalizeExerciseKey(rawKey)
      if (!normalizedKey) return

      descriptionMap.set(normalizedKey, rawDescription)
    })

  return descriptionMap
}

export default function WorkoutSessionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuthStore()
  const canSaveProgress = Boolean(user?.isPremium)
  const hasLoggedRef = useRef(false)
  const [currentLogId, setCurrentLogId] = useState<string | null>(null)
  const [xpEarnedState, setXpEarnedState] = useState<number>(0)
  // Holds the result of the workout's AMRAP section (if it has one), captured whenever
  // that section finishes so it can be attached to the final completion log regardless
  // of whether the AMRAP section sits at the start, middle or end of the workout.
  const [sectionChallengeResult, setSectionChallengeResult] = useState<LocalWorkoutChallengeResult | null>(null)
  // Section indexes for which the mode-change transition screen (WorkoutChangeTypeView) has
  // already been acknowledged. A section triggers it once, the first time it's reached with
  // a different mode than the section before it; reset whenever the session (re)starts so
  // it's shown again on a fresh attempt.
  const [acknowledgedTransitionSections, setAcknowledgedTransitionSections] = useState<Set<number>>(new Set())

  // Zustand Store
  const {
    activeWorkout,
    hasStarted,
    isCompleted,
    currentSectionIndex,
    currentExerciseIndex,
    currentSet,
    isResting,
    startTime,
    elapsedMs,
    initializeWorkout,
    startSession,
    endSession,
    nextStep,
    restartWorkout,
    jumpToStep,
    completeWorkout
  } = useWorkoutStore()

  // Mobile screens dim/lock mid-session otherwise, taking the elapsed-time clock and the
  // current exercise off screen with them. Spans every in-progress view — normal exercises,
  // the AMRAP challenge and the mode-change transition in between — and releases the instant
  // the session isn't actively running (overview, completed, exited).
  useWakeLock(hasStarted && !isCompleted)

  // Fetch Workout Data
  const { data: workoutData, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['workout', params.id],
    queryFn: async () => {
      const result = await getWorkoutById(params.id)
      if (!result.success || !result.data) {
        return {
          workout: null as null,
          errorCode: result.errorCode || 'unknown',
          errorMessage: result.error || 'No se pudo cargar el workout',
        }
      }
      return {
        workout: result.data,
        errorCode: null as null | 'notFound' | 'forbidden' | 'unknown',
        errorMessage: null as null | string,
      }
    }
  })

  const fetchErrorInfo = (() => {
    if (!queryError) return workoutData ?? null
    return {
      workout: null,
      errorCode: 'unknown' as const,
      errorMessage: (queryError as Error)?.message || 'Error desconocido',
    }
  })()

  const errorCode = fetchErrorInfo?.errorCode ?? null
  const errorMessage = fetchErrorInfo?.errorMessage ?? null
  const isError = Boolean(errorCode)

  // Map DB data to View Type
  const workout: LocalWorkout | null = useMemo(() => {
    if (!workoutData?.workout) return null
    const raw = workoutData.workout

    const descMap = buildExerciseDescriptionMap(raw.description)

    return {
      id: raw.id,
      title: raw.title,
      cover: raw.cover || undefined,
      description: raw.description || '',
      tags: raw.tags || [],
      difficulty: (raw.difficulty as Difficulty) || undefined,
      challenge: raw.challenge
        ? {
            mode: 'amrap_section',
            challengeSectionId: raw.challenge.challenge_section_id,
            timeCapSeconds: raw.challenge.time_cap_seconds,
            scoreType: 'rounds_plus_reps',
          }
        : null,
      sections: raw.sections.map(s => ({
        id: s.id,
        name: s.name,
        orderType: (s.type as 'linear' | 'single') || 'single',
        exercises: s.exercises.map(e => ({
          id: e.id,
          name: e.name,
          type: (e.type as 'reps' | 'time' | 'emom') || 'reps',
          reps: e.reps || 0,
          sets: e.sets || 0,
          duration: e.duration || 0,
          rest: e.rest || 0,
          weight_kg: e.weight_kg ?? null,
          thumbnail_url: e.thumbnail_url || undefined,
          tutorial: e.tutorial?.media_url ? {
            media: {
              type: (e.tutorial.media_type as 'image' | 'video' | 'audio') || 'image',
              url: e.tutorial.media_url,
            },
            steps: e.tutorial.steps || [],
          } : undefined,
          description: e.description || descMap.get(normalizeExerciseKey(e.name)) || '',
          muscle_groups: e.muscle_group || [],
          equipment: e.equipment || []
        }))
      }))
    }
  }, [workoutData])

  // The whole session — every section, whatever its mode — is driven by the same store
  // cursor; only the section *currently* under that cursor decides which execution view
  // renders (see currentSectionKind further down, near the render logic).

  // Initialize store with workout data
  useEffect(() => {
    if (workout && (!activeWorkout || activeWorkout.id !== workout.id)) {
      initializeWorkout(workout)
    }
  }, [workout, activeWorkout, initializeWorkout])

  useEffect(() => {
    setSectionChallengeResult(null)
    setAcknowledgedTransitionSections(new Set())
  }, [workout?.id])

  // Handle Workout Completion (Log Stats)
  useEffect(() => {
    if (isCompleted && activeWorkout && user && !hasLoggedRef.current) {
        hasLoggedRef.current = true

        const durationMinutes = Math.max(1, Math.ceil(elapsedMs / 60000))
        // Misma fórmula (ponderada por dificultad) que se usa al guardar el
        // workout para calcular su exp_earned "de catálogo" — ver
        // packages/shared/src/rewards.ts.
        const xpEarned = calcWorkoutXP(elapsedMs / 1000, activeWorkout?.difficulty)
        setXpEarnedState(xpEarned)

        if (!canSaveProgress) {
            return
        }

        // Call Server Action
        completeWorkoutAction({
            workoutId: activeWorkout.id,
            durationMinutes: durationMinutes,
            xpEarned: xpEarned,
            ...(sectionChallengeResult ? {
              challengeResult: {
                mode: sectionChallengeResult.mode,
                roundsCompleted: sectionChallengeResult.roundsCompleted,
                score: sectionChallengeResult.score,
                timeCapSeconds: sectionChallengeResult.timeCapSeconds,
              }
            } : {})
        }).then((result) => {
            if (!result.success) {
                console.error('Error logging workout stats:', result.error)
            } else {
                const logData = result.data as { log_id?: string; challenge_result?: { is_pr?: boolean } } | null | undefined
                if (typeof logData?.log_id === 'string') {
                    setCurrentLogId(logData.log_id)
                }
                if (logData?.challenge_result?.is_pr) {
                    setSectionChallengeResult((previous) => previous ? { ...previous, isPr: true } : previous)
                }
            }
        })
    }

    // Reset ref if workout is restarted
    if (!isCompleted) {
        hasLoggedRef.current = false
        setCurrentLogId(null)
        setXpEarnedState(0)
    }
  }, [isCompleted, activeWorkout, user, canSaveProgress, elapsedMs, sectionChallengeResult])


  // Helper to determine if we have a session in progress
  const hasActiveSession = activeWorkout?.id === workout?.id && !isCompleted && Boolean(
        startTime ||
        elapsedMs > 0 ||
        currentSectionIndex > 0 ||
        currentExerciseIndex > 0 ||
        currentSet > 1 ||
        isResting
      )

  const handleStartFromOverview = () => {
    if (!workout) return

    initializeWorkout(workout)
    restartWorkout()
    setAcknowledgedTransitionSections(new Set())
  }

  const handleJumpToExerciseFromOverview = (sectionIndex: number, exerciseIndex: number) => {
    if (!workout) return
    initializeWorkout(workout)
    jumpToStep(sectionIndex, exerciseIndex)
    setAcknowledgedTransitionSections(new Set())
  }

  // Fires when the AMRAP section's time cap runs out or the user ends it early. Stores the
  // score for the final completion screen/log, then either continues into the next section
  // (if the AMRAP section wasn't the last one) or finishes the whole workout.
  const handleAmrapSectionComplete = (result: LocalWorkoutChallengeResult) => {
    if (!activeWorkout) return

    setSectionChallengeResult(result)

    // Mirrors how normal exercise-by-exercise navigation advances between sections: skips
    // past any section left with no exercises instead of assuming the very next one is valid.
    const nextCursor = getFirstCursorFromSection(activeWorkout, currentSectionIndex + 1)
    if (nextCursor) {
      jumpToStep(nextCursor.sectionIndex, nextCursor.exerciseIndex)
    } else {
      completeWorkout()
    }
  }

  // Render Logic
  if (isLoading || (workout && !activeWorkout) || (activeWorkout && activeWorkout.id !== params.id)) {
    return <WorkoutOverviewSkeleton />
  }

  if (isError || (!isLoading && !workout)) {
    return <WorkoutError onRetry={() => refetch()} errorCode={errorCode || undefined} error={errorMessage || undefined} />
  }

  // 1. Completion View
  if (isCompleted && activeWorkout) {
    return (
      <WorkoutCompleted
        workout={activeWorkout}
        onRestart={restartWorkout}
        initialLogId={currentLogId}
        xpEarned={xpEarnedState}
        canSaveProgress={canSaveProgress}
        challengeResult={sectionChallengeResult}
      />
    )
  }

  // 2. Intro View
  if (!hasStarted && workout) {
    return (
      <WorkoutOverview
        workout={workout}
        onStart={handleStartFromOverview}
        onResume={startSession}
        onBack={() => router.push('/feed')}
        hasActiveSession={hasActiveSession}
        onExerciseClick={handleJumpToExerciseFromOverview}
        isAuthenticated={!!user}
        canViewPremiumTutorial={!!user?.isPremium}
      />
    )
  }

  if (!activeWorkout) return null

  // 3. Active Session View — which execution UI renders depends on the *current* section's
  // mode, not the workout as a whole, so normal and AMRAP sections can alternate freely.
  const currentSection = activeWorkout.sections[currentSectionIndex]
  const currentSectionKind = getWorkoutSegmentKind(activeWorkout, currentSectionIndex)
  const previousSectionKind = currentSectionIndex > 0 ? getWorkoutSegmentKind(activeWorkout, currentSectionIndex - 1) : null

  // Skip the transition screen when this is the very first section — there's no preceding
  // mode to contrast against — or when its mode is unchanged from the section before it.
  const needsModeTransition =
    Boolean(currentSection) &&
    previousSectionKind !== null &&
    previousSectionKind !== currentSectionKind &&
    !acknowledgedTransitionSections.has(currentSectionIndex)

  if (needsModeTransition && currentSection) {
    return (
      <WorkoutChangeTypeView
        workout={activeWorkout}
        section={currentSection}
        toKind={currentSectionKind}
        fromKind={previousSectionKind}
        timeCapSeconds={currentSectionKind === 'amrap' ? activeWorkout.challenge?.timeCapSeconds : undefined}
        onExit={endSession}
        onContinue={() =>
          setAcknowledgedTransitionSections((previous) => {
            const next = new Set(previous)
            next.add(currentSectionIndex)
            return next
          })
        }
      />
    )
  }

  if (currentSectionKind === 'amrap') {
    return (
      <WorkoutChallengeExecutionView
        workout={activeWorkout}
        canAccessTutorial={canSaveProgress}
        onExit={endSession}
        onComplete={handleAmrapSectionComplete}
      />
    )
  }

  return (
    <>
      <ActiveSession
        workout={activeWorkout}
        currentSectionIndex={currentSectionIndex}
        currentExerciseIndex={currentExerciseIndex}
        currentSet={currentSet}
        isResting={isResting}
        canAccessTutorial={canSaveProgress}
        onExit={endSession}
        onNextStep={nextStep}
      />
    </>
  )
}

function WorkoutOverviewSkeleton() {
  return (
    <div className="min-h-screen w-full bg-[#050608] text-foreground pb-32 relative animate-pulse">
      <div className="absolute top-4 left-4 z-50">
        <div className="h-10 w-10 rounded-2xl bg-black/30 border border-white/10" />
      </div>

      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <div className="h-10 w-10 rounded-2xl bg-black/30 border border-white/10" />
      </div>

      <div className="relative h-[180px] sm:h-[200px] overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-slate-900/80" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,12,14,0.25)_0%,rgba(12,12,14,0.92)_100%)]" />
        <div className="relative h-full px-4 sm:px-6 lg:px-8 pt-12 flex items-end justify-between gap-4 max-w-7xl mx-auto w-full pb-5 sm:pb-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="min-w-0 space-y-2">
              <div className="h-3.5 w-24 rounded bg-white/30" />
              <div className="h-7 w-56 sm:h-8 sm:w-72 rounded-md bg-white/20" />
            </div>
          </div>
          <div className="hidden sm:flex items-end gap-4 sm:gap-6 md:gap-8 text-right">
            <div className="space-y-1.5">
              <div className="h-2.5 w-16 rounded bg-white/20" />
              <div className="h-6 w-20 rounded bg-white/20" />
            </div>
            <div className="space-y-1.5">
              <div className="h-2.5 w-20 rounded bg-white/20" />
              <div className="h-6 w-10 rounded bg-white/20" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="space-y-2">
            <div className="h-2.5 w-20 rounded bg-white/20 mb-2" />
            <div className="h-9 w-28 rounded-full border border-emerald-500/20 bg-emerald-500/10" />
          </div>
          <div className="space-y-2">
            <div className="h-2.5 w-12 rounded bg-white/20 mb-2" />
            <div className="h-9 w-28 rounded-full border border-sky-500/20 bg-sky-500/10" />
          </div>
          <div className="space-y-2">
            <div className="h-2.5 w-20 rounded bg-white/20 mb-2" />
            <div className="h-9 w-28 rounded-full border border-violet-500/20 bg-violet-500/10" />
          </div>
          <div className="sm:col-span-2 lg:col-span-1 space-y-2">
            <div className="h-2.5 w-28 rounded bg-white/20 mb-2" />
            <div className="h-11 w-full rounded-2xl border border-white/10 bg-white/5" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-8 h-8 rounded-xl bg-orange-500/15" />
              <div className="h-3.5 w-40 rounded bg-white/20" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-7 w-20 rounded-full border border-orange-500/20 bg-orange-500/10" />
              ))}
            </div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15" />
              <div className="h-3.5 w-36 rounded bg-white/20" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-7 w-24 rounded-full border border-sky-500/20 bg-sky-500/10" />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <div className="h-2.5 w-44 rounded bg-white/20 mb-3" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-white/15" />
            <div className="h-4 w-5/6 rounded bg-white/10" />
            <div className="h-4 w-4/5 rounded bg-white/5" />
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {[1, 2].map((idx) => (
            <div
              key={idx}
              className="rounded-[24px] sm:rounded-[26px] border border-white/10 bg-white/[0.02] overflow-hidden"
            >
              <div className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 bg-gradient-to-r from-sky-500/20 via-transparent to-transparent">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-black/40 backdrop-blur-md">
                  <div className="h-4 w-4 rounded bg-white/30" />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="h-5 w-40 sm:h-6 sm:w-48 rounded bg-white/20" />
                  <div className="h-3 w-24 rounded bg-white/15" />
                </div>
                <div className="h-5 w-5 rounded bg-white/20 shrink-0" />
              </div>
              <div className="p-3 sm:p-4 md:p-5 space-y-2.5 sm:space-y-3 border-t border-white/10">
                {[1, 2].map((exIdx) => (
                  <div
                    key={exIdx}
                    className="flex items-center gap-3 sm:gap-4 rounded-[20px] sm:rounded-[22px] border border-white/10 bg-white/[0.03] p-2.5 sm:p-3"
                  >
                    <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 shrink-0 rounded-[18px] sm:rounded-2xl overflow-hidden border border-white/10 bg-black/30">
                      <div className="w-full h-full bg-white/10" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 w-40 sm:h-5 sm:w-48 rounded bg-white/20" />
                      <div className="h-6 w-32 rounded-xl bg-white/[0.04] border border-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 sm:pb-5 bg-[linear-gradient(180deg,transparent_0%,rgba(5,6,8,0.85)_40%,rgba(5,6,8,0.98)_85%)] z-50 pb-safe">
        <div className="max-w-md mx-auto w-full">
          <div className="w-full h-12 sm:h-14 rounded-2xl sm:rounded-[22px] bg-emerald-500/60 shadow-xl shadow-emerald-500/20" />
        </div>
      </div>
    </div>
  )
}
