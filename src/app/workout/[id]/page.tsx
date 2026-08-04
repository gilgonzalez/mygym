'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
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
        const xpEarned = Math.ceil(durationMinutes * 5) + 50 // Base 50 + 5 per minute
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
    const xpEarned = Math.ceil(durationMinutes * 5) + 50
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
        extraReps: result.extraReps,
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
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando entrenamiento...</p>
      </div>
    )
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
        onBack={() => router.push('/')}
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
