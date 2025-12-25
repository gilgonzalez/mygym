'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { WorkoutOverview } from '@/components/workout/WorkoutOverview'
import { ActiveSession } from '@/components/workout/ActiveSession'
import { WorkoutCompleted } from '@/components/workout/WorkoutCompleted'
import { LocalWorkout } from '@/types/workout/viewTypes'
import { useWorkoutStore } from '@/store/workOutStore'
import { useQuery } from '@tanstack/react-query'
import { getWorkoutById } from '@/app/actions/workout/get'

export default function WorkoutSessionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  
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
  const { data: workoutData, isLoading, isError } = useQuery({
    queryKey: ['workout', params.id],
    queryFn: async () => {
      const result = await getWorkoutById(params.id)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch workout')
      }
      return result.data
    }
  })

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
          media_url: e.media_url || undefined,
          description: e.description || '',
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


  // Helper to determine if we have a session in progress
  const hasActiveSession = activeWorkout?.id === workout?.id && (currentSectionIndex > 0 || currentExerciseIndex > 0 || isResting)

  // Render Logic
  if (isLoading || (workout && !activeWorkout) || (activeWorkout && activeWorkout.id !== params.id)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando entrenamiento...</p>
      </div>
    )
  }
  
  if (isError || !workout) return <div className="flex h-screen items-center justify-center text-red-500">Error loading workout</div>

  // 1. Completion View
  if (isCompleted && activeWorkout) {
    return (
      <WorkoutCompleted 
        workout={activeWorkout} 
        onRestart={restartWorkout} 
      />
    )
  }

  // 2. Intro View
  if (!hasStarted && activeWorkout) {
    return (
      <WorkoutOverview 
        workout={activeWorkout}
        onStart={restartWorkout}
        onResume={startSession}
        onBack={() => router.push('/')}
        hasActiveSession={hasActiveSession}
        onExerciseClick={jumpToStep}
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