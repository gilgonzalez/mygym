'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { WorkoutOverview } from '@/components/workout/WorkoutOverview'
import { ActiveSession } from '@/components/workout/ActiveSession'
import { WorkoutCompleted } from '@/components/workout/WorkoutCompleted'
import { WorkoutError } from '@/components/workout/WorkoutError'
import { LocalWorkout } from '@/types/workout/viewTypes'
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
  
  // Zustand Store
  const { 
    activeWorkout, 
    hasStarted, 
    isCompleted, 
    currentSectionIndex, 
    currentExerciseIndex, 
    currentSet,
    isResting,
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

  const exerciseDescriptionMap = buildExerciseDescriptionMap(workoutData?.description)

  // Map DB data to View Type
  const workout: LocalWorkout | null = workoutData ? {
    id: workoutData.id,
    title: workoutData.title,
    cover: workoutData.cover || undefined,
    description: workoutData.description || '',
    tags: workoutData.tags || [],
    difficulty: workoutData.difficulty || undefined,
    audio: workoutData.audio || [],
    sections: workoutData.sections.map(s => ({
      id: s.id,
      name: s.name,
      orderType: (s.type as 'linear' | 'single') || 'single',
      exercises: s.exercises.map(e => {
        return ({
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
        })
      }
      
      )
    }))
  } : null

  // Initialize store with workout data
  useEffect(() => {
    if (workout && (!activeWorkout || activeWorkout.id !== workout.id)) {
      initializeWorkout(workout)
    }
  }, [workout, activeWorkout, initializeWorkout])

  // Handle Workout Completion (Log Stats)
  useEffect(() => {
    if (isCompleted && activeWorkout && user && !hasLoggedRef.current) {
        hasLoggedRef.current = true
        
        // Calculate total duration (estimate)
        // Sum of all exercises duration + rest + sets
        let totalSeconds = 0
        activeWorkout.sections.forEach(section => {
            section.exercises.forEach(ex => {
                const sets = ex.sets || 1
                const duration = ex.duration || 0
                const rest = ex.rest || 0
                // Rough estimate: (duration + rest) * sets
                // If reps based, assume 45s per set?
                const timePerSet = duration > 0 ? duration : 45 
                totalSeconds += (timePerSet + rest) * sets
            })
        })
        
        const durationMinutes = Math.ceil(totalSeconds / 60)
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
                if (result.data && typeof result.data === 'object' && 'log_id' in result.data) {
                    setCurrentLogId((result.data as any).log_id)
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
  }, [isCompleted, activeWorkout, user, canSaveProgress])


  // Helper to determine if we have a session in progress
  const hasActiveSession = activeWorkout?.id === workout?.id && (currentSectionIndex > 0 || currentExerciseIndex > 0 || isResting)

  const handleStartFromOverview = () => {
    if (!workout) return
    initializeWorkout(workout)
    restartWorkout()
  }

  const handleJumpToExerciseFromOverview = (sectionIndex: number, exerciseIndex: number) => {
    if (!workout) return
    initializeWorkout(workout)
    jumpToStep(sectionIndex, exerciseIndex)
  }

  // Render Logic
  if (isLoading || (workout && !activeWorkout) || (activeWorkout && activeWorkout.id !== params.id)) {
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
  if (!hasStarted && workout) {
    return (
      <WorkoutOverview 
        workout={workout}
        onStart={handleStartFromOverview}
        onResume={startSession}
        onBack={() => router.push('/')}
        hasActiveSession={hasActiveSession}
        onExerciseClick={handleJumpToExerciseFromOverview}
        isAuthenticated={!!user}
        canViewPremiumTutorial={!!user?.isPremium}
      />
    )
  }

  // 3. Active Session View
  if (!activeWorkout) return null

  return (
    <>
      <ActiveSession 
        workout={activeWorkout}
        currentSectionIndex={currentSectionIndex}
        currentExerciseIndex={currentExerciseIndex}
        currentSet={currentSet}
        isResting={isResting}
        onExit={endSession}
        onNextStep={nextStep}
      />
    </>
  )
}
