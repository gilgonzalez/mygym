'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WorkoutOverview } from '@/components/workout/WorkoutOverview'
import { ActiveSession } from '@/components/workout/ActiveSession'
import { WorkoutChallengeExecutionView } from '@/components/workout/WorkoutChallengeExecutionView'
import { WorkoutCompleted } from '@/components/workout/WorkoutCompleted'
import { WorkoutError } from '@/components/workout/WorkoutError'
import { LocalWorkout, LocalWorkoutChallengeResult } from '@/types/workout/viewTypes'
import { useWorkoutStore } from '@/store/workOutStore'
import { useQuery } from '@tanstack/react-query'
import { getWorkoutById } from '@/app/actions/workout/get'
import { useAuthStore } from '@/store/authStore'
import { completeWorkoutAction } from '@/app/actions/user/completeWorkout'
import { calcWorkoutXP } from '@/lib/workout-utils'

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
  const [challengeHasStarted, setChallengeHasStarted] = useState(false)
  const [challengeIsCompleted, setChallengeIsCompleted] = useState(false)
  const [challengeResult, setChallengeResult] = useState<LocalWorkoutChallengeResult | null>(null)
  const [challengeDurationSeconds, setChallengeDurationSeconds] = useState(0)
  const [challengeLogId, setChallengeLogId] = useState<string | null>(null)
  const [challengeXpEarned, setChallengeXpEarned] = useState(0)
  
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
    jumpToStep
  } = useWorkoutStore()
  
  // Fetch Workout Data
  const { data: workoutData, isLoading, isError, refetch } = useQuery({
    queryKey: ['workout', params.id],
    queryFn: async () => {
      const result = await getWorkoutById(params.id)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch workout')
      }
      return result.data
    }
  })

  const exerciseDescriptionMap = useMemo(
    () => buildExerciseDescriptionMap(workoutData?.description),
    [workoutData?.description]
  )

  // Map DB data to View Type
  const workout: LocalWorkout | null = useMemo(() => {
    if (!workoutData) return null

    return {
      id: workoutData.id,
      title: workoutData.title,
      cover: workoutData.cover || undefined,
      description: workoutData.description || '',
      tags: workoutData.tags || [],
      difficulty: workoutData.difficulty || undefined,
      audio: workoutData.audio || [],
      challenge: workoutData.challenge
        ? {
            mode: 'amrap_section',
            challengeSectionId: workoutData.challenge.challenge_section_id,
            timeCapSeconds: workoutData.challenge.time_cap_seconds,
            scoreType: 'rounds_plus_reps',
          }
        : null,
      sections: workoutData.sections.map(s => ({
        id: s.id,
        name: s.name,
        orderType: (s.type as 'linear' | 'single') || 'single',
        exercises: s.exercises.map(e => ({
          id: e.id,
          name: e.name,
          type: (e.type as 'reps' | 'time') || 'reps',
          reps: e.reps || 0,
          sets: e.sets || 0,
          duration: e.duration || 0,
          rest: e.rest || 0,
          thumbnail_url: e.thumbnail_url || undefined,
          tutorial: e.tutorial?.media_url ? {
            media: {
              type: (e.tutorial.media_type as 'image' | 'video' | 'audio') || 'image',
              url: e.tutorial.media_url,
            },
            steps: e.tutorial.steps || [],
          } : undefined,
          description: e.description || exerciseDescriptionMap.get(normalizeExerciseKey(e.name)) || '',
          muscle_groups: e.muscle_group || [],
          equipment: e.equipment || []
        }))
      }))
    }
  }, [exerciseDescriptionMap, workoutData])

  const isChallengeWorkout = Boolean(workout?.challenge?.mode === 'amrap_section')

  // Initialize store with workout data
  useEffect(() => {
    if (workout && !isChallengeWorkout && (!activeWorkout || activeWorkout.id !== workout.id)) {
      initializeWorkout(workout)
    }
  }, [workout, activeWorkout, initializeWorkout, isChallengeWorkout])

  useEffect(() => {
    setChallengeHasStarted(false)
    setChallengeIsCompleted(false)
    setChallengeResult(null)
    setChallengeDurationSeconds(0)
    setChallengeLogId(null)
    setChallengeXpEarned(0)
  }, [workout?.id])

  // Handle Workout Completion (Log Stats)
  useEffect(() => {
    if (isChallengeWorkout) return

    if (isCompleted && activeWorkout && user && !hasLoggedRef.current) {
        hasLoggedRef.current = true
        
        const durationMinutes = Math.max(1, Math.ceil(elapsedMs / 60000))
        const xpEarned = calcWorkoutXP(durationMinutes, false) // Base 50 + 5 per minute
        setXpEarnedState(xpEarned)

        if (!canSaveProgress) {
            return
        }

        // Call Server Action
        completeWorkoutAction({
            workoutId: activeWorkout.id,
            durationMinutes: durationMinutes,
            xpEarned: xpEarned
        }).then((result) => {
            if (!result.success) {
                console.error('Error logging workout stats:', result.error)
            } else {
                const logData = result.data as { log_id?: string } | null | undefined
                if (typeof logData?.log_id === 'string') {
                    setCurrentLogId(logData.log_id)
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
  }, [isCompleted, activeWorkout, user, canSaveProgress, elapsedMs, isChallengeWorkout])


  // Helper to determine if we have a session in progress
  const hasActiveSession = isChallengeWorkout
    ? false
    : activeWorkout?.id === workout?.id && !isCompleted && Boolean(
        startTime ||
        elapsedMs > 0 ||
        currentSectionIndex > 0 ||
        currentExerciseIndex > 0 ||
        currentSet > 1 ||
        isResting
      )

  const handleStartFromOverview = () => {
    if (!workout) return

    if (isChallengeWorkout) {
      setChallengeResult(null)
      setChallengeDurationSeconds(0)
      setChallengeLogId(null)
      setChallengeXpEarned(0)
      setChallengeIsCompleted(false)
      setChallengeHasStarted(true)
      return
    }

    initializeWorkout(workout)
    restartWorkout()
  }

  const handleJumpToExerciseFromOverview = (sectionIndex: number, exerciseIndex: number) => {
    if (!workout) return
    initializeWorkout(workout)
    jumpToStep(sectionIndex, exerciseIndex)
  }

  const handleChallengeComplete = (result: LocalWorkoutChallengeResult, elapsedSeconds: number) => {
    if (!workout) return

    setChallengeHasStarted(false)
    setChallengeIsCompleted(true)
    setChallengeResult(result)
    setChallengeDurationSeconds(elapsedSeconds)

    const durationMinutes = Math.max(1, Math.ceil(elapsedSeconds / 60))
    const xpEarned = calcWorkoutXP(durationMinutes, false)
    setChallengeXpEarned(xpEarned)

    if (!user || !canSaveProgress) {
      return
    }

    completeWorkoutAction({
      workoutId: workout.id,
      durationMinutes,
      xpEarned,
      challengeResult: {
        mode: result.mode,
        roundsCompleted: result.roundsCompleted,
        score: result.score,
        timeCapSeconds: result.timeCapSeconds,
      }
    }).then((completionResult) => {
      if (!completionResult.success) {
        console.error('Error logging workout challenge stats:', completionResult.error)
        return
      }

      const completionData = completionResult.data as
        | { log_id?: string; challenge_result?: { is_pr?: boolean } }
        | null
        | undefined

      if (typeof completionData?.log_id === 'string') {
        setChallengeLogId(completionData.log_id)
      }

      if (completionData?.challenge_result?.is_pr) {
        setChallengeResult((previous) => previous ? { ...previous, isPr: true } : previous)
      }
    })
  }

  const handleRestartChallenge = () => {
    setChallengeResult(null)
    setChallengeDurationSeconds(0)
    setChallengeLogId(null)
    setChallengeXpEarned(0)
    setChallengeIsCompleted(false)
    setChallengeHasStarted(true)
  }

  // Render Logic
  if (isLoading || (workout && !isChallengeWorkout && !activeWorkout) || (activeWorkout && activeWorkout.id !== params.id)) {
    return <WorkoutOverviewSkeleton />
  }
  
  if (isError || (!isLoading && !workout)) {
    return <WorkoutError onRetry={() => refetch()} />
  }

  // 1. Completion View
  if (isChallengeWorkout && challengeIsCompleted && workout && challengeResult) {
    return (
      <WorkoutCompleted
        workout={workout}
        onRestart={handleRestartChallenge}
        initialLogId={challengeLogId}
        xpEarned={challengeXpEarned}
        canSaveProgress={canSaveProgress}
        challengeResult={challengeResult}
        durationOverrideSeconds={challengeDurationSeconds}
      />
    )
  }

  if (isCompleted && activeWorkout) {
    return (
      <WorkoutCompleted 
        workout={activeWorkout} 
        onRestart={restartWorkout} 
        initialLogId={currentLogId}
        xpEarned={xpEarnedState}
        canSaveProgress={canSaveProgress}
      />
    )
  }

  // 2. Intro View
  if ((!hasStarted && !challengeHasStarted) && workout) {
    return (
      <WorkoutOverview 
        workout={workout}
        onStart={handleStartFromOverview}
        onResume={isChallengeWorkout ? undefined : startSession}
        onBack={() => router.push('/feed')}
        hasActiveSession={hasActiveSession}
        onExerciseClick={handleJumpToExerciseFromOverview}
        isAuthenticated={!!user}
        canViewPremiumTutorial={!!user?.isPremium}
      />
    )
  }

  // 3. Active Session View
  if (isChallengeWorkout && workout) {
    return (
      <WorkoutChallengeExecutionView
        workout={workout}
        canAccessTutorial={canSaveProgress}
        onExit={() => setChallengeHasStarted(false)}
        onComplete={handleChallengeComplete}
      />
    )
  }

  if (!activeWorkout) return null

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
